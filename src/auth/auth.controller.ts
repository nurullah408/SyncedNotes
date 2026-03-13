import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt.auth-guard';
import type { RequestUser } from './types/JwtPayload';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.create(createUserDto);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const accessTokenMaxAge = Number(this.configService.get('JWT_ACCESS_TOKEN_MAX_AGE'));
    const refreshTokenMaxAge = Number(this.configService.get('JWT_REFRESH_TOKEN_MAX_AGE'));

    if (result) {
      const { access_token, refresh_token, user } = result;

      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: accessTokenMaxAge, // 15 minutes
      });

      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: refreshTokenMaxAge, // 7 days
      });

      return {
        message: "Sign up Successfull",
        user,
      }
    }

  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  update(@GetUser() user: RequestUser, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(user.id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
