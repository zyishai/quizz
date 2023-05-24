import {
  ActionArgs,
  json,
  LinksFunction,
  LoaderArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { IconCalendarPlus } from "~/utils/icons";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { findLessonsInRange, getLesson } from "~/handlers/lessons.server";
import { DateRange, OffsetUnit } from "~/types/datetime";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getRange } from "~/utils/calendar";
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
import isMobile from "ismobilejs";
import { redirectCookie } from "~/utils/cookies.server";
import LessonInfoModal from "~/components/lesson-info-modal";
import { DateTimeString } from "~/types/misc";

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
      const redirectToCookie = await redirectCookie.getSession(
        request.headers.get("Cookie")
      );
      const redirectTo = redirectToCookie.get("redirectTo");
      if (redirectTo && typeof redirectTo === "string") {
        redirectToCookie.unset("redirectTo");
        return redirect(redirectTo, {
          headers: {
            "Set-Cookie": await redirectCookie.commitSession(redirectToCookie),
          },
        });
      }

      const searchParams = new URL(request.url).searchParams;
      let range: DateRange;
      if (searchParams.has("l")) {
        const lesson = await getLesson(teacher.id, searchParams.get("l") || "");
        if (!hasEventFetched(lesson)) {
          throw new AppError({ errType: ErrorType.LessonNotFound });
        }
        range = {
          start: dayjs(lesson.event.dateAndTime).startOf("week").toISOString(),
          end: dayjs(lesson.event.dateAndTime).endOf("week").toISOString(),
        };
      } else {
        range = await getRange(request);
      }
      const events = await findLessonsInRange(teacher.id, range);
      const students = await getStudents(request);
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);

      return json({
        events,
        range,
        students,
        isMobilePhone,
      });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

if (typeof document !== "undefined") {
  (window as any).dayjs = dayjs;
}

export default function LessonsCalendarView() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [lessons, setLessons] = useState<
    (Lesson & {
      displayDate: string;
      displayHour: string;
      displayDuration: string;
    })[]
  >([]);
  const [editedLessonId, setEditedLessonId] = useState<string | null>(null);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const initialDateRef = useRef<DateTimeString | undefined>(undefined);

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
              ? dayjs(lesson.event.dateAndTime).utc()
              : null;
            return {
              i: lesson.id,
              w: 1,
              h: hasEventFetched(lesson) ? lesson.event.duration / 15 : 1,
              y: date
                ? (date.hour() - 8) * 4 + Math.floor(date.minute() / 15)
                : 0,
              x: date ? days.length - 1 - date.get("day") : days.length - 1,
              maxW: 1,
              static: true,
            };
          }),
        }}
        // onItemMove={(id, x, y, height) => {
        //   setLessons((lessons) =>
        //     lessons.map((lesson) => {
        //       if (lesson.id === id) {
        //         return {
        //           ...lesson,
        //           displayDate: dayjs(range.start)
        //             .add(days.length - 1 - x, "days")
        //             .format("DD/MM"),
        //           displayHour: formatTime24FromMinutes(15 * y + 8 * 60),
        //         };
        //       }

        //       return lesson;
        //     })
        //   );
        // }}
        // onItemResize={(id, x, y, height) => {
        //   setLessons((lessons) =>
        //     lessons.map((lesson) => {
        //       if (lesson.id === id) {
        //         return {
        //           ...lesson,
        //           displayDuration: formatDuration(height * 15),
        //         };
        //       }

        //       return lesson;
        //     })
        //   );
        // }}
        onClick={(index) => {
          const col = index % 6;
          const row = Math.floor(index / 6);
          const hour = 8 + (row * 30) / 60;
          initialDateRef.current = dayjs(range.start)
            .add(days.length - col - 1, "days")
            .add(hour, "hours")
            .toISOString();
          setShowNewLessonModal(true);
        }}
        itemIds={events.map((lesson) => lesson.id)}
        renderItem={(id) => {
          const lesson = lessons.find((l) => l.id === id);
          return lesson ? (
            <>
              <CalendarEntry
                lesson={lesson}
                isMobile={loaderData.isMobilePhone}
                searchParams={searchParams}
                onClick={setEditedLessonId}
              />
            </>
          ) : null;
        }}
        // onDragStop={(layout, oldItem, newItem, placeholder, event, elem) => {
        //   fetcher.submit(
        //     {
        //       lessonId: newItem.i,
        //       dateAndTime: dayjs(range.start)
        //         .startOf("week")
        //         .day(days.length - newItem.x - 1)
        //         .minute(8 * 60 + newItem.y * 15)
        //         .toISOString(),
        //       _action: "updateLessonPlacement",
        //     },
        //     { method: "post", action: "/lessons?index" }
        //   );
        // }}
        // onResizeStop={(layout, oldItem, newItem, placeholder, event, elem) => {
        //   fetcher.submit(
        //     {
        //       lessonId: newItem.i,
        //       duration: (newItem.h * 15).toString(),
        //       _action: "updateLessonDuration",
        //     },
        //     { method: "post", action: "/lessons?index" }
        //   );
        // }}
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
        onClose={() => {
          setShowNewLessonModal(false);
          initialDateRef.current = undefined;
        }}
        students={loaderData.students}
        initialDate={initialDateRef.current}
      />
      <LessonInfoModal
        open={typeof editedLessonId === "string"}
        onClose={() => {
          setEditedLessonId(null);
        }}
        lesson={useMemo(() => {
          return typeof editedLessonId === "string"
            ? events.find((event) => event.id === editedLessonId)
            : undefined;
        }, [editedLessonId])}
        students={loaderData.students}
      />
    </>
  );
}

type CalendarEntryProps = {
  lesson: Lesson;
  isMobile: boolean;
  searchParams: URLSearchParams;
  onClick: (id: string) => void;
};
function CalendarEntry({
  lesson,
  isMobile,
  searchParams,
  onClick,
}: CalendarEntryProps) {
  useEffect(() => {
    if (lesson.id === searchParams.get("l")) {
      setTimeout(() => {
        document
          .getElementById(lesson.id)
          ?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
      }, 500);
    }
  }, []);

  return (
    <div
      id={lesson.id}
      className={clsx([
        "relative flex-1 select-none overflow-hidden text-ellipsis rounded-md bg-sky-200 px-1 text-blue-900",
        {
          "drag-handle": /* activeMovableLessonId === id || */ isMobile,
        },
        {
          "border-2 border-indigo-600/70": searchParams.get("l") === lesson.id,
        },
      ])}
      dir="rtl"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(lesson.id);
        return false;
      }}
      // onMouseOver={() => setActiveMovableLessonId(id)}
      // onMouseUp={() => setActiveMovableLessonId(null)}
    >
      <span className="h-4 text-xs">
        {hasStudentFetched(lesson) ? lesson.student.fullName : null}
      </span>
    </div>
  );
}
