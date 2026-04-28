import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ProviderService } from '../../../core/services/provider.service';
import { Provider } from '../../../core/models/provider.model';

@Component({
  selector: 'app-search-providers',
  imports: [FormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="page-header">
      <h2>Find a Provider</h2>
      <p>Search by name, specialization, or clinic</p>
    </div>

    <div class="flex gap-4 mb-6">
      <input class="form-control" style="flex: 1;" type="text" [(ngModel)]="query"
             placeholder="Search providers..." (input)="onSearch()" id="provider-search" />
      <select class="form-control" [(ngModel)]="specFilter" (change)="onFilter()" id="spec-filter" style="width: 200px;">
        <option value="">All Specializations</option>
        @for (s of specializations; track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
    </div>

    @if (filtered.length === 0) {
      <div class="empty-state glass-panel">
        <div class="icon">🔍</div>
        <p>No providers found</p>
      </div>
    } @else {
      <div class="grid-3">
        @for (p of filtered; track p.providerId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between mb-4">
              <h4>{{ p.clinicName }}</h4>
              @if (p.isVerified) {
                <span class="badge badge-success">✓ Verified</span>
              }
            </div>
            <p class="text-secondary" style="font-size: 0.85rem;">{{ p.specialization }}</p>
            <p class="text-muted" style="font-size: 0.8rem;">{{ p.qualification }} · {{ p.experienceYears }} yrs</p>
            <p class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">📍 {{ p.clinicAddress }}</p>
            <div class="flex items-center justify-between mt-4">
              <div class="stars">
                @if (p.avgRating > 0) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <span class="star" [class.filled]="i <= p.avgRating" [class.empty]="i > p.avgRating">★</span>
                  }
                  <span class="text-muted" style="font-size: 0.75rem; margin-left: 4px;">({{ p.avgRating | number:'1.1-1' }})</span>
                } @else {
                  <span class="badge badge-neutral" style="font-size: 0.7rem;">New</span>
                }
              </div>
              <a [routerLink]="'/patient/book/' + p.providerId" class="btn btn-primary btn-sm" id="book-btn-{{p.providerId}}">
                Book
              </a>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class SearchProvidersComponent implements OnInit {
  private providerService = inject(ProviderService);
  private cd = inject(ChangeDetectorRef);

  providers: Provider[] = [];
  filtered: Provider[] = [];
  specializations: string[] = [];
  query = '';
  specFilter = '';

  ngOnInit(): void {
    this.providerService.getAll().subscribe({
      next: (data) => {
        this.providers = data.filter(p => p.isAvailable && p.isVerified);
        this.filtered = this.providers;
        this.specializations = [...new Set(data.map(p => p.specialization))];
        this.cd.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.providers;
    if (this.query.trim()) {
      const q = this.query.toLowerCase();
      result = result.filter(p =>
        p.clinicName.toLowerCase().includes(q) ||
        p.specialization.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q)
      );
    }
    if (this.specFilter) {
      result = result.filter(p => p.specialization === this.specFilter);
    }
    this.filtered = result;
  }
}
