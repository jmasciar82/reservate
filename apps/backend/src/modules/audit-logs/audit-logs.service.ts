import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>
  ) {}

  async logAction(params: {
    userId?: string;
    userName: string;
    userEmail?: string;
    action: string;
    targetType: string;
    targetId: string;
    clubId?: string | Types.ObjectId;
    tenantId?: string | Types.ObjectId;
    details?: Record<string, any>;
  }): Promise<AuditLogDocument> {
    const createdLog = new this.auditLogModel({
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      clubId: params.clubId ? new Types.ObjectId(params.clubId) : undefined,
      tenantId: params.tenantId ? new Types.ObjectId(params.tenantId) : undefined,
      details: params.details,
    });
    return createdLog.save();
  }

  async findAll(tenantId?: string): Promise<AuditLogDocument[]> {
    const filter: any = {};
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);
    return this.auditLogModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
