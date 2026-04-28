import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Payment, PaymentProcess, RazorpayOrder, RazorpayVerify } from '../models/payment.model';

declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = environment.apis.payment;

  constructor(private http: HttpClient) {}

  processPayment(data: PaymentProcess) {
    return this.http.post<Payment>(`${this.api}/process`, data);
  }

  createRazorpayOrder(appointmentId: number) {
    return this.http.post<RazorpayOrder>(`${this.api}/razorpay/create-order`, { appointmentId });
  }

  verifyRazorpayPayment(data: RazorpayVerify) {
    return this.http.post<{ message: string; payment: Payment }>(`${this.api}/razorpay/verify`, data);
  }

  getByAppointment(appointmentId: number) {
    return this.http.get<Payment>(`${this.api}/appointment/${appointmentId}`);
  }

  getByPatient(patientId: number) {
    return this.http.get<Payment[]>(`${this.api}/patient/${patientId}`);
  }

  getHistory() {
    return this.http.get<Payment[]>(`${this.api}/history`);
  }

  refund(appointmentId: number) {
    return this.http.post<Payment>(`${this.api}/refund/${appointmentId}`, {});
  }

  getStatus(appointmentId: number) {
    return this.http.get<{ status: string; transactionId: string }>(`${this.api}/status/${appointmentId}`);
  }

  getInvoiceUrl(appointmentId: number): string {
    return `${this.api}/invoice/${appointmentId}`;
  }

  downloadInvoice(appointmentId: number) {
    return this.http.get(`${this.api}/invoice/${appointmentId}`, { responseType: 'blob' });
  }

  getRevenueByProvider(providerId: number) {
    return this.http.get<{ providerId: number; totalRevenue: number }>(`${this.api}/revenue/${providerId}`);
  }

  getAllRevenue() {
    return this.http.get<{ totalRevenue: number }>(`${this.api}/revenue/all`);
  }

  openRazorpayCheckout(orderId: string, amount: number, onSuccess: (response: any) => void): void {
    const options = {
      key: environment.razorpayKey,
      amount: amount * 100,
      currency: 'INR',
      name: 'MediBook',
      description: 'Appointment Payment',
      order_id: orderId,
      handler: onSuccess,
      theme: { color: '#14b8a6' }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
}
