export class UpdateTeacherDto {
  name?: string;
  email?: string;
  phone?: string;
  pricePerHour?: number;
  sport?: string;
  isActive?: boolean;
  clubId?: string;
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

