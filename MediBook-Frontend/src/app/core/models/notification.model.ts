export interface Notification {
  notificationId: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  sentAt: string;
}

export interface NotificationCreate {
  recipientId: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  relatedId?: number;
  relatedType?: string;
}
