import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <div class="glass-card animate-slide-up auth-card">
        <div class="auth-header">
          <div class="brand-logo">🎬</div>
          <h2>Create Account</h2>
          <p>Join CineMate today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" formControlName="fullName" class="form-input" 
                   [class.is-invalid]="form.get('fullName')?.touched && form.get('fullName')?.invalid"
                   placeholder="Enter your full name" autocomplete="name">
            @if (form.get('fullName')?.touched && form.get('fullName')?.hasError('required')) {
              <span class="error-text">Name is required</span>
            }
          </div>

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
                   placeholder="Create a password" autocomplete="new-password">
            @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
              <span class="error-text">Password is required</span>
            }
            @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
              <span class="error-text">Password must be at least 6 characters</span>
            }
          </div>

          <button type="submit" class="btn-primary submit-btn" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="20" style="margin: 0 auto;"></mat-spinner>
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: center;
      min-height: 80vh; padding: 2rem 0;
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
export class RegisterComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  loading = false;
  form = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.register(this.form.value as any).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          this.snack.open('Account created!', 'OK', { duration: 3000 });
          this.router.navigate(['/movies']);
        } else {
          this.snack.open(res.message, 'Close', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Registration failed', 'Close', { duration: 4000 });
      }
    });
  }
}
