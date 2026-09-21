import { PaymentProvider, PaymentRequestInput, PaymentResponse } from './types';

export class ManualPaymentProvider implements PaymentProvider {
  id = 'manual';
  name = 'Manual Cash / Bank / Mobile Transfer';
  isOnline = false;

  async createPaymentRequest(input: PaymentRequestInput): Promise<PaymentResponse> {
    // Manual payments are immediately confirmed upon admin entry
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 9);
    return {
      paymentId,
      status: 'confirmed',
      providerRef: `MANUAL-${Date.now()}`
    };
  }
}

export const defaultPaymentProvider = new ManualPaymentProvider();
