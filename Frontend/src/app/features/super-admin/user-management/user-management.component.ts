import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { UserDto, SystemStats } from '../../../core/models/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  users = signal<UserDto[]>([]);
  stats = signal<SystemStats | null>(null);
  loading = signal(false);
  creatingAdmin = signal(false);
  showCreateForm = signal(false);

  selectedUserForBranch = signal<UserDto | null>(null);
  addingBranch = signal(false);

  cols: string[] = ['name', 'email', 'role', 'theaters', 'date', 'actions'];

  adminForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    theaterName: ['', [Validators.required, Validators.minLength(2)]],
    theaterLocation: ['', [Validators.required, Validators.minLength(2)]]
  });

  branchForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.api.superAdminGetStats().subscribe({
      next: res => {
        if (res.success) this.stats.set(res.data);
      }
    });

    this.api.superAdminGetUsers().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.users.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load user list.', 'Close', { duration: 4000 });
      }
    });
  }

  createAdmin(): void {
    if (this.adminForm.invalid) return;

    this.creatingAdmin.set(true);
    this.api.superAdminCreateAdmin(this.adminForm.value).subscribe({
      next: res => {
        this.creatingAdmin.set(false);
        if (res.success) {
          this.snack.open(`Admin '${res.data.fullName}' & assigned theater provisioned!`, 'Close', { duration: 4000 });
          this.adminForm.reset();
          this.showCreateForm.set(false);
          this.loadData();
        } else {
          this.snack.open(res.message || 'Could not create admin.', 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.creatingAdmin.set(false);
        const msg = err.error?.message || err.error?.errors?.[0] || 'Error creating admin.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  openAddBranch(u: UserDto): void {
    this.selectedUserForBranch.set(u);
    this.branchForm.reset();
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  closeAddBranch(): void {
    this.selectedUserForBranch.set(null);
    this.branchForm.reset();
  }

  submitAddBranch(): void {
    if (this.branchForm.invalid || !this.selectedUserForBranch()) return;

    this.addingBranch.set(true);
    const user = this.selectedUserForBranch()!;
    this.api.superAdminAddTheaterToAdmin(user.id, this.branchForm.value).subscribe({
      next: res => {
        this.addingBranch.set(false);
        if (res.success) {
          this.snack.open(`Assigned '${res.data.name}' to ${user.fullName} successfully!`, 'Close', { duration: 4000 });
          this.closeAddBranch();
          this.loadData();
        } else {
          this.snack.open(res.message || 'Failed to assign theater.', 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.addingBranch.set(false);
        const msg = err.error?.message || err.error?.errors?.[0] || 'Error assigning theater.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  changeRole(user: UserDto, newRole: string): void {
    if (user.role === newRole) return;

    this.api.superAdminUpdateUserRole(user.id, { role: newRole }).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open(`Updated ${user.fullName}'s role to ${newRole}`, 'Close', { duration: 3000 });
          this.loadData();
        }
      },
      error: () => this.snack.open('Failed to update user role.', 'Close', { duration: 4000 })
    });
  }

  deleteUser(user: UserDto): void {
    if (user.role === 'SuperAdmin') {
      this.snack.open('Cannot delete SuperAdmin accounts.', 'Close', { duration: 3000 });
      return;
    }

    if (!confirm(`Are you sure you want to delete user '${user.fullName}'?`)) return;

    this.api.superAdminDeleteUser(user.id).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('User deleted successfully.', 'Close', { duration: 3000 });
          this.loadData();
        }
      },
      error: () => this.snack.open('Failed to delete user.', 'Close', { duration: 4000 })
    });
  }
}
