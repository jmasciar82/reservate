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
  Patch,
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
    const user = req.user;
    if (user.role === 'admin') {
      return this.usersService.findAll();
    } else if (user.role === 'club_owner') {
      return this.usersService.findAll(undefined, user.tenantId);
    }
    throw new ForbiddenException('No tienes permisos para realizar esta acción.');
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const caller = req.user;
    if (caller.role !== 'admin' && caller.role !== 'club_owner') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      throw new BadRequestException('Todos los campos (nombre, email, contraseña) son obligatorios.');
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let targetRole = role || 'staff';
    let targetClubId = body.clubId && body.clubId !== '' ? body.clubId : undefined;
    let targetTenantId = body.tenantId && body.tenantId !== '' ? body.tenantId : undefined;

    if (caller.role === 'club_owner') {
      if (role !== 'staff' && role !== 'player') {
        targetRole = 'staff';
      }
      targetTenantId = caller.tenantId;
    }

    return this.usersService.create({
      name,
      email,
      passwordHash,
      role: targetRole,
      clubId: targetClubId,
      tenantId: targetTenantId,
    });
  }

  @Patch('profile/password')
  async changePassword(@Req() req: any, @Body() body: any) {
    const userId = req.user.sub;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('La contraseña actual y la nueva contraseña son obligatorias.');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.usersService.updatePassword(userId, passwordHash);

    return { message: 'Contraseña actualizada con éxito.' };
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const caller = req.user;
    if (caller.role === 'admin') {
      return this.usersService.remove(id);
    } else if (caller.role === 'club_owner') {
      const userToDelete = await this.usersService.findById(id);
      if (!userToDelete || userToDelete.tenantId?.toString() !== caller.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permisos para eliminar este usuario.');
      }
      return this.usersService.remove(id);
    }
    throw new ForbiddenException('No tienes permisos para realizar esta acción.');
  }
}
