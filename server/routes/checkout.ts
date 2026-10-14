import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { razorpayService } from '../utils/razorpay.ts';
import {
  generateOrderNumber,
  generateTrackingNumber,
} from '../utils/crypto.ts';

const router = Router();
router.use(requireAuth);

const CreatePaymentOrderSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  shippingMethod: z.string().default('Standard Delivery'),
  couponCode: z.string().optional(),
});

const VerifyAndPlaceOrderSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  shippingMethod: z.string().default('Standard Delivery'),
  couponCode: z.string().optional(),
  paymentOrderId: z.string().min(1, 'Payment order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Payment signature is required'),
});

const DirectOrderSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  shippingMethod: z.string().default('Standard Delivery'),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['SIMULATED_TEST', 'COD']),
  paymentDetails: z
    .object({
      type: z.string().optional(),
      upiId: z.string().optional(),
      cardLast4: z.string().optional(),
      bankName: z.string().optional(),
    })
    .optional(),
});

// POST /api/v1/checkout/create-payment-order
// Prepares order on server, validates stock, calculates exact amounts, creates Razorpay order
router.post('/create-payment-order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = CreatePaymentOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid checkout data',
      });
    }

    const { addressId, shippingMethod, couponCode } = parse.data;

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user!.id },
    });
    if (!address) {
      return res.status(400).json({ success: false, error: 'Selected address is invalid' });
    }

    // Fetch user cart
    const cart = await prisma.cart.findFirst({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty' });
    }

    // Verify stock for all items
    for (const item of cart.items) {
      if (!item.product.isActive || item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Item "${item.product.title}" has insufficient stock (${item.product.stock} available).`,
        });
      }
    }

    // Server-side calculation
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      const now = new Date();
      if (
        coupon &&
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        coupon.timesUsed < coupon.usageLimit &&
        subtotal >= coupon.minOrderValue
      ) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    const shippingFee =
      shippingMethod === 'Express Delivery'
        ? 99
        : subtotal >= 500 || subtotal === 0
        ? 0
        : 49;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.18).toFixed(2));
    const total = Number((taxableAmount + shippingFee).toFixed(2));

    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.round(total * 100);

    const razorpayOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user!.id,
        userEmail: req.user!.email,
      },
    });

    return res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        isMock: razorpayOrder.isMock,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_shopsphere_demo_key',
      },
      orderSummary: {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        shippingFee,
        tax,
        total,
        itemsCount: cart.items.reduce((acc, i) => acc + i.quantity, 0),
      },
    });
  } catch (error: any) {
    console.error('Create payment order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate payment order' });
  }
});

// POST /api/v1/checkout/verify-and-place-order
// Verifies Razorpay HMAC signature, places order inside transaction, decrements inventory
router.post('/verify-and-place-order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = VerifyAndPlaceOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid payment verification payload',
      });
    }

    const {
      addressId,
      shippingMethod,
      couponCode,
      paymentOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = parse.data;

    // Check duplicate payment ID
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: razorpayPaymentId },
    });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: 'This payment has already been processed and placed for an order.',
      });
    }

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: paymentOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed.',
      });
    }

    // Fetch address snapshot
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user!.id },
    });
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address not found' });
    }

    const addressSnapshot = JSON.stringify({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    // Fetch cart
    const cart = await prisma.cart.findFirst({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Calculate amounts
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      const now = new Date();
      if (
        coupon &&
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        coupon.timesUsed < coupon.usageLimit &&
        subtotal >= coupon.minOrderValue
      ) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    const shippingFee =
      shippingMethod === 'Express Delivery'
        ? 99
        : subtotal >= 500 || subtotal === 0
        ? 0
        : 49;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.18).toFixed(2));
    const total = Number((taxableAmount + shippingFee).toFixed(2));

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + (shippingMethod === 'Express Delivery' ? 2 : 4)
    );

    const initialTrackingUpdate = JSON.stringify([
      {
        time: new Date().toISOString(),
        status: 'ORDER_PLACED',
        message: 'Order placed successfully and payment confirmed via Razorpay.',
        location: 'ShopSphere Central Fulfillment Hub',
      },
    ]);

    // Database transaction:
    // 1. Verify stock & decrement
    // 2. Create Order
    // 3. Create OrderItems (historical prices & titles snapshot)
    // 4. Create Payment record
    // 5. Create Shipment record
    // 6. Increment coupon usage if applied
    // 7. Clear user cart
    // 8. Create AuditLog
    const result = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod || prod.stock < item.quantity) {
          throw new Error(
            `Item "${item.product.title}" is out of stock or quantity changed.`
          );
        }

        const newStock = prod.stock - item.quantity;
        await tx.product.update({
          where: { id: prod.id },
          data: { stock: newStock },
        });

        await tx.inventory.create({
          data: {
            productId: prod.id,
            changeType: 'SALE',
            quantityDelta: -item.quantity,
            remainingStock: newStock,
            reason: `Order ${orderNumber}`,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          status: 'PAID',
          subtotal: Number(subtotal.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          shippingFee,
          tax,
          total,
          couponCode: coupon?.code || null,
          addressId: address.id,
          shippingAddressSnapshot: addressSnapshot,
          shippingMethod,
        },
      });

      // Order items
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            historicalTitle: item.product.title,
            historicalPrice: item.product.price,
            historicalSku: item.product.slug,
            quantity: item.quantity,
            total: Number((item.product.price * item.quantity).toFixed(2)),
            image: item.product.images[0]?.url || null,
          },
        });
      }

      // Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: razorpayService.isDevMockMode ? 'MOCK_DEV' : 'RAZORPAY',
          transactionId: razorpayPaymentId,
          paymentOrderId,
          amount: total,
          currency: 'INR',
          status: 'SUCCESS',
          signature: razorpaySignature,
          payload: JSON.stringify({
            paymentOrderId,
            razorpayPaymentId,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      // Shipment
      await tx.shipment.create({
        data: {
          orderId: order.id,
          trackingNumber,
          carrier: 'SphereExpress Logistics',
          status: 'PREPARING',
          estimatedDelivery,
          currentCity: 'Bengaluru Fulfillment Center',
          updates: initialTrackingUpdate,
        },
      });

      // Update coupon timesUsed
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ORDER_CREATED',
          entityType: 'Order',
          entityId: order.id,
          details: `Order ${orderNumber} created for ₹${total}`,
          ipAddress: req.ip || null,
        },
      });

      return order;
    });

    return res.status(201).json({
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.id,
      total,
      trackingNumber,
      message: 'Order placed successfully!',
    });
  } catch (error: any) {
    console.error('Order placement error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to place order',
    });
  }
});

// POST /api/v1/checkout/place-direct-order
// Allows seamless order placement via Simulated Test Payment (Instant Sandbox) or Cash on Delivery (COD)
// No Razorpay credentials or external merchant accounts required
router.post('/place-direct-order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = DirectOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid direct order payload',
      });
    }

    const { addressId, shippingMethod, couponCode, paymentMethod, paymentDetails } = parse.data;

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user!.id },
    });
    if (!address) {
      return res.status(400).json({ success: false, error: 'Selected address not found' });
    }

    const addressSnapshot = JSON.stringify({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    // Fetch user cart
    const cart = await prisma.cart.findFirst({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty' });
    }

    // Verify stock
    for (const item of cart.items) {
      if (!item.product.isActive || item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Item "${item.product.title}" has insufficient stock (${item.product.stock} available).`,
        });
      }
    }

    // Calculate amounts
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      const now = new Date();
      if (
        coupon &&
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        coupon.timesUsed < coupon.usageLimit &&
        subtotal >= coupon.minOrderValue
      ) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    const shippingFee =
      shippingMethod === 'Express Delivery'
        ? 99
        : subtotal >= 500 || subtotal === 0
        ? 0
        : 49;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.18).toFixed(2));
    const total = Number((taxableAmount + shippingFee).toFixed(2));

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + (shippingMethod === 'Express Delivery' ? 2 : 4)
    );

    const transactionId =
      paymentMethod === 'COD'
        ? `cod_${Date.now()}_${Math.floor(Math.random() * 10000)}`
        : `sim_pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const initialStatus = paymentMethod === 'COD' ? 'PROCESSING' : 'PAID';

    const initialTrackingUpdate = JSON.stringify([
      {
        time: new Date().toISOString(),
        status: 'ORDER_PLACED',
        message:
          paymentMethod === 'COD'
            ? 'Order placed successfully with Cash on Delivery option.'
            : 'Order placed successfully via Instant Simulated Payment Sandbox.',
        location: 'ShopSphere Central Fulfillment Hub, Bengaluru',
      },
    ]);

    // Transaction execution
    const result = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod || prod.stock < item.quantity) {
          throw new Error(`Item "${item.product.title}" has insufficient stock.`);
        }

        const newStock = prod.stock - item.quantity;
        await tx.product.update({
          where: { id: prod.id },
          data: { stock: newStock },
        });

        await tx.inventory.create({
          data: {
            productId: prod.id,
            changeType: 'SALE',
            quantityDelta: -item.quantity,
            remainingStock: newStock,
            reason: `Order ${orderNumber}`,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          status: initialStatus,
          subtotal: Number(subtotal.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          shippingFee,
          tax,
          total,
          couponCode: coupon?.code || null,
          addressId: address.id,
          shippingAddressSnapshot: addressSnapshot,
          shippingMethod,
        },
      });

      // Create Order Items
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            historicalTitle: item.product.title,
            historicalPrice: item.product.price,
            historicalSku: item.product.slug,
            quantity: item.quantity,
            total: Number((item.product.price * item.quantity).toFixed(2)),
            image: item.product.images[0]?.url || null,
          },
        });
      }

      // Create Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: paymentMethod === 'COD' ? 'COD' : 'SIMULATED_TEST',
          transactionId,
          amount: total,
          currency: 'INR',
          status: paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS',
          payload: JSON.stringify({
            paymentMethod,
            paymentDetails: paymentDetails || {},
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      // Create Shipment
      await tx.shipment.create({
        data: {
          orderId: order.id,
          trackingNumber,
          carrier: 'SphereExpress Logistics',
          status: 'PREPARING',
          estimatedDelivery,
          currentCity: 'Bengaluru Fulfillment Center',
          updates: initialTrackingUpdate,
        },
      });

      // Increment coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ORDER_CREATED',
          entityType: 'Order',
          entityId: order.id,
          details: `Order ${orderNumber} created (${paymentMethod}) for ₹${total}`,
          ipAddress: req.ip || null,
        },
      });

      return order;
    });

    return res.status(201).json({
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.id,
      total,
      trackingNumber,
      message:
        paymentMethod === 'COD'
          ? 'Order confirmed with Cash on Delivery!'
          : 'Payment simulated successfully! Order confirmed.',
    });
  } catch (error: any) {
    console.error('Direct order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to place order',
    });
  }
});

export default router;
