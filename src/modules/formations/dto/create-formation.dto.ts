import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDate, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TypeFormation } from '@prisma/client';

export class CreateFormationDto {
  @ApiProperty({ example: 'Formation PSC1', description: 'Titre de la formation' })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty({ 
    enum: TypeFormation, 
    description: 'Type de formation',
    example: TypeFormation.PSC1
  })
  @IsEnum(TypeFormation)
  type: TypeFormation;

  @ApiProperty({ 
    example: '2023-12-01T09:00:00Z', 
    description: 'Date de la formation' 
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @ApiProperty({ example: '7h', description: 'Durée de la formation' })
  @IsString()
  @IsNotEmpty()
  duree: string;

  @ApiProperty({ example: 12, description: 'Nombre total de places' })
  @IsNumber()
  @Min(1)
  placesTotal: number;

  @ApiProperty({ example: 89.99, description: 'Prix de la formation' })
  @IsNumber()
  @Min(0)
  prix: number;

  @ApiProperty({ example: 'Lyon', description: 'Lieu de la formation' })
  @IsString()
  @IsNotEmpty()
  lieu: string;

  @ApiProperty({ example: 'Jean Dupont', description: 'Nom du formateur' })
  @IsString()
  @IsNotEmpty()
  formateur: string;
}