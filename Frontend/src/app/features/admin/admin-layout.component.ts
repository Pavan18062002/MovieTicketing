import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SignalRService, LowStockAlertEvent } from '../../core/services/signalr.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatSnackBarModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private signalr = inject(SignalRService);
  private snack   = inject(MatSnackBar);
  private router  = inject(Router);

  private sub = new Subscription();
  recentAlerts = signal<LowStockAlertEvent[]>([]);

  navItems = [
    { label: 'Dashboard', icon: 'grid_view', route: '/admin/dashboard' },
    { label: 'Movies', icon: 'movie', route: '/admin/movies' },
    { label: 'Shows', icon: 'event_seat', route: '/admin/shows' },
    { label: 'Screens', icon: 'theaters', route: '/admin/screens' },
    { label: 'Concessions', icon: 'fastfood', route: '/admin/concessions' },
  ];

  ngOnInit(): void {
    // 1. Connect to Admin SignalR Hub
    this.signalr.startAdminConnection();

    // 2. Listen for real-time low-stock alerts
    this.sub.add(
      this.signalr.lowStockAlert$.subscribe(alert => {
        this.recentAlerts.update(list => [alert, ...list.slice(0, 4)]);

        // Display instant toast notification
        const snackRef = this.snack.open(
          `⚠️ Low Stock: ${alert.itemName} (${alert.itemSize}) only has ${alert.currentStock} left!`,
          'Restock',
          {
            duration: 7000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['admin-low-stock-toast']
          }
        );

        snackRef.onAction().subscribe(() => {
          this.router.navigate(['/admin/concessions']);
        });
      })
    );
  }

  onRestockClick(): void {
    if (this.router.url.includes('/admin/concessions')) {
      const tableEl = document.querySelector('table') || document.querySelector('.form-card');
      tableEl?.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/admin/concessions']);
    }
  }

  dismissAlert(index: number): void {
    this.recentAlerts.update(list => list.filter((_, i) => i !== index));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.signalr.stopAdminConnection();
  }
}
