import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile, UpdateProfile, ChangePassword } from '../models/auth.model';
import { SignalRService } from './signalr.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apis.auth;

  currentUser = signal<AuthResponse | null>(null);
  isLoggedIn = signal(false);

  constructor(private http: HttpClient, private router: Router, private signalrService: SignalRService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('medibook_user');
    if (stored) {
      const user: AuthResponse = JSON.parse(stored);
      this.currentUser.set(user);
      this.isLoggedIn.set(true);
      this.signalrService.connect(user.token);
    }
  }

  register(data: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.api}/register`, data);
  }

  createAdmin(data: RegisterRequest) {
    return this.http.post<{message: string, userId: number, email: string}>(`${this.api}/create-admin`, data);
  }

  login(data: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.api}/login`, data).pipe(
      tap(res => {
        localStorage.setItem('medibook_token', res.token);
        localStorage.setItem('medibook_user', JSON.stringify(res));
        this.currentUser.set(res);
        this.isLoggedIn.set(true);
        this.signalrService.connect(res.token);
      })
    );
  }

  logout() {
    return this.http.post(`${this.api}/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  clearSession(): void {
    localStorage.removeItem('medibook_token');
    localStorage.removeItem('medibook_user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.signalrService.disconnect();
    this.router.navigate(['/login']);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.api}/profile`);
  }

  updateProfile(data: UpdateProfile) {
    return this.http.put<UserProfile>(`${this.api}/profile`, data);
  }

  changePassword(data: ChangePassword) {
    return this.http.put(`${this.api}/password`, data);
  }

  deactivateAccount() {
    return this.http.delete(`${this.api}/deactivate`);
  }

  getAllUsers() {
    return this.http.get<UserProfile[]>(`${this.api}/users?t=${new Date().getTime()}`);
  }

  toggleUserStatus(userId: number) {
    return this.http.put<UserProfile>(`${this.api}/users/${userId}/toggle-status`, {});
  }

  getToken(): string | null {
    return localStorage.getItem('medibook_token');
  }

  getRole(): string {
    return this.currentUser()?.role ?? '';
  }

  getUserId(): number {
    return this.currentUser()?.userId ?? 0;
  }
}
