/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** 
   * we are validating the credentials and returning the user without the password
   * 
   */
  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const match = await bcrypt.compare(pass, user.password);
    if (!match) return null;

    const { ...result } = user;
    return result;
  }


   login(user: { id: string; username: string }) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
