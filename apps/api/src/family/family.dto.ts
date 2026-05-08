import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum FamilyVisibility { PRIVATE = 'PRIVATE', PUBLIC_TREE = 'PUBLIC_TREE' }

export class CreateFamilyDto {
  @IsString() @MaxLength(100) name: string;
  @IsOptional() @IsString() originProvince?: string;
  @IsOptional() @IsString() originDistrict?: string;
  @IsOptional() @IsString() originCommune?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsEnum(FamilyVisibility) visibility?: FamilyVisibility;
}

export class UpdateFamilyDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() originProvince?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(FamilyVisibility) visibility?: FamilyVisibility;
}
