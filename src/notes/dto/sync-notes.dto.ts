import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BaseNoteDto } from './base-note.dto';

export class SyncNotesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseNoteDto)
  notes!: BaseNoteDto[]
}