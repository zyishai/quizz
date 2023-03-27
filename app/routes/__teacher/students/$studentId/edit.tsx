import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import {
  badRequest,
  forbidden,
  safeRedirect,
  serverError,
  unauthorized,
} from "remix-utils";
import isMobile from "ismobilejs";
import StudentForm from "~/components/student-form";
import { getContacts } from "~/handlers/contacts.server";
import {
  constructUpdateStudentDto,
  getStudent,
  updateStudentDetails,
} from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { AppError, isAppError } from "~/utils/app-error";
import { getUserId, requireUserId } from "~/utils/session.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { getPaymentAccountsList } from "~/handlers/payments.server";

// function validateFullName(name?: string) {
//   if (!name) {
//     return `שם חסר`;
//   }
//   if (!validator.isLength(name, { min: 2 })) {
//     return `שם קצר מדי.`;
//   }
//   if (!validator.isAlpha(name, "he", { ignore: " " })) {
//     return `שם לא תקין. יש לציין שם באותיות עבריות בלבד`;
//   }
// }
// function validateGrade(grade?: string) {
//   if (!grade) {
//     return `כיתה לא צוינה`;
//   }
//   if (
//     !validator.isInt(grade, { min: 1, max: 12, allow_leading_zeroes: false })
//   ) {
//     return `כיתה לא תקינה`;
//   }
// }
// function validateContactList(contacts: any[]) {
//   if (contacts.length === 0) {
//     return `יש להוסיף לפחות איש קשר אחד`;
//   }
// }

export const action = async ({ request, params }: ActionArgs) => {
  const { studentId } = params;
  const fields = await constructUpdateStudentDto(request, studentId);
  console.log(fields);

  const fieldErrors = {
    fullName: undefined,
    grade: undefined,
    contacts: undefined,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  // Update student details
  const student = await updateStudentDetails(fields);
  if (!student) {
    throw new AppError({ errType: ErrorType.StudentUpdateFailed });
  }

  const userAgent = request.headers.get("user-agent");
  const { any: isMobilePhone } = isMobile(userAgent || undefined);
  return redirect(
    safeRedirect(isMobilePhone ? `/students/${studentId}` : "/students", "/")
  );
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const contacts = await getContacts(request);
      const { studentId } = params;
      const student = await getStudent(studentId);
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);
      const paymentAccounts = await getPaymentAccountsList(teacher.id);
      return json({ contacts, student, isMobilePhone, paymentAccounts });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function EditStudent() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const paymentAccountId = loaderData.paymentAccounts.find((account) =>
    account.students.some((student) => {
      return typeof student === "string"
        ? student === loaderData.student.id
        : student.id === loaderData.student.id;
    })
  )?.id;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-auto px-2 pb-2">
        <div className="flex-1 overflow-auto sm:flex-none">
          <StudentForm
            id="update-student-form"
            fields={
              actionData?.fields || {
                ...loaderData?.student,
                paymentAccountId,
              } ||
              undefined
            }
            fieldErrors={actionData?.fieldErrors || undefined}
            existingContacts={loaderData.contacts}
            existingPaymentAccounts={loaderData.paymentAccounts}
          />
        </div>

        <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
          <Link
            to={
              loaderData.isMobilePhone
                ? `/students/${loaderData.student.id}`
                : "/students"
            }
            className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
          >
            {loaderData.isMobilePhone
              ? "חזרה לפרטי תלמיד"
              : "חזרה לרשימת התלמידים"}
          </Link>
          <button
            type="submit"
            form="update-student-form"
            className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
          >
            עדכן פרטי תלמיד
          </button>
        </div>
      </div>
    </>
  );
}
