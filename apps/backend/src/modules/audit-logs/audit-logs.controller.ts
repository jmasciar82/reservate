import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner') {
      throw new ForbiddenException('No tienes permisos para consultar la auditoría de cambios.');
    }

    if (user.role === 'admin') {
      return this.auditLogsService.findAll();
    } else {
      return this.auditLogsService.findAll(user.tenantId);
    }
  }
}
