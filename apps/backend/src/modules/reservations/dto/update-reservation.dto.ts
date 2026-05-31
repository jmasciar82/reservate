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
}
