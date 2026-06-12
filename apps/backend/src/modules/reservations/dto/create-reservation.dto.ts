export class CreateReservationDto {
  courtId: string;
  userId?: string;
  startTime: string;
  endTime: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isPublic?: boolean;
  isRecurring?: boolean;
  recurrenceWeeks?: number;
  payBlock?: boolean;
  depositAmount?: number;
  paymentStatus?: string;
  paymentDate?: Date;
  status?: string;
  products?: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  productsPrice?: number;
  reservationType?: string;
  teacherId?: string;
  teacherPrice?: number;
  students?: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>;
}



