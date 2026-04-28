import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Review, ReviewCreate } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = environment.apis.review;

  constructor(private http: HttpClient) {}

  add(data: ReviewCreate) {
    return this.http.post<Review>(`${this.api}`, data);
  }

  getByProvider(providerId: number) {
    return this.http.get<Review[]>(`${this.api}/provider/${providerId}`);
  }

  getByPatient(patientId: number) {
    return this.http.get<Review[]>(`${this.api}/patient/${patientId}`);
  }

  getByAppointment(appointmentId: number) {
    return this.http.get<Review>(`${this.api}/appointment/${appointmentId}`);
  }

  update(id: number, data: ReviewCreate) {
    return this.http.put<Review>(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getAvgRating(providerId: number) {
    return this.http.get<{ providerId: number; averageRating: number }>(`${this.api}/avgRating/${providerId}`);
  }

  getCount(providerId: number) {
    return this.http.get<{ providerId: number; totalReviews: number }>(`${this.api}/count/${providerId}`);
  }

  getAll() {
    return this.http.get<Review[]>(`${this.api}/all`);
  }
}
