import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import type { UploadedFile as PostImageFile } from '../cloudinary/cloudinary.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: PostImageFile,
  ) {
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException(
          'La imagen no puede superar los 5 MB',
        );
      }
    }

    return this.postsService.create(
      createPostDto,
      request.user.userId,
      file,
    );
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy: 'date' | 'likes' = 'date',
    @Query('offset') offset = '0',
    @Query('limit') limit = '10',
    @Query('userId') userId?: string,
  ) {
    return this.postsService.findAll(
      sortBy,
      Number(offset),
      Number(limit),
      userId,
    );
  }

  @Post(':id/like')
  like(
    @Param('id') postId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.postsService.like(postId, request.user.userId);
  }

  @Delete(':id/like')
  unlike(
    @Param('id') postId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.postsService.unlike(postId, request.user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') postId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.postsService.remove(
      postId,
      request.user.userId,
      request.user.role,
    );
  }
}