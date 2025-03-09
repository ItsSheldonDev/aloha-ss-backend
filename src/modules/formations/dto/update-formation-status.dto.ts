import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutFormation } from '@prisma/client';

export class UpdateFormationStatusDto {
  @ApiProperty({ 
    enum: StatutFormation, 
    description: 'Statut de la formation',
    example: StatutFormation.EN_COURS
  })
  @IsEnum(StatutFormation)
  @IsNotEmpty()
  statut: StatutFormation;
}