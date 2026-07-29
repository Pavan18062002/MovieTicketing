import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <div class="glass-card animate-slide-up auth-card">
        <div class="auth-header">
          <div class="brand-logo">🎬</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your CineMate account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" formControlName="email" class="form-input" 
                   [class.is-invalid]="form.get('email')?.touched && form.get('email')?.invalid"
                   placeholder="Enter your email" autocomplete="email">
            @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
              <span class="error-text">Email is required</span>
            }
            @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
              <span class="error-text">Enter a valid email address</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" formControlName="password" class="form-input"
                   [class.is-invalid]="form.get('password')?.touched && form.get('password')?.invalid"
                   placeholder="Enter your password" autocomplete="current-password">
            @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
              <span class="error-text">Password is required</span>
            }
          </div>

          <button type="submit" class="btn-primary submit-btn" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="20" style="margin: 0 auto;"></mat-spinner>
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/auth/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: center;
      min-height: 80vh;
    }
    .auth-card {
      max-width: 420px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .auth-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      color: var(--text-main);
    }
    .auth-header p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .submit-btn {
      margin-top: 1rem;
      height: 48px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .auth-footer p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }
    .auth-footer a {
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  loading = false;
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          this.router.navigate([res.data.role === 'Admin' ? '/admin' : '/movies']);
        } else {
          this.snack.open(res.message, 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Login failed', 'Close', { duration: 4000 });
      }
    });
  }
}
