export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  profilePicUrl?: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  provider?: string;
  profilePicUrl?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UpdateProfile {
  fullName?: string;
  phone?: string;
  profilePicUrl?: string;
}

export interface ChangePassword {
  oldPassword: string;
  newPassword: string;
}
