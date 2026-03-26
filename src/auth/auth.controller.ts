import { Controller, Get, Post, Body, Param, Delete, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt.auth-guard';
import type { RequestUser } from './types/JwtPayload';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.create(createUserDto);

    if (result) {
      const { access_token, refresh_token, user } = result;

      this.authService.setCookies(response, { access_token, refresh_token });

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

    this.authService.setCookies(response, { access_token, refresh_token });

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

    this.authService.setCookies(response, { ...result });

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
