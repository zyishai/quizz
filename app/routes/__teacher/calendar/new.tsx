import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { badRequest, namedAction } from "remix-utils";
import EventForm from "~/components/event-form";
import { constructNewEventDto, createNewEvent } from "~/handlers/events.server";
import {
  constructNewLessonDto,
  createNewLesson,
} from "~/handlers/lessons.server";
import { getStudents } from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { requireUserId } from "~/utils/session.server";

// function validateDateTime(date?: string) {
//   if (!date) {
//     return `חסר תאריך שיעור`;
//   }

//   if (!dayjs(date).isValid()) {
//     return `תאריך לא חוקי`;
//   }
// }

// function validateDuration(duration?: string) {
//   if (!duration) {
//     return `חסר אורך שיעור`;
//   }

//   if (!validator.isNumeric(duration, { no_symbols: true })) {
//     return `אורך שיעור לא תקין`;
//   }
// }

export const action = async ({ request }: ActionArgs) => {
  await requireUserId(request);

  return namedAction(request, {
    async save() {
      const formData = await request.clone().formData();

      // Validate form data
      const datetime = formData.get("datetime")?.toString();
      const duration = formData.get("duration")?.toString();
      const topic = formData.get("topic")?.toString();
      const studentId = formData.get("studentId")?.toString();

      const fields = { datetime, duration, topic, studentId };
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

      // Create event and a lesson
      const eventDto = await constructNewEventDto(request.clone());
      const event = await createNewEvent(eventDto);
      if (event) {
        const lessonDto = await constructNewLessonDto(
          request.clone(),
          event.id
        );
        const lesson = await createNewLesson(lessonDto);
        if (lesson) {
          return redirect("/calendar");
        } else {
          throw new AppError({ errType: ErrorType.LessonNotCreated });
        }
      } else {
        throw new AppError({ errType: ErrorType.EventNotCreated });
      }
    },
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  const students = await getStudents(request);

  return json({ students });
};

export default function NewEventPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData();

  return (
    <div className="overflow-auto px-2 pb-2">
      <header className="mb-4 sm:mb-5">
        <h1 className="text-lg font-medium leading-6 text-gray-900">
          צור שיעור
        </h1>
        {/* <p className="mt-1 text-sm text-gray-500">
          מלא את פרטי התלמיד בטופס בבקשה.
        </p> */}
      </header>
      <EventForm
        fields={actionData?.fields}
        fieldErrors={actionData?.fieldErrors || undefined}
        students={loaderData.students}
        back="/calendar"
      />
    </div>
  );
}
