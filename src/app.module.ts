import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from './prisma/prisma.service';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
    }),
    NotesModule
  ],
  controllers: [AppController],
  providers: [AppService, Prisma],
})
export class AppModule { }
