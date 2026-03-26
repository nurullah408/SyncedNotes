import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Prisma } from 'src/prisma/prisma.service';
import { extractJwtFromCookie } from './jwt.extractor';
import { JwtPayload } from '../types/JwtPayload';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prismaService: Prisma,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || ""
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email }
  }

}