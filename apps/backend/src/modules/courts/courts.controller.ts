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
import { CourtsService } from './courts.service';
import { ClubsService } from '../clubs/clubs.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courts')
@UseGuards(JwtAuthGuard)
export class CourtsController {
  constructor(
    private readonly courtsService: CourtsService,
    private readonly clubsService: ClubsService,
  ) {}

  @Post()
  async create(@Body() createCourtDto: CreateCourtDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      if (user.role === 'club_owner') {
        if (!createCourtDto.clubId) {
          throw new ForbiddenException('Debes indicar el clubId para crear la cancha.');
        }
        const club = await this.clubsService.findOne(createCourtDto.clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('El club indicado no pertenece a tu franquicia.');
        }
      } else if (user.role === 'staff') {
        if (!user.clubId) {
          throw new ForbiddenException('No tienes un club asociado para crear una cancha.');
        }
        createCourtDto.clubId = user.clubId;
      } else {
        throw new ForbiddenException('No tienes permiso para crear canchas.');
      }
    }
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    if (user.role === 'club_owner') {
      if (!user.tenantId) return [];
      const clubs = await this.clubsService.findByTenant(user.tenantId);
      const clubIds = clubs.map((c: any) => c._id.toString());
      return this.courtsService.findAll(clubIds);
    } else if (user.role === 'staff') {
      return this.courtsService.findAll(user.clubId);
    }
    return this.courtsService.findAll();
  }

  @Get('available')
  async findAvailable(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Request() req: any,
    @Query('clubId') clubId?: string,
  ) {
    const user = req.user;
    let targetClubId = clubId;
    if (user.role === 'club_owner') {
      if (clubId) {
        const club = await this.clubsService.findOne(clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para consultar disponibilidad en este club.');
        }
      }
    } else if (user.role === 'staff') {
      targetClubId = user.clubId;
    }
    return this.courtsService.findAvailable(
      new Date(startTime),
      new Date(endTime),
      targetClubId,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourtDto: UpdateCourtDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin') {
      const court = await this.courtsService.findOne(id);
      if (!court) {
        throw new ForbiddenException('La cancha indicada no existe.');
      }

      if (user.role === 'club_owner') {
        const club = await this.clubsService.findOne(court.clubId.toString());
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para actualizar esta cancha.');
        }
        if (updateCourtDto.clubId) {
          const newClub = await this.clubsService.findOne(updateCourtDto.clubId);
          if (!newClub || newClub.tenantId?.toString() !== user.tenantId?.toString()) {
            throw new ForbiddenException('El club destino no pertenece a tu franquicia.');
          }
        }
      } else if (user.role === 'staff') {
        if (court.clubId.toString() !== user.clubId) {
          throw new ForbiddenException('No tienes permiso para actualizar esta cancha.');
        }
        updateCourtDto.clubId = user.clubId;
      } else {
        throw new ForbiddenException('No tienes permiso para actualizar esta cancha.');
      }
    }
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      const court = await this.courtsService.findOne(id);
      if (!court) {
        throw new ForbiddenException('La cancha indicada no existe.');
      }

      if (user.role === 'club_owner') {
        const club = await this.clubsService.findOne(court.clubId.toString());
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para eliminar esta cancha.');
        }
      } else if (user.role === 'staff') {
        if (court.clubId.toString() !== user.clubId) {
          throw new ForbiddenException('No tienes permiso para eliminar esta cancha.');
        }
      } else {
        throw new ForbiddenException('No tienes permiso para eliminar esta cancha.');
      }
    }
    return this.courtsService.remove(id);
  }
}
