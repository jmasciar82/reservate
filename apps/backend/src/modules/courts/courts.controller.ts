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
} from '@nestjs/common';
import * as fs from 'fs';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courts')
@UseGuards(JwtAuthGuard)
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
    const logFile = 'C:/Users/juanp/.gemini/antigravity/brain/0404d1e4-10e2-458d-95cd-b130662bc2c8/scratch/debug.log';
    fs.appendFileSync(logFile, `findAvailable called: startTime=${startTime}, endTime=${endTime}, clubId=${clubId}\n`);
    try {
      const courts = await this.courtsService.findAvailable(
        new Date(startTime),
        new Date(endTime),
        clubId,
      );
      fs.appendFileSync(logFile, `findAvailable returning ${courts.length} courts\n`);
      return courts;
    } catch (e: any) {
      fs.appendFileSync(logFile, `findAvailable ERROR: ${e.message}\n`);
      throw e;
    }
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
