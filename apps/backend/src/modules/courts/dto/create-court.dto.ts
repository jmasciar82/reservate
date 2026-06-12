export class CreateCourtDto {
  name: string;
  sport: string;
  clubId: string;
  isActive?: boolean;
  isCovered?: boolean;
  pricePerHour?: number;
  capacity?: number;
}
