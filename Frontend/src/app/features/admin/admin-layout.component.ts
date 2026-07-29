import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Admin Panel</span>
        </div>
        <nav>
          @for (item of navItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: false}" class="nav-item">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      margin: -24px;
      min-height: calc(100vh - 64px);
    }

    /* ── Sidebar ─────────────────────────────── */
    .sidebar {
      width: 220px; flex-shrink: 0;
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex; flex-direction: column;
      position: sticky; top: 64px;
      height: calc(100vh - 64px);
      overflow-y: auto;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 8px;
      padding: 20px 16px 16px;
      font-size: 0.78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: #94a3b8; border-bottom: 1px solid #f1f5f9;
    }
    .sidebar-brand mat-icon {
      font-size: 18px !important; height: 18px !important; width: 18px !important;
      color: #6366f1;
    }
    nav {
      display: flex; flex-direction: column;
      padding: 12px 8px; gap: 2px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      color: #64748b; font-size: 0.9rem; font-weight: 500;
      text-decoration: none; transition: all 0.18s;
    }
    .nav-item mat-icon {
      font-size: 20px !important; height: 20px !important; width: 20px !important;
    }
    .nav-item:hover { background: #f8fafc; color: #4f46e5; }
    .nav-item:hover mat-icon { color: #6366f1; }
    .nav-item.active {
      background: #eef2ff; color: #4f46e5; font-weight: 600;
    }
    .nav-item.active mat-icon { color: #6366f1; }

    /* ── Page content ────────────────────────── */
    .content { flex: 1; padding: 32px; overflow: auto; min-width: 0; }
  `]
})
export class AdminLayoutComponent {
  navItems = [
    { label: 'Dashboard',   icon: 'grid_view',  route: '/admin/dashboard' },
    { label: 'Movies',      icon: 'movie',       route: '/admin/movies' },
    { label: 'Shows',       icon: 'event_seat',  route: '/admin/shows' },
    { label: 'Screens',     icon: 'theaters',    route: '/admin/screens' },
    { label: 'Concessions', icon: 'fastfood',    route: '/admin/concessions' },
  ];
}
