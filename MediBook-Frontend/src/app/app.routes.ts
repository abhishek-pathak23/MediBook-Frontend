import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'patient',
    canActivate: [roleGuard('Patient')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/patient/dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent)
      },
      {
        path: 'providers',
        loadComponent: () => import('./features/patient/search-providers/search-providers.component').then(m => m.SearchProvidersComponent)
      },
      {
        path: 'book/:providerId',
        loadComponent: () => import('./features/patient/book-appointment/book-appointment.component').then(m => m.BookAppointmentComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/patient/my-appointments/my-appointments.component').then(m => m.MyAppointmentsComponent)
      },
      {
        path: 'records',
        loadComponent: () => import('./features/patient/my-records/my-records.component').then(m => m.MyRecordsComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/patient/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/shared/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'provider',
    canActivate: [roleGuard('Provider')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/provider/dashboard/provider-dashboard.component').then(m => m.ProviderDashboardComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./features/provider/manage-schedule/manage-schedule.component').then(m => m.ManageScheduleComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/provider/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent)
      },
      {
        path: 'records',
        loadComponent: () => import('./features/provider/patient-records/patient-records.component').then(m => m.PatientRecordsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/shared/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard('Admin')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/shared/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
