import { DateRange } from "~/types/datetime";
import { Lesson } from "~/types/lesson";
import { Event } from "~/types/event";
import { Replace } from "~/types/misc";
import { Contact, Grade, Student } from "~/types/student";
import { validator } from '~/utils/validator.server';

export function truthy<T>(value: T | null | undefined): value is T {
  return !!value;
}
export function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${value} is not a string.`);
  }
}
export function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${value} is not a valid number.`);
  }
}
export function assertGrade(value: number): asserts value is Grade {
  if (isNaN(value) || !validator.isInt(value.toString(), { min: 1, max: 12, allow_leading_zeroes: false })) {
    throw new Error(`${value} is not a valid grade. Grade should be a number between 1 and 12.`);
  }
}
export function assertContactDtoType(value: unknown): asserts value is 'new'|'existing' {
  if (typeof value !== 'string') {
    throw new Error(`${value} is not a string. Expected 'new' or 'existing'.`);
  }

  if (!['new', 'existing'].includes(value)) {
    throw new Error(`Expected 'new' or 'existing'. Got: ${value}.`);
  }
}
type ValidRangeOptions = {
  minLength: number;
  maxLength: number;
}
export function assertValidRange(value: DateRange, options?: ValidRangeOptions): void {
  if (isNaN(Date.parse(value.start))) {
    throw new Error(`Invalid start range: ${value.start}`);
  }
  if (isNaN(Date.parse(value.end))) {
    throw new Error(`Invalid end range: ${value.end}`);
  }
  if (new Date(value.start) > new Date(value.end)) {
    throw new Error(`Invalid range. 'end' must be equals or after 'start' date.`);
  }
}
export function hasEventFetched(value: Lesson): value is Replace<typeof value, 'event', Event> {
  if (typeof value.event === 'string') {
    return false;
  }
  
  return true;
}
export function hasStudentFetched(value: Lesson): value is Replace<typeof value, 'student', Student> {
  if (typeof value.student === 'string') {
    return false;
  }

  return true;
}
export function hasContactFetched(value: Contact | string): value is Contact {
  if (typeof value === 'string') {
    return false;
  }

  return true;
}

type ID = string & { __brand: 'id' };
export function isID(value: string): asserts value is ID {
  if (value.startsWith('temp')) {
    throw new Error(`${value} is not a valid id.`);
  }
}
