import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from 'src/constants';

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: Prisma,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const found = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      }
    });

    if (!found) {
      const hashed = await bcrypt.hash(createUserDto.password, BCRYPT_SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password_hash: hashed,
        }
      });
      const { access_token, refresh_token } = await this.getTokens(user.id, user.email);

      await this.updateHashedRefreshToken(user.id, refresh_token);

      const userObj = {
        id: user.id,
        email: user.email,
      }

      return {
        refresh_token,
        access_token,
        user: userObj
      }
    }

    throw new HttpException('This email is already exists', HttpStatus.CONFLICT);

  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      data: {
        ...updateUserDto,
      },
      where: {
        id: userId,
      }
    });
    if (!user) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  // Helper function to generate access and refresh tokens
  async getTokens(userId: number, email: string) {
    const payload = {
      sub: userId,
      email,
    };
    const [accessToken, refreshToken] = await Promise.all([
      // 1. The access token
      this.jwtService.signAsync(payload),
      // 2. The refresh token that uses a different secret key
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d'
      })
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    }
  }

  async updateHashedRefreshToken(userId: number, token: string | null) {
    let hashedRefreshToken: string | null = null;

    if (token) {
      hashedRefreshToken = await bcrypt.hash(token, BCRYPT_SALT_ROUNDS);
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashed_refresh_token: hashedRefreshToken
      }
    });
  }


}
