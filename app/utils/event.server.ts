import dayjs from "dayjs";
import { Result } from "surrealdb.js";
import { ScheduledEvent } from "~/types/event";
import { DateRange } from "./datetime";
import { getDatabaseInstance } from "./db.server";
import { logout } from "./session.server";
import { getTeacher } from "./teacher.server";

type FetchRequestRange = {
  start: number | string | Date;
  end: number | string | Date;
};

export async function fetchScheduledEvents(
  request: Request,
  range?: FetchRequestRange
): Promise<ScheduledEvent[]> {
  const db = await getDatabaseInstance();
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw await logout(request);
  }

  // Take range into consideration
  const query = range
    ? "select ->schedule->event[where <datetime>$startDate <= dateAndTime and dateAndTime <= <datetime>$endDate] as events from teacher where id = $teacherId fetch events"
    : "select ->schedule->event as events from teacher where id = $teacherId fetch events";
  const [events] = await db.query<Result<{ events: ScheduledEvent[] }[]>[]>(
    query,
    {
      teacherId: teacher.id,
      startDate: range ? new Date(range?.start) : undefined,
      endDate: range ? new Date(range?.end) : undefined,
    }
  );

  if (events.error) {
    console.error(`Operation fetchScheduledEvents failed: ${events.error}`);
    return [];
  }

  return events.result[0].events;
}

export const getRange = async (request: Request): Promise<DateRange> => {
  const searchParams = new URL(request.url).searchParams;
  const formData = await request.formData().catch(() => new FormData());
  let rangeStart = formData.get("rangeStart") || searchParams.get("rangeStart");
  if (!rangeStart || typeof rangeStart !== "string") {
    console.warn(
      "rangeStart not included in the request. Default to current week"
    );
    rangeStart = dayjs().startOf("week").toISOString();
  }
  let rangeEnd = formData.get("rangeEnd") || searchParams.get("rangeEnd");
  if (!rangeEnd || typeof rangeEnd !== "string") {
    console.warn(
      "rangeEnd not included in the request. Default to current week"
    );
    rangeEnd = dayjs().endOf("week").toISOString();
  }

  return { start: rangeStart, end: rangeEnd };
};
