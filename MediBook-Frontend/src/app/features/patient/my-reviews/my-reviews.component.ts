import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { Review } from '../../../core/models/review.model';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-my-reviews',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-header">
      <h2>My Reviews</h2>
      <p>Leave feedback for your providers</p>
    </div>

    <div class="card mb-6 animate-in">
      <h4 class="mb-4">Write a Review</h4>
      <div class="form-group mb-4">
        <label class="form-label">Select Completed Appointment</label>
        <select class="form-control" [(ngModel)]="selectedApptId" id="review-appt-select">
          <option [ngValue]="0">-- Select --</option>
          @for (a of completedAppts; track a.appointmentId) {
            <option [ngValue]="a.appointmentId">{{ a.serviceType }} ({{ a.appointmentDate }})</option>
          }
        </select>
      </div>
      <div class="form-group mb-4">
        <label class="form-label">Rating</label>
        <div class="stars">
          @for (i of [1,2,3,4,5]; track i) {
            <span class="star" [class.filled]="i <= newRating" [class.empty]="i > newRating"
                  (click)="newRating = i" style="cursor:pointer;">★</span>
          }
        </div>
      </div>
      <div class="form-group mb-4">
        <label class="form-label">Comment</label>
        <textarea class="form-control" [(ngModel)]="newComment" rows="3" placeholder="Share your experience..."></textarea>
      </div>
      <button class="btn btn-primary" [disabled]="!selectedApptId || !newRating" (click)="submitReview()">Submit Review</button>
    </div>

    <h3 class="mb-4">Past Reviews</h3>
    @if (reviews.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">⭐</div><p>No reviews yet</p></div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (r of reviews; track r.reviewId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div class="stars">
                @for (i of [1,2,3,4,5]; track i) {
                  <span class="star" [class.filled]="i <= r.rating" [class.empty]="i > r.rating">★</span>
                }
              </div>
              <span class="text-muted" style="font-size:0.8rem;">{{ r.reviewDate | date:'mediumDate' }}</span>
            </div>
            @if (r.comment) { <p class="text-secondary mt-3">{{ r.comment }}</p> }
          </div>
        }
      </div>
    }
  `
})
export class MyReviewsComponent implements OnInit {
  private auth = inject(AuthService);
  private reviewService = inject(ReviewService);
  private apptService = inject(AppointmentService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  completedAppts: Appointment[] = [];
  selectedApptId = 0;
  newRating = 0;
  newComment = '';

  ngOnInit(): void {
    const uid = this.auth.getUserId();
    this.reviewService.getByPatient(uid).subscribe({
      next: d => { 
        this.reviews = d;
        this.cd.detectChanges();
      }
    });
    this.apptService.getByPatient(uid).subscribe({
      next: d => { 
        this.completedAppts = d.filter(a => a.status === 'Completed');
        this.cd.detectChanges();
      }
    });
  }

  submitReview(): void {
    const appt = this.completedAppts.find(a => a.appointmentId === this.selectedApptId);
    if (!appt) return;
    this.reviewService.add({
      appointmentId: appt.appointmentId,
      patientId: this.auth.getUserId(),
      providerId: appt.providerId,
      rating: this.newRating,
      comment: this.newComment || undefined,
      isAnonymous: false
    }).subscribe({
      next: () => { this.toast.success('Review submitted!'); this.ngOnInit(); this.newRating = 0; this.newComment = ''; this.selectedApptId = 0; },
      error: err => this.toast.error(err.error?.message || 'Failed to submit review')
    });
  }
}
