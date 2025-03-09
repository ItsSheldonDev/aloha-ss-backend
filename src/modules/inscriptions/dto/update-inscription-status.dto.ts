import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutInscription } from '@prisma/client';

export class UpdateInscriptionStatusDto {
  @ApiProperty({
    enum: StatutInscription,
    description: 'Nouveau statut de l\'inscription',
    example: StatutInscription.ACCEPTEE,
  })
  @IsEnum(StatutInscription)
  @IsNotEmpty()
  statut: StatutInscription;
}