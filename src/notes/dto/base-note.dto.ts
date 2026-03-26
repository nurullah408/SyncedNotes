import { IsString, IsUUID, IsNotEmpty, IsOptional, IsDate, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseNoteDto {
  @IsUUID()
  @IsNotEmpty()
  id: string; // This will be generated on the client side

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  content: string

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsInt()
  @IsNotEmpty()
  userId: number;
}