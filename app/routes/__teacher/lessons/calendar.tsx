import { ActionArgs, json, LinksFunction, LoaderArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
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
import AddLessonModal from "~/components/add-lesson-modal";
import { getStudents } from "~/handlers/students.server";
import { XMarkIconSolid } from "~/utils/icons";
import isMobile from "ismobilejs";

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
      const students = await getStudents(request);
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);

      return json(
        {
          events,
          range,
          students,
          isMobilePhone,
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
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [lessons, setLessons] = useState<
    (Lesson & {
      displayDate: string;
      displayHour: string;
      displayDuration: string;
    })[]
  >([]);
  const [activeMovableLessonId, setActiveMovableLessonId] = useState<
    string | null
  >(null);
  const fetcher = useFetcher();
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);

  const events = useMemo(
    () =>
      (actionData?.events || loaderData.events || [])
        .filter(hasStudentFetched)
        .filter(hasEventFetched),
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
      <Form
        id="deleteLesson"
        method="post"
        action="/lessons?index"
        className="hidden"
      >
        <input type="hidden" name="_action" value="deleteScheduledLesson" />
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
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
          onClick={() => setShowNewLessonModal(true)}
        >
          <IconCalendarPlus
            className="h-5 w-auto ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2"
            aria-hidden="true"
          />
          שיעור חדש
        </button>

        <span className="isolate hidden rounded-md shadow-sm sm:inline-flex">
          <button
            type="submit"
            form="prevWeek"
            className="relative inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-medium text-orange-600 ring-1 ring-inset ring-orange-300 hover:bg-orange-50 focus:z-10"
          >
            שבוע שעבר
          </button>
          <button
            type="submit"
            form="currentWeek"
            className="relative -mr-px inline-flex items-center bg-white px-3 py-2 text-sm font-medium text-orange-600 ring-1 ring-inset ring-orange-300 hover:bg-orange-50 focus:z-10"
          >
            שבוע נוכחי
          </button>
          <button
            type="submit"
            form="nextWeek"
            className="relative -mr-px inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-medium text-orange-600 ring-1 ring-inset ring-orange-300 hover:bg-orange-50 focus:z-10"
          >
            שבוע הבא
          </button>
        </span>
        {/* <button
          form="currentWeek"
          type="submit"
          className="inline-flex items-center rounded-md border border-orange-400 px-3 py-2 text-sm font-medium leading-4 text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          עבור להיום
        </button> */}
        <button
          type="button"
          className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ltr:ml-2 rtl:mr-2 sm:inline-flex"
          onClick={() => setShowNewLessonModal(true)}
        >
          <IconCalendarPlus
            className="h-4 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
            aria-hidden="true"
          />
          צור שיעור חדש
        </button>
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
                className={clsx([
                  "relative flex flex-1 select-none flex-col items-center justify-center overflow-hidden text-ellipsis rounded-md bg-sky-600 p-1 text-white sm:p-2",
                  {
                    "drag-handle":
                      activeMovableLessonId === id || loaderData.isMobilePhone,
                  },
                ])}
                dir="rtl"
                onMouseOver={() => setActiveMovableLessonId(id)}
                onMouseUp={() => setActiveMovableLessonId(null)}
              >
                <button
                  type="submit"
                  form="deleteLesson"
                  className="cancel-drag absolute top-1 right-1 z-20 rounded-full bg-white/70 p-0.5 text-blue-600"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    if (!confirm("האם ברצונך למחוק את השיעור?")) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }}
                  name="lessonId"
                  value={lesson.id}
                >
                  <XMarkIconSolid className="h-3 w-3" />
                </button>

                <span className="text-sm">
                  {hasStudentFetched(lesson) ? lesson.student.fullName : null}
                </span>
              </div>
            </>
          ) : null;
        }}
        onDragStop={(layout, oldItem, newItem, placeholder, event, elem) => {
          const rangeStart = new Date(range.start);
          let dateAndTime = new Date(range.start);
          dateAndTime = new Date(
            dateAndTime.setDate(
              rangeStart.getDate() + days.length - newItem.x - 1
            )
          );
          dateAndTime = new Date(
            dateAndTime.setMinutes(8 * 60 + newItem.y * 15)
          );
          fetcher.submit(
            {
              lessonId: newItem.i,
              dateAndTime: dateAndTime.toISOString(),
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

      <div className="m-1 mt-3 flex sm:hidden">
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-600 shadow-sm"
          form="prevWeek"
        >
          שבוע שעבר
        </button>

        <button
          type="submit"
          className="mx-2 flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-600 shadow-sm"
          form="currentWeek"
        >
          שבוע נוכחי
        </button>

        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-600 shadow-sm"
          form="nextWeek"
        >
          שבוע הבא
        </button>
      </div>

      <AddLessonModal
        action="/lessons?index"
        open={showNewLessonModal}
        onClose={() => setShowNewLessonModal(false)}
        students={loaderData.students}
      />
    </>
  );
}
