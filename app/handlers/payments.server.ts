import { addStudentToPaymentAccount, createPaymentAccount, deletePaymentAccountById, fetchPaymentAccountById, fetchPaymentAccountByStudentId, fetchPaymentAccountsByTeacherId, findStudentsWithoutAccount, removeStudentFromPaymentAccount } from "~/adapters/payment.adapter"
import { ErrorType } from "~/types/errors";
import { CreatePaymentAccountDto } from "~/types/payment-account";
import { AppError } from "~/utils/app-error";

export const getPaymentAccountsList = async (teacherId: string) => {
  return fetchPaymentAccountsByTeacherId(teacherId, { fetch: ['students', 'contacts'] });
}

export const getPaymentAccountById = async (teacherId: string, accountId: string) => {
  const account = await fetchPaymentAccountById({ teacherId, accountId, fetch: ['students', 'contacts'] });
  if (!account) {
    throw new AppError({ errType: ErrorType.AccountNotFound });
  }

  return account;
}

export const findPaymentAccountByStudentId = async (studentId: string) => {
  return fetchPaymentAccountByStudentId(studentId, { fetch: ['students', 'contacts']});
}

export const createNewPaymentAccount = async (dto: CreatePaymentAccountDto) => {
  return createPaymentAccount(dto);
}

export const deletePaymentAccount = async (accountId: string) => {
  return deletePaymentAccountById(accountId);
}

export const findAvailableStudents = async () => {
  return findStudentsWithoutAccount();
}

export const attachStudentToPaymentAccount = async (accountId: string, studentId: string) => {
  return addStudentToPaymentAccount({ accountId, studentId });
}

export const detachStudentFromPaymentAccount = async (studentId: string) => {
  return removeStudentFromPaymentAccount({ studentId })
}
