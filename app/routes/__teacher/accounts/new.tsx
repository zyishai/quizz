import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import PaymentAccountForm from "~/components/payment-account-form";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getUserId } from "~/utils/session.server";
import { findAvailableStudents } from "~/handlers/payments.server";

export const action = async ({ request }: ActionArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      console.log(Array.from(formData));
      return json({ fields: {}, fieldErrors: {} });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const students = await findAvailableStudents();
      return json({ students });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function NewPaymentAccount() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-1 flex-col px-2 pb-2">
      <div className="flex-1 p-1 sm:flex-initial">
        <PaymentAccountForm
          id="new-account-form"
          fields={actionData?.fields}
          fieldErrors={actionData?.fieldErrors || undefined}
          students={loaderData.students}
        />
      </div>

      <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
        <Link
          to="/accounts"
          className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
        >
          חזרה לכרטיסיות
        </Link>
        <button
          type="submit"
          form="new-account-form"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          צור כרטיסיה
        </button>
      </div>
    </div>
  );
}
