/* eslint-disable prettier/prettier */
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,UpdateResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './user.entity';
import { RegisterUserDto } from '../auth/dto/UserDTO';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: RegisterUserDto): Promise<Partial<User>> {
    const exists = await this.usersRepo.findOneBy({ username: dto.username });
    if (exists) {
      throw new ConflictException('Username already taken');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      username: dto.username,
      password: hash,
      status: UserStatus.OFFLINE,
    });
    await this.usersRepo.save(user);

    // Hello Mr. Mohammad we never return the result of the hashed password for security issues
    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string) {
  return this.usersRepo.findOneBy({ username });
}

async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UpdateResult> {
    return this.usersRepo.update(userId, { status });
  }

}
