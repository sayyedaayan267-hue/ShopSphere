import { Router, Request, Response } from 'express';
import prisma from '../db.ts';
import { razorpayService } from '../utils/razorpay.ts';

const router = Router();

// POST /api/v1/payments/razorpay/webhook
// Handles payment.captured, payment.failed, order.paid idempotently
router.post('/razorpay/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    if (signature && !razorpayService.verifyWebhookSignature(bodyStr, signature)) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (!event || !payload) {
      return res.status(200).json({ received: true });
    }

    // Handle payment captured
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;

      // Check if payment already recorded
      const existing = await prisma.payment.findUnique({
        where: { transactionId: paymentId },
      });

      if (!existing && orderId) {
        // Find order by matching paymentOrderId
        const existingOrderByPaymentOrder = await prisma.payment.findFirst({
          where: { paymentOrderId: orderId },
        });

        if (existingOrderByPaymentOrder) {
          await prisma.payment.update({
            where: { id: existingOrderByPaymentOrder.id },
            data: {
              status: 'SUCCESS',
              payload: JSON.stringify(paymentEntity),
            },
          });
        }
      }
    }

    // Handle refund or failure
    if (event === 'refund.processed') {
      const refundEntity = payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const payment = await prisma.payment.findUnique({
        where: { transactionId: paymentId },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    // Return 200 so webhook isn't endlessly retried on internal bugs
    return res.status(200).json({ received: true, error: error.message });
  }
});

// GET /api/v1/payments/config - Returns public Razorpay key ID & mock mode state
router.get('/config', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_shopsphere_demo_key',
    isDevMockMode: razorpayService.isDevMockMode,
  });
});

export default router;
