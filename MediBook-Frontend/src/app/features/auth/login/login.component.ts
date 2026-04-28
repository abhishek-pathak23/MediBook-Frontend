import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-panel animate-in">
        <div class="auth-header">
          <h1>💊 MediBook</h1>
          <p class="text-muted">Sign in to your account</p>
        </div>
        <form (ngSubmit)="onLogin()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" [(ngModel)]="email" name="email"
                   placeholder="you@example.com" required id="login-email" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="password"
                   placeholder="••••••••" required id="login-password" />
          </div>
          <button class="btn btn-primary btn-lg" style="width: 100%;" [disabled]="loading" id="login-submit">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <p class="auth-footer text-muted">
          Don't have an account? <a routerLink="/register">Register</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      z-index: 1;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .auth-header h1 {
      font-size: 2rem;
      margin-bottom: 8px;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  password = '';
  loading = false;

  onLogin(): void {
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.toast.success(`Welcome back, ${res.fullName}!`);
        const role = res.role;
        if (role === 'Patient') this.router.navigate(['/patient/dashboard']);
        else if (role === 'Provider') this.router.navigate(['/provider/dashboard']);
        else if (role === 'Admin') this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Login failed. Check your credentials.');
      }
    });
  }
}
