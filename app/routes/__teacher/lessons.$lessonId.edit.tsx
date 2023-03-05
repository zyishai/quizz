import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { badRequest, namedAction, safeRedirect } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import EventForm from "~/components/event-form";
import {
  constructUpdateLessonDto,
  findAvailableTimes,
  getLesson,
  updateLesson,
} from "~/handlers/lessons.server";
import { getStudents } from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { Event } from "~/types/event";
import { AppError } from "~/utils/app-error";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionArgs) => {
  return namedAction(request, {
    async save() {
      const formData = await request.clone().formData();

      // Validate form data
      const datetime = formData.get("datetime")?.toString();
      const duration = formData.get("duration")?.toString();
      const topic = formData.get("topic")?.toString();
      const studentId = formData.get("studentId")?.toString();
      const eventId = formData.get("eventId")?.toString();
      const price = formData.get("price")?.toString();

      const fields = { datetime, duration, topic, studentId, eventId, price };
      const fieldErrors = {
        datetime: undefined,
        duration: undefined,
      };

      if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({
          actionName: "save",
          fields,
          fieldErrors,
          formError: null,
        });
      }

      const updateDto = await constructUpdateLessonDto(request.clone(), {
        lessonId: params.lessonId,
        eventId,
      });
      const updatedLesson = await updateLesson(updateDto);
      if (!updatedLesson) {
        throw new AppError({ errType: ErrorType.LessonUpdateFailed });
      }

      return redirect(safeRedirect(`/lessons/${params.lessonId}`, "/lessons"));
    },
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { lessonId = "" } = params;
      const lesson = await getLesson(teacher.id, lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }
      const students = await getStudents(request);
      const availableSlots = await findAvailableTimes(request, {
        date: (lesson.event as Event).dateAndTime,
        duration: (lesson.event as Event).duration,
        fromTimeInMinutes: 8 * 60,
        untilTimeInMinutes: 19 * 60,
        ignoreIds: [lesson.id],
      });
      return json({ lesson, students, availableSlots });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function EditLessonDetailsPage() {
  const { lesson, students, availableSlots } = useLoaderData<typeof loader>();
  const eventFetched = hasEventFetched(lesson);
  const studentFetched = hasStudentFetched(lesson);

  return (
    <div className="flex-1 overflow-auto px-2 pb-2">
      <EventForm
        id="update-lesson-form"
        fields={{
          datetime: eventFetched ? lesson.event.dateAndTime : undefined,
          duration: eventFetched ? lesson.event.duration.toString() : undefined,
          studentId: studentFetched ? lesson.student.id : undefined,
          topic: lesson.topic,
          price: eventFetched
            ? ((lesson.price / lesson.event.duration) * 60)?.toString()
            : undefined,
          slots: availableSlots,
          eventId: eventFetched ? lesson.event.id : undefined,
          lessonId: lesson.id,
        }}
        students={students}
      />

      <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
        <Link
          to={`/lessons/${lesson.id}`}
          className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
        >
          ביטול
        </Link>
        <button
          type="submit"
          form="update-lesson-form"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          עדכן פרטי שיעור
        </button>
      </div>
    </div>
  );
}
