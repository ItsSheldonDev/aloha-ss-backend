import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsBoolean, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class ContactSettingsDto {
  @ApiProperty({ example: 'contact@aloha-secourisme.fr', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '06 12 34 56 78', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123 rue de la Paix, 75000 Paris', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}

class SocialSettingsDto {
  @ApiProperty({ example: 'https://facebook.com/aloha-secourisme', required: false })
  @IsUrl()
  @IsOptional()
  facebook?: string;

  @ApiProperty({ example: 'https://instagram.com/aloha-secourisme', required: false })
  @IsUrl()
  @IsOptional()
  instagram?: string;
}

class NotificationSettingsDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  emailInscription?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  emailContact?: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: ContactSettingsDto, required: false })
  @ValidateNested()
  @Type(() => ContactSettingsDto)
  @IsOptional()
  contact?: ContactSettingsDto;

  @ApiProperty({ type: SocialSettingsDto, required: false })
  @ValidateNested()
  @Type(() => SocialSettingsDto)
  @IsOptional()
  social?: SocialSettingsDto;

  @ApiProperty({ type: NotificationSettingsDto, required: false })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @IsOptional()
  notifications?: NotificationSettingsDto;
}