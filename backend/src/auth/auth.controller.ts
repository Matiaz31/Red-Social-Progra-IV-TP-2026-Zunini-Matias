import {
  Body,
  Controller,
  Post,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { UploadedFile as ProfileImageFile } from '../cloudinary/cloudinary.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImage'))
  register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file?: ProfileImageFile,
  ) {
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          'El archivo debe ser una imagen',
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException(
          'La imagen no puede superar los 5 MB',
        );
      }
    }

    return this.authService.register(registerDto, file);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(
      loginDto.identifier,
      loginDto.password,
    );
  }
}