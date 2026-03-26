import { Controller, Get, Post, Body, Param, Delete, Res, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt.auth-guard';
import type { RequestUser } from './types/JwtPayload';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('signup')
  async signup(
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

  @Post('signin')
  async signin(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const { user, access_token, refresh_token } = await this.authService.signin(createUserDto);

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const accessTokenMaxAge = Number(this.configService.get('JWT_ACCESS_TOKEN_MAX_AGE'));
    const refreshTokenMaxAge = Number(this.configService.get('JWT_REFRESH_TOKEN_MAX_AGE'));

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenMaxAge,
    });

    return {
      user,
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
  @Post('update')
  update(@GetUser() user: RequestUser, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(user.id, updateUserDto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(
    @GetUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response
  ) {

    if (!user?.refreshToken) {
      throw new UnauthorizedException('No refresh token given');
    }

    const result = await this.authService.refresh(user.id, user?.refreshToken);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const accessTokenMaxAge = Number(this.configService.get('JWT_ACCESS_TOKEN_MAX_AGE'));
    const refreshTokenMaxAge = Number(this.configService.get('JWT_REFRESH_TOKEN_MAX_AGE'));

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
    });

    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenMaxAge,
    })

    return {
      message: 'Token refreshed'
    }

  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@GetUser() user: RequestUser) {
    return this.authService.remove(user.id);
  }
}
