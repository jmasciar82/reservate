export class CreateTeacherDto {
  name: string;
  email?: string;
  phone?: string;
  pricePerHour: number;
  sport: string;
  isActive?: boolean;
  clubId: string;
}
