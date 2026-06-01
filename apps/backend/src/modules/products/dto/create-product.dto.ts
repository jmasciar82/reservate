export class CreateProductDto {
  name: string;
  price: number;
  icon?: string;
  isActive?: boolean;
  clubId: string;
}
