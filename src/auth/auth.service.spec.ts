import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Prisma } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Prisma;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    }
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('fake_token')
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        {
          provide: Prisma, useValue: mockPrismaService,
        },
        {
          provide: JwtService, useValue: mockJwtService,
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<Prisma>(Prisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should hash password and create a new user', async () => {
      const dto = {
        email: 'test@email.com',
        password: 'test123',
        name: 'Test User'
      };

      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(prisma.user.create).toHaveBeenCalled();

      expect(result.user.email).toEqual(dto.email);

    });
  });

  describe('signin', () => {

    it('should throw Not found if user doesn\'t exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.signin({
        email: 'wrong@test.com',
        password: 'test123',
      })).rejects.toThrow(NotFoundException)
    });

    it('should throw Unauthorized if password is incorrect', async () => {

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'test@test.com',
        password_hash: await bcrypt.hash('correct_password', 10)
      });

      await expect(service.signin({
        email: 'test@test.com',
        password: await bcrypt.hash('incorrect_password', 10),
      })).rejects.toThrow(UnauthorizedException);

    })

  })

});
