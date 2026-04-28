export interface PaymentProcess {
  appointmentId: number;
  mode: string;
  notes?: string;
}

export interface Payment {
  paymentId: number;
  appointmentId: number;
  amount: number;
  status: string;
  transactionId: string;
  currency: string;
  mode: string;
  paidAt: string;
}

export interface RazorpayOrder {
  razorpayOrderId: string;
}

export interface RazorpayVerify {
  appointmentId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
