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
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    if (!createTeacherDto.clubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  async findAll(@Query('clubId') clubId?: string) {
    return this.teachersService.findAll(clubId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const teacher = await this.teachersService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado.');
    }
    return teacher;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    const teacher = await this.teachersService.update(id, updateTeacherDto);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado para actualizar.');
    }
    return teacher;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const teacher = await this.teachersService.remove(id);
    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado para eliminar.');
    }
    return { message: 'Profesor eliminado correctamente.' };
  }

  @Get(':id/settlement')
  async getSettlement(
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!start || !end) {
      throw new BadRequestException('Los parámetros query start y end son requeridos (formato YYYY-MM-DD).');
    }
    return this.teachersService.getSettlement(id, start, end);
  }
}
