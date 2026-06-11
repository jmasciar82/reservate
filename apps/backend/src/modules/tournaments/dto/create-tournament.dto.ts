export class CreateTournamentDto {
  name: string;
  clubId: string;
  sport: string;
  category: string;
  startDate: string;
  endDate: string;
  registrationFee: number;
  maxTeams: number;
  type?: 'elimination' | 'round_robin' | 'groups_playoff' | 'americano';
  status?: 'draft' | 'registration' | 'active' | 'completed';
}
