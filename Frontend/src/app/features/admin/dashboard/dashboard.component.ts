import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  items = [
    { label: 'Movies',      icon: 'movie',      desc: 'Add, edit and manage movies',       route: '/admin/movies' },
    { label: 'Screens',     icon: 'theaters',   desc: 'Manage auditoriums & seating',       route: '/admin/screens' },
    { label: 'Shows',       icon: 'event_seat', desc: 'Schedule and manage screenings',     route: '/admin/shows' },
    { label: 'Concessions', icon: 'fastfood',   desc: 'Manage food & beverage inventory',  route: '/admin/concessions' }
  ];
}
