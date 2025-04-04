// src/modules/users/dto/update-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'nouveau.email@example.com',
    description: 'Email de l\'administrateur',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'Dupont',
    description: 'Nom de famille',
    required: false
  })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({
    example: 'Jean',
    description: 'Prénom',
    required: false
  })
  @IsString()
  @IsOptional()
  prenom?: string;
}