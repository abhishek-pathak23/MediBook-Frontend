import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserProfile } from '../../../core/models/auth.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-management',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>User Management</h2>
        <p>View and manage all platform users</p>
      </div>
      <button class="btn btn-primary" (click)="showAddAdmin = true">➕ Add Admin</button>
    </div>

    @if (showAddAdmin) {
      <div class="card mb-6" style="padding: 1.5rem;">
        <h3>Create New Admin</h3>
        <form (ngSubmit)="submitAdmin()" #adminForm="ngForm">
          <div class="form-group">
            <label>Full Name</label>
            <input class="form-control" name="fullName" [(ngModel)]="newAdmin.fullName" required />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input class="form-control" type="email" name="email" [(ngModel)]="newAdmin.email" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" name="password" [(ngModel)]="newAdmin.password" required minlength="6" />
          </div>
          <div class="flex gap-4 mt-4">
            <button type="submit" class="btn btn-primary" [disabled]="!adminForm.valid || isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Admin' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="showAddAdmin = false">Cancel</button>
          </div>
        </form>
      </div>
    }

    <div class="flex gap-4 mb-6">
      <input class="form-control" style="flex:1;" type="text" [(ngModel)]="query"
             placeholder="Search users..." (input)="onSearch()" />
      <select class="form-control" [(ngModel)]="roleFilter" (change)="onSearch()" style="width:160px;">
        <option value="">All Roles</option>
        <option value="Patient">Patient</option>
        <option value="Provider">Provider</option>
        <option value="Admin">Admin</option>
      </select>
    </div>

    <table class="data-table">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        @for (u of filtered; track u.userId) {
          <tr>
            <td>{{ u.userId }}</td>
            <td>{{ u.fullName }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge" [class.badge-accent]="u.role==='Patient'" [class.badge-info]="u.role==='Provider'"
                      [class.badge-warning]="u.role==='Admin'">{{ u.role }}</span></td>
            <td>{{ u.createdAt | date:'mediumDate' }}</td>
            <td>
              <span class="badge" [class.badge-accent]="u.isActive" [class.badge-error]="!u.isActive">
                {{ u.isActive ? 'Active' : 'Suspended' }}
              </span>
            </td>
            <td>
              @if (u.userId !== auth.getUserId() && u.role !== 'Admin') {
                <button class="btn btn-sm" [class.btn-outline]="u.isActive" [class.btn-primary]="!u.isActive" 
                        (click)="toggleStatus(u)">
                  {{ u.isActive ? 'Suspend' : 'Activate' }}
                </button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `
})
export class UserManagementComponent implements OnInit {
  public auth = inject(AuthService);
  private toast = inject(ToastService);

  users: UserProfile[] = [];
  filtered: UserProfile[] = [];
  query = '';
  roleFilter = '';

  showAddAdmin = false;
  isSubmitting = false;
  newAdmin = {
    fullName: '',
    email: '',
    password: '',
    role: 'Admin'
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.auth.getAllUsers().subscribe({
      next: d => { this.users = d; this.onSearch(); },
      error: () => this.toast.error('Failed to load users')
    });
  }

  submitAdmin(): void {
    if (!this.newAdmin.fullName || !this.newAdmin.email || !this.newAdmin.password) return;
    this.isSubmitting = true;
    this.auth.createAdmin(this.newAdmin as any).subscribe({
      next: (res) => {
        this.toast.success('Admin created successfully!');
        this.showAddAdmin = false;
        this.newAdmin = { fullName: '', email: '', password: '', role: 'Admin' };
        this.isSubmitting = false;
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error('Failed to create admin: ' + err.error?.message || err.message);
        this.isSubmitting = false;
      }
    });
  }

  onSearch(): void {
    let result = this.users || [];
    if (this.query.trim()) {
      const q = this.query.toLowerCase();
      result = result.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (this.roleFilter) result = result.filter(u => u.role === this.roleFilter);
    this.filtered = result;
  }

  toggleStatus(user: UserProfile): void {
    const action = user.isActive ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    this.auth.toggleUserStatus(user.userId).subscribe({
      next: (res) => {
        this.toast.success(`User ${res.fullName} is now ${res.isActive ? 'Active' : 'Suspended'}`);
        // Update local state without reloading entire list
        user.isActive = res.isActive;
      },
      error: (err) => this.toast.error(`Failed to ${action} user: ` + (err.error?.message || err.message))
    });
  }
}
