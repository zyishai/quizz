import { DateRange } from "~/types/datetime";
import { Lesson } from "~/types/lesson";
import { Event } from "~/types/event";
import { Replace } from "~/types/misc";
import { Contact, CreateContactDto, Grade, Student } from "~/types/student";
import { validator } from '~/utils/validator.server';
import { CreditTransaction, DebitTransaction, PaymentAccount, PaymentMethod, Transaction, TransactionType } from "~/types/payment-account";
import { paymentMethods } from "./payment-methods";

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
export function assertPaymentMethod(value: unknown): asserts value is PaymentMethod {
  if (typeof value !== 'string') {
    throw new Error(`${value} is not a PaymentMethod string`);
  }
  if (!paymentMethods.some((method) => method.value === value)) {
    throw new Error(`${value} is not PaymentMethod type`);
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
export function assertCreateContactDtoType(value: unknown): asserts value is CreateContactDto {
  if (!value || typeof value !== 'object') {
    throw new Error(`${value} is not a CreateContactDto type`);
  }

  if (!('type' in value) || typeof value.type !== 'string') {
    throw new Error(`${value} is not a CreateContactDto type`);
  }

  if (!['new', 'existing'].includes(value.type)) {
    throw new Error(`${value} is not a CreateContactDto type`);
  }

  if (value.type === 'existing' && !('id' in value)) {
    throw new Error(`${value} is not a CreateContactDto type`);
  }

  if (value.type === 'new' && !('fullName' in value)) {
    throw new Error(`${value} is not a CreateContactDto type`);
  }
}
export function assertPaymentAccountType(value: unknown): asserts value is 'new'|'existing'|'absent' {
  if (typeof value !== 'string') {
    throw new Error(`${value} is not a string. Expected 'new', 'existing' or 'absent'.`);
  }

  if (!['new', 'existing', 'absent'].includes(value)) {
    throw new Error(`Expected 'new', 'existing' or 'absent'. Got: ${value}`);
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
  if (!value.event || typeof value.event === 'string') {
    return false;
  }
  
  return true;
}
export function hasStudentFetched(value: Lesson): value is Replace<typeof value, 'student', Student> {
  if (!value.student || typeof value.student === 'string') {
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
export function haveStudentsFetched(value: PaymentAccount): value is Replace<typeof value, 'students', Student[]> {
  for (let student of value.students) {
    if (typeof student === 'string') {
      return false;
    }
  }

  return true;
}
export function haveContactsFetched(value: PaymentAccount): value is Replace<typeof value, 'contacts', Contact[]> {
  for (let contact of value.contacts) {
    if (typeof contact === 'string') {
      return false;
    }
  }

  return true;
}
export function isCreditTransaction(value: Transaction): value is CreditTransaction {
  return value.type === TransactionType.CREDIT;
}
export function isDebitTransaction(value: Transaction): value is DebitTransaction {
  return value.type === TransactionType.DEBIT;
}

export const throttleEventBy = <T extends (...args: any[]) => any>(handler: T, timeInMilliseconds: number) => {
  let lastRun = 0;
  return (...args: Parameters<T>) => {
    if (Date.now() - lastRun >= timeInMilliseconds) {
      lastRun = Date.now();
      return handler(...args);
    }
  }
}

type ID = string & { __brand: 'id' };
export function isID(value: string): asserts value is ID {
  if (value.startsWith('temp')) {
    throw new Error(`${value} is not a valid id.`);
  }
}
