import { json } from "@remix-run/node";
import { addPaymentToStudentAccount, addStandalonePayment, addStudentToPaymentAccount, createPaymentAccount, deletePaymentAccountById, deletePaymentById, deletePaymentByIdV2, fetchPaymentAccountById, fetchPaymentAccountByStudentId, fetchPaymentAccountsByTeacherId, findStudentsWithoutAccount, makePaymentToAccount, removeStudentFromPaymentAccount, resetAccountBills, resetAccountCredits, updatePaymentDetails, updatePaymentDetailsV2 } from "~/adapters/payment.adapter"
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { CreatePaymentAccountDto, PaymentMethod } from "~/types/payment-account";
import { AppError } from "~/utils/app-error";
import { assertNumber, assertPaymentMethod, assertString, hasEventFetched } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";
import { getLesson } from "./lessons.server";
import { redirectCookie } from "~/utils/cookies.server";
import dayjs from "dayjs";
import { updateLessonDetails } from "~/adapters/lesson.adapter";
import { deleteLessonById } from "~/adapters/lesson.adapter";

export const getPaymentAccountsList = async (teacherId: string) => {
  return fetchPaymentAccountsByTeacherId(teacherId, { fetch: ['students', 'contacts', 'billings.lesson.id'] });
}

export const getPaymentAccountById = async (teacherId: string, accountId: string) => {
  const account = await fetchPaymentAccountById({ teacherId, accountId, fetch: ['students', 'contacts', 'billings.lesson.id'] });
  if (!account) {
    throw new AppError({ errType: ErrorType.AccountNotFound });
  }

  return account;
}

export const findPaymentAccountByStudentId = async (studentId: string) => {
  return fetchPaymentAccountByStudentId(studentId, { fetch: ['students', 'contacts', 'billings.lesson']});
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

type AddPaymentProps = {
  sum: number;
  method: PaymentMethod;
  studentId: string;
}
export const addPaymentToAccount = async (accountId: string, data: AddPaymentProps) => {
  return makePaymentToAccount({
    accountId,
    ...data,
  });
}

type EditTransactionProps = {
  teacherId: string;
  sum?: number;
  method?: PaymentMethod;
  studentId?: string;
}
export const editCreditPaymentDetails = async (accountId: string, transactionId: string, data: EditTransactionProps) => {
  return updatePaymentDetails({
    accountId,
    paymentId: transactionId,
    ...data
  });
}

export const deleteCreditPayment = async (accountId: string, transactionId: string) => {
  return deletePaymentById({
    accountId,
    paymentId: transactionId
  });
}

export const makePayment = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const lessonId = formData.get("lessonId")?.toString();
      const sum = Number(formData.get('sum'));
      assertNumber(sum);
      const paymentMethod = formData.get('paymentMethod');
      assertPaymentMethod(paymentMethod);
      
      if (lessonId) {
        const account = await addPaymentToStudentAccount(lessonId, { sum, paymentMethod });
        if (!account) {
          throw new AppError({ errType: ErrorType.PaymentFailed });
        }

        const lesson = await getLesson(teacher.id, lessonId);
        const redirectToCookie = await redirectCookie.getSession(
          request.headers.get("Cookie")
        );
        if (hasEventFetched(lesson)) {
          const rangeStart = dayjs(lesson.event.dateAndTime).startOf("week").toISOString();
          const rangeEnd = dayjs(lesson.event.dateAndTime).endOf("week").toISOString();
          redirectToCookie.set(
            "redirectTo",
            `/lessons/calendar?rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`
          );
        }
        return json({ account }, {
          headers: {
            "Set-Cookie": await redirectCookie.commitSession(
              redirectToCookie
            ),
          },
        });
      } else {
        const accountId = formData.get('accountId');
        assertString(accountId);
        const account = await addStandalonePayment({ accountId, sum, paymentMethod });
        if (!account) {
          throw new AppError({ errType: ErrorType.PaymentFailed });
        }
        return json({ account });
      }
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}
export const updateTransaction = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const transactionId = formData.get("transactionId");
      assertString(transactionId);
      const paymentId = formData.get('paymentId')?.toString();
      const billingId = formData.get('billingId')?.toString();
      const credit = Number(formData.get('credit'));
      assertNumber(credit);
      const debit = Number(formData.get('debit'));
      assertNumber(debit);
      const paymentMethod = formData.get('paymentMethod');
      assertPaymentMethod(paymentMethod);
      
      if (paymentId) {
        const account = await updatePaymentDetailsV2(paymentId, { sum: credit, paymentMethod });
        if (!account) {
          throw new AppError({ errType: ErrorType.PaymentUpdateFailed });
        }
      } else if (billingId) {
        const account = await addPaymentToStudentAccount(billingId, {
          paymentMethod,
          sum: credit
        });
        if (!account) {
          throw new AppError({ errType: ErrorType.AccountNotCreated });
        }
      }

      if (billingId) {
        const lesson = await updateLessonDetails({ lessonId: billingId, price: debit });
        if (!lesson) {
          throw new AppError({ errType: ErrorType.LessonUpdateFailed });
        }
      }
      
      return json({});
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};
export const deleteCredit = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const paymentId = formData.get('paymentId');
      assertString(paymentId);
      const account = await deletePaymentByIdV2(paymentId);
      if (!account) {
        throw new AppError({ errType: ErrorType.PaymentDeleteFailed });
      }

      return json({ account });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};
export const deleteDebit = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const lessonId = formData.get('lessonId');
      assertString(lessonId);
      const lesson = await deleteLessonById(lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonDeleteFailed });
      }

      return json({ lesson });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};
export const deleteTransaction = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();

      const paymentId = formData.get('paymentId');
      assertString(paymentId);
      const lessonId = formData.get('lessonId');
      assertString(lessonId);

      const account = await deletePaymentByIdV2(paymentId);
      if (!account) {
        throw new AppError({ errType: ErrorType.PaymentDeleteFailed });
      }

      const lesson = await deleteLessonById(lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonDeleteFailed });
      }

      return json({ lesson, account });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};
export const resetAccount = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const accountId = formData.get('accountId');
      assertString(accountId);

      if (!await resetAccountBills(accountId)) {
        throw new AppError({ errType: ErrorType.AccountResetFailed });
      }
      const account = await resetAccountCredits(accountId);
      if (!account) {
        throw new AppError({ errType: ErrorType.AccountResetFailed });
      }

      return json({ account });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}

export const deletePayment = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const paymentId = formData.get('paymentId');
      assertString(paymentId);
      const account = await deletePaymentByIdV2(paymentId);
      if (!account) {
        throw new AppError({ errType: ErrorType.PaymentDeleteFailed });
      }

      return json({ account });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}
