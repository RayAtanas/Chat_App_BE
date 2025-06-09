/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
