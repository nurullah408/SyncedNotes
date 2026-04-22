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

}
