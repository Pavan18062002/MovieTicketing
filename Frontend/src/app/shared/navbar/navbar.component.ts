import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="nav-inner">
        <a class="brand" routerLink="/">
          <span class="brand-icon">🎬</span>
          <span class="brand-text">Cine<span class="brand-highlight">Book</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="active" class="nav-link">
            <span class="icon">🎟️</span> Movies
          </a>
        </div>

        <div class="nav-auth">
          @if (auth.isLoggedIn()) {
            <span class="user-chip">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ auth.user()?.fullName || auth.user()?.email || 'User' }}</span>
            </span>
            <button class="btn-ghost" (click)="auth.logout()">Sign Out</button>
          } @else {
            <a routerLink="/login" class="btn-ghost">Sign In</a>
            <a routerLink="/register" class="btn-primary-sm">Get Started</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
    }
    .nav-inner {
      display: flex;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
      height: 70px;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.4rem;
      font-weight: 800;
      text-decoration: none;
      margin-right: 24px;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }
    .brand-icon {
      font-size: 1.6rem;
      filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
    }
    .brand-text {
      color: #f8fafc;
    }
    .brand-highlight {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .nav-link .icon {
      font-size: 1.1rem;
    }
    .nav-link:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-link.active {
      color: #fff;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      font-weight: 600;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
    }
    .nav-auth {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
    .user-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      font-size: 0.88rem;
      font-weight: 500;
    }
    .user-icon {
      font-size: 1rem;
    }
    .btn-ghost {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
    }
    .btn-primary-sm {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      padding: 8px 22px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
      display: inline-block;
    }
    .btn-primary-sm:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      color: #fff;
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
