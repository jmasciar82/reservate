import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class SetScoreDto {
  @IsNumber()
  scoreA: number;

  @IsNumber()
  scoreB: number;
}

export class UpdateMatchDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  // Para torneos con sets (pádel/tenis)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetScoreDto)
  @ArrayMinSize(1)
  sets?: SetScoreDto[];

  // Para torneos americano (puntos simples)
  @IsOptional()
  @IsNumber()
  scoreA?: number;

  @IsOptional()
  @IsNumber()
  scoreB?: number;
}
