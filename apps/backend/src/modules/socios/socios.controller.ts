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
import { ClubsService } from '../clubs/clubs.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('socios')
@UseGuards(JwtAuthGuard)
export class SociosController {
  constructor(
    private readonly sociosService: SociosService,
    private readonly clubsService: ClubsService,
  ) {}

  private async verifyAccess(socioClubId: string | undefined, user: any) {
    if (user.role === 'admin') return;
    if (!socioClubId) {
      throw new ForbiddenException('No tienes permisos para acceder a este socio.');
    }
    if (user.role === 'club_owner') {
      const club = await this.clubsService.findOne(socioClubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para acceder a este socio.');
      }
    } else if (user.role === 'staff') {
      if (socioClubId !== user.clubId) {
        throw new ForbiddenException('No tienes permiso para acceder a este socio.');
      }
    } else {
      throw new ForbiddenException('No tienes permiso para realizar esta acción.');
    }
  }

  @Post()
  async create(@Body() createSocioDto: CreateSocioDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    if (user.role === 'staff') {
      createSocioDto.clubId = user.clubId;
    }

    if (user.role === 'club_owner') {
      if (!createSocioDto.clubId) {
        throw new BadRequestException('El clubId es requerido.');
      }
      const club = await this.clubsService.findOne(createSocioDto.clubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('El club indicado no pertenece a tu franquicia.');
      }
    }

    if (!createSocioDto.clubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.sociosService.create(createSocioDto);
  }

  @Get()
  async findAll(@Query('clubId') clubId: string, @Query('search') search: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    let targetClubId = clubId;
    if (user.role === 'staff') {
      targetClubId = user.clubId;
    }

    if (user.role === 'club_owner') {
      if (!targetClubId) {
        throw new BadRequestException('El clubId es requerido.');
      }
      const club = await this.clubsService.findOne(targetClubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para consultar socios de este club.');
      }
    }

    if (!targetClubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.sociosService.findAll(targetClubId, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.verifyAccess(socio.clubId?.toString(), user);
    return socio;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSocioDto: UpdateSocioDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para actualizar.');
    }
    await this.verifyAccess(socio.clubId?.toString(), user);

    return this.sociosService.update(id, updateSocioDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para eliminar.');
    }
    await this.verifyAccess(socio.clubId?.toString(), user);

    await this.sociosService.remove(id);
    return { message: 'Socio eliminado correctamente.' };
  }

  @Post(':id/payments')
  async registerPayment(
    @Param('id') id: string,
    @Body() registerPaymentDto: RegisterPaymentDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para registrar pago.');
    }
    await this.verifyAccess(socio.clubId?.toString(), user);

    return this.sociosService.registerPayment(id, registerPaymentDto);
  }

  @Delete(':id/payments/:month')
  async removePayment(
    @Param('id') id: string,
    @Param('month') month: string,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const socio = await this.sociosService.findOne(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado para eliminar pago.');
    }
    await this.verifyAccess(socio.clubId?.toString(), user);

    return this.sociosService.removePayment(id, month);
  }
}
