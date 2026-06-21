import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ClubsService } from '../clubs/clubs.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly clubsService: ClubsService,
  ) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      if (user.role === 'club_owner') {
        if (!createProductDto.clubId) {
          throw new ForbiddenException('Debes indicar el clubId para crear el producto.');
        }
        const club = await this.clubsService.findOne(createProductDto.clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('El club indicado no pertenece a tu franquicia.');
        }
      } else if (user.role === 'staff') {
        if (!user.clubId) {
          throw new ForbiddenException('No tienes un club asociado para crear un producto.');
        }
        createProductDto.clubId = user.clubId;
      } else {
        throw new ForbiddenException('No tienes permiso para crear productos.');
      }
    }
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(@Request() req: any, @Query('clubId') clubId?: string) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    if (user.role === 'club_owner') {
      if (clubId) {
        const club = await this.clubsService.findOne(clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes acceso a los productos de este club.');
        }
        return this.productsService.findAll(clubId);
      }
      if (!user.tenantId) return [];
      const clubs = await this.clubsService.findByTenant(user.tenantId);
      const clubIds = clubs.map((c: any) => c._id.toString());
      return this.productsService.findAll(clubIds);
    } else if (user.role === 'staff') {
      return this.productsService.findAll(user.clubId);
    }
    return this.productsService.findAll(clubId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin') {
      const product = await this.productsService.findOne(id);
      if (!product) {
        throw new ForbiddenException('El producto indicado no existe.');
      }

      if (user.role === 'club_owner') {
        const club = await this.clubsService.findOne(product.clubId.toString());
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para actualizar este producto.');
        }
        if (updateProductDto.clubId) {
          const newClub = await this.clubsService.findOne(updateProductDto.clubId);
          if (!newClub || newClub.tenantId?.toString() !== user.tenantId?.toString()) {
            throw new ForbiddenException('El club destino no pertenece a tu franquicia.');
          }
        }
      } else if (user.role === 'staff') {
        if (product.clubId.toString() !== user.clubId) {
          throw new ForbiddenException('No tienes permiso para actualizar este producto.');
        }
        updateProductDto.clubId = user.clubId;
      } else {
        throw new ForbiddenException('No tienes permiso para actualizar este producto.');
      }
    }
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      const product = await this.productsService.findOne(id);
      if (!product) {
        throw new ForbiddenException('El producto indicado no existe.');
      }

      if (user.role === 'club_owner') {
        const club = await this.clubsService.findOne(product.clubId.toString());
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para eliminar este producto.');
        }
      } else if (user.role === 'staff') {
        if (product.clubId.toString() !== user.clubId) {
          throw new ForbiddenException('No tienes permiso para eliminar este producto.');
        }
      } else {
        throw new ForbiddenException('No tienes permiso para eliminar este producto.');
      }
    }
    return this.productsService.remove(id);
  }
}
