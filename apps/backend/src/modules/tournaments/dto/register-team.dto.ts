import { IsString, IsNotEmpty, IsOptional, IsEmail, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class PlayerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  email?: string;
}

export class RegisterTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => PlayerDto)
  player1: PlayerDto;

  @ValidateNested()
  @Type(() => PlayerDto)
  player2: PlayerDto;
}
