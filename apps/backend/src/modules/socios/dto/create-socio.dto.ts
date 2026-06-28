import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSocioDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  clubId: string;

  @IsOptional()
  @IsString()
  status?: string;
}
