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
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courts')
@UseGuards(JwtAuthGuard)
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  async create(@Body() createCourtDto: CreateCourtDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      if (!user.clubId) {
        throw new ForbiddenException('No tienes un club asociado para crear una cancha.');
      }
      createCourtDto.clubId = user.clubId;
    }
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const user = req.user;
    if (user.role === 'club_owner' || user.role === 'staff') {
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
    if (user.role === 'club_owner' || user.role === 'staff') {
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
      const courts = await this.courtsService.findAll(user.clubId);
      const belongs = courts.some((c: any) => c._id.toString() === id);
      if (!belongs) {
        throw new ForbiddenException('No tienes permiso para actualizar esta cancha.');
      }
      updateCourtDto.clubId = user.clubId;
    }
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      const courts = await this.courtsService.findAll(user.clubId);
      const belongs = courts.some((c: any) => c._id.toString() === id);
      if (!belongs) {
        throw new ForbiddenException('No tienes permiso para eliminar esta cancha.');
      }
    }
    return this.courtsService.remove(id);
  }
}
