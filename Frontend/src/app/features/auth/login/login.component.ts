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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
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
