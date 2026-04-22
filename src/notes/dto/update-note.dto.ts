import { PartialType } from '@nestjs/mapped-types';
import { BaseNoteDto } from './base-note.dto';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateNoteDto extends PartialType(BaseNoteDto) {
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;
}
