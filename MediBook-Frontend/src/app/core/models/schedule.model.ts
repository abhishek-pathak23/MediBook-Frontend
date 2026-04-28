export interface AvailabilitySlot {
  slotId: number;
  providerId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBooked: boolean;
  isBlocked: boolean;
  status: string;
  recurrence?: string;
}

export interface SlotCreate {
  providerId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface RecurringSlotCreate {
  providerId: number;
  recurrence: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface SlotUpdate {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  recurrence?: string;
}
