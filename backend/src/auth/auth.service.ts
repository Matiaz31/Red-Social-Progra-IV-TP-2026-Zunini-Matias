import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);

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

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    birthDate: string;
    description?: string;
    profileImage?: string;
  }) {
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


    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.usersService.create({
        ...userData,
        birthDate: new Date(userData.birthDate),
        password: hashedPassword,
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