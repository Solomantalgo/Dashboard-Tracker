export interface PaymentRequestInput {
  clientId: string;
  planId: string;
  amountUgx: number;
  phone?: string;
  method?: string;
  notes?: string;
}

export interface PaymentResponse {
  paymentId: string;
  providerRef?: string;
  redirectUrl?: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface PaymentProvider {
  id: string; // 'manual' | 'mtn_momo' | 'airtel_money' | 'flutterwave'
  name: string;
  isOnline: boolean;
  createPaymentRequest(input: PaymentRequestInput): Promise<PaymentResponse>;
}
