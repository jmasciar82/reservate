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
}
