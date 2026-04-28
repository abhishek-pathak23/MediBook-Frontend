import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-panel animate-in">
        <div class="auth-header">
          <h1>💊 MediBook</h1>
          <p class="text-muted">Create your patient account</p>
        </div>
        <form (ngSubmit)="onRegister()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-control" type="text" [(ngModel)]="fullName" name="fullName"
                   placeholder="John Doe" required id="register-name" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" [(ngModel)]="email" name="email"
                   placeholder="you@example.com" required id="register-email" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone (optional)</label>
            <input class="form-control" type="tel" [(ngModel)]="phone" name="phone"
                   placeholder="+91 98765 43210" id="register-phone" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="password"
                   placeholder="Min 6 characters" required id="register-password" />
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-control" [(ngModel)]="role" name="role" id="register-role">
              <option value="Patient">Patient</option>
              <option value="Provider">Provider</option>
            </select>
          </div>
          <button class="btn btn-primary btn-lg" style="width: 100%;" [disabled]="loading" id="register-submit">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>
        <p class="auth-footer text-muted">
          Already have an account? <a routerLink="/login">Sign In</a>
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
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  fullName = '';
  email = '';
  phone = '';
  password = '';
  role = 'Patient';
  loading = false;

  onRegister(): void {
    this.loading = true;
    this.auth.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      phone: this.phone || undefined,
      role: this.role
    }).subscribe({
      next: () => {
        this.toast.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Registration failed.');
      }
    });
  }
}
