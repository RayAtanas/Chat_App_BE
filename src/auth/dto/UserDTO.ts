/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  // at least one letter and one number
  @Matches(/(?=.*\d)(?=.*[a-zA-Z]).*/, {
    message: 'password too weak',
  })
  password: string;
}
