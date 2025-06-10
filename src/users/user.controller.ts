/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/user.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User, UserStatus } from '../users/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
  ) {}


@UseGuards(JwtAuthGuard)
@Get()
async getAllUsers(): Promise<Partial<User>[]> {
  return this.usersService.findAllUsers();
}

  @Get('online')
  async getOnlineUsers(): Promise<Partial<User>[]> {
    return this.usersService.findUsersByStatus(UserStatus.ONLINE);
  }

}
