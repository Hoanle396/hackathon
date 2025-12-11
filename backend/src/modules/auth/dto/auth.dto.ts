import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty()
  fullName: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty()
  password: string;
}

export class UpdateTokensDto {
  @ApiProperty({
    example: 'ghp_xxxxxxxxxxxx',
    description: 'GitHub Personal Access Token',
    required: false,
  })
  @IsOptional()
  githubToken?: string;

  @ApiProperty({
    example: 'glpat-xxxxxxxxxxxx',
    description: 'GitLab Personal Access Token',
    required: false,
  })
  @IsOptional()
  gitlabToken?: string;
}
