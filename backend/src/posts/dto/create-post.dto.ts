import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(100, {
    message: 'El título no puede superar los 100 caracteres',
  })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @MaxLength(2000, {
    message: 'El mensaje no puede superar los 2000 caracteres',
  })
  message: string;
}