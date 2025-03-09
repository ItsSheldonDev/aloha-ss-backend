import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ example: 'Nouvelle formation PSC1', description: 'Titre de l\'actualité' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Contenu détaillé de l\'actualité...', description: 'Contenu de l\'actualité' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'John Doe', description: 'Auteur de l\'actualité', required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ example: true, description: 'Statut de publication', default: true })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}