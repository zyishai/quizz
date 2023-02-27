import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import StudentForm from "~/components/student-form";
import { requireUserId } from "~/utils/session.server";
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
  const fields = await constructNewStudentDto(request);

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
  await requireUserId(request);

  try {
    const contacts = await getContacts(request);
    return json({ contacts });
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

export default function AddNewStudent() {
  const actionData = useActionData<typeof action>();
  const { contacts } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="overflow-auto px-2 pb-2">
        <header className="mb-4 sm:mb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            הוספת תלמיד חדש
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            מלא את פרטי התלמיד בטופס בבקשה.
          </p>
        </header>
        <StudentForm
          fields={actionData?.fields}
          fieldErrors={actionData?.fieldErrors || undefined}
          existingContacts={contacts}
          back="/students"
        />
      </div>
    </>
  );
}
