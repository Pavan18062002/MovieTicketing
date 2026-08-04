import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <a class="brand" routerLink="/">
          <span class="brand-icon">🎬</span>
          <span class="brand-text">CineMate</span>
        </a>

        <div class="nav-links">
          <!-- Removed redundant Movies link -->
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-link">
              <mat-icon>dashboard</mat-icon> Admin Dashboard
            </a>
          }
        </div>

        <div class="nav-auth">
          @if (auth.isLoggedIn()) {
            <span class="user-chip">
              <mat-icon>account_circle</mat-icon>
              {{ auth.user()?.fullName }}
            </span>
            <button class="btn-ghost" (click)="auth.logout()">Sign Out</button>
          } @else {
            <a routerLink="/auth/login" class="btn-ghost">Sign In</a>
            <a routerLink="/auth/register" class="btn-primary">Get Started</a>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 1000;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .nav-inner {
      display: flex; align-items: center;
      max-width: 1400px; margin: 0 auto;
      padding: 0 24px; height: 64px; gap: 8px;
    }
    .brand {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      font-size: 1.25rem; font-weight: 800; text-decoration: none;
      margin-right: 16px; color: var(--primary);
    }
    .brand-text { color: var(--primary); }
    .nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
    .nav-link {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 14px; border-radius: 8px;
      color: var(--text-muted); font-size: 0.88rem; font-weight: 500;
      text-decoration: none; transition: color 0.2s, background 0.2s;
    }
    .nav-link mat-icon { font-size: 18px !important; height: 18px !important; width: 18px !important; }
    .nav-link:hover { color: var(--primary); background: #eef2ff; }
    .nav-link.active { color: var(--primary); background: #eef2ff; font-weight: 600; border: 1px solid #c7d2fe; }
    .nav-auth { display: flex; align-items: center; gap: 10px; margin-left: auto; }
    .user-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 14px; border-radius: 20px;
      background: #f8fafc; font-size: 0.84rem; color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .user-chip mat-icon { font-size: 17px !important; height: 17px !important; width: 17px !important; color: var(--primary); }
    .btn-ghost {
      background: none; border: 1px solid var(--border);
      color: var(--text-main); padding: 7px 18px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      cursor: pointer; text-decoration: none; transition: all 0.2s; font-family: inherit;
      white-space: nowrap;
    }
    .btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; color: var(--primary); }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; padding: 7px 20px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; text-decoration: none; border: none; transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(99,102,241,0.3);
      white-space: nowrap;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
