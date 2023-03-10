import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import StudentForm from "~/components/student-form";
import { getUserId, requireUserId } from "~/utils/session.server";
import { getContacts } from "~/handlers/contacts.server";
import { AppError, isAppError } from "~/utils/app-error";
import {
  created,
  forbidden,
  serverError,
  unauthorized,
  badRequest,
} from "remix-utils";
import { ErrorType } from "~/types/errors";
import {
  constructNewStudentDto,
  createNewStudent,
} from "~/handlers/students.server";
import { getPaymentAccountsList } from "~/handlers/payments.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";

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

export const action = async ({ request }: ActionArgs) => {
  const fields = await constructNewStudentDto(request.clone());

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

  // Create student
  const student = await createNewStudent(fields);
  if (!student) {
    throw new AppError({ errType: ErrorType.StudentNotCreated });
  }

  return redirect("/students");
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const contacts = await getContacts(request);
      const paymentAccounts = await getPaymentAccountsList(teacher.id);
      return json({ contacts, paymentAccounts });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function AddNewStudent() {
  const actionData = useActionData<typeof action>();
  const { contacts, paymentAccounts } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="flex flex-1 flex-col overflow-auto px-2 pb-2">
        <div className="flex-1 overflow-auto sm:flex-none">
          <StudentForm
            id="new-student-form"
            fields={actionData?.fields}
            fieldErrors={actionData?.fieldErrors || undefined}
            existingContacts={contacts}
            existingPaymentAccounts={paymentAccounts}
          />
        </div>

        <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
          <Link
            to="/students"
            className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
          >
            חזרה לרשימת תלמידים
          </Link>
          <button
            type="submit"
            form="new-student-form"
            className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
          >
            הוסף תלמיד
          </button>
        </div>
      </div>
    </>
  );
}
