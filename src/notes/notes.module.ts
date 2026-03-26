import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Prisma } from 'src/prisma/prisma.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, Prisma],
})
export class NotesModule { }
