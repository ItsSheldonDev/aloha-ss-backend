import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Category } from '@prisma/client';

export class CreateImageDto {
  @ApiProperty({
    example: 'Formation PSC1 - juin 2023',
    description: 'Description de l\'image',
  })
  @IsString()
  @IsNotEmpty()
  alt: string;

  @ApiProperty({
    enum: Category,
    description: 'Catégorie de l\'image',
    example: Category.formations,
  })
  @IsEnum(Category)
  @IsNotEmpty()
  category: Category;
}