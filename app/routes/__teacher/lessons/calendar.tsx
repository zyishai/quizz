import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { IconCalendarPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import EventsCalendar from "~/components/events-calendar";
import { findLessonsInRange } from "~/handlers/lessons.server";
import { OffsetUnit } from "~/types/datetime";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getRange } from "~/utils/calendar";
import { setLastLessonsView } from "~/utils/client-prefs.server";
import { offsetRangeBy } from "~/utils/datetime";
import { getUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    async prev() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const range = offsetRangeBy(
            await getRange(request),
            -1,
            OffsetUnit.WEEK
          );
          const events = await findLessonsInRange(teacher.id, range);
          console.log(range, events);

          return json({ events, range });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async next() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const range = offsetRangeBy(
            await getRange(request),
            1,
            OffsetUnit.WEEK
          );
          const events = await findLessonsInRange(teacher.id, range);

          return json({ events, range });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async today() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const range = {
            start: dayjs().startOf("week").toISOString(),
            end: dayjs().endOf("week").toISOString(),
          };
          const events = await findLessonsInRange(teacher.id, range);

          return json({ events, range });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const range = await getRange(request);
      const events = await findLessonsInRange(teacher.id, range);

      return json(
        {
          events,
          range,
        },
        {
          headers: {
            "Set-Cookie": await setLastLessonsView(request, "calendar"),
          },
        }
      );
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function LessonsCalendarView() {
  const [currentDate, setCurrentDate] = useState<string | Date | null>(null);
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const events = useMemo(
    () => actionData?.events || loaderData.events,
    [loaderData, actionData]
  );
  const range = useMemo(
    () => actionData?.range || loaderData.range,
    [loaderData, actionData]
  );
  const isSameMonth = useMemo(
    () => new Date(range.start).getMonth() === new Date(range.end).getMonth(),
    [range]
  );
  const isSameYear = useMemo(
    () =>
      new Date(range.start).getFullYear() === new Date(range.end).getFullYear(),
    [range]
  );

  return (
    <>
      <Form id="prevWeek" method="post" className="hidden">
        <input type="hidden" name="rangeStart" value={range.start} />
        <input type="hidden" name="rangeEnd" value={range.end} />
        <input type="hidden" name="_action" value="prev" />
      </Form>
      <Form id="currentWeek" method="post" className="hidden">
        <input type="hidden" name="rangeStart" value={range.start} />
        <input type="hidden" name="rangeEnd" value={range.end} />
        <input type="hidden" name="_action" value="today" />
      </Form>
      <Form id="nextWeek" method="post" className="hidden">
        <input type="hidden" name="rangeStart" value={range.start} />
        <input type="hidden" name="rangeEnd" value={range.end} />
        <input type="hidden" name="_action" value="next" />
      </Form>

      {/* Month and year (& "go to today" button) */}
      <header className="mb-5 flex items-center ltr:pr-1 rtl:pl-1">
        <h1 className="text-xl font-semibold text-gray-800 ltr:mr-auto rtl:ml-auto sm:text-3xl">
          {dayjs(range.start).format("MMMM")}{" "}
          {!isSameYear && (
            <span className="font-medium text-gray-500">
              {new Date(range.start).getFullYear()}
            </span>
          )}
          {(!isSameMonth || !isSameYear) && <span> &#x2010; </span>}
          {!isSameMonth && dayjs(range.end).format("MMMM ")}
          <span className="font-medium text-gray-500">
            {new Date(range.end).getFullYear()}
          </span>
        </h1>

        <button
          form="currentWeek"
          type="submit"
          className="inline-flex items-center rounded-md border border-orange-400 px-3 py-2 text-sm font-medium leading-4 text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          עבור להיום
        </button>
        <Link
          to="/lessons/new"
          state={{ date: currentDate }}
          className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ltr:ml-2 rtl:mr-2 sm:inline-flex"
        >
          <IconCalendarPlus
            className="h-4 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
            aria-hidden="true"
          />
          יצירת שיעור חדש
        </Link>
      </header>

      <EventsCalendar
        lessons={events}
        range={range}
        onPreviousWeek={() => {
          console.log(document.forms);
          submit(document.forms.namedItem("prevWeek"), { replace: true });
        }}
        onNextWeek={() => {
          submit(document.forms.namedItem("nextWeek"), { replace: true });
        }}
        onCurrentDayChanged={setCurrentDate}
      />

      <Link
        to="/lessons/new"
        state={{ date: currentDate }}
        className="m-1 mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
      >
        <IconCalendarPlus
          className="h-6 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
          aria-hidden="true"
        />
        יצירת שיעור חדש
      </Link>
    </>
  );
}
