import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentCreate, AppointmentReschedule, AppointmentStatusUpdate } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private api = environment.apis.appointment;

  constructor(private http: HttpClient) {}

  book(data: AppointmentCreate) {
    return this.http.post<Appointment>(`${this.api}`, data);
  }

  getById(id: number) {
    return this.http.get<Appointment>(`${this.api}/${id}`);
  }

  getByPatient(patientId: number) {
    return this.http.get<Appointment[]>(`${this.api}/patient/${patientId}`);
  }

  getUpcoming(patientId: number) {
    return this.http.get<Appointment[]>(`${this.api}/patient/${patientId}/upcoming`);
  }

  getByProvider(providerId: number) {
    return this.http.get<Appointment[]>(`${this.api}/provider/${providerId}`);
  }

  getUpcomingByProvider(providerId: number) {
    return this.http.get<Appointment[]>(`${this.api}/provider/${providerId}/upcoming`);
  }

  getByProviderAndDate(providerId: number, date: string) {
    return this.http.get<Appointment[]>(`${this.api}/provider/${providerId}/date?date=${date}`);
  }

  getCount(providerId: number) {
    return this.http.get<{ providerId: number; count: number }>(`${this.api}/provider/${providerId}/count`);
  }

  getAll() {
    return this.http.get<Appointment[]>(`${this.api}/all`);
  }

  cancel(id: number) {
    return this.http.put(`${this.api}/${id}/cancel`, {});
  }

  reschedule(id: number, data: AppointmentReschedule) {
    return this.http.put<Appointment>(`${this.api}/${id}/reschedule`, data);
  }

  complete(id: number) {
    return this.http.put(`${this.api}/${id}/complete`, {});
  }

  updateStatus(id: number, data: AppointmentStatusUpdate) {
    return this.http.put(`${this.api}/${id}/status`, data);
  }
}
