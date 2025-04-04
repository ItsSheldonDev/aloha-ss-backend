import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email de l\'administrateur',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mot de passe (min 8 caractères)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Dupont',
    description: 'Nom de famille',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    example: 'Jean',
    description: 'Prénom',
  })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    enum: Role,
    description: 'Rôle de l\'administrateur',
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.ADMIN;
}