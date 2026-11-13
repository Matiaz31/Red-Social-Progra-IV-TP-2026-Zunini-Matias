import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../core/service/auth.service';
import { Post, PostsService } from '../../core/service/posts';
import { PostCard } from '../publications/post-card/post-card';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DatePipe, PostCard],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})

export class Profile implements OnInit, OnDestroy {
  isSidebarExpanded = true;
  currentUser: AuthUser | null = null;
  posts: Post[] = [];
  loadingPosts = false;

  private allowHover = false;
  private sidebarTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private postsService: PostsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.loadMyPosts();
    }
    this.sidebarTimeout = setTimeout(() => {
      this.isSidebarExpanded = false;
      this.allowHover = true;
      this.cdr.detectChanges();
    }, 1000);
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

  loadMyPosts(): void {
    if (!this.currentUser) return;

    this.loadingPosts = true;

    this.postsService.getPosts(
      'date',
      0,
      3,
      this.currentUser.id
    ).subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.loadingPosts = false;
      },
      error: (error) => {
        console.error('Error al cargar mis publicaciones:', error);
        this.loadingPosts = false;
      },
    });
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