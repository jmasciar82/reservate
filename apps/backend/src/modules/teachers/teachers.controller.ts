import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { ClubsService } from '../clubs/clubs.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly clubsService: ClubsService,
  ) {}

  private async verifyAccess(teacherClubId: string | undefined, user: any) {
    if (user.role === 'admin') return;
    if (!teacherClubId) {
      throw new ForbiddenException('No tienes permisos para acceder a este profesor.');
    }
    if (user.role === 'club_owner') {
      const club = await this.clubsService.findOne(teacherClubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para acceder a este profesor.');
      }
    } else if (user.role === 'staff') {
      if (teacherClubId !== user.clubId) {
        throw new ForbiddenException('No tienes permiso para acceder a este profesor.');
      }
    } else {
      throw new ForbiddenException('No tienes permiso para realizar esta acción.');
    }
  }

  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    if (user.role === 'club_owner') {
      if (!createTeacherDto.clubId) {
        throw new BadRequestException('El clubId es requerido.');
      }
      const club = await this.clubsService.findOne(createTeacherDto.clubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('El club indicado no pertenece a tu franquicia.');
      }
    } else if (user.role === 'staff') {
      createTeacherDto.clubId = user.clubId;
    }

    if (!createTeacherDto.clubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.teachersService.create(createTeacherDto);
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
          throw new ForbiddenException('No tienes permiso para consultar profesores de este club.');
        }
        return this.teachersService.findAll(clubId);
      } else {
        if (!user.tenantId) return [];
        const clubs = await this.clubsService.findByTenant(user.tenantId);
        const clubIds = clubs.map((c: any) => c._id.toString());
        return this.teachersService.findAll(clubIds);
      }
    } else if (user.role === 'staff') {
      return this.teachersService.findAll(user.clubId);
    }

    return this.teachersService.findAll(clubId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado.');
    }
    await this.verifyAccess(teacher.clubId?.toString(), user);
    return teacher;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado para actualizar.');
    }
    await this.verifyAccess(teacher.clubId?.toString(), user);

    if (updateTeacherDto.clubId) {
      await this.verifyAccess(updateTeacherDto.clubId, user);
    }

    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado para eliminar.');
    }
    await this.verifyAccess(teacher.clubId?.toString(), user);

    await this.teachersService.remove(id);
    return { message: 'Profesor eliminado correctamente.' };
  }

  @Get(':id/settlement')
  async getSettlement(
    @Param('id') id: string,
    @Request() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado.');
    }
    await this.verifyAccess(teacher.clubId?.toString(), user);

    if (!start || !end) {
      throw new BadRequestException('Los parámetros query start y end son requeridos (formato YYYY-MM-DD).');
    }
    return this.teachersService.getSettlement(id, start, end);
  }
}
