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
import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { RegisterUserDto } from './dto/UserDTO';
import { LoginUserDto } from './dto/LoginDTO';
import { JwtAuthGuard } from './jwt.guard';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterUserDto,
  ): Promise<Partial<User>> {
    return this.usersService.create(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req,
  ): { userId: string; username: string } {
    return req.user;
  }
}
