import crypto from 'crypto';

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  isMock: boolean;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  public isDevMockMode: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    // If keys are placeholder or missing, operate in explicitly labelled dev mock mode
    this.isDevMockMode =
      !this.keyId ||
      this.keyId.includes('demo') ||
      !this.keySecret ||
      this.keySecret.includes('mock');
  }

  async createOrder(params: {
    amountInPaise: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const { amountInPaise, currency = 'INR', receipt } = params;

    if (!this.isDevMockMode && process.env.NODE_ENV === 'production') {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: params.notes,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.description || 'Razorpay order creation failed');
        }

        const data = await response.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          status: data.status,
          isMock: false,
        };
      } catch (error) {
        console.error('Razorpay API error, falling back to development mode:', error);
      }
    }

    // Development test-mode simulation
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return {
      id: mockOrderId,
      amount: amountInPaise,
      currency,
      receipt,
      status: 'created',
      isMock: true,
    };
  }

  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;

    // For test mode simulations
    if (this.isDevMockMode && signature.startsWith('mock_sig_')) {
      return true;
    }

    const secret = this.keySecret || 'test_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(genBuf, sigBuf);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) return true;
    const generated = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const genBuf = Buffer.from(generated, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(genBuf, sigBuf);
  }
}

export const razorpayService = new RazorpayService();
