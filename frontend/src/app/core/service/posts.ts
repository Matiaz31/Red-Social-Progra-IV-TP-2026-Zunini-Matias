import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Post {
  _id: string;
  userId: string;
  authorUsername: string;
  title: string;
  message: string;
  image: string;
  likes: string[];
  likesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  offset: number;
  limit: number;
}

export interface CommentAuthor {
  _id: string;
  username: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: CommentAuthor;
  message: string;
  modified: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly apiUrl = environment.apiUrl.replace(/\/auth\/?$/, '');

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getPosts(
    sortBy: 'date' | 'likes' = 'date',
    offset = 0,
    limit = 10,
    userId?: string,
  ): Observable<PostsResponse> {
    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('offset', offset)
      .set('limit', limit);

    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<PostsResponse>(`${this.apiUrl}/posts`, {
      headers: this.getHeaders(),
      params,
    });
  }

  createPost(title: string, message: string, image?: File): Observable<unknown> {
    const formData = new FormData();

    formData.append('title', title);
    formData.append('message', message);

    if (image) {
      formData.append('image', image);
    }

    return this.http.post(`${this.apiUrl}/posts`, formData, {
      headers: this.getHeaders(),
    });
  }

  likePost(postId: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/posts/${postId}/like`,
      {},
      { headers: this.getHeaders() },
    );
  }

  unlikePost(postId: string): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/posts/${postId}/like`,
      { headers: this.getHeaders() },
    );
  }

  deletePost(postId: string): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/posts/${postId}`,
      { headers: this.getHeaders() },
    );
  }
}