import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateInscriptionDto } from './create-inscription.dto';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { StatutInscription } from '@prisma/client';

export class UpdateInscriptionDto extends PartialType(
  OmitType(CreateInscriptionDto, ['formationId'] as const),
) {
  @ApiProperty({
    enum: StatutInscription,
    description: 'Statut de l\'inscription',
    required: false,
  })
  @IsEnum(StatutInscription)
  @IsOptional()
  statut?: StatutInscription;

  @ApiProperty({
    example: false,
    description: 'Indique si l\'utilisateur a été notifié',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifie?: boolean;
}