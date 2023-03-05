import clsx from "clsx";
import dayjs from "dayjs";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  formatTime,
  convertDateToMinutesOffset,
  convertTimeComponentsToMinutesOffset,
} from "~/utils/datetime";
import { TimeRange } from "~/types/datetime";
import { Lesson } from "~/types/lesson";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { formatDuration } from "~/utils/format";
import StudentAvatar from "./student-avatar";
import { Student } from "~/types/student";
import { Link } from "@remix-run/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface EventsCalendarProps {
  lessons: Lesson[];
  range: {
    start: number | string | Date;
    end: number | string | Date;
  };
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentDayChanged?: (date: string | Date) => void;
}

export default function EventsCalendar({
  lessons,
  range,
  onPreviousWeek,
  onNextWeek,
  onCurrentDayChanged,
}: EventsCalendarProps) {
  const timeRange = useMemo(
    () => ({
      start: { hour: 8, minute: 0 },
      end: { hour: 19, minute: 0 },
    }),
    []
  );
  const days = useMemo(
    () => getDateListFromRange(new Date(range.start), new Date(range.end)),
    [range]
  );
  const times = useMemo(() => {
    const tempTimes = [];
    for (
      let time = convertTimeComponentsToMinutesOffset(timeRange.start);
      time < convertTimeComponentsToMinutesOffset(timeRange.end);
      time += 60
    ) {
      tempTimes.push({ hour: Math.floor(time / 60), minute: time % 60 });
    }
    return tempTimes;
  }, [timeRange]);
  //   if (typeof document !== "undefined" && containerRef) {
  //     if (prevInView) {
  //       typeof onPrev === "function" && onPrev();
  //       // console.log("prev in view");

  //       // restore scroll position of the container to the middle view
  //       // containerRef.scrollLeft = -containerRef.getBoundingClientRect().width;
  //     }
  //   }
  // }, [prevInView, containerRef, prevEntry]);

  // useEffect(() => {
  //   if (typeof document !== "undefined" && containerRef) {
  //     if (nextInView) {
  //       typeof onNext === "function" && onNext();
  //       // console.log("next in view");

  //       // restore scroll position or the container to the middle view
  //       // containerRef.scrollLeft = -containerRef.getBoundingClientRect().width;
  //     }
  //   }
  // }, [nextInView, containerRef, nextEntry]);

  const daysContainer = useRef<HTMLDivElement>(null);
  const { ref: sundayRef, inView: sundayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: mondayRef, inView: mondayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: tuesdayRef, inView: tuesdayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: wednesdayRef, inView: wednesdayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: thursdayRef, inView: thursdayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: fridayRef, inView: fridayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const { ref: saturdayRef, inView: saturdayInView } = useInView({
    root: daysContainer.current,
    rootMargin: "0px",
    threshold: 0.5,
  });
  const daysRef = [
    sundayRef,
    mondayRef,
    tuesdayRef,
    wednesdayRef,
    thursdayRef,
    fridayRef,
    saturdayRef,
  ];
  const dayInView = [
    sundayInView,
    mondayInView,
    tuesdayInView,
    wednesdayInView,
    thursdayInView,
    fridayInView,
    saturdayInView,
  ];

  useEffect(() => {
    if (daysContainer.current && dayjs().isBetween(range.start, range.end)) {
      daysContainer.current.scrollLeft =
        -daysContainer.current.getBoundingClientRect().width *
        new Date().getDay();
    }
  }, [range]);

  useEffect(() => {
    if (typeof onCurrentDayChanged === "function") {
      const dayIndex = days[dayInView.findIndex(Boolean)];
      if (dayIndex) {
        onCurrentDayChanged(dayIndex);
      }
    }
  }, [dayInView, days]);

  return (
    <div className="flex flex-auto flex-col overflow-hidden border-b border-gray-200 bg-white">
      <div
        style={{ width: "100%" }}
        className="grid max-w-full flex-1 snap-x snap-mandatory scroll-p-0 auto-cols-[100%] grid-flow-col overflow-y-hidden overflow-x-scroll sm:max-w-none md:max-w-full"
      >
        <div className="bg-amber-30 snap-center snap-always overflow-y-scroll">
          {/* Header (mobile & desktop) */}
          <div
            className={clsx([
              "sticky top-0 z-30 flex-none border-t border-gray-300 bg-white shadow ring-1 ring-black ring-opacity-5",
            ])}
          >
            {/* Mobile header */}
            <div
              className="grid text-sm leading-6 text-gray-500 sm:hidden"
              style={{
                gridTemplateColumns: "auto repeat(7, minmax(0, 1fr)) auto",
              }}
            >
              <button
                type="button"
                className="border-l pr-1 pl-2"
                onClick={onPreviousWeek}
              >
                <ChevronRightIcon className="h-6 w-auto" />
              </button>
              {days.map((day, dayIndex) => (
                <button
                  type="button"
                  className="flex flex-col items-center pt-2 pb-3"
                  key={day.toISOString()}
                  onClick={(e) => {
                    daysContainer.current?.scrollTo({
                      left:
                        -daysContainer.current.getBoundingClientRect().width *
                        dayIndex,
                    });
                  }}
                >
                  {dayjs(day).format("ddd")}{" "}
                  <span
                    className={clsx([
                      "mt-1 flex h-8 w-8 items-center justify-center font-semibold",
                      {
                        "rounded-full bg-amber-500 text-white":
                          dayInView[day.getDay()],
                      },
                      { "text-gray-900": !dayInView[day.getDay()] },
                    ])}
                  >
                    {day.getDate()}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="border-r pl-1 pr-2"
                onClick={onNextWeek}
              >
                <ChevronLeftIcon className="h-6 w-auto" />
              </button>
            </div>

            {/* Desktop header */}
            <div className="hidden grid-cols-7 divide-x divide-gray-100 border-gray-100 text-sm leading-6 text-gray-500 ltr:-mr-px ltr:border-r rtl:-ml-px rtl:divide-x-reverse rtl:border-l sm:grid">
              <div className="col-end-1 flex w-14 justify-end">
                <button
                  className="bg-gray-100 pl-1 pr-1"
                  onClick={onPreviousWeek}
                >
                  <ChevronRightIcon className="h-6 w-auto" />
                </button>
              </div>
              {days.map((day) => (
                <div
                  className="flex items-center justify-center py-3"
                  key={day.toISOString()}
                >
                  <span className="flex items-baseline">
                    {dayjs(day).format("dddd")}{" "}
                    <span
                      className={clsx([
                        "flex h-8 w-8 items-center justify-center font-semibold ltr:ml-1.5 rtl:mr-1.5",
                        { "text-gray-900": !dayjs().isSame(day, "date") },
                        {
                          "rounded-full bg-amber-500 text-white":
                            dayjs().isSame(day, "date"),
                        },
                      ])}
                    >
                      {day.getDate()}
                    </span>
                  </span>
                </div>
              ))}
              <div className="col-end-9 flex w-8 justify-start">
                <button className="bg-gray-100 pr-1" onClick={onNextWeek}>
                  <ChevronLeftIcon className="h-6 w-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="relative flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div
              ref={daysContainer}
              className="grid flex-auto snap-x snap-mandatory grid-cols-[repeat(7,_100%)] grid-rows-1 overflow-x-scroll sm:grid-cols-1"
            >
              {/* Horizontal lines */}
              <div
                className="divide-gray-100, col-start-1 col-end-8 row-start-1 grid divide-y sm:col-end-2"
                style={{
                  gridTemplateRows: `repeat(${times.length * 2}, minmax(3.5rem, 1fr))`, // prettier-ignore
                }}
              >
                <div className="row-end-1 h-7"></div>
                {times.map((time) => (
                  <Fragment key={convertTimeComponentsToMinutesOffset(time)}>
                    <div>
                      <div className="absolute z-20 -mt-2.5 w-14 text-right text-xs leading-5 text-gray-400 ltr:left-0 ltr:pl-3 rtl:right-0 rtl:pr-3">
                        {time.hour.toString().padStart(2, "0")}:
                        {time.minute.toString().padStart(2, "0")}
                      </div>
                    </div>
                    <div />
                  </Fragment>
                ))}
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 row-start-1 contents grid-rows-1 divide-x divide-gray-300 rtl:divide-x-reverse sm:col-end-2 sm:grid sm:grid-cols-7 sm:divide-gray-100">
                <div
                  ref={sundayRef}
                  className="col-start-1 row-span-full snap-center snap-always"
                />
                <div
                  ref={mondayRef}
                  className="col-start-2 row-span-full snap-center snap-always"
                />
                <div
                  ref={tuesdayRef}
                  className="col-start-3 row-span-full snap-center snap-always"
                />
                <div
                  ref={wednesdayRef}
                  className="col-start-4 row-span-full snap-center snap-always"
                />
                <div
                  ref={thursdayRef}
                  className="col-start-5 row-span-full snap-center snap-always"
                />
                <div
                  ref={fridayRef}
                  className="col-start-6 row-span-full snap-center snap-always"
                />
                <div
                  ref={saturdayRef}
                  className="col-start-7 row-span-full snap-center snap-always"
                />
                <div className="col-start-8 row-span-full hidden w-8 sm:block" />
              </div>

              {/* Events */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-[repeat(7,_100%)] sm:grid-cols-7 sm:ltr:pr-8 sm:rtl:pl-8"
                style={{
                  gridTemplateRows: `1.75rem repeat(${getGridRowsFromTimeRange(timeRange)}, minmax(0, 1fr)) auto`, // prettier-ignore
                }}
              >
                {lessons
                  .filter(hasEventFetched)
                  .filter(hasStudentFetched)
                  .map((lesson) => {
                    const row =
                    Math.round((convertDateToMinutesOffset(new Date(lesson.event.dateAndTime)) - convertTimeComponentsToMinutesOffset(timeRange.start)) / 5) + 2; // prettier-ignore
                    const column =
                      days.findIndex((day) =>
                        dayjs(lesson.event.dateAndTime).isSame(day, "date")
                      ) + 1;
                    return (
                      <li
                        className="relative mt-px"
                        style={{
                          gridColumn: `${column} / span 1`,
                          gridRow: `${row} / span ${lesson.event.duration / 5}`,
                        }}
                        key={lesson.id}
                      >
                        <div className="group absolute inset-1">
                          <Link
                            to={`../${lesson.id}`}
                            className="flex h-full w-full flex-col overflow-y-auto rounded-lg bg-blue-50 p-1.5 pb-2 leading-5 hover:bg-blue-100"
                          >
                            <div className="space-x-1.5 rtl:space-x-reverse">
                              <p className="inline-block text-xs font-light text-gray-600">
                                <time dateTime={lesson.event.dateAndTime}>
                                  {formatTime(lesson.event.dateAndTime)}
                                </time>
                              </p>
                              <span>&bull;</span>
                              <p className="inline-block text-xs font-light text-gray-600">
                                {formatDuration(lesson.event.duration)}
                              </p>
                            </div>

                            <p className="flex-1 text-gray-800">
                              {lesson.topic}
                            </p>

                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <StudentAvatar
                                fullName={(lesson.student as Student).fullName}
                                size={16}
                                radius={999}
                                border={{
                                  size: 1,
                                  color: "darkgray",
                                }}
                              />
                              <span className="text-xs text-gray-600">
                                {(lesson.student as Student).fullName}
                              </span>
                            </div>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGridRowsFromTimeRange(range: TimeRange) {
  const startMins = convertTimeComponentsToMinutesOffset(range.start);
  const endMins = convertTimeComponentsToMinutesOffset(range.end);

  return (endMins - startMins) / 5;
}

function getDateListFromRange(from: Date, to: Date) {
  const list = [];
  for (let day = dayjs(from); day <= dayjs(to); day = day.add(1, "day")) {
    list.push(day.toDate());
  }
  return list;
}
