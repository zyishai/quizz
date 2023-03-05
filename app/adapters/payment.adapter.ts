import { Result } from "surrealdb.js";
import { PaymentMethod } from "~/types/payment";
import { PaymentAccount, TransactionType } from "~/types/payment-account";
import { getDatabaseInstance } from "./db.adapter";

type CreatePaymentAccountDto = {
  students: string[];
  contacts: string[];
  teacherId: string;
}
export async function createPaymentAccount(dto: CreatePaymentAccountDto): Promise<PaymentAccount | null> {
  const { students, contacts, teacherId } = dto;
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>(`create paymentAccount content {
    balance: <future>{ math::sum(payments.sum) - math::sum((select price from lesson where $parent.students contains student)) },
    transactions: <future>{ array::sort::asc(
      array::concat(
        payments,
        (select {type: 'DEBIT', id: id, sum: 0 - price, date: event.dateAndTime} from lesson where $parent.students contains student)
      )
    ) },
    payments: [],
    students: $students,
    contacts: $contacts,
    teacher: $teacherId,
    createdAt: time::now()
  }`, { students, contacts, teacherId });
  if (account.error) {
    throw account.error;
  }

  return account.result.length > 0 ? account.result[0] : null;
}

type FetchPaymentAccountProps = {
  teacherId: string;
  accountId: string;
  fetch?: ('students' | 'contacts' | 'teacher' | 'payments.student' | 'payments.contact')[];
}
export async function fetchPaymentAccountById({ teacherId, accountId, fetch }: FetchPaymentAccountProps): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();
  let query = 'select * from $accountId where teacher == $teacherId';
  if (fetch) {
    query += ` fetch ${fetch.join(', ')}`;
  }
  const [account] = await db.query<Result<PaymentAccount[]>[]>(query, { accountId, teacherId });
  if (account.error) {
    throw account.error;
  }
  return account.result.length > 0 ? account.result[0] : null;
}

type FetchPaymentAccountsProps = {
  fetch: ('students' | 'contacts' | 'teacher' | 'payments.student' | 'payments.contact')[];
}
export async function fetchPaymentAccountsByTeacherId(teacherId: string, props?: FetchPaymentAccountsProps): Promise<PaymentAccount[]> {
  const db = await getDatabaseInstance();

  let query = 'select * from paymentAccount where teacher == $teacherId';
  if (props?.fetch) {
    query += ` fetch ${props.fetch.join(', ')}`;
  };
  const [accounts] = await db.query<Result<PaymentAccount[]>[]>(query, { teacherId });
  if (accounts.error) {
    throw accounts.error;
  }

  return accounts.result;
}

type AddStudentToAccountProps = {
  accountId: string;
  studentId: string;
  contactIds?: string[];
}
export async function addStudentToPaymentAccount({ accountId, studentId, contactIds = [] }: AddStudentToAccountProps): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>('update $accountId set students += $studentId, contacts += $contactIds', { accountId, studentId, contactIds });
  if (account.error) {
    throw account.error;
  }

  return account.result.length > 0 ? account.result[0] : null;
}

type MakePaymentDto = {
  accountId: string;
  sum: number;
  paymentMethod?: PaymentMethod;
  studentId: string;
  contactId: string;
}
export async function makePaymentToAccount(dto: MakePaymentDto): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>(`update $accountId set payments += {
    id: rand::uuid(),
    type: $creditType,
    sum: $sum,
    method: $paymentMethod,
    student: $studentId;
    contact: $contactId;
    paidAt: time::now()
  }`, { creditType: TransactionType.CREDIT, sum: dto.sum, paymentMethod: dto.paymentMethod, studentId: dto.studentId, contactId: dto.contactId });
  if (account.error) {
    throw account.error;
  }

  return account.result.length > 0 ? account.result[0] : null;
}

type UpdatePaymentProps = {
  teacherId: string;
  accountId: string;
  paymentId: string;
  sum?: number;
  method?: PaymentMethod;
  studentId?: string;
  contactId?: string;
}
export async function updatePaymentDetails(props: UpdatePaymentProps): Promise<PaymentAccount | null> {
  const { teacherId, accountId, paymentId, sum, method, studentId, contactId } = props;

  const db = await getDatabaseInstance();

  const account = await fetchPaymentAccountById({ teacherId, accountId });
  if (!account) {
    return null;
  }

  const payment = account.payments.find((p) => p.id === paymentId);
  if (!payment) {
    return null;
  }
  if (sum) {
    payment.sum = sum;
  }
  if (method) {
    payment.method = method;
  }
  if (studentId) {
    payment.student = studentId;
  }
  if (contactId) {
    payment.contact = contactId;
  }
  const [updatedAccount] = await db.query<Result<PaymentAccount[]>[]>(`update $accountId set payments[where id = $paymentid] = $payment`, { accountId, paymentId, payment });
  if (updatedAccount.error) {
    throw updatedAccount.error;
  }

  return updatedAccount.result.length > 0 ? updatedAccount.result[0] : null;
}

type DeletePaymentProps = {
  accountId: string;
  paymentId: string;
}
export async function deletePaymentById(props: DeletePaymentProps): Promise<PaymentAccount | null> {
  const { accountId, paymentId } = props;
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>('update $accountId set payments -= payments[where id = $paymentId]', { accountId, paymentId });
  if (account.error) {
    throw account.error;
  }

  return account.result.length > 0 ? account.result[0] : null;
}

export async function deletePaymentAccountById(accountId: string): Promise<boolean> {
  const db = await getDatabaseInstance();

  await db.delete(accountId);

  return true;
}
