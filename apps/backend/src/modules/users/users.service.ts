import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(user: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(clubId?: string, tenantId?: string): Promise<UserDocument[]> {
    const filter: any = {};
    if (clubId) filter.clubId = clubId;
    if (tenantId) {
      filter.tenantId = tenantId;
      filter.role = { $ne: 'admin' }; // Excluir administradores globales del listado de la franquicia
    }
    return this.userModel.find(filter, { passwordHash: 0 }).exec();
  }

  async remove(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updatePassword(id: string, passwordHash: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { passwordHash } }, { new: true })
      .exec();
  }

  async saveResetToken(email: string, token: string, expires: Date): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email },
        { $set: { resetPasswordToken: token, resetPasswordExpires: expires } },
        { new: true },
      )
      .exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      })
      .exec();
  }

  async updateProfileInfo(id: string, name: string, email: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { name, email } }, { new: true })
      .exec();
  }

  async clearResetToken(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } },
        { new: true },
      )
      .exec();
  }
}
