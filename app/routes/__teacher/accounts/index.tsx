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
          כרטיסיות תלמידים
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

      <main className="flex-1">
        <section className="flex flex-1 overflow-hidden">
          <ul
            role="list"
            className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {accounts
              .filter(haveStudentsFetched)
              .filter(haveContactsFetched)
              .map((account, index) => (
                <li
                  key={account.id}
                  className="col-span-1 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex w-full items-center justify-between space-x-6 px-6 py-4 rtl:space-x-reverse sm:py-6">
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <h3 className="truncate text-xl font-bold text-gray-900">
                          כרטיסיה #{index + 1}
                        </h3>
                        {/* <span className="inline-block flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        </span> */}
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {""}
                      </p>
                    </div>
                    {/* <img className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300" src={person.imageUrl} alt="" /> */}
                  </div>

                  <div className="space-x-2 bg-gray-100 px-6 py-3 rtl:space-x-reverse sm:py-4">
                    <Link
                      to={`/accounts/${account.id}`}
                      className="rounded-md bg-white py-2 px-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:text-base"
                    >
                      צפה בכרטיסיה
                    </Link>

                    <Form method="post" className="inline-block">
                      <input
                        type="hidden"
                        name="accountId"
                        value={account.id}
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-red-100 py-1 px-2.5 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-200 sm:text-base"
                        onClick={(e) => {
                          if (!confirm("למחוק את חשבון תשלום זה?")) {
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                          }
                        }}
                      >
                        מחק כרטיסיה
                      </button>
                    </Form>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </main>

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
