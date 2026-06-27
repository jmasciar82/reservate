import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      if (isProduction) {
        throw new Error('FATAL: JWT_SECRET environment variable is required in production but not set.');
      } else {
        console.warn('⚠️ [WARNING]: JWT_SECRET is not configured. Falling back to "super-secret-key" for local development.');
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'super-secret-key',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      clubId: payload.clubId,
      tenantId: payload.tenantId,
    };
  }
}
