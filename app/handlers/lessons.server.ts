import { DateRange } from "~/types/datetime";
import { CreateLessonDto, Lesson, UpdateLessonDto } from "~/types/lesson";
import { createLesson, deleteLessonById, fetchLessonById, fetchLessonsByTeacherId, updateLessonDetails } from "~/adapters/lesson.adapter";
import dayjs from "dayjs";
import { assertNumber, assertString, assertValidRange, hasEventFetched, truthy } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { AppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import { updateEventDetails } from "~/adapters/event.adapter";
import { UpdateEventDto } from "~/types/event";

export const findLessonsInRange: (teacherId: string, range: DateRange) => Promise<Lesson[]> = async (teacherId: string, range: DateRange) => {
  assertValidRange(range);
  const days = [];
  for (let day = dayjs(range.start); !day.isAfter(range.end); day = day.add(1, 'day')) {
    days.push(day.toDate());
  }

  return fetchLessonsByTeacherId(teacherId, {
    days,
    fetch: ['event', 'student']
  });
}

export const constructLookupAvailableTimesConstraint: (request: Request) => Promise<AvailableTimesConstraint | null> = async (request: Request) => {
  const formData = await request.formData();
  const date = formData.get("date")?.toString();
  const duration = Number(formData.get("duration"));
  if (!date || isNaN(duration)) {
    return null;
  }
  const lessonId = formData.get('lessonId')?.toString();

  return {
    date,
    duration,
    fromTimeInMinutes: 8 * 60,
    untilTimeInMinutes: 19 * 60,
    ignoreIds: lessonId ? [lessonId] : undefined
  };
}
type AvailableTimesConstraint = {
  date: Date | string;
  duration: number;
  fromTimeInMinutes: number;
  untilTimeInMinutes: number;
  ignoreIds?: string[]
}
export const findAvailableTimes = async (request: Request, constraint: AvailableTimesConstraint) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { date, duration, fromTimeInMinutes, untilTimeInMinutes, ignoreIds } = constraint;
      const availableTimes: Date[] = [];
      const lessons = (await fetchLessonsByTeacherId(teacher.id, {
        days: [new Date(date)],
        fetch: ['event']
      })).filter(hasEventFetched).filter((lesson) => !ignoreIds?.includes(lesson.id));

      for (let time = fromTimeInMinutes; time + duration <= untilTimeInMinutes; time += 15 /** min lesson length */) {
        const targetDateTime = dayjs(date).startOf("date").minute(time);
        // A
        const targetStart = targetDateTime;
        const targetEnd = targetDateTime.add(duration, 'minutes');
        if (lessons.some((lesson) => {
          // B
          const lessonStart = dayjs(lesson.event.dateAndTime);
          const lessonEnd = lessonStart.add(lesson.event.duration, 'minutes');

          return /** check overlapping */ !((
            /** endA <= startB */
            !targetEnd.isAfter(lessonStart)
          ) || (
            /** startA >= endB */
            !targetStart.isBefore(lessonEnd)
          ))
        })) {
          continue
        }

        availableTimes.push(targetDateTime.toDate());
      }

      return availableTimes;
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}

export const getLesson = async (teacherId: string, lessonId: string) => {
  const lesson = await fetchLessonById({teacherId, lessonId, fetch: ['event', 'student']});
  if (!lesson) {
    throw new AppError({ errType: ErrorType.LessonNotFound });
  }

  return lesson;
}

// export const fetchPaymentsDetails: (payments: Payment[]) => Promise<Array<DirectPayment & Partial<CreditPayment>>> = async (payments: Payment[]) => {
//   return Promise.all(payments.map(async (payment) => {
//     if ((payment as any).creditId) {
//       return (await fetchCreditById((payment as any).creditId)) as DirectPayment & Partial<CreditPayment>;
//     } else {
//       return payment as DirectPayment & Partial<CreditPayment>;
//     }
//   })).then(res => res.filter(truthy));
// }

export const constructNewLessonDto: (request: Request, duration: number, eventId?: string) => Promise<CreateLessonDto> = async (request: Request, duration: number, eventId?: string) => {
  assertString(eventId);
  const formData = await request.formData();
  const topic = formData.get('topic')?.toString();
  const studentId = formData.get('studentId');
  assertString(studentId);
  const price = Number(formData.get('price'));
  assertNumber(price);

  return {
    eventId,
    topic,
    price: price * duration / 60,
    studentId,
  }
}

export const createNewLesson = async (dto: CreateLessonDto) => {
  const lesson = await createLesson(dto);
  if (!lesson) {
    throw new AppError({ errType: ErrorType.LessonNotCreated });
  }

  return lesson;
}

type UpdateLessonDtoProps = {
  lessonId?: string;
  eventId?: string;
}
export const constructUpdateLessonDto: (request: Request, props: UpdateLessonDtoProps) => Promise<Partial<UpdateLessonDto> & Partial<UpdateEventDto> & { lessonId: string }> = async (request: Request, { lessonId, eventId }: UpdateLessonDtoProps) => {
  assertString(lessonId);
  const formData = await request.formData();
  const dateAndTime = formData.get('datetime')?.toString();
  const duration = Number(formData.get('duration'));
  assertNumber(duration);
  const topic = formData.get('topic')?.toString();
  const studentId = formData.get('studentId')?.toString();
  const price = Number(formData.get('price'));
  assertNumber(price);

  return {
    lessonId,
    dateAndTime,
    duration,
    eventId: dateAndTime || duration ? eventId : undefined,
    topic,
    price: price * duration / 60,
    studentId
  }
}
export const updateLesson = async (dto: Partial<UpdateLessonDto> & Partial<UpdateEventDto> & { lessonId: string }) => {
  if (dto.eventId) {
    const event = await updateEventDetails({ eventId: dto.eventId, ...dto });
    if (!event) {
      throw new AppError({ errType: ErrorType.EventUpdateFailed });
    }
  }
  
  const lesson =  await updateLessonDetails(dto);
  if (!lesson) {
    throw new AppError({ errType: ErrorType.LessonUpdateFailed });
  }

  return lesson;
}

export const deleteLesson = async (lessonId: string) => {
  return deleteLessonById(lessonId);
}

type FinishLessonProps = {
  lessonId: string;
  summary?: string;
}
export const finishLesson = async (props: FinishLessonProps) => {
  const { lessonId, summary } = props;
  console.log(props);
  
  const lesson = await updateLessonDetails({ lessonId, summary, ended: true });
  if (!lesson) {
    throw new AppError({ errType: ErrorType.LessonUpdateFailed });
  }

  return lesson;
}

// type AddPaymentProps = {
//   lessonId: string;
//   price: number;
//   paymentMethod?: PaymentMethod;
//   sum?: number;
//   creditId?: string;
// }
// export const addPayment = async (props: AddPaymentProps) => {
//   const { lessonId, price, paymentMethod, sum, creditId } = props;

//   if (creditId) { // credit
//     const credit = await fetchCreditById(creditId);
//     if (!credit) {
//       throw new AppError({ errType: ErrorType.CreditNotFound });
//     }
//     return makePaymentForLesson({ lessonId, creditId, sum: Math.min(credit.remaining, price) })
//   } else if (sum && paymentMethod) { // one-time payment
//     return makePaymentForLesson({ lessonId, sum, paymentMethod });
//   } else { // invalid
//     throw new AppError({ errType: ErrorType.InvalidOrMissingPaymentInformation });
//   }
// }

// type UpdatePaymentProps = {
//   lessonId: string;
//   paymentIndex: number;
//   creditId?: string;
//   sum?: number;
//   paymentMethod?: PaymentMethod;
// }
// export const updatePayment = async (props: UpdatePaymentProps) => {
//   const { lessonId, paymentIndex, creditId, sum, paymentMethod } = props;

//   return updatePaymentDetails(lessonId, paymentIndex, { paymentMethod, sum, creditId });
// }

// export const deletePayment = async (lessonId: string, paymentIndex:number) => {
//   return removePaymentFromLesson(lessonId, paymentIndex);
// }
