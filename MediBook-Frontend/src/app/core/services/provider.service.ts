import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Provider, ProviderRegistration, ProviderUpdate } from '../models/provider.model';
import { Observable, shareReplay, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private api = environment.apis.provider;

  constructor(private http: HttpClient) {}

  register(data: ProviderRegistration) {
    return this.http.post<Provider>(`${this.api}`, data);
  }

  getById(id: number) {
    return this.http.get<Provider>(`${this.api}/${id}`);
  }

  getBySpecialization(specialization: string) {
    return this.http.get<Provider[]>(`${this.api}/specialization/${specialization}`);
  }

  search(query: string) {
    return this.http.get<Provider[]>(`${this.api}/search?query=${encodeURIComponent(query)}`);
  }

  /** Fetches all providers directly from backend */
  getAll(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.api}`);
  }

  /** Convenience: get the profile for a specific userId */
  getMyProfile(userId: number): Observable<Provider | undefined> {
    return this.getAll().pipe(map(providers => providers.find(p => p.userId === userId)));
  }

  update(id: number, data: ProviderUpdate) {
    return this.http.put<Provider>(`${this.api}/${id}`, data);
  }

  verify(id: number) {
    return this.http.put(`${this.api}/${id}/verify`, {}, { responseType: 'text' });
  }

  setAvailability(id: number, isAvailable: boolean) {
    return this.http.put(`${this.api}/${id}/availability?isAvailable=${isAvailable}`, {}, { responseType: 'text' });
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
