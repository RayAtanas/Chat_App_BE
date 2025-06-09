/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: '2831t6e2t30dsadahsdwe2268347rd2372hjdhshcuiw',
    });
  }

  validate(payload: any) {
    // Payload: { sub: userId, username: ... }
    return { userId: payload.sub, username: payload.username };
  }
}
