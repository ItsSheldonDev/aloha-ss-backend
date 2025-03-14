import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CreateInscriptionDto {
  @ApiProperty({
    example: 'Dupont',
    description: 'Nom de famille du participant',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    example: 'Jean',
    description: 'Prénom du participant',
  })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    example: 'jean.dupont@example.com',
    description: 'Email du participant',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '0612345678',
    description: 'Numéro de téléphone du participant',
  })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Date de naissance du participant (format ISO)',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateNaissance: string;

  @ApiProperty({
    example: 'cm8378b1w0000ieen3bkkafwh',
    description: 'ID de la formation à laquelle le participant souhaite s\'inscrire',
  })
  @IsString()
  @IsNotEmpty()
  formationId: string;

  @ApiProperty({
    example: 'Allergie aux arachides, besoin d\'un accès PMR',
    description: 'Message ou informations complémentaires',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}