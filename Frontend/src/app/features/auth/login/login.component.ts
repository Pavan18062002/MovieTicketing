import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = this.loginForm.value as LoginRequest;

    this.authService.login(payload).subscribe({
      next: (res) => {
        if (res.data?.token) {
          this.authService.saveToken(res.data.token);
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = err.error?.errors?.[0] || 'Invalid credentials. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
