export class CreateTournamentDto {
  name: string;
  clubId: string;
  sport: string;
  category: string;
  startDate: string;
  endDate: string;
  registrationFee: number;
  maxTeams: number;
  status?: 'draft' | 'registration' | 'active' | 'completed';
}
