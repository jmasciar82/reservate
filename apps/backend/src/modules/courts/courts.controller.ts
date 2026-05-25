import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  async create(@Body() createCourtDto: CreateCourtDto) {
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  async findAll() {
    return this.courtsService.findAll();
  }

  @Get('available')
  async findAvailable(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('clubId') clubId?: string,
  ) {
    return this.courtsService.findAvailable(
      new Date(startTime),
      new Date(endTime),
      clubId,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourtDto: UpdateCourtDto,
  ) {
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.courtsService.remove(id);
  }
}
