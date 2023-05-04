import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getUserId } from "~/utils/session.server";
import {
  deletePayment,
  getPaymentAccountsList,
  updatePayment,
} from "~/handlers/payments.server";
import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  hasStudentFetched,
  haveContactsFetched,
  haveStudentsFetched,
  isCreditTransaction,
  isDebitTransaction,
} from "~/utils/misc";
import { namedAction } from "remix-utils";
import {
  BanknotesIconSolid,
  ChevronLeftIconSolid,
  IconBrandPaypal,
  IconCalendarEvent,
  IconCoins,
  IconCreditCard,
  IconCurrencyShekel,
  IconPlus,
} from "~/utils/icons";
import clsx from "clsx";
import { Fragment, useState } from "react";
import WarningAlert from "~/components/WarningAlert";
import {
  Billing,
  Payment,
  PaymentMethod,
  TransactionType,
} from "~/types/payment-account";
import dayjs from "dayjs";
import { formatPaymentMethod } from "~/utils/format";
import EditTransactionModal from "~/components/edit-transaction-modal";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    updatePayment: () => updatePayment(request),
    deletePayment: () => deletePayment(request),
  });
  // const formData = await request.formData();
  // const accountId = formData.get("accountId")?.toString();
  // assertString(accountId);

  // if (!(await deletePaymentAccount(accountId))) {
  //   throw new AppError({ errType: ErrorType.PaymentAccountNotFound });
  // }

  // return redirect(safeRedirect("/accounts", "/"));
};

export const loader = async ({ request }: LoaderArgs) => {
  if (!new URL(request.url).searchParams.has("display")) {
    return redirect("?display=all");
  }

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
  const [editedPaymentId, setEditedPaymentId] = useState<string | null>(null);

  return (
    <>
      <main
        className={clsx([
          "flex flex-1 flex-col overflow-y-auto",
          { " bg-gray-0": accounts.length > 0 },
        ])}
      >
        <section className="flex flex-wrap items-center justify-between gap-2 border-b-0 border-gray-200 px-1 pt-1 pb-2">
          <h3 className="text-xl font-semibold leading-none text-gray-900">
            כרטיסיות תשלום
          </h3>

          <div className="sm:mt-0 sm:ltr:ml-4 sm:rtl:mr-4">
            <Link
              to="new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <IconPlus className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              <span>כרטיסיה חדשה</span>
            </Link>
          </div>
        </section>

        {accounts.length > 0 ? (
          <ul role="list" className="divide-y divide-gray-100 px-4">
            {accounts
              .slice(0, 6)
              .filter(
                (account) =>
                  haveStudentsFetched(account) && haveContactsFetched(account)
              )
              .map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-start py-5"
                >
                  <div className="grid h-9 w-9 flex-none place-content-center rounded-lg bg-emerald-200 ltr:mr-3 rtl:ml-3">
                    <BanknotesIconSolid className="h-4 w-4 text-emerald-800" />
                  </div>
                  <div className="flex flex-1 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      {haveStudentsFetched(account) && (
                        <p className="text-sm font-medium leading-5 text-gray-900">
                          {account.students
                            .map((student) => student.fullName)
                            .join(", ")}
                        </p>
                      )}
                      {/* <p className="mt-1 truncate text-xs leading-5 text-gray-500">{person.email}</p> */}
                    </div>
                  </div>
                  <Link
                    to={`/accounts/${account.id}`}
                    className="flex items-center gap-x-1 text-xs font-medium text-gray-700"
                  >
                    <span>עוד</span>
                    <ChevronLeftIconSolid className="inline-block h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
          </ul>
        ) : (
          <WarningAlert title="אין כרטיסיות">
            <p>צור כרטיסיה חדשה כדי להתחיל.</p>
          </WarningAlert>
        )}

        <h2 className="mt-6 text-base font-semibold leading-6 text-gray-900">
          תנועות אחרונות בכל הכרטיסיות
        </h2>
        <div className="mt-2 flex-1 border-t border-gray-100">
          <div className="px-4">
            <div className="">
              <table className="w-full text-right">
                <thead className="sr-only">
                  <tr>
                    <th>Amount</th>
                    <th className="hidden sm:table-cell">Client</th>
                    <th>More details</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts
                    .reduce(
                      (transactions, account) => [
                        ...transactions,
                        ...account.payments,
                        ...account.billings,
                      ],
                      [] as (Payment | Billing)[]
                    )
                    .sort((txa, txb) => {
                      const dateTxa = isCreditTransaction(txa)
                        ? txa.paidAt
                        : txa.date;
                      const dateTxb = isCreditTransaction(txb)
                        ? txb.paidAt
                        : txb.date;

                      return Date.parse(dateTxa) - Date.parse(dateTxb);
                    })
                    .slice(0, 7)
                    .map((tx) => (
                      <Fragment key={tx.id}>
                        <tr className="relative flex">
                          <td className="flex-1 py-5">
                            <div className="flex gap-x-6">
                              {isCreditTransaction(tx) ? (
                                tx.method === PaymentMethod.PAYPAL ? (
                                  <IconBrandPaypal />
                                ) : tx.method === PaymentMethod.CREDIT_CARD ? (
                                  <IconCreditCard />
                                ) : tx.method === PaymentMethod.CASH ? (
                                  <IconCoins />
                                ) : (
                                  <IconCurrencyShekel />
                                )
                              ) : (
                                <IconCalendarEvent />
                              )}
                              {/* <transaction.icon
                                className="hidden h-6 w-5 flex-none text-gray-400 sm:block"
                                aria-hidden="true"
                              /> */}
                              <div className="flex-auto">
                                <div className="flex items-center gap-x-0.5 text-sm font-medium leading-6 text-gray-900">
                                  <span dir="ltr">
                                    {tx.sum > 0
                                      ? `+${tx.sum.toFixed(2)}`
                                      : tx.sum.toFixed(2)}
                                  </span>
                                  <IconCurrencyShekel className="h-5 w-auto" />
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {isCreditTransaction(tx)
                                    ? `תשלום: ${formatPaymentMethod(tx.method)}`
                                    : "שיעור"}
                                </div>
                              </div>
                            </div>
                            <div className="absolute bottom-0 right-full left-full h-px bg-gray-100" />
                            <div className="absolute -inset-x-4 bottom-0 h-px bg-gray-100" />
                          </td>
                          <td className="hidden flex-1 py-5 pr-6 sm:table-cell">
                            {tx.type === TransactionType.DEBIT &&
                            tx?.lesson &&
                            hasStudentFetched(tx.lesson) ? (
                              <>
                                <div className="text-sm leading-6 text-gray-900">
                                  {tx.lesson.student.fullName}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {dayjs(tx.date).format("DD.MM.YYYY")}
                                </div>
                              </>
                            ) : null}
                          </td>
                          <td className="flex-1 py-5 text-right">
                            {isDebitTransaction(tx) ? (
                              <div className="flex justify-end sm:justify-start">
                                <Link
                                  to={`/lessons/calendar#${tx.id}`}
                                  className="rounded-md border-0 border-sky-400 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                                >
                                  הצג שיעור
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-x-3 sm:justify-start">
                                <button
                                  type="button"
                                  className="rounded-md border-0 border-sky-400 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                                  onClick={() => setEditedPaymentId(tx.id)}
                                >
                                  ערוך תשלום
                                </button>
                                <Form method="post" className="flex flex-col">
                                  <input
                                    type="hidden"
                                    name="_action"
                                    value="deletePayment"
                                  />
                                  <input
                                    type="hidden"
                                    name="paymentId"
                                    value={tx.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-md border-0 border-red-400 bg-red-50 px-2 py-1 text-xs text-red-500 hover:bg-red-100"
                                    onClick={(e) => {
                                      if (!confirm(`למחוק את התשלום?`)) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                      }
                                    }}
                                  >
                                    מחק
                                  </button>
                                </Form>
                                <EditTransactionModal
                                  open={
                                    typeof editedPaymentId === "string" &&
                                    editedPaymentId === tx.id
                                  }
                                  onClose={() => setEditedPaymentId(null)}
                                  transaction={tx}
                                />
                              </div>
                            )}
                            {/* <div className="mt-1 text-xs leading-5 text-gray-500">
                              Invoice <span className="text-gray-900">#{transaction.invoiceNumber}</span>
                            </div> */}
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
