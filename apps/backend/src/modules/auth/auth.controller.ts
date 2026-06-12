import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    if (!email) {
      throw new BadRequestException('El correo electrónico es obligatorio.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Por seguridad, retornamos el mismo mensaje sin revelar si el correo existe o no
      return { message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' };
    }

    // Generar token y expiración
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await this.usersService.saveResetToken(email, token, expires);

    // En desarrollo local, se imprime en la consola del servidor
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    console.log('\n==================================================');
    console.log(`SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA`);
    console.log(`Usuario: ${user.name} (${email})`);
    console.log(`Enlace de restablecimiento:\n${resetUrl}`);
    console.log('==================================================\n');

    return { message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const { token, password } = body;
    if (!token || !password) {
      throw new BadRequestException('El token y la nueva contraseña son obligatorios.');
    }

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('El token de restablecimiento es inválido o ha expirado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.usersService.updatePassword(user._id.toString(), passwordHash);
    await this.usersService.clearResetToken(user._id.toString());

    return { message: 'Contraseña restablecida con éxito.' };
  }
}
