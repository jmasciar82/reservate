export class UpdateReservationDto {
  status?: string;
  paymentStatus?: string;
  depositAmount?: number;
  cancelSeries?: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
  paymentDate?: Date;
  payBlock?: boolean;
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  totalPrice?: number;
  products?: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  productsPrice?: number;
  reservationType?: string;
  teacherId?: string | null;
  teacherPrice?: number;
  students?: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    paidAbono?: boolean;
  }>;
}



