import dayjs from "dayjs";
import { Result } from "surrealdb.js";
import { CreateLessonDto, Lesson, UpdateLessonDto } from "~/types/lesson";
import { getDatabaseInstance } from "./db.adapter";

// TODO: convert payments' paidAt from string to Date
// function mapToLesson(lessonResponse: Lesson): Lesson {
//   let createdAt = new Date(lessonResponse.createdAt);
//   let lastUpdatedAt = undefined;
//   if (isNaN(Date.parse(lessonResponse.createdAt))) {
//     createdAt = new Date();
//   }
//   if (lessonResponse.lastUpdatedAt && !isNaN(Date.parse(lessonResponse.lastUpdatedAt))) {
//     lastUpdatedAt = new Date(lessonResponse.lastUpdatedAt);
//   }

//   return {
//     ...lessonResponse,
//     createdAt,
//     lastUpdatedAt
//   };
// }

function resetDateStartOfDay(date: Date): Date {
  return dayjs(date).tz('utc').startOf('day').toDate();
}

type FetchLessonsProps = {
  days?: Date[];
  fetch?: ('event'|'student')[];
}
export async function fetchLessonsByTeacherId(teacherId: string, props?: FetchLessonsProps): Promise<Lesson[]> {
  const db = await getDatabaseInstance();
  let query = 'select *, math::sum((select math::sum(payments[where lesson == $parent.id].sum) from paymentAccount)) as paid from lesson where event<-schedule<-teacher.id contains $teacherId and event.status == "ACTIVE"';
  if (props?.days) {
    query += ' and time::group(event.dateAndTime, "day") inside $days';
  }
  if (props?.fetch) {
    query += ` fetch ${props.fetch.join(', ')}`;
  }
  const [lessons] = await db.query<Result<Lesson[]>[]>(query, { teacherId, days: props?.days?.map(resetDateStartOfDay) });
  if (lessons.error) {
    throw lessons.error;
  }
  return lessons.result;
}

type FetchLessonProps = {
  teacherId: string;
  lessonId: string;
  fetch?: ('event'|'student')[];
}
export async function fetchLessonById({ teacherId, lessonId, fetch }: FetchLessonProps): Promise<Lesson | null> {
  const db = await getDatabaseInstance();
  let query = 'select *, math::sum((select math::sum(payments[where lesson == $parent.id].sum) from paymentAccount)) as paid from $lessonId where student<-teach<-teacher.id contains $teacherId';
  if (fetch) {
    query += ` fetch ${fetch.join(', ')}`;
  }
  const [lesson] = await db.query<Result<Lesson[]>[]>(query, { lessonId, teacherId });
  if (lesson.error) {
    throw lesson.error;
  }
  return lesson.result.length > 0 ? lesson.result[0] : null;
}

export async function createLesson(dto: CreateLessonDto): Promise<Lesson | null> {
  const db = await getDatabaseInstance();
  const [lesson] = await db.query<Result<Lesson[]>[]>(`create lesson content {
    event: $eventId,
    student: $studentId,
    topic: $topic,
    notes: '',
    price: $price,
    address: '',
    summary: '',
    ended: false,
    createdAt: time::now()
  }`, dto);
  // ended: <future> { math::sum((select math::sum(payments[where lesson == $parent.id].sum) from paymentAccount)) >= $price * $eventId.duration / 60 },
  if (lesson.error) {
    throw lesson.error;
  }

  return lesson.result.length > 0 ? lesson.result[0] : null;
}

export async function updateLessonDetails({ lessonId, ...updateData }: UpdateLessonDto): Promise<Lesson | null> {
  const db = await getDatabaseInstance();
  const { studentId: student, topic, price, summary } = updateData;
  const lesson = await db.change<Lesson, {}>(lessonId, {
    student,
    topic,
    price,
    summary,
  });
  if (Array.isArray(lesson)) {
    return null;
  } else {
    return lesson;
  }
}

export async function deleteLessonById(lessonId: string): Promise<boolean> {
  const db = await getDatabaseInstance();
  const [res] = await db.query<Result<any[]>[]>('select event as eventId from $lessonId', { lessonId });
  if (res.error || res.result.length < 1) {
    return false;
  }
  await db.delete(res.result[0].eventId); // delete associated event;
  await db.delete(lessonId); // delete the lesson;
  return true;
}

// type MakePaymentDto = {
//   lessonId: string;
//   sum: number;
//   paymentMethod: PaymentMethod;
// } | {
//   lessonId: string;
//   creditId: string;
//   sum: number;
// }
// export async function makePaymentForLesson({ lessonId, ...paymentData }: MakePaymentDto): Promise<boolean> {
//   let creditId = undefined;
//   let paymentMethod = undefined;
//   const sum = paymentData.sum;
//   if ('creditId' in paymentData) {
//     creditId = paymentData.creditId;
//   } else {
//     paymentMethod = paymentData.paymentMethod;
//   }
//   const db = await getDatabaseInstance();
//   const [response] = await db.query<Result<string|null>[]>(`
//     if $lessonId.paid + $sum <= $lessonId.price then
//       (update $lessonId set payments += { sum: $sum, paymentMethod: $paymentMethod, paidAt: time::now(), creditId: $creditId })
//     end
//   `, { lessonId, creditId, sum, paymentMethod });
//   if (response.error) {
//     throw response.error;
//   }
//   return !!response.result ? true : false;
// }

// export async function removePaymentFromLesson(lessonId: string, paymentIndex: number): Promise<boolean> {
//   const db = await getDatabaseInstance();
//   const [lesson] = await db.query<Result<Lesson[]>[]>('select * from $lessonId', { lessonId });
//   if (lesson.error) {
//     throw lesson.error;
//   }
//   const payments = lesson.result.length > 0 ? lesson.result[0].payments : [];
//   const [response] = await db.query('update $lessonId set payments = $payments', { lessonId, payments: payments.filter((_, index) => index !== paymentIndex) });
//   if (response.error) {
//     throw response.error;
//   }
//   return true;
// }

// type UpdatePaymentDto = {
//   sum?: number;
//   paymentMethod?: PaymentMethod;
//   creditId?: string;
// }
// export async function updatePaymentDetails(lessonId: string, paymentIndex: number, dto: UpdatePaymentDto): Promise<Lesson | null> {
//   const db = await getDatabaseInstance();
//   const [lesson] = await db.query<Result<Lesson[]>[]>('select * from $lessonId', { lessonId });
//   if (lesson.error) {
//     throw lesson.error;
//   }
//   const payments = lesson.result.length > 0 ? lesson.result[0].payments : [];
//   payments[paymentIndex] = {
//     ...payments[paymentIndex],
//     ...dto
//   }
//   const [updatedLesson] = await db.query<Result<Lesson[]>[]>(`update $lessonId set payments = $payments`, { lessonId, payments });
  
//   if (updatedLesson.error) {
//     throw updatedLesson.error;
//   }

//   return updatedLesson.result[0];
// }
