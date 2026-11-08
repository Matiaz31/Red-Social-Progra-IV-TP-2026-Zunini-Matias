import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-publications',
  imports: [RouterLink],
  templateUrl: './publications.html',
  styleUrl: './publications.scss',
})
export class Publications implements OnInit, OnDestroy {
  isSidebarExpanded = true;
  private allowHover = false;
  private sidebarTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
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

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.sidebarTimeout) {
      clearTimeout(this.sidebarTimeout);
    }
  }
}