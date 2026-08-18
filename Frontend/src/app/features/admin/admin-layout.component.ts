import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SignalRService, LowStockAlertEvent } from '../../core/services/signalr.service';
import { StockDialogComponent } from './concessions/stock-dialog.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private signalr = inject(SignalRService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);
  private api     = inject(ApiService);
  private router  = inject(Router);

  private sub = new Subscription();
  recentAlerts = signal<LowStockAlertEvent[]>([]);

  navItems = [
    { label: 'Dashboard', icon: 'grid_view', route: '/admin/dashboard' },
    { label: 'Movies', icon: 'movie', route: '/admin/movies' },
    { label: 'Screens', icon: 'theaters', route: '/admin/screens' },
    { label: 'Shows', icon: 'event_seat', route: '/admin/shows' },
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
            duration: 8000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['admin-low-stock-toast']
          }
        );

        snackRef.onAction().subscribe(() => {
          this.onRestockClick();
        });
      })
    );
  }

  onRestockClick(): void {
    const alert = this.recentAlerts()[0];
    if (!alert) {
      this.router.navigate(['/admin/concessions']);
      return;
    }

    const ref = this.dialog.open(StockDialogComponent, {
      width: '380px',
      data: {
        item: {
          id: alert.concessionItemId,
          itemName: alert.itemName,
          itemSize: alert.itemSize,
          stockCount: alert.currentStock
        }
      }
    });

    ref.afterClosed().subscribe(newStock => {
      if (newStock !== undefined && newStock !== null) {
        this.api.adminUpdateStock(alert.concessionItemId, newStock).subscribe(res => {
          if (res.success) {
            this.snack.open('Stock updated successfully!', 'OK', { duration: 3000 });
            this.dismissAlert(0);
            if (this.router.url.includes('/admin/concessions')) {
              this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                this.router.navigate(['/admin/concessions']);
              });
            }
          } else {
            this.snack.open(res.message || 'Failed to update stock', 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  dismissAlert(index: number): void {
    this.recentAlerts.update(list => list.filter((_, i) => i !== index));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.signalr.stopAdminConnection();
  }
}
