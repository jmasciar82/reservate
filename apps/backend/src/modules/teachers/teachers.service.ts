import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Teacher, TeacherDocument } from './schemas/teacher.schema';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';

@Injectable()
export class TeachersService {
  constructor(
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    const createdTeacher = new this.teacherModel({
      ...createTeacherDto,
      clubId: new Types.ObjectId(createTeacherDto.clubId),
    });
    return createdTeacher.save();
  }

  async findAll(clubId?: string | string[]): Promise<Teacher[]> {
    let filter = {};
    if (clubId) {
      if (Array.isArray(clubId)) {
        filter = { clubId: { $in: clubId.map((id) => new Types.ObjectId(id)) } };
      } else {
        filter = { clubId: new Types.ObjectId(clubId) };
      }
    }
    return this.teacherModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Teacher | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.teacherModel.findById(id).exec();
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher | null> {
    const updateData: any = { ...updateTeacherDto };
    if (updateTeacherDto.clubId) {
      updateData.clubId = new Types.ObjectId(updateTeacherDto.clubId);
    }
    return this.teacherModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Teacher | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID no válido');
    }
    return this.teacherModel.findByIdAndDelete(id).exec();
  }

  async getSettlement(teacherId: string, startDateStr: string, endDateStr: string): Promise<any> {
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new BadRequestException('El profesor indicado no es válido.');
    }

    const teacher = await this.teacherModel.findById(teacherId).exec();
    if (!teacher) {
      throw new NotFoundException('El profesor no existe.');
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Formato de fecha no válido. Use YYYY-MM-DD.');
    }

    // Buscar reservas confirmadas/completadas en el rango para este profesor
    const reservations = await this.reservationModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
        status: { $in: ['confirmed', 'completed'] },
        startTime: { $gte: start, $lte: end },
      })
      .populate('courtId')
      .sort({ startTime: 1 })
      .exec();

    let totalHours = 0;
    let totalEarnings = 0;

    const classesList = reservations.map((res) => {
      const startMs = res.startTime.getTime();
      const endMs = res.endTime.getTime();
      const hours = (endMs - startMs) / (1000 * 60 * 60);
      totalHours += hours;

      const earnings = res.teacherPrice || 0;
      totalEarnings += earnings;

      return {
        id: res._id.toString(),
        startTime: res.startTime,
        endTime: res.endTime,
        courtName: res.courtId ? (res.courtId as any).name : 'Cancha eliminada',
        sport: res.courtId ? (res.courtId as any).sport : 'N/A',
        hours,
        earnings,
        playerName: `${res.firstName || ''} ${res.lastName || ''}`.trim() || res.userId || 'Cliente',
      };
    });

    return {
      teacher: {
        id: teacher._id.toString(),
        name: teacher.name,
        pricePerHour: teacher.pricePerHour,
        sport: teacher.sport,
      },
      range: {
        start,
        end,
      },
      summary: {
        totalClasses: reservations.length,
        totalHours: Math.round(totalHours * 100) / 100,
        totalEarnings,
      },
      classes: classesList,
    };
  }
}
