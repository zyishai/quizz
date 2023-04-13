import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import {
  IconCalendarPlus,
  IconCalendarTime,
  ChevronLeftIconSolid,
  ChevronRightIconSolid,
} from "~/utils/icons";
import dayjs from "dayjs";
import { namedAction, safeRedirect } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { findLessonsInRange } from "~/handlers/lessons.server";
import { OffsetUnit } from "~/types/datetime";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getRange } from "~/utils/calendar";
import { setLastLessonsView } from "~/utils/client-prefs.server";
import { offsetRangeBy } from "~/utils/datetime";
import { hasEventFetched } from "~/utils/misc";
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
  return redirect(safeRedirect("/lessons/calendar", "/"));
  // const userId = await getUserId(request);
  // if (userId) {
  //   const teacher = await getTeacherByUserId(userId);
  //   if (teacher) {
  //     const range = await getRange(request);
  //     const events = await findLessonsInRange(teacher.id, range);

  //     return json(
  //       {
  //         events,
  //         range,
  //       },
  //       {
  //         headers: {
  //           "Set-Cookie": await setLastLessonsView(request, "list"),
  //         },
  //       }
  //     );
  //   } else {
  //     throw new AppError({ errType: ErrorType.TeacherNotFound });
  //   }
  // } else {
  //   throw new AppError({ errType: ErrorType.UserNotFound });
  // }
};

export default function LessonsListView() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const events = actionData?.events || loaderData.events;
  const range = actionData?.range || loaderData.range;

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

      <header className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
        <div className="-mt-2 flex flex-wrap items-center ltr:-ml-4 rtl:-mr-4 sm:flex-nowrap">
          <div className="mt-2 ltr:ml-4 rtl:mr-4">
            <h3 className="text-lg font-medium leading-6 text-gray-700 sm:text-xl">
              שיעורים מתאריך{" "}
              <span className="font-semibold text-gray-800">
                {dayjs(range.start).format("DD.MM.YYYY")}
              </span>{" "}
              עד{" "}
              <span className="font-semibold text-gray-800">
                {dayjs(range.end).format("DD.MM.YYYY")}
              </span>
            </h3>
          </div>
          <div className="mt-2 ltr:ml-auto rtl:mr-auto">
            <span className="isolate hidden rounded-md shadow-sm sm:inline-flex">
              <button
                type="submit"
                form="prevWeek"
                className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
              >
                <span className="sr-only">עבור לשבוע שעבר</span>
                <ChevronRightIconSolid className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="submit"
                form="currentWeek"
                className="relative -ml-px inline-flex items-center bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
              >
                עבור להיום
              </button>
              <button
                type="submit"
                form="nextWeek"
                className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
              >
                <span className="sr-only">עבור לשבוע הבא</span>
                <ChevronLeftIconSolid className="h-5 w-5" aria-hidden="true" />
              </button>
            </span>
          </div>
          <div className="mt-2 flex-shrink-0 ltr:ml-4 rtl:mr-4">
            <Link
              to="/lessons/new"
              className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ltr:mr-2 rtl:ml-2 sm:inline-flex"
            >
              <IconCalendarPlus
                className="h-4 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
                aria-hidden="true"
              />
              יצירת שיעור חדש
            </Link>
          </div>
        </div>
      </header>

      <section className="flex flex-1 overflow-hidden">
        <ul
          role="list"
          className="flex-1 divide-y divide-gray-200 overflow-auto"
        >
          {events.filter(hasEventFetched).map((lesson) => (
            <li key={lesson.id}>
              <Link
                to={`/lessons/${lesson.id}`}
                className="block hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-amber-300"
              >
                <div className="flex items-center px-4 py-4 sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <p className="truncate font-medium text-indigo-600">
                        {lesson.topic || "ללא נושא"}
                      </p>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm">
                          <IconCalendarTime
                            className="h-5 w-5 flex-shrink-0 text-gray-700 ltr:mr-1.5 rtl:ml-1.5"
                            aria-hidden="true"
                          />
                          <p className="flex-shrink-0 font-medium text-gray-700 ltr:mr-1.5 rtl:ml-1.5">
                            {dayjs(lesson.event.dateAndTime).format(
                              "DD.MM.YYYY,"
                            )}
                          </p>
                          <p className="text-gray-500">
                            <time dateTime={lesson.event.dateAndTime}>
                              {dayjs(lesson.event.dateAndTime).format("HH:mm")}
                            </time>
                            <span className="mx-1">&#x2010;</span>
                            <time
                              dateTime={dayjs(lesson.event.dateAndTime)
                                .add(lesson.event.duration, "minutes")
                                .toISOString()}
                            >
                              {dayjs(lesson.event.dateAndTime)
                                .add(lesson.event.duration, "minutes")
                                .format("HH:mm")}
                            </time>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ltr:ml-5 sm:rtl:mr-5">
                      {/* <div className="flex -space-x-1 overflow-hidden">
                        {position.applicants.map((applicant) => (
                          <img
                            key={applicant.email}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                            src={applicant.imageUrl}
                            alt={applicant.name}
                          />
                        ))}
                      </div> */}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ltr:ml-5 rtl:mr-5">
                    <ChevronLeftIconSolid
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="m-1 mt-3 flex flex-col sm:hidden">
        <span className="flex rounded-md shadow-sm">
          <button
            type="submit"
            form="prevWeek"
            className="relative -ml-px inline-flex flex-1 items-center justify-center rounded-r-md bg-white px-3 py-3 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
          >
            <span className="sr-only">עבור לשבוע שעבר</span>
            <ChevronRightIconSolid className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="submit"
            form="currentWeek"
            className="relative -ml-px inline-flex flex-[2] items-center justify-center bg-white px-3 py-3 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
          >
            עבור להיום
          </button>
          <button
            type="submit"
            form="nextWeek"
            className="relative inline-flex flex-1 items-center justify-center rounded-l-md bg-white px-3 py-3 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
          >
            <span className="sr-only">עבור לשבוע הבא</span>
            <ChevronLeftIconSolid className="h-5 w-5" aria-hidden="true" />
          </button>
        </span>
        <Link
          to="/lessons/new"
          className="mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <IconCalendarPlus
            className="h-6 w-auto ltr:-ml-1 ltr:mr-3 rtl:-mr-1 rtl:ml-3"
            aria-hidden="true"
          />
          יצירת שיעור חדש
        </Link>
      </div>
    </>
  );
}
