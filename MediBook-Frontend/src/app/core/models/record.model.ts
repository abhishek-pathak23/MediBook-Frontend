export interface MedicalRecord {
  recordId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
  attachmentUrl?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordCreate {
  appointmentId: number;
  patientId: number;
  providerId: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
  attachmentUrl?: string;
  followUpDate?: string;
}

export interface RecordUpdate {
  diagnosis: string;
  prescription: string;
  notes?: string;
  attachmentUrl?: string;
  followUpDate?: string;
}
