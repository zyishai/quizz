import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { badRequest, namedAction } from "remix-utils";
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

      const fields = { datetime, duration, topic, studentId, eventId };
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

      return redirect(`/calendar/${params.lessonId}`);
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

export default function EditLesson() {
  const { lesson, students, availableSlots } = useLoaderData<typeof loader>();
  const eventFetched = hasEventFetched(lesson);
  const studentFetched = hasStudentFetched(lesson);

  return (
    <div className="overflow-auto px-2 pb-2">
      <header className="mb-4 sm:mb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          עריכת פרטי שיעור
        </h3>
        {/* <p className="mt-1 text-sm text-gray-500">
          מלא את פרטי איש הקשר בטופס בבקשה.
        </p> */}
      </header>
      <EventForm
        fields={{
          datetime: eventFetched ? lesson.event.dateAndTime : undefined,
          duration: eventFetched ? lesson.event.duration.toString() : undefined,
          studentId: studentFetched ? lesson.student.id : undefined,
          topic: lesson.topic,
          slots: availableSlots,
          eventId: eventFetched ? lesson.event.id : undefined,
          lessonId: lesson.id,
        }}
        students={students}
        back={`/calendar/${lesson.id}`}
      />
    </div>
  );
}
