import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateMatchDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsNumber()
  @IsNotEmpty()
  scoreA: number;

  @IsNumber()
  @IsNotEmpty()
  scoreB: number;
}
