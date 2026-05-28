import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    return this.usersService.findAll();
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      throw new BadRequestException('Todos los campos (nombre, email, contraseña) son obligatorios.');
    }

    // Verificar si el email ya existe
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }
    
    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return this.usersService.create({
      name,
      email,
      passwordHash,
      role: role || 'staff',
    });
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    return this.usersService.remove(id);
  }
}
