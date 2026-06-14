import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Socio, SocioDocument } from './schemas/socio.schema';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Injectable()
export class SociosService {
  constructor(
    @InjectModel(Socio.name) private socioModel: Model<SocioDocument>,
  ) {}

  async create(createSocioDto: CreateSocioDto): Promise<Socio> {
    const createdSocio = new this.socioModel({
      ...createSocioDto,
      clubId: new Types.ObjectId(createSocioDto.clubId),
    });
    return createdSocio.save();
  }

  async findAll(clubId: string, search?: string): Promise<Socio[]> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('clubId no válido');
    }
    const filter: any = { clubId: new Types.ObjectId(clubId) };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { dni: searchRegex },
      ];
    }
    return this.socioModel.find(filter).sort({ lastName: 1, firstName: 1 }).exec();
  }

  async findOne(id: string): Promise<Socio | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.socioModel.findById(id).exec();
  }

  async update(id: string, updateSocioDto: UpdateSocioDto): Promise<Socio | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID no válido');
    }
    return this.socioModel
      .findByIdAndUpdate(id, { $set: updateSocioDto }, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Socio | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID no válido');
    }
    return this.socioModel.findByIdAndDelete(id).exec();
  }

  async registerPayment(id: string, registerPaymentDto: RegisterPaymentDto): Promise<Socio> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID no válido');
    }
    const socio = await this.socioModel.findById(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado');
    }

    const existingPaymentIndex = socio.payments.findIndex(p => p.month === registerPaymentDto.month);
    if (existingPaymentIndex > -1) {
      socio.payments[existingPaymentIndex] = {
        ...socio.payments[existingPaymentIndex],
        amount: registerPaymentDto.amount,
        status: registerPaymentDto.status,
        paymentMethod: registerPaymentDto.paymentMethod,
        notes: registerPaymentDto.notes,
        paymentDate: new Date(),
      };
    } else {
      socio.payments.push({
        month: registerPaymentDto.month,
        amount: registerPaymentDto.amount,
        status: registerPaymentDto.status,
        paymentMethod: registerPaymentDto.paymentMethod,
        notes: registerPaymentDto.notes,
        paymentDate: new Date(),
      });
    }

    socio.markModified('payments');
    return socio.save();
  }

  async removePayment(id: string, month: string): Promise<Socio> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID no válido');
    }
    const socio = await this.socioModel.findById(id);
    if (!socio) {
      throw new NotFoundException('Socio no encontrado');
    }

    socio.payments = socio.payments.filter(p => p.month !== month);
    socio.markModified('payments');
    return socio.save();
  }
}
