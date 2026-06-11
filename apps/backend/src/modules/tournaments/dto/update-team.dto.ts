class PlayerDto {
  name: string;
  phone: string;
  email?: string;
}

export class UpdateTeamDto {
  name?: string;
  player1?: PlayerDto;
  player2?: PlayerDto;
}
