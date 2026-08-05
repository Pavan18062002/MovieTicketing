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
        <!-- Logo -->
        <a class="brand" routerLink="/">
          <div class="brand-logo-icon">
            <mat-icon>movie</mat-icon>
          </div>
          <span class="brand-name">Cine<span class="brand-accent">Mate</span></span>
        </a>

        <!-- Main Navigation Links -->
        <div class="nav-links">
          <a routerLink="/movies" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            Movies
          </a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/movies/my-bookings" routerLinkActive="active" class="nav-link">
              My Bookings
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-link admin-pill">
              <mat-icon class="sm-icon">admin_panel_settings</mat-icon> Admin
            </a>
          }
        </div>

        <!-- Right Side Widgets & User Auth Info -->
        <div class="nav-right">
          <div class="nav-auth">
            @if (auth.isLoggedIn()) {
              <div class="user-chip" [title]="auth.user()?.fullName">
                <div class="avatar-circle">
                  {{ (auth.user()?.fullName || 'U').charAt(0).toUpperCase() }}
                </div>
                <span class="user-name">{{ auth.user()?.fullName }}</span>
              </div>
              <button class="btn-ghost-sm" (click)="auth.logout()" title="Sign Out">
                <mat-icon>logout</mat-icon>
              </button>
            } @else {
              <a routerLink="/auth/login" class="btn-ghost-sm">Sign In</a>
              <a routerLink="/auth/register" class="btn-purple-sm">Get Started</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 1000;
      background: rgba(11, 11, 20, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      height: 72px;
    }
    .nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1400px; margin: 0 auto;
      padding: 0 28px; height: 100%; gap: 20px;
    }

    /* Brand Logo */
    .brand {
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      text-decoration: none; color: #ffffff;
    }
    .brand-logo-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
    }
    .brand-logo-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    .brand-name { font-family: var(--font-heading); font-size: 1.45rem; font-weight: 800; letter-spacing: -0.03em; }
    .brand-accent { color: #8b5cf6; }

    /* Nav Links */
    .nav-links { display: flex; align-items: center; gap: 8px; margin-left: 24px; }
    .nav-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px;
      color: #94a3b8; font-size: 0.9rem; font-weight: 500;
      text-decoration: none; transition: all 0.2s ease;
    }
    .nav-link:hover { color: #ffffff; background: rgba(255, 255, 255, 0.05); }
    .nav-link.active {
      color: #ffffff; background: rgba(124, 58, 237, 0.2);
      border: 1px solid rgba(139, 92, 246, 0.4); font-weight: 600;
    }
    .admin-pill {
      color: #a78bfa; background: rgba(124, 58, 237, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .sm-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }

    /* Nav Right Section */
    .nav-right { display: flex; align-items: center; gap: 16px; margin-left: auto; }

    .nav-auth { display: flex; align-items: center; gap: 10px; }

    .user-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 12px 4px 4px; border-radius: 24px;
      background: #181832; border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .avatar-circle {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      color: #fff; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: center;
    }
    .user-name { font-size: 0.84rem; font-weight: 600; color: #e2e8f0; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .btn-ghost-sm {
      background: transparent; border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1; padding: 7px 14px; border-radius: 20px; font-size: 0.85rem;
      font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-ghost-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-ghost-sm:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255, 255, 255, 0.25); }

    .btn-purple-sm {
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #fff; padding: 8px 18px; border-radius: 20px; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; text-decoration: none; border: none;
      transition: all 0.2s; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
    }
    .btn-purple-sm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124, 58, 237, 0.5); }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
