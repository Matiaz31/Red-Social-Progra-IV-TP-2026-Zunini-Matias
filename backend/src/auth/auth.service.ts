import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService, UploadedFile } from '../cloudinary/cloudinary.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async login(identifier: string, password: string) {
    const user = await this.usersService.findByIdentifierWithPassword(
      identifier,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Inicio de sesión exitoso',
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        birthDate: user.birthDate,
        description: user.description,
        profileImage: user.profileImage,
        role: user.role,
      },
    };
  }

  async register(userData: RegisterDto, file?: UploadedFile) {
    const existingEmail = await this.usersService.findByEmail(
      userData.email,
    );

    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const existingUsername = await this.usersService.findByUsername(
      userData.username,
    );

    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    let profileImage = '';

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'red-social/profile-images',
      );

      profileImage = uploadResult.secure_url;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.usersService.create({
      ...userData,
      birthDate: new Date(userData.birthDate),
      password: hashedPassword,
      profileImage,
      role: 'usuario',
    });

    return {
      message: 'Usuario registrado correctamente',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        birthDate: user.birthDate,
        description: user.description,
        profileImage: user.profileImage,
        role: user.role,
      },
    };
  }
}