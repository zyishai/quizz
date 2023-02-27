import { Result } from "surrealdb.js";
import { EventStatus, ScheduledEvent } from "~/types/event";
import { CreateLessonPayload, Lesson } from "~/types/lesson";
import { getDatabaseInstance } from "./db.server";
import { getTeacher } from "./teacher.server";

export async function createLesson(request: Request, lessonData: CreateLessonPayload): Promise<Lesson> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw new Error('Operation createLesson failed. Reason: Not a teacher, not allowed');
  }

  const db = await getDatabaseInstance();
  const createdEvent = await db.create<Omit<ScheduledEvent, 'id'>>('event', {
    dateAndTime: lessonData.datetime,
    duration: lessonData.duration,
    status: EventStatus.ACTIVE
  });
  const createdLesson = await db.create('lesson', {
    event: createdEvent.id,
    student: lessonData.studentId,
    topic: lessonData.topic,
    notes: '',
    summary: '',
    address: '',
    payments: [],
  });
  const [response] = await db.query('relate $teacherId -> schedule -> $eventId', { teacherId: teacher.id, eventId: createdEvent.id });
  if (response.error) {
    console.error(`Operation createLesson failed. Failed to relate the event to the teacher: ${response.error}`);
    throw response.error;
  }
  const [lesson] = await db.query<Result<Lesson[]>[]>('select * from lesson where id = $lessonId fetch event, student', {
    lessonId: createdLesson.id
  });
  if (lesson.error) {
    console.error(`Operation createLesson failed. Failed to fetch the created lesson: ${lesson.error}`);
    throw lesson.error;
  }

  return lesson.result[0];
}
