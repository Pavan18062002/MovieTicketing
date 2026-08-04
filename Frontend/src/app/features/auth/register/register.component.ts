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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
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
