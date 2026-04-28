export interface Appointment {
  appointmentId: number;
  patientId: number;
  providerId: number;
  slotId: number;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  modeOfConsultation: string;
  status: string;
  createdAt: string;
}

export interface AppointmentCreate {
  providerId: number;
  slotId: number;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  modeOfConsultation: string;
}

export interface AppointmentReschedule {
  newSlotId: number;
}

export interface AppointmentStatusUpdate {
  status: string;
}
