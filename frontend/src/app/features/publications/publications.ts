import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../core/service/auth.service';
import { PostsService, Post } from '../../core/service/posts';
import { PostCard } from './post-card/post-card';

@Component({
  selector: 'app-publications',
  imports: [RouterLink, PostCard],
  templateUrl: './publications.html',
  styleUrl: './publications.scss',
})
export class Publications implements OnInit, OnDestroy {
  isSidebarExpanded = true;
  private allowHover = false;
  private sidebarTimeout?: ReturnType<typeof setTimeout>;

  currentUser: AuthUser | null = null;
  posts: Post[] = [];

  loading = false;
  errorMessage = '';

  sortBy: 'date' | 'likes' = 'date';
  offset = 0;
  limit = 10;
  total = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private postsService: PostsService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.loadPosts();

    this.sidebarTimeout = setTimeout(() => {
      this.isSidebarExpanded = false;
      this.allowHover = true;
      this.cdr.detectChanges();
    }, 1000);
  }

  loadPosts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.postsService
      .getPosts(this.sortBy, this.offset, this.limit)
      .subscribe({
        next: (response) => {
          this.posts = response.posts;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
          this.errorMessage =
            'No se pudieron cargar las publicaciones. Intentá nuevamente.';
          this.loading = false;
        },
      });
  }

  onSidebarMouseEnter(): void {
    if (this.allowHover) {
      this.isSidebarExpanded = true;
    }
  }

  onSidebarMouseLeave(): void {
    if (this.allowHover) {
      this.isSidebarExpanded = false;
    }
  }

  onPostDeleted(postId: string): void {
    this.posts = this.posts.filter((post) => post._id !== postId);
    this.total--;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.sidebarTimeout) {
      clearTimeout(this.sidebarTimeout);
    }
  }
}