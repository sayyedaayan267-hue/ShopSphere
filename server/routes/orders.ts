import { Router, Response } from 'express';
import prisma from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// GET /api/v1/orders - Get user orders with pagination and status filter
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {
      userId: req.user!.id,
    };

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
          items: true,
          payments: {
            select: {
              provider: true,
              transactionId: true,
              status: true,
              amount: true,
            },
          },
          shipments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
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
    console.error('Fetch orders error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// GET /api/v1/orders/:orderNumber - Single order details
router.get('/:orderNumber', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        // Non-admin can only access their own order
        ...(req.user!.role !== 'ADMIN' ? { userId: req.user!.id } : {}),
      },
      include: {
        items: true,
        payments: true,
        shipments: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.json({
      success: true,
      order: {
        ...order,
        shippingAddress: JSON.parse(order.shippingAddressSnapshot || '{}'),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to load order' });
  }
});

// POST /api/v1/orders/:orderNumber/cancel - Cancel order & restore inventory
router.post('/:orderNumber/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: req.user!.id,
      },
      include: {
        items: true,
        payments: true,
        shipments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Permitted state transitions check
    const cancellableStatuses = ['PENDING', 'PAID', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled because it is already ${order.status.toLowerCase()}.`,
      });
    }

    // Safe database transaction to restore inventory and update status
    await prisma.$transaction(async (tx) => {
      // Restore inventory
      for (const item of order.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const restoredStock = product.stock + item.quantity;
            await tx.product.update({
              where: { id: product.id },
              data: { stock: restoredStock },
            });

            await tx.inventory.create({
              data: {
                productId: product.id,
                changeType: 'CANCEL_RESTORE',
                quantityDelta: item.quantity,
                remainingStock: restoredStock,
                reason: `Order ${order.orderNumber} cancelled: ${reason}`,
              },
            });
          }
        }
      }

      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      // Update shipment
      await tx.shipment.updateMany({
        where: { orderId: order.id },
        data: { status: 'CANCELLED' },
      });

      // Update payment status to REFUNDED if was paid
      if (order.status === 'PAID') {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: 'REFUNDED' },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ORDER_CANCELLED',
          entityType: 'Order',
          entityId: order.id,
          details: `Order ${order.orderNumber} cancelled. Reason: ${reason}`,
          ipAddress: req.ip || null,
        },
      });
    });

    return res.json({
      success: true,
      message: 'Order has been cancelled and any paid amounts will be refunded.',
    });
  } catch (error: any) {
    console.error('Order cancellation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

export default router;
