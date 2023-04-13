import { ActionArgs, json, LinksFunction, LoaderArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { IconCalendarPlus } from "~/utils/icons";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { findLessonsInRange } from "~/handlers/lessons.server";
import { OffsetUnit } from "~/types/datetime";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getRange } from "~/utils/calendar";
import { setLastLessonsView } from "~/utils/client-prefs.server";
import { offsetRangeBy } from "~/utils/datetime";
import { getUserId } from "~/utils/session.server";
import CalendarGrid from "~/components/calendar-grid";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { Lesson } from "~/types/lesson";
import stylesHref from "react-grid-layout/css/styles.css";
import extraStylesHref from "node_modules/react-resizable/css/styles.css";
import { formatDuration, formatTime24FromMinutes } from "~/utils/format";
import clsx from "clsx";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: stylesHref,
    },
    {
      rel: "stylesheet",
      href: extraStylesHref,
    },
  ];
};

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
  // const [currentDate, setCurrentDate] = useState<string | Date | null>(null);
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [lessons, setLessons] = useState<
    (Lesson & {
      displayDate: string;
      displayHour: string;
      displayDuration: string;
    })[]
  >([]);
  // const submit = useSubmit();
  const fetcher = useFetcher();

  const events = useMemo(
    () => actionData?.events || loaderData.events,
    [loaderData, actionData]
  );
  const range = useMemo(
    () => actionData?.range || loaderData.range,
    [loaderData, actionData]
  );
  const days = useMemo(() => {
    const list: Date[] = [];
    const startWeekDay = dayjs(range.start);

    for (let i = 0; i < dayjs(range.end).diff(startWeekDay, "days"); i++) {
      list.push(startWeekDay.add(i, "days").toDate());
    }

    return list;
  }, [range]);
  const isSameMonth = useMemo(
    () => new Date(range.start).getMonth() === new Date(range.end).getMonth(),
    [range]
  );
  const isSameYear = useMemo(
    () =>
      new Date(range.start).getFullYear() === new Date(range.end).getFullYear(),
    [range]
  );

  useEffect(() => {
    if (events) {
      setLessons(
        events.map((lesson) => {
          return {
            ...lesson,
            displayDate: hasEventFetched(lesson)
              ? dayjs(lesson.event.dateAndTime).format("DD/MM")
              : "",
            displayHour: hasEventFetched(lesson)
              ? dayjs(lesson.event.dateAndTime).format("HH:mm")
              : "",
            displayDuration: hasEventFetched(lesson)
              ? formatDuration(lesson.event.duration)
              : "שעה", //  replace with default value from settings
          };
        })
      );
    }
  }, [events]);

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
          className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ltr:ml-2 rtl:mr-2 sm:inline-flex"
        >
          <IconCalendarPlus
            className="h-4 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
            aria-hidden="true"
          />
          צור שיעור חדש
        </Link>
      </header>

      <CalendarGrid
        days={days}
        timeRange={{
          start: { hour: 8, minute: 0 },
          end: { hour: 19, minute: 0 },
        }}
        layouts={{
          lg: events.map((lesson) => {
            const date = hasEventFetched(lesson)
              ? dayjs(lesson.event.dateAndTime)
              : null;
            return {
              i: lesson.id,
              w: 1,
              h: hasEventFetched(lesson) ? lesson.event.duration / 15 : 1,
              y: date
                ? (date.hour() - 8) * 4 + Math.floor(date.minute() / 15)
                : 0,
              x: hasEventFetched(lesson)
                ? days.length - 1 - new Date(lesson.event.dateAndTime).getDay()
                : days.length - 1,
              maxW: 1,
              resizeHandles: ["s"],
              static: false,
            };
          }),
        }}
        onItemMove={(id, x, y, height) => {
          setLessons((lessons) =>
            lessons.map((lesson) => {
              if (lesson.id === id) {
                return {
                  ...lesson,
                  displayDate: dayjs(range.start)
                    .add(days.length - 1 - x, "days")
                    .format("DD/MM"),
                  displayHour: formatTime24FromMinutes(15 * y + 8 * 60),
                };
              }

              return lesson;
            })
          );
        }}
        onItemResize={(id, x, y, height) => {
          setLessons((lessons) =>
            lessons.map((lesson) => {
              if (lesson.id === id) {
                return {
                  ...lesson,
                  displayDuration: formatDuration(height * 15),
                };
              }

              return lesson;
            })
          );
        }}
        itemIds={events.map((lesson) => lesson.id)}
        renderItem={(id) => {
          const lesson = lessons.find((l) => l.id === id);
          return lesson ? (
            <>
              <div
                className="flex flex-1 select-none flex-col items-center overflow-hidden text-ellipsis rounded-md bg-sky-600 p-1 text-white sm:flex-row sm:items-start sm:p-2"
                dir="rtl"
              >
                <span className="break-keep text-xs leading-tight sm:text-sm">
                  {lesson.topic ||
                    (hasStudentFetched(lesson)
                      ? lesson.student.fullName
                      : "ללא נושא")}
                </span>
                <span className="mx-1 leading-tight">&middot;</span>
                <span className="text-xs leading-tight text-sky-200 sm:text-sm">
                  {lesson.displayDuration}
                </span>
              </div>
            </>
          ) : null;
        }}
        onDragStop={(layout, oldItem, newItem, placeholder, event, elem) => {
          fetcher.submit(
            {
              lessonId: newItem.i,
              dateAndTime: dayjs(range.start)
                .day(days.length - newItem.x - 1)
                .minute(8 * 60 + newItem.y * 15)
                .toISOString(),
              _action: "updateLessonPlacement",
            },
            { method: "post", action: "/lessons?index" }
          );
        }}
        onResizeStop={(layout, oldItem, newItem, placeholder, event, elem) => {
          fetcher.submit(
            {
              lessonId: newItem.i,
              duration: (newItem.h * 15).toString(),
              _action: "updateLessonDuration",
            },
            { method: "post", action: "/lessons?index" }
          );
        }}
      />

      <Link
        to="/lessons/new"
        className="m-1 mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-4 py-3 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
      >
        <IconCalendarPlus
          className="h-6 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
          aria-hidden="true"
        />
        צור שיעור חדש
      </Link>
    </>
  );
}
