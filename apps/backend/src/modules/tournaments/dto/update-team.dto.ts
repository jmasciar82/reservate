import { IsString, IsOptional, IsEmail, ValidateNested, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class PlayerDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.phone !== '')
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  email?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlayerDto)
  player1?: PlayerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlayerDto)
  player2?: PlayerDto;

  @IsOptional()
  @IsEnum(['pending', 'paid'])
  paymentStatus?: 'pending' | 'paid';

  @IsOptional()
  @IsDateString()
  paymentDate?: Date;
}
