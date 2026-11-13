import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Post } from '../../posts/schemas/post.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({
    type: Types.ObjectId,
    ref: Post.name,
    required: true,
  })
  postId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ default: false })
  modified: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);