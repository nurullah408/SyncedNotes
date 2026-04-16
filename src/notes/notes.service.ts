import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Prisma } from '../prisma/prisma.service';
import { BaseNoteDto } from './dto/base-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: Prisma) { }

  async create(userId: number, createNoteDto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        ...createNoteDto,
        userId,
      },
    });

    if (!note) {
      throw new InternalServerErrorException();
    }

    return note;
  }

  async findAll(userId: number) {
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
      },
      orderBy: { updatedAt: 'desc' }
    });
    return notes;
  }

  async findOne(userId: number, id: string) {
    const note = await this.prisma.note.findUnique({
      where: {
        id,
        userId,
      }
    });

    if (!note) {
      throw new NotFoundException(`Note with ${id} not found`);
    }

    return note;
  }

  async update(userId: number, id: string, updateNoteDto: UpdateNoteDto) {
    const updated = await this.prisma.note.update({
      where: {
        id,
        userId,
      },
      data: {
        ...updateNoteDto,
        version: { increment: 1 }
      }
    });

    if (!updated) {
      throw new NotFoundException(`Note with ${id} not found`);
    }

    return updated;
  }

  async remove(userId: number, id: string) {
    const deleted = await this.prisma.note.delete({
      where: {
        id,
        userId
      }
    });

    if (!deleted) {
      throw new NotFoundException(`Note not found or not authorized`);
    }

    return deleted;
  }

  async sync(userId: number, incomingNotes: BaseNoteDto[]) {
    const syncResults = {
      upserted: [] as BaseNoteDto[],
      conflicts: [] as BaseNoteDto[],
    };

    const incomingIds = incomingNotes.map((note) => note.id);
    const existingNotes = await this.prisma.note.findMany({
      where: {
        id: {
          in: incomingIds
        },
        userId
      }
    });

    const existingMap = new Map(existingNotes.map((n) => [n.id, n]));

    await this.prisma.$transaction(async (tx) => {
      for (const incoming of incomingNotes) {
        const existing = existingMap.get(incoming.id);

        if (!existing || new Date(incoming.updatedAt) > new Date(existing.updatedAt)) {
          // Case: Note is either new or client version is newer
          const upserted = await tx.note.upsert({
            where: {
              id: incoming.id,
            },
            create: {
              ...incoming,
              userId,
              version: 1
            },
            update: {
              title: incoming.title,
              content: incoming.content,
              updatedAt: incoming.updatedAt,
              version: { increment: 1 }
            }
          });
          syncResults.upserted.push(upserted);
        } else {
          syncResults.conflicts.push(existing);
        }
      }
    });

    return syncResults;
  }
}
