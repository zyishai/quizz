import { Lesson } from "./lesson";
import { DateTimeString, EntityBase } from "./misc";
import { Contact, Student } from "./student";
import { Teacher } from "./teacher";

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BIT = 'BIT',
  PAYPAL = 'PAYPAL'
}

export type Payment = {
  id: string;
  type: TransactionType.CREDIT,
  sum: number;
  method: PaymentMethod;
  student: string | Student;
  contact: string | Contact;
  paidAt: DateTimeString;
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export type CreditTransaction = {
  id: string;
  type: TransactionType.CREDIT;
  sum: number;
  method: PaymentMethod;
  lesson?: Lesson | null | undefined;
  student: string;
  paidAt: DateTimeString;
};
export type DebitTransaction = {
  id: string;
  type: TransactionType.DEBIT;
  lesson?: Lesson | null | undefined;
  sum: number;
  date: DateTimeString;
};

export type Transaction = CreditTransaction | DebitTransaction;

export type PaymentAccount = EntityBase & {
  balance: number;
  transactions: readonly Transaction[];
  payments: Payment[];
  students: string[] | Student[];
  contacts: string[] | Contact[];
  teacher: string | Teacher;
}

export type CreatePaymentAccountDto = {
  students: string[];
  contacts: string[];
  teacherId: string;
}
