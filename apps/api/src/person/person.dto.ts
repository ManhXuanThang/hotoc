import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';

export enum Gender { MALE = 'MALE', FEMALE = 'FEMALE', UNKNOWN = 'UNKNOWN' }
export enum RelationType {
  PARENT = 'PARENT', ADOPTED_PARENT = 'ADOPTED_PARENT',
  SPOUSE = 'SPOUSE', EX_SPOUSE = 'EX_SPOUSE',
  SIBLING = 'SIBLING', HALF_SIBLING = 'HALF_SIBLING'
}

export class CreatePersonDto {
  @IsString() familyId: string;
  @IsString() @IsNotEmpty({ message: 'Họ tên không được để trống' }) @MaxLength(100) fullName: string;
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsDateString() deathDate?: string;
  @IsOptional() @IsBoolean() isAlive?: boolean;
  @IsOptional() @IsString() hometown?: string;
  @IsOptional() @IsString() currentLocation?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsBoolean() isRootAncestor?: boolean;
  @IsOptional() @IsString() relatedPersonId?: string;
  @IsOptional() @IsEnum(RelationType) relationToRelated?: RelationType;
}

export class UpdatePersonDto {
  @IsOptional() @IsString() @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsDateString() deathDate?: string;
  @IsOptional() @IsBoolean() isAlive?: boolean;
  @IsOptional() @IsString() hometown?: string;
  @IsOptional() @IsString() currentLocation?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
}
