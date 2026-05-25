import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  async create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  @Get()
  async findAll() {
    return this.clubsService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
    return this.clubsService.update(id, updateClubDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }
}
