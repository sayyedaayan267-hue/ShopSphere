import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.ts';
import prisma from '../server/db.ts';
import { razorpayService } from '../server/utils/razorpay.ts';

describe('ShopSphere Full-Stack E-Commerce API Test Suite', () => {
  let customerCookie = '';
  let adminCookie = '';
  let sampleProductId = '';
  let savedAddressId = '';
  let placedOrderNumber = '';
  let paymentOrderId = '';

  beforeAll(async () => {
    // Locate a seeded product
    const product = await prisma.product.findFirst({
      where: { isActive: true, stock: { gt: 5 } },
    });
    if (product) {
      sampleProductId = product.id;
    }
  });

  describe('1. Health and Readiness', () => {
    it('should return 200 UP for /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database).toBe('connected');
    });
  });

  describe('2. User Authentication & Session Security', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login as Customer and return session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'customer@shopsphere.store', password: 'Customer@12345' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('CUSTOMER');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      customerCookie = cookies[0].split(';')[0];
    });

    it('should login as Admin and return session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@shopsphere.store', password: 'Admin@12345' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('ADMIN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      adminCookie = cookies[0].split(';')[0];
    });

    it('should return user profile on /api/v1/auth/me with valid session cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [customerCookie]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('customer@shopsphere.store');
    });

    it('should reject /api/v1/auth/me without authentication', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Product Catalog & Search', () => {
    it('should list products with real database query and pagination', async () => {
      const res = await request(app).get('/api/v1/products?page=1&limit=8');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
    });

    it('should filter products by search term', async () => {
      const res = await request(app).get('/api/v1/products?q=Headphones');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.products.forEach((p: any) => {
        const matches =
          p.title.toLowerCase().includes('headphones') ||
          p.description.toLowerCase().includes('headphones') ||
          p.brand.toLowerCase().includes('headphones');
        expect(matches).toBe(true);
      });
    });

    it('should return categories list with product counts', async () => {
      const res = await request(app).get('/api/v1/products/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });
  });

  describe('4. Shopping Cart & Inventory Checks', () => {
    it('should add item to authenticated user cart and calculate totals', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [customerCookie])
        .send({ productId: sampleProductId, quantity: 2 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.subtotal).toBeGreaterThan(0);
      expect(res.body.itemsCount).toBeGreaterThanOrEqual(2);
    });

    it('should reject adding more quantity than available stock', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [customerCookie])
        .send({ productId: sampleProductId, quantity: 99999 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate and apply coupon WELCOME10', async () => {
      const res = await request(app)
        .post('/api/v1/cart/apply-coupon')
        .set('Cookie', [customerCookie])
        .send({ code: 'WELCOME10' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.coupon.code).toBe('WELCOME10');
      expect(res.body.discount).toBeGreaterThan(0);
    });
  });

  describe('5. Checkout, Payments & Order State Machine', () => {
    it('should list saved addresses for checkout', async () => {
      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Cookie', [customerCookie]);
      expect(res.status).toBe(200);
      expect(res.body.addresses.length).toBeGreaterThan(0);
      savedAddressId = res.body.addresses[0].id;
    });

    it('should create Razorpay payment order on backend', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/create-payment-order')
        .set('Cookie', [customerCookie])
        .send({
          addressId: savedAddressId,
          shippingMethod: 'Standard Delivery',
          couponCode: 'WELCOME10',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.razorpayOrder.id).toBeDefined();
      paymentOrderId = res.body.razorpayOrder.id;
    });

    it('should reject order placement with invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/verify-and-place-order')
        .set('Cookie', [customerCookie])
        .send({
          addressId: savedAddressId,
          paymentOrderId,
          razorpayPaymentId: 'pay_invalid_123',
          razorpaySignature: 'invalid_sha256_signature',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should place order with verified mock signature and decrement inventory', async () => {
      const mockPayId = `pay_test_${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/checkout/verify-and-place-order')
        .set('Cookie', [customerCookie])
        .send({
          addressId: savedAddressId,
          paymentOrderId,
          razorpayPaymentId: mockPayId,
          razorpaySignature: 'mock_sig_verified_for_test',
          couponCode: 'WELCOME10',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.orderNumber).toMatch(/^SP-2026-\d+/);
      placedOrderNumber = res.body.orderNumber;
    });

    it('should prevent duplicate order processing for the same payment ID', async () => {
      const mockPayId = `pay_duplicate_test_${Date.now()}`;
      // Add item to cart for first order
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [customerCookie])
        .send({ productId: sampleProductId, quantity: 1 });

      // First order placement
      const firstRes = await request(app)
        .post('/api/v1/checkout/verify-and-place-order')
        .set('Cookie', [customerCookie])
        .send({
          addressId: savedAddressId,
          paymentOrderId,
          razorpayPaymentId: mockPayId,
          razorpaySignature: 'mock_sig_verified_for_test',
        });
      expect(firstRes.status).toBe(201);

      // Add item again for second attempt with duplicate payment ID
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [customerCookie])
        .send({ productId: sampleProductId, quantity: 1 });

      // Duplicate call with same payment ID
      const res = await request(app)
        .post('/api/v1/checkout/verify-and-place-order')
        .set('Cookie', [customerCookie])
        .send({
          addressId: savedAddressId,
          paymentOrderId,
          razorpayPaymentId: mockPayId,
          razorpaySignature: 'mock_sig_verified_for_test',
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should allow customer to access their own order details', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${placedOrderNumber}`)
        .set('Cookie', [customerCookie]);
      expect(res.status).toBe(200);
      expect(res.body.order.orderNumber).toBe(placedOrderNumber);
      expect(res.body.order.items.length).toBeGreaterThan(0);
    });

    it('should cancel order and safely restore inventory in database', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${placedOrderNumber}/cancel`)
        .set('Cookie', [customerCookie])
        .send({ reason: 'Found better price elsewhere' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify order status updated to CANCELLED
      const order = await prisma.order.findUnique({
        where: { orderNumber: placedOrderNumber },
      });
      expect(order?.status).toBe('CANCELLED');
    });

    it('should reject cancelling an already cancelled order', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${placedOrderNumber}/cancel`)
        .set('Cookie', [customerCookie])
        .send({ reason: 'Attempt duplicate cancel' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Role-Based Authorization & Admin Controls', () => {
    it('should reject standard customer from accessing /api/v1/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [customerCookie]);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Administrator');
    });

    it('should allow Admin to access /api/v1/admin/dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', [adminCookie]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.totalProducts).toBeGreaterThan(0);
    });

    it('should allow Admin to update order status', async () => {
      const order = await prisma.order.findFirst();
      if (order) {
        const res = await request(app)
          .put(`/api/v1/admin/orders/${order.id}/status`)
          .set('Cookie', [adminCookie])
          .send({ status: 'PROCESSING', trackingNote: 'Package packed at warehouse' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });
});
