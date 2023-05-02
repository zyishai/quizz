import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getUserId } from "~/utils/session.server";
import {
  deletePaymentAccount,
  getPaymentAccountsList,
} from "~/handlers/payments.server";
import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  assertString,
  haveContactsFetched,
  haveStudentsFetched,
} from "~/utils/misc";
import { safeRedirect } from "remix-utils";
import { IconFilePlus } from "~/utils/icons";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const accountId = formData.get("accountId")?.toString();
  assertString(accountId);

  if (!(await deletePaymentAccount(accountId))) {
    throw new AppError({ errType: ErrorType.PaymentAccountNotFound });
  }

  return redirect(safeRedirect("/accounts", "/"));
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const accounts = await getPaymentAccountsList(teacher.id);
      return json({ accounts });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function PaymentAccountsListPage() {
  const { accounts } = useLoaderData<typeof loader>();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between border-b border-gray-200 px-1 pt-1 pb-5">
        <h3 className="text-xl font-medium leading-none text-gray-900">
          חשבונות ותשלומים
        </h3>

        <div className="sm:mt-0 sm:ltr:ml-4 sm:rtl:mr-4">
          <Link
            to="new"
            className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:inline-flex"
          >
            צור כרטיסיה חדשה
          </Link>
        </div>
      </header>

      <section className="mb-5">{/* [TODO] apply filters */}</section>

      <main className="flex-1"></main>

      <footer className="mt-5 flex flex-col">
        <Link
          to="new"
          className="mb-2 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-2.5 py-3 font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
        >
          <IconFilePlus
            className="h-5 w-5 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
            aria-hidden="true"
          />
          <span>צור כרטיסיה חדשה</span>
        </Link>
      </footer>
    </>
  );
}
