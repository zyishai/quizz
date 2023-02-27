import { EntityBase } from "./misc";
import { Payment } from "./payment";
import { Student } from "./student";
import { Event } from "./event";

export type Lesson = EntityBase & {
  event: Event | string;
  topic?: string;
  notes?: string;
  address?: string;
  price: number;
  student: Student | string;
  summary?: string;
  paid: number;
  payments: Payment[];
  ended?: boolean;
}

export type CreateLessonDto = {
  eventId: string;
  topic?: string;
  price: number;
  studentId: string;
}

export type UpdateLessonDto = {
  lessonId: string;
  studentId?: string;
} & Partial<Pick<Lesson, 'topic'|'summary'|'price'|'ended'>>
