import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'Fiche formation PSC1',
    description: 'Titre du document',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: DocumentCategory,
    description: 'Catégorie du document',
    example: DocumentCategory.FORMATIONS_PRO,
  })
  @IsEnum(DocumentCategory)
  @IsNotEmpty()
  category: DocumentCategory;
}