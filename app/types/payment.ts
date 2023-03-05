import { DateTimeString } from "./misc";

export enum PaymentStatus {
  DEBIT = 'DEBIT',
  DIRECT = 'DIRECT',
  CREDIT = 'CREDIT'
}
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BIT = 'BIT',
  PAYPAL = 'PAYPAL'
}
export type Credit = {
  id: string;
  sum: number;
  remaining: number;
  paymentMethod: PaymentMethod;
  paidAt: DateTimeString;
}
export type DirectPayment = {
  sum: number;
  paymentMethod: PaymentMethod;
  paidAt: DateTimeString;
};
export type CreditPayment = {
  sum: number;
  creditId: string;
  paidAt: DateTimeString;
};
export type Payment = DirectPayment | CreditPayment;
