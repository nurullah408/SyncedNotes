import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/prisma.service';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: Prisma;

  // 1. Create a Mock Prisma Object
  const mockPrisma = {
    note: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)), // Mocking transactions
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: Prisma, useValue: mockPrisma }, // Inject the mock
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    prisma = module.get<Prisma>(Prisma);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clean up between tests
  });

  describe('findOne', () => {
    it('should return a note if it exists', async () => {
      const mockNote = { id: '1', title: 'Test Note', userId: 123 };
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);

      const result = await service.findOne(123, '1');

      expect(result).toEqual(mockNote);
      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: '1', userId: 123 },
      });
    });

    it('should throw NotFoundException if note does not exist', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      await expect(service.findOne(123, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sync', () => {
    it('should upsert when incoming note is newer than existing', async () => {
      const userId = 1;
      const oldDate = new Date('2023-01-01');
      const newDate = new Date('2023-01-02');

      const incomingNotes = [{ id: 'note-1', title: 'New', content: '...', updatedAt: newDate }];
      const existingNotes = [{ id: 'note-1', title: 'Old', content: '...', updatedAt: oldDate, userId }];

      mockPrisma.note.findMany.mockResolvedValue(existingNotes);
      mockPrisma.note.upsert.mockResolvedValue({ ...incomingNotes[0], userId, version: 2 });

      const result = await service.sync(userId, incomingNotes as any);

      expect(result.upserted).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(mockPrisma.note.upsert).toHaveBeenCalled();
    });

    it('should record a conflict when existing note is newer', async () => {
      const userId = 1;
      const newerDate = new Date('2024-01-01');
      const olderDate = new Date('2023-01-01');

      const incomingNotes = [{ id: 'note-1', title: 'Stale', content: '...', updatedAt: olderDate }];
      const existingNotes = [{ id: 'note-1', title: 'Fresh', content: '...', updatedAt: newerDate, userId }];

      mockPrisma.note.findMany.mockResolvedValue(existingNotes);

      const result = await service.sync(userId, incomingNotes as any);

      expect(result.upserted).toHaveLength(0);
      expect(result.conflicts[0].title).toBe('Fresh');
    });
  });
});