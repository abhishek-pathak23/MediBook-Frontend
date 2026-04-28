import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>🔒 Change Password</h2>
      <p>Update your account password. You'll need your current password to make changes.</p>
    </div>

    <div class="card animate-in" style="max-width: 480px; margin: 0 auto;">

      <!-- Current Password -->
      <div class="form-group">
        <label class="form-label" for="current-password">Current Password *</label>
        <div style="position: relative;">
          <input
            class="form-control"
            [type]="showCurrent ? 'text' : 'password'"
            id="current-password"
            [(ngModel)]="currentPassword"
            placeholder="Enter your current password"
            autocomplete="current-password"
          />
          <button type="button"
            (click)="showCurrent = !showCurrent"
            style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1rem; color:var(--text-muted)">
            {{ showCurrent ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <hr style="border-color: #334155; margin: 20px 0;" />

      <!-- New Password -->
      <div class="form-group">
        <label class="form-label" for="new-password">New Password *</label>
        <div style="position: relative;">
          <input
            class="form-control"
            [type]="showNew ? 'text' : 'password'"
            id="new-password"
            [(ngModel)]="newPassword"
            placeholder="Enter new password (min 6 characters)"
            autocomplete="new-password"
          />
          <button type="button"
            (click)="showNew = !showNew"
            style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1rem; color:var(--text-muted)">
            {{ showNew ? '🙈' : '👁️' }}
          </button>
        </div>
        @if (newPassword && newPassword.length < 6) {
          <small style="color: var(--danger); margin-top: 4px; display:block;">Password must be at least 6 characters.</small>
        }
        @if (newPassword && newPassword === currentPassword) {
          <small style="color: var(--danger); margin-top: 4px; display:block;">New password must be different from current password.</small>
        }
      </div>

      <!-- Strength indicator -->
      @if (newPassword) {
        <div style="margin-top: 8px; margin-bottom: 16px;">
          <small class="form-label">Password strength:</small>
          <div style="display:flex; gap:4px; margin-top:4px;">
            @for (bar of [1,2,3,4]; track bar) {
              <div style="flex:1; height:4px; border-radius:2px; transition: background 0.3s;"
                [style.background]="bar <= strength ? strengthColor : '#334155'"></div>
            }
          </div>
          <small [style.color]="strengthColor" style="margin-top:4px; display:block;">{{ strengthLabel }}</small>
        </div>
      }

      <!-- Confirm New Password -->
      <div class="form-group">
        <label class="form-label" for="confirm-password">Confirm New Password *</label>
        <div style="position: relative;">
          <input
            class="form-control"
            [type]="showConfirm ? 'text' : 'password'"
            id="confirm-password"
            [(ngModel)]="confirmPassword"
            placeholder="Re-enter new password"
            autocomplete="new-password"
          />
          <button type="button"
            (click)="showConfirm = !showConfirm"
            style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1rem; color:var(--text-muted)">
            {{ showConfirm ? '🙈' : '👁️' }}
          </button>
        </div>
        @if (confirmPassword && newPassword !== confirmPassword) {
          <small style="color: var(--danger); margin-top: 4px; display:block;">Passwords do not match.</small>
        }
      </div>

      <button
        class="btn btn-primary"
        style="width:100%; margin-top: 24px;"
        id="update-password-btn"
        [disabled]="isSubmitting || !canSubmit"
        (click)="submit()"
      >
        {{ isSubmitting ? 'Updating...' : '🔒 Update Password' }}
      </button>
    </div>
  `
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  isSubmitting = false;

  get canSubmit(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword &&
      this.newPassword !== this.currentPassword
    );
  }

  get strength(): number {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  }

  get strengthColor(): string {
    return ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][this.strength] || '#ef4444';
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength] || 'Weak';
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.auth.changePassword({ oldPassword: this.currentPassword, newPassword: this.newPassword } as any).subscribe({
      next: () => {
        this.toast.success('Password updated successfully! Please log in again with your new password.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update password.');
        this.isSubmitting = false;
      }
    });
  }
}
