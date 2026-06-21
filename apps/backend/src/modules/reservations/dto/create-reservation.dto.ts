import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  total?: number;
}

class StudentItemDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  paidAbono?: boolean;

  @IsOptional()
  @IsString()
  socioId?: string;
}

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsNumber()
  recurrenceWeeks?: number;

  @IsOptional()
  @IsBoolean()
  payBlock?: boolean;

  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products?: ProductItemDto[];

  @IsOptional()
  @IsNumber()
  productsPrice?: number;

  @IsOptional()
  @IsString()
  reservationType?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsNumber()
  teacherPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentItemDto)
  students?: StudentItemDto[];
}




