import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  registrationFee?: number;

  @IsOptional()
  @IsNumber()
  maxTeams?: number;

  @IsOptional()
  @IsEnum(['elimination', 'round_robin', 'groups_playoff', 'americano'])
  type?: 'elimination' | 'round_robin' | 'groups_playoff' | 'americano';

  @IsOptional()
  @IsEnum(['draft', 'registration', 'active', 'completed'])
  status?: 'draft' | 'registration' | 'active' | 'completed';
}
