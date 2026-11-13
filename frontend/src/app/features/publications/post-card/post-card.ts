import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Post, PostsService } from '../../../core/service/posts';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-post-card',
  imports: [DatePipe],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard implements OnInit {
  @Input({ required: true }) post!: Post;
  @Output() deleted = new EventEmitter<string>();

  loadingDelete = false;
  loadingLike = false;
  showActions = false;
  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  hasLiked = false;

  get isOwner(): boolean {
    const currentUser = this.authService.getCurrentUser();

    return currentUser?.id === this.post.userId;
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    this.hasLiked = currentUser
      ? this.post.likes.includes(currentUser.id)
      : false;
  }

  toggleLike(): void {
    if (this.loadingLike) return;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) return;

    const wasLiked = this.hasLiked;

    console.log('Estado anterior:', wasLiked);
    console.log('ID del usuario:', currentUser.id);
    console.log('Likes de la publicación:', this.post.likes);

    this.loadingLike = true;

    const request = wasLiked
      ? this.postsService.unlikePost(this.post._id)
      : this.postsService.likePost(this.post._id);

    request.pipe(
      finalize(() => {
        this.loadingLike = false;
        this.cdr.detectChanges();
      }),
    )
    .subscribe({
      next: () => {
        this.hasLiked = !wasLiked;

        this.post = {
          ...this.post,
          likes: this.hasLiked
            ? [...this.post.likes, currentUser.id]
            : this.post.likes.filter((id) => id !== currentUser.id),
          likesCount: this.hasLiked
            ? this.post.likesCount + 1
            : this.post.likesCount - 1,
        };

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al actualizar el like:', error);
      },
    });
  }
  
  showDeleteModal = false;
  deleteMessage = '';
  deleteMessageType: 'success' | 'error' | '' = '';

  openDeleteModal(): void {
    this.showActions = false;
    this.showDeleteModal = true;
    this.deleteMessage = '';
    this.deleteMessageType = '';
  }

  closeDeleteModal(): void {
    if (this.loadingDelete) return;
    this.showDeleteModal = false;
  }

  deletePost(): void {
    if (!this.isOwner || this.loadingDelete) return;

    this.loadingDelete = true;
    this.deleteMessage = '';
    this.deleteMessageType = '';

    this.postsService.deletePost(this.post._id)
      .pipe(
        finalize(() => {
          this.loadingDelete = false;
          this.cdr.detectChanges();
        }),
      ).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.deleted.emit(this.post._id);
      },
      error: (error) => {
        console.error('Error al eliminar la publicación:', error);
        this.deleteMessage = 'No se pudo eliminar la publicación. Intentá nuevamente.';
        this.deleteMessageType = 'error';
        this.showDeleteModal = false;
      },
    });
  }

}