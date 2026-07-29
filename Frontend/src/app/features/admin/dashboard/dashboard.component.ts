import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <h1>Admin Dashboard</h1>
    <div class="dashboard-grid">
      @for (item of items; track item.label) {
        <mat-card class="dash-card" [routerLink]="item.route">
          <mat-card-content>
            <mat-icon class="dash-icon">{{ item.icon }}</mat-icon>
            <h2>{{ item.label }}</h2>
            <p>{{ item.desc }}</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    h1 { margin-bottom: 24px; color: #1e293b; font-weight: 800; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .dash-card { cursor: pointer; transition: transform .2s, box-shadow .2s; border: 1px solid #e2e8f0; border-radius: 12px; }
    .dash-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,.08); transform: translateY(-4px); border-color: #cbd5e1; }
    .dash-icon { font-size: 48px; height: 48px; width: 48px; color: #6366f1; margin-bottom: 8px; }
    h2 { margin: 8px 0 4px; font-size: 1.1rem; color: #334155; }
    p { color: #64748b; font-size: .85rem; margin: 0; line-height: 1.4; }
  `]
})
export class DashboardComponent {
  items = [
    { label: 'Movies',      icon: 'movie',      desc: 'Add, edit and manage movies',       route: '/admin/movies' },
    { label: 'Screens',     icon: 'theaters',   desc: 'Manage auditoriums & seating',       route: '/admin/screens' },
    { label: 'Shows',       icon: 'event_seat', desc: 'Schedule and manage screenings',     route: '/admin/shows' },
    { label: 'Concessions', icon: 'fastfood',   desc: 'Manage food & beverage inventory',  route: '/admin/concessions' }
  ];
}
