import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('request-creation')
  async requestCreation(@Body() body: any, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'club_owner') {
      throw new ForbiddenException('Solo los dueños de franquicias pueden solicitar la creación de una nueva sede.');
    }

    if (!body.name || !body.location) {
      throw new BadRequestException('El nombre y la ubicación de la sede son requeridos.');
    }

    await this.auditLogsService.logAction({
      userId: user.id || user._id,
      userName: user.name || user.email || 'Dueño de Club',
      userEmail: user.email,
      action: 'request_club_creation',
      targetType: 'club',
      targetId: 'new',
      tenantId: user.tenantId,
      details: {
        name: body.name,
        location: body.location,
        sports: body.sports,
        comments: body.comments,
      },
    });

    return { success: true, message: 'Solicitud de nueva sede registrada correctamente.' };
  }

  @Post()
  async create(@Body() createClubDto: CreateClubDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Solo los administradores globales pueden crear sedes/clubes. Por favor, solicita la creación al administrador del sistema.');
    }

    return this.clubsService.create(createClubDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    if (user.role === 'club_owner') {
      if (!user.tenantId) return [];
      return this.clubsService.findByTenant(user.tenantId);
    } else if (user.role === 'staff') {
      if (user.clubId) {
        const club = await this.clubsService.findOne(user.clubId);
        return club ? [club] : [];
      }
      return [];
    }
    return this.clubsService.findAll();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin') {
      if (user.role === 'club_owner') {
        const club = await this.clubsService.findOne(id);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para actualizar este club.');
        }
      } else if (user.role === 'staff') {
        if (user.clubId !== id) {
          throw new ForbiddenException('No tienes permiso para actualizar este club.');
        }
      } else {
        throw new ForbiddenException('No tienes permiso para actualizar este club.');
      }
    }
    return this.clubsService.update(id, updateClubDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Solo los administradores globales pueden eliminar clubes.');
    }
    return this.clubsService.remove(id);
  }
}
