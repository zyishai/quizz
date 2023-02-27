import { DateTimeString, EntityBase } from "./misc";

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED'
}
export type Event = EntityBase & {
  dateAndTime: DateTimeString;
  duration: number;
  status: EventStatus;
  cancelledAt?: DateTimeString;
  cancellationReason?: string;
};

export type CreateEventDto = {
  teacherId: string;
  dateAndTime: string;
  duration: number;
}

export type UpdateEventDto = {
  eventId: string;
  dateAndTime?: string;
  duration?: number;
  status?: EventStatus;
  cancellationReason?: string;
}
