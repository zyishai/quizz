import { Result } from "surrealdb.js";
import { PaymentMethod } from "~/types/payment";
import { CreatePaymentAccountDto, PaymentAccount, TransactionType } from "~/types/payment-account";
import { Student } from "~/types/student";
import { getDatabaseInstance } from "./db.adapter";
import { findStudentById } from "./student.adapter";

export async function createPaymentAccount(dto: CreatePaymentAccountDto): Promise<PaymentAccount | null> {
  const { students, contacts, teacherId } = dto;
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>(`create paymentAccount content {
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
  fetch?: ('students' | 'contacts' | 'teacher' | 'payments.student' | 'payments.contact' | 'billings.lesson' | 'billings.lesson.student')[];
}
export async function fetchPaymentAccountById({ teacherId, accountId, fetch }: FetchPaymentAccountProps): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();
  let query = 'select *, (select {type: "DEBIT", id: id, lesson: id, sum: 0 - price, date: event.dateAndTime} from lesson where $parent.students contains student) as billings from $accountId where teacher == $teacherId';
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
  fetch: ('students' | 'contacts' | 'teacher' | 'payments.student' | 'payments.contact' | 'billings.lesson' | 'billings.lesson.student')[];
}
export async function fetchPaymentAccountsByTeacherId(teacherId: string, props?: FetchPaymentAccountsProps): Promise<PaymentAccount[]> {
  const db = await getDatabaseInstance();

  let query = 'select *, (select {type: "DEBIT", id: id, lesson: id, sum: 0 - price, date: event.dateAndTime} from lesson where $parent.students contains student) as billings from paymentAccount where teacher == $teacherId';
  if (props?.fetch) {
    query += ` fetch ${props.fetch.join(', ')}`;
  };
  const [accounts] = await db.query<Result<PaymentAccount[]>[]>(query, { teacherId });
  if (accounts.error) {
    throw accounts.error;
  }

  return accounts.result;
}

export async function fetchPaymentAccountByStudentId(studentId: string, props?: FetchPaymentAccountsProps): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  let query = 'select *, (select {type: "DEBIT", id: id, lesson: id, sum: 0 - price, date: event.dateAndTime} from lesson where $parent.students contains student) as billings from paymentAccount where students contains $studentId';
  if (props?.fetch) {
    query += ` fetch ${props.fetch.join(', ')}`;
  };
  const [account] = await db.query<Result<PaymentAccount[]>[]>(query, { studentId });
  if (account.error) {
    throw account.error;
  }

  return account.result[0];
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

type MoveStudentToAccountProps = {
  teacherId: string;
  studentId: string;
  accountId?: string;
}
export async function moveStudentToPaymentAccount({ teacherId, studentId, accountId }: MoveStudentToAccountProps): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  const existingAccount = await fetchPaymentAccountByStudentId(studentId);
  if (existingAccount) {
    const [updatedAccount] = await db.query<Result<PaymentAccount[]>[]>('update $accountId set students -= $studentId', { accountId: existingAccount.id, studentId });
    if (updatedAccount.error) {
      throw updatedAccount.error;
    }
    if (updatedAccount.result[0].students.length === 0) {
      if (!await deletePaymentAccountById(updatedAccount.result[0].id)) {
        return null;
      }
    }
  }

  if (accountId) {
    const [account] = await db.query<Result<PaymentAccount[]>[]>('update $accountId set students += $studentId', { accountId, studentId });
    if (account.error) {
      throw account.error;
    }
    return account.result[0];
  } else {
    const student = await findStudentById(studentId);
    if (!student) {
      return null;
    }
    const paymentAccount = await createPaymentAccount({ teacherId, students: [studentId], contacts: student.contacts as unknown as string[] })
    return paymentAccount;
  }
}

type RemoveStudentFromAccountProps = {
  studentId: string;
}
export async function removeStudentFromPaymentAccount({ studentId }: RemoveStudentFromAccountProps): Promise<boolean> {
  const account = await fetchPaymentAccountByStudentId(studentId);
  if (!account) {
    return true;
  }

  const db = await getDatabaseInstance();
  const [result] = await db.query('update $accountId set students -= $studentId', { accountId: account.id, studentId });
  if (result.error) {
    throw result.error;
  }

  return true;
}

type MakePaymentDto = {
  accountId: string;
  sum: number;
  paymentMethod?: PaymentMethod;
  studentId: string;
  contactId?: string;
}
export async function makePaymentToAccount(dto: MakePaymentDto): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  const [account] = await db.query<Result<PaymentAccount[]>[]>(`update $accountId set payments += {
    id: rand::uuid(),
    type: $creditType,
    sum: $sum,
    method: $paymentMethod,
    student: $studentId,
    paidAt: time::now()
  }`, { accountId: dto.accountId, creditType: TransactionType.CREDIT, sum: dto.sum, paymentMethod: dto.paymentMethod, studentId: dto.studentId });
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
  const [updatedAccount] = await db.query<Result<PaymentAccount[]>[]>(`update $accountId set payments[where id = $paymentId] = $payment`, { accountId, paymentId, payment });
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

export async function findStudentsWithoutAccount(): Promise<Student[]> {
  const db = await getDatabaseInstance();

  const [students] = await db.query<Result<Student[]>[]>('select * from student where (select id from paymentAccount where students contains $parent.id) = []');
  if (students.error) {
    throw students.error;
  }

  return students.result;
}

type AddPaymentToStudentAccountProps = {
  sum: number;
  paymentMethod: PaymentMethod;
}
export async function addPaymentToStudentAccount(lessonId: string, props: AddPaymentToStudentAccountProps): Promise<PaymentAccount | null> {
  const { sum, paymentMethod } = props;
  const db = await getDatabaseInstance();
  const [account] = await db.query<Result<PaymentAccount[]>[]>(`update paymentAccount set payments += {
    id: rand::uuid(),
    type: $creditType,
    sum: $sum,
    method: $paymentMethod,
    student: $lessonId.student,
    lesson: $lessonId,
    paidAt: time::now()
  } where students contains $lessonId.student`, { lessonId, creditType: TransactionType.CREDIT, sum, paymentMethod });

  if (account.error) {
    throw account.error;
  }

  return account.result.length > 0 ? account.result[0] : null;
}

type UpdatePaymentV2Props = {
  sum: number;
  paymentMethod: PaymentMethod;
}
export async function updatePaymentDetailsV2(paymentId: string, props: UpdatePaymentV2Props): Promise<PaymentAccount | null> {
  const { sum, paymentMethod } = props;
  const db = await getDatabaseInstance();

  const [accounts] = await db.query<Result<PaymentAccount[]>[]>('select * from paymentAccount where payments.id contains $paymentId', { paymentId });
  if (accounts.error) {
    throw accounts.error;
  }

  if (accounts.result.length > 0) {
    const account = accounts.result[0];
    const payment = account.payments.find((p) => p.id === paymentId);
    if (!payment) {
      return null;
    }
    if (typeof sum === 'number') {
      payment.sum = sum;
    }
    if (paymentMethod) {
      payment.method = paymentMethod;
    }

    const [results] = await db.query<Result<PaymentAccount[]>[]>('update $accountId set payments[where id == $paymentId] = $payment', { accountId: account.id, paymentId, payment });
    if (results.error) {
      throw results.error;
    }

    return results.result.length > 0 ? results.result[0] : null;
  }

  return null;
}

export async function deletePaymentByIdV2(paymentId: string): Promise<PaymentAccount | null> {
  const db = await getDatabaseInstance();

  const [accounts] = await db.query<Result<PaymentAccount[]>[]>('update paymentAccount set payments -= payments[where id == $paymentId] where payments.id contains $paymentId', { paymentId });
  if (accounts.error) {
    throw accounts.error;
  }

  return accounts.result.length > 0 ? accounts.result[0] : null;
}
