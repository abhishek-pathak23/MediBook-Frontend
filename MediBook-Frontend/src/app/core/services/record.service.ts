import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MedicalRecord, RecordCreate, RecordUpdate } from '../models/record.model';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private api = environment.apis.record;

  constructor(private http: HttpClient) {}

  create(data: RecordCreate) {
    return this.http.post<{ message: string; recordId: number }>(`${this.api}`, data);
  }

  getByAppointment(appointmentId: number) {
    return this.http.get<MedicalRecord>(`${this.api}/appointment/${appointmentId}`);
  }

  getByPatient(patientId: number) {
    return this.http.get<MedicalRecord[]>(`${this.api}/patient/${patientId}`);
  }

  getByProvider(providerId: number) {
    return this.http.get<MedicalRecord[]>(`${this.api}/provider/${providerId}`);
  }

  getById(id: number) {
    return this.http.get<MedicalRecord>(`${this.api}/${id}`);
  }

  update(id: number, data: RecordUpdate) {
    return this.http.put<MedicalRecord>(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getFollowUps(date: string) {
    return this.http.get<MedicalRecord[]>(`${this.api}/followUps?date=${date}`);
  }

  getRecordCount(patientId: number) {
    return this.http.get<{ patientId: number; recordCount: number }>(`${this.api}/patient/${patientId}/count`);
  }

  attachDocument(id: number, attachmentUrl: string) {
    return this.http.put(`${this.api}/${id}/attachDocument`, { attachmentUrl });
  }
}
