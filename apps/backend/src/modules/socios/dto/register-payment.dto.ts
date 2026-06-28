import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class RegisterPaymentDto {
  @IsString()
  @IsNotEmpty()
  month: string; // "YYYY-MM"

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  status: string; // 'paid' | 'pending'

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
