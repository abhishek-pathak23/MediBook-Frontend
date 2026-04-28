import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AvailabilitySlot, SlotCreate, RecurringSlotCreate, SlotUpdate } from '../models/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private api = environment.apis.schedule;

  constructor(private http: HttpClient) {}

  addSlot(data: SlotCreate) {
    return this.http.post<AvailabilitySlot>(`${this.api}`, data);
  }

  addBulk(data: SlotCreate[]) {
    return this.http.post<AvailabilitySlot[]>(`${this.api}/bulk`, data);
  }

  generateRecurring(data: RecurringSlotCreate) {
    return this.http.post<AvailabilitySlot[]>(`${this.api}/recurring`, data);
  }

  getByProvider(providerId: number) {
    return this.http.get<AvailabilitySlot[]>(`${this.api}/provider/${providerId}`);
  }

  getAvailable(providerId: number, date: string) {
    return this.http.get<AvailabilitySlot[]>(`${this.api}/available/${providerId}?date=${date}`);
  }

  getById(id: number) {
    return this.http.get<AvailabilitySlot>(`${this.api}/${id}`);
  }

  blockSlot(id: number) {
    return this.http.put(`${this.api}/${id}/block`, {});
  }

  unblockSlot(id: number) {
    return this.http.put(`${this.api}/${id}/unblock`, {});
  }

  updateSlot(id: number, data: SlotUpdate) {
    return this.http.put<AvailabilitySlot>(`${this.api}/${id}`, data);
  }

  deleteSlot(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
