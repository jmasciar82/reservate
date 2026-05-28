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

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({}, { passwordHash: 0 }).exec();
  }

  async remove(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
