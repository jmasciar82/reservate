import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  clubId: string;

  @IsString()
  @IsNotEmpty()
  sport: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  registrationFee: number;

  @IsNumber()
  @IsNotEmpty()
  maxTeams: number;

  @IsOptional()
  @IsEnum(['elimination', 'round_robin', 'groups_playoff', 'americano'])
  type?: 'elimination' | 'round_robin' | 'groups_playoff' | 'americano';

  @IsOptional()
  @IsEnum(['draft', 'registration', 'active', 'completed'])
  status?: 'draft' | 'registration' | 'active' | 'completed';
}
