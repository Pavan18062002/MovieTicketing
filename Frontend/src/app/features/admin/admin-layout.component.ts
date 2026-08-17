import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  navItems = [
    { label: 'Dashboard', icon: 'grid_view', route: '/admin/dashboard' },
    { label: 'Movies', icon: 'movie', route: '/admin/movies' },
    { label: 'Shows', icon: 'event_seat', route: '/admin/shows' },
    { label: 'Screens', icon: 'theaters', route: '/admin/screens' },
    { label: 'Concessions', icon: 'fastfood', route: '/admin/concessions' },
  ];
}
