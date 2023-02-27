import dayjs from "dayjs";
import { DateRange } from "~/types/datetime";

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
