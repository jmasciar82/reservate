export class CreateProductDto {
  name: string;
  price: number;
  icon?: string;
  isActive?: boolean;
  isPopular?: boolean;
  clubId: string;
}
