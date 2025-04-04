import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Nouveau mot de passe (min 8 caractères)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}