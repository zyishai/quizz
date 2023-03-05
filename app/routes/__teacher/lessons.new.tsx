import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
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
      const price = formData.get("price")?.toString();

      const fields = { datetime, duration, topic, studentId, price };
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
          event.duration,
          event.id
        );
        const lesson = await createNewLesson(lessonDto);
        if (lesson) {
          return redirect("/lessons");
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
  const location = useLocation();

  return (
    <div className="flex-1 overflow-auto px-2 pb-2">
      <EventForm
        id="new-event-form"
        defaultDate={location.state?.date}
        fields={actionData?.fields}
        fieldErrors={actionData?.fieldErrors || undefined}
        students={loaderData.students}
      />

      <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
        <Link
          to="/lessons"
          className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
        >
          חזרה לשיעורים
        </Link>
        <button
          type="submit"
          form="new-event-form"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          צור שיעור
        </button>
      </div>
    </div>
  );
}
