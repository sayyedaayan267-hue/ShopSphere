import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAdmin);

// GET /api/v1/admin/dashboard - Summary metrics & low stock alerts
router.get('/dashboard', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalOrders,
      paidOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        select: { total: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 10 } },
        take: 10,
        select: { id: true, title: true, stock: true, price: true, slug: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: { take: 2 },
        },
      }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    return res.json({
      success: true,
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard metrics' });
  }
});

// GET /api/v1/admin/products - List products for admin
router.get('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: String(q) } },
        { brand: { contains: String(q) } },
      ];
    }
    if (category) {
      where.categoryId = String(category);
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          images: { take: 1, orderBy: { isPrimary: 'desc' } },
        },
      }),
    ]);

    return res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// POST /api/v1/admin/products - Create product
const ProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description required'),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Valid image URL required'),
  isFeatured: z.boolean().default(false),
  specifications: z.record(z.string(), z.string()).optional(),
});

router.post('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = ProductSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid product data',
      });
    }

    const data = parse.data;
    const slug =
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          categoryId: data.categoryId,
          brand: data.brand,
          stock: data.stock,
          isFeatured: data.isFeatured,
          specifications: data.specifications ? JSON.stringify(data.specifications) : null,
          images: {
            create: {
              url: data.imageUrl,
              altText: data.title,
              isPrimary: true,
            },
          },
        },
        include: {
          images: true,
          category: true,
        },
      });

      // Record initial inventory
      await tx.inventory.create({
        data: {
          productId: prod.id,
          changeType: 'RESTOCK',
          quantityDelta: data.stock,
          remainingStock: data.stock,
          reason: 'Initial catalog creation',
        },
      });

      return prod;
    });

    return res.status(201).json({
      success: true,
      product,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// PUT /api/v1/admin/products/:id - Update product
router.put('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      compareAtPrice,
      categoryId,
      brand,
      stock,
      isFeatured,
      isActive,
      imageUrl,
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(price !== undefined ? { price: parseFloat(price) } : {}),
          ...(compareAtPrice !== undefined ? { compareAtPrice: parseFloat(compareAtPrice) } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(brand ? { brand } : {}),
          ...(stock !== undefined ? { stock: parseInt(stock, 10) } : {}),
          ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
        include: { images: true, category: true },
      });

      if (imageUrl) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.create({
          data: {
            productId: id,
            url: imageUrl,
            isPrimary: true,
          },
        });
      }

      // If stock was adjusted
      if (stock !== undefined && parseInt(stock, 10) !== existing.stock) {
        const delta = parseInt(stock, 10) - existing.stock;
        await tx.inventory.create({
          data: {
            productId: id,
            changeType: 'ADJUSTMENT',
            quantityDelta: delta,
            remainingStock: parseInt(stock, 10),
            reason: 'Admin manual stock update',
          },
        });
      }

      return prod;
    });

    return res.json({ success: true, product: updated, message: 'Product updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// DELETE /api/v1/admin/products/:id - Soft delete / archive
router.delete('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return res.json({ success: true, message: 'Product archived successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to archive product' });
  }
});

// GET /api/v1/admin/orders - All customer orders
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = String(status).toUpperCase();
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          shipments: true,
          payments: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// PUT /api/v1/admin/orders/:orderId/status - Update order & shipment status
router.put('/orders/:orderId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNote, carrier, trackingNumber } = req.body;

    const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid order status' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      // Update shipment if exists
      if (order.shipments.length > 0) {
        const shipment = order.shipments[0];
        let existingUpdates: any[] = [];
        try {
          existingUpdates = JSON.parse(shipment.updates || '[]');
        } catch {}

        existingUpdates.push({
          time: new Date().toISOString(),
          status,
          message: trackingNote || `Status updated to ${status}`,
          location: 'ShopSphere Logistics Center',
        });

        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status:
              status === 'SHIPPED'
                ? 'IN_TRANSIT'
                : status === 'DELIVERED'
                ? 'DELIVERED'
                : shipment.status,
            ...(carrier ? { carrier } : {}),
            ...(trackingNumber ? { trackingNumber } : {}),
            updates: JSON.stringify(existingUpdates),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADMIN_ORDER_STATUS_UPDATE',
          entityType: 'Order',
          entityId: orderId,
          details: `Order status set to ${status}`,
          ipAddress: req.ip || null,
        },
      });
    });

    return res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// GET /api/v1/admin/customers
router.get('/customers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ success: true, customers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// GET /api/v1/admin/coupons
router.get('/coupons', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, coupons });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
});

// POST /api/v1/admin/coupons - Create coupon
router.post('/coupons', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, validUntilDays } =
      req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, error: 'Code and discount value required' });
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (parseInt(validUntilDays, 10) || 30));

    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase().trim(),
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validUntil: expiry,
      },
    });

    return res.status(201).json({ success: true, coupon, message: 'Coupon created' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
});

export default router;
