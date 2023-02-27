import dayjs from "dayjs";
import { DateRange, OffsetUnit, TimeComponents } from "~/types/datetime";

// ----- Manipulate datetime -----

export function offsetDateBy(date: number | string | Date, offset: number, unit: OffsetUnit): string {
  return dayjs(date).add(offset, unit).toISOString();
}
export function offsetRangeBy(range: DateRange, offset: number, unit: OffsetUnit): DateRange {
  return { start: offsetDateBy(range.start, offset, unit), end: offsetDateBy(range.end, offset, unit) };
}

// ----- Format datetime -----

export function formatDate(date: number | string | Date) {
  return dayjs(date).format("DD.MM.YYYY");
}
export function formatTime(date: number | string | Date) {
  return dayjs(date).format('HH:mm');
}

// ----- Convert datetime representations -----

export function convertTimeComponentsToMinutesOffset(timeComonents: TimeComponents) {
  return timeComonents.hour * 60 + timeComonents.minute;
}
export function convertDateToMinutesOffset(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}
