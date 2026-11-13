import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import {
  CloudinaryService,
  UploadedFile,
} from '../cloudinary/cloudinary.service';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly commentsService: CommentsService,
  ) {}

  // Crear una publicación
  async create(
    createPostDto: CreatePostDto,
    userId: string,
    file?: UploadedFile,
  ) {
    let image = '';

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'red-social/publications',
      );

      image = uploadResult.secure_url;
    }

    const post = await this.postModel.create({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
      image,
    });

    return {
      message: 'Publicación creada correctamente',
      post,
    };
  }

  // Obtener publicaciones con filtros, ordenamiento y paginación
  async findAll(
    sortBy: 'date' | 'likes' = 'date',
    offset = 0,
    limit = 10,
    userId?: string,
  ) {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('El offset no es válido');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('El limit debe estar entre 1 y 100');
    }

    if (sortBy !== 'date' && sortBy !== 'likes') {
      throw new BadRequestException('El criterio de ordenamiento no es válido');
    }

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('El identificador del usuario no es válido');
      }

      filter.userId = new Types.ObjectId(userId);
    }

    const sort: Record<string, 1 | -1> =
        sortBy === 'likes'
            ? { likesCount: -1, createdAt: -1 }
            : { createdAt: -1 };

    const [result] = await this.postModel.aggregate([
      { $match: filter },
      {
        $addFields: {
          likesCount: {
            $size: { $ifNull: ['$likes', []] },
          },
        },
      },
      {
        $facet: {
          data: [
            { $sort: sort },
            { $skip: offset },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'author',
              },
            },
            {
              $unwind: {
                path: '$author',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                authorUsername: '$author.username',
              },
            },
            {
              $project: {
                author: 0,
              },
            },
          ],
          total: [
            { $count: 'count' },
          ],
        },
      },
    ]);

    const posts: any[] = result?.data ?? [];

    if (userId && posts.length > 0) {
      const comments = await this.commentsService.findByPostIds(
        posts.map((post) => post._id.toString()),
      );

      const commentsByPost = new Map<string, typeof comments>();

      for (const comment of comments) {
        const postId = comment.postId.toString();

        if (!commentsByPost.has(postId)) {
          commentsByPost.set(postId, []);
        }

        commentsByPost.get(postId)!.push(comment);
      }

      for (const post of posts) {
        post.comments = commentsByPost.get(post._id.toString()) ?? [];
      }
    }

    return {
      posts,
      total: result?.total[0]?.count ?? 0,
      offset,
      limit,
    };
  }

  // Dar like a una publicación
  async like(postId: string, userId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }

    const post = await this.postModel.findOne({
      _id: postId,
      isActive: true,
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId,
    );

    if (alreadyLiked) {
      throw new ConflictException('Ya diste like a esta publicación');
    }

    await this.postModel.updateOne(
      { _id: postId, isActive: true },
      { $addToSet: { likes: new Types.ObjectId(userId) } },
    );

    return {
      message: 'Like agregado correctamente',
    };
  }

  // Quitar like de una publicación
  async unlike(postId: string, userId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }

    const post = await this.postModel.findOneAndUpdate(
      {
        _id: postId,
        isActive: true,
        likes: new Types.ObjectId(userId),
      },
      {
        $pull: { likes: new Types.ObjectId(userId) },
      },
      { returnDocument: 'after' },
    );

    if (post) {
      return {
        message: 'Like eliminado correctamente',
      };
    }

    const existingPost = await this.postModel.exists({
      _id: postId,
      isActive: true,
    });

    if (!existingPost) {
      throw new NotFoundException('Publicación no encontrada');
    }

    throw new BadRequestException('No diste like a esta publicación');
  }

  // Eliminar publicación lógicamente
  async remove(postId: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }

    const post = await this.postModel.findOne({
      _id: postId,
      isActive: true,
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const isOwner = post.userId.toString() === userId;
    const isAdmin = role === 'administrador';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'No tenés permisos para eliminar esta publicación',
      );
    }

    post.isActive = false;
    await post.save();

    return {
      message: 'Publicación eliminada correctamente',
    };
  }
}