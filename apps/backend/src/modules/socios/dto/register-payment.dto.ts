export class RegisterPaymentDto {
  month: string; // "YYYY-MM"
  amount: number;
  status: string; // 'paid' | 'pending'
  paymentMethod?: string;
  notes?: string;
}
