export interface Provider {
  providerId: number;
  userId: number;
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  avgRating: number;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface ProviderRegistration {
  userId: number;
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
}

export interface ProviderUpdate {
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
}
