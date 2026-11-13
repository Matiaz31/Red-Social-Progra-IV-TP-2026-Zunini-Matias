import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  async findByPostIds(postIds: string[]) {
    const ids = postIds.map((id) => new Types.ObjectId(id));

    return this.commentModel
      .find({ postId: { $in: ids } })
      .populate('userId', 'username')
      .sort({ createdAt: 1 })
      .exec();
  }
}