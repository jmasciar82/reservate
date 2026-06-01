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
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private verifyAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Solo los administradores globales de la plataforma pueden gestionar inquilinos.');
    }
  }

  @Post()
  async create(@Body('name') name: string, @Request() req: any) {
    this.verifyAdmin(req);
    return this.tenantsService.create(name);
  }

  @Get()
  async findAll(@Request() req: any) {
    this.verifyAdmin(req);
    return this.tenantsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    this.verifyAdmin(req);
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body('name') name?: string,
    @Body('isActive') isActive?: boolean,
  ) {
    this.verifyAdmin(req);
    return this.tenantsService.update(id, name, isActive);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    this.verifyAdmin(req);
    return this.tenantsService.remove(id);
  }
}
