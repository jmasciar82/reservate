import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreatePublicReservationDto {
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail({}, { message: 'El formato del email no es válido.' })
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
