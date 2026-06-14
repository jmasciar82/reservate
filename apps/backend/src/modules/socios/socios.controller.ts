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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SociosService } from './socios.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('socios')
@UseGuards(JwtAuthGuard)
export class SociosController {
  constructor(private readonly sociosService: SociosService) {}

  @Post()
  async create(@Body() createSocioDto: CreateSocioDto, @Request() req: any) {
    const user = req.user;
    if (user.role === 'staff') {
      createSocioDto.clubId = user.clubId;
    }
    if (!createSocioDto.clubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.sociosService.create(createSocioDto);
  }

  @Get()
  async findAll(@Query('clubId') clubId: string, @Query('search') search: string, @Request() req: any) {
    const user = req.user;
    let targetClubId = clubId;
    if (user.role === 'staff') {
      targetClubId = user.clubId;
    }
    if (!targetClubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.sociosService.findAll(targetClubId, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado.');
    }
    return socio;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSocioDto: UpdateSocioDto,
  ) {
    const socio = await this.sociosService.update(id, updateSocioDto);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para actualizar.');
    }
    return socio;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const socio = await this.sociosService.remove(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para eliminar.');
    }
    return { message: 'Socio eliminado correctamente.' };
  }

  @Post(':id/payments')
  async registerPayment(
    @Param('id') id: string,
    @Body() registerPaymentDto: RegisterPaymentDto,
  ) {
    return this.sociosService.registerPayment(id, registerPaymentDto);
  }

  @Delete(':id/payments/:month')
  async removePayment(
    @Param('id') id: string,
    @Param('month') month: string,
  ) {
    return this.sociosService.removePayment(id, month);
  }
}
