import { Prisma } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SyncNotesDto } from './dto/sync-notes.dto';
import { Note } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private prisma: Prisma) { }

  async processSync(userId: number, incomingNotes: SyncNotesDto) {
    return this.prisma.$transaction(async (tx) => {

      const results: Note[] = [];

      for (const incomingNote of incomingNotes.notes) {

        const existingNote = await tx.note.findUnique({
          where: {
            id: incomingNote.id
          }
        });

        if (existingNote && existingNote.userId !== userId) {
          // If it belongs to someone else, we skip it entirely
          continue;
        }

        if (!existingNote || new Date(incomingNote.updatedAt) > existingNote.updatedAt) {

          const updated = await tx.note.upsert({
            where: {
              id: incomingNote.id,
            },
            create: {
              ...incomingNote,
              userId,
            },
            update: {
              title: incomingNote.title,
              content: incomingNote.content,
              updatedAt: incomingNote.updatedAt,
              isDeleted: incomingNote.isDeleted,
              version: {
                increment: 1
              }
            }
          });

          results.push(updated);
        } else {
          results.push(existingNote);
        }
      }
      return results;
    });
  }

}