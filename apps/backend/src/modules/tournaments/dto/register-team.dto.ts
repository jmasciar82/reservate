class PlayerDto {
  name: string;
  phone: string;
  email?: string;
}

export class RegisterTeamDto {
  name: string;
  player1: PlayerDto;
  player2: PlayerDto;
}
