export class CreateClubDto {
  name: string;
  location: string;
  sports?: string[];
  description?: string;
  bookingEnabled?: boolean;
  depositType?: string;
  depositValue?: number;
  mpAccessToken?: string;
  mpPublicKey?: string;
  tenantId?: string;
}
