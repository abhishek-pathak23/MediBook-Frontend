export interface ReviewCreate {
  appointmentId: number;
  patientId: number;
  providerId: number;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
}

export interface Review {
  reviewId: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  providerId: number;
  rating: number;
  comment?: string;
  reviewDate: string;
  isVerified: boolean;
  isAnonymous: boolean;
}
