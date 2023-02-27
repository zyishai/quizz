import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { badRequest, forbidden, serverError, unauthorized } from "remix-utils";
import StudentForm from "~/components/student-form";
import { getContacts } from "~/handlers/contacts.server";
import {
  constructUpdateStudentDto,
  getStudent,
  updateStudentDetails,
} from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { AppError, isAppError } from "~/utils/app-error";
import { requireUserId } from "~/utils/session.server";

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

  return redirect("/students");
};

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireUserId(request);
  try {
    const contacts = await getContacts(request);
    const { studentId } = params;
    const student = await getStudent(studentId);
    return json({ contacts, student });
  } catch (error) {
    if (isAppError(error)) {
      switch (error.name) {
        case ErrorType.UserNotFound: {
          throw unauthorized({ message: "המשתמש לא מחובר" });
        }
        case ErrorType.TeacherNotFound: {
          throw forbidden({ message: "המשתמש לא רשום כמורה במערכת" });
        }
      }
    }
    throw serverError({
      message: "אירעה שגיאה בשרת. אנא נסו שנית במועד מאוחר יותר",
    });
  }
};

export default function EditStudent() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <div className="overflow-auto px-2 pb-2">
        <header className="mb-4 sm:mb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            עריכת פרטי תלמיד
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            מלא את פרטי התלמיד בטופס בבקשה.
          </p>
        </header>
        <StudentForm
          fields={actionData?.fields || loaderData?.student || undefined}
          fieldErrors={actionData?.fieldErrors || undefined}
          existingContacts={loaderData.contacts}
          back="/students"
        />
      </div>
    </>
  );
}
