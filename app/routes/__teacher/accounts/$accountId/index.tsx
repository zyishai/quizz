import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData, useLocation } from "@remix-run/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import {
  addPaymentToAccount,
  deleteCreditPayment,
  editCreditPaymentDetails,
  getPaymentAccountById,
} from "~/handlers/payments.server";
import { ErrorType } from "~/types/errors";
import {
  PaymentAccount,
  PaymentMethod,
  Transaction,
} from "~/types/payment-account";
import { AppError } from "~/utils/app-error";
import { formatPaymentMethod } from "~/utils/format";
import {
  ArrowRightIconSolid,
  BanknotesIconSolid,
  IconBrandPaypal,
  IconCalendarEvent,
  IconCoins,
  IconCreditCard,
  IconCurrencyShekel,
} from "~/utils/icons";
import { assertNumber, assertPaymentMethod, assertString } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionArgs) => {
  return namedAction(request, {
    async makePayment() {
      const formData = await request.formData();

      const accountId = formData.get("accountId")?.toString();
      assertString(accountId);
      const sum = Number(formData.get("sum"));
      assertNumber(sum);
      const method = formData.get("method")?.toString();
      assertPaymentMethod(method);
      const studentId = formData.get("studentId")?.toString();
      assertString(studentId);

      // console.log(Object.fromEntries(Array.from(formData)));
      const account = await addPaymentToAccount(accountId, {
        sum,
        method,
        studentId,
      });

      if (!account) {
        throw new AppError({ errType: ErrorType.PaymentFailed });
      }

      return json({ account });
    },
    async editTransaction() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.formData();
          const { accountId } = params;
          assertString(accountId);
          const sum = formData.get("sum");
          const method = formData.get("method")?.toString() as
            | PaymentMethod
            | undefined;
          const studentId = formData.get("studentId")?.toString();
          const transactionId = formData.get("transactionId");
          assertString(transactionId);

          const account = await editCreditPaymentDetails(
            accountId,
            transactionId,
            {
              teacherId: teacher.id,
              sum: sum ? Number(sum) : undefined,
              method,
              studentId,
            }
          );
          if (!account) {
            throw new AppError({ errType: ErrorType.PaymentUpdateFailed });
          }

          console.log(account);
          return json({ account });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async deleteTransaction() {
      const formData = await request.formData();
      const accountId = formData.get("accountId")?.toString();
      assertString(accountId);
      const transactionId = formData.get("transactionId")?.toString();
      assertString(transactionId);

      const account = await deleteCreditPayment(accountId, transactionId);
      if (!account) {
        throw new AppError({ errType: ErrorType.PaymentDeleteFailed });
      }

      return json({ account });
    },
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { accountId } = params;
      if (!accountId) {
        throw new AppError({ errType: ErrorType.AccountNotFound });
      }

      const account = await getPaymentAccountById(teacher.id, accountId);
      if (!account) {
        throw new AppError({ errType: ErrorType.AccountNotFound });
      }

      return json({ account });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function PaymentAccountInfoPage() {
  const { account } = useLoaderData<typeof loader>();
  const transactions = generateTransactionsHistory(account)
    .sort((txa, txb) => Date.parse(txb.date) - Date.parse(txa.date))
    .filter((tx) => tx.credit || tx.debit);
  const balance = useMemo(
    () =>
      transactions.reduce(
        (sum, tx) => sum + (tx.credit || 0) + (tx.debit || 0),
        0
      ),
    [transactions]
  );
  // const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  // const [editTransactionModalTransactionIndex, setShowEditTransactionModal] =
  //   useState<number | null>(null);
  // const [transactionInfoModalTransactionIndex, setShowTransactionInfoModal] =
  //   useState<number | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  return (
    <>
      <div className="border-b border-gray-200 pb-3">
        <Link
          to={"/accounts" || searchParams.get("returnTo") || "/students"}
          className="inline-flex items-center gap-x-1 text-gray-400"
        >
          <ArrowRightIconSolid className="h-4 w-auto" />
          <span className="text-sm font-medium">פרטי כרטיסיה</span>
        </Link>
      </div>

      <main className="flex-1 overflow-auto">
        <section className="flex border-b border-gray-200 py-6">
          <div className="grid h-10 w-10 flex-none place-content-center rounded-lg border border-gray-300 bg-white shadow-sm ltr:mr-3 rtl:ml-3">
            <BanknotesIconSolid
              className={clsx([
                "h-6 w-6",
                {
                  "text-emerald-500": balance > 0,
                  "text-gray-400": balance === 0,
                  "text-red-300 sm:text-red-400": balance < 0,
                },
              ])}
            />
          </div>
          <div className="flex-1">
            <dd className="mb-1 flex items-end text-xl font-medium leading-none tracking-tight text-gray-900">
              <span dir="ltr" className="tabular-nums leading-5">
                {balance}
              </span>
              <IconCurrencyShekel
                className="inline-block text-gray-600 ltr:ml-0.5 rtl:mr-0.5"
                size={18}
              />
            </dd>
            <dt className="text-sm font-medium leading-none text-gray-500">
              יתרה נוכחית
            </dt>
          </div>
          <button type="button" className="self-center text-sm text-red-400">
            אפס כרטיסיה
          </button>
        </section>

        <h1 className="mt-5 text-base font-semibold text-gray-600">
          תנועות בכרטיסיה
        </h1>
        <ul className="mt-2 divide-y divide-gray-100">
          {transactions.map((tx, index) => {
            const currentBalance =
              balance -
              transactions
                .slice(0, index)
                .reduce(
                  (sum, tx) => sum + (tx.credit || 0) + (tx.debit || 0),
                  0
                );
            return (
              <li key={tx.id} className="flex items-start gap-x-3 py-3">
                {tx.method === PaymentMethod.PAYPAL ? (
                  <IconBrandPaypal className="text-gray-400" />
                ) : tx.method === PaymentMethod.CREDIT_CARD ? (
                  <IconCreditCard className="text-gray-400" />
                ) : tx.method === PaymentMethod.CASH ? (
                  <IconCoins className="text-gray-400" />
                ) : tx.method === PaymentMethod.BIT ? (
                  <IconCurrencyShekel className="text-gray-400" />
                ) : (
                  <IconCalendarEvent className="text-gray-400" />
                )}
                <div className="flex-1">
                  <div className="flex flex-shrink-0 items-start gap-x-1">
                    {tx.debit && (
                      <span className="text-base font-medium tabular-nums leading-none text-red-400">
                        חובה: {Math.abs(tx.debit)}
                      </span>
                    )}
                    {tx.debit && tx.credit ? (
                      <span className="self-center text-xs leading-none text-gray-500">
                        /
                      </span>
                    ) : null}
                    {tx.credit && (
                      <span className="text-base font-medium tabular-nums leading-none text-green-600">
                        זכות: {Math.abs(tx.credit || 0)}{" "}
                        <span className="text-xs text-gray-500">
                          {tx.method
                            ? `(${formatPaymentMethod(tx.method)})`
                            : null}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {dayjs(tx.date).format("DD MMM YYYY")}{" "}
                  </span>
                </div>
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="mb-1.5 flex items-end gap-x-0.5">
                    <span
                      dir="ltr"
                      className="text-base font-medium tabular-nums leading-none text-gray-500"
                    >
                      {currentBalance}
                    </span>
                    <IconCurrencyShekel className="text-gray-500" size={15} />
                  </div>
                  <span className="text-xs text-gray-400">יתרה</span>
                </div>
                {/* <div className="flex items-center gap-x-2">
                  <strong className="text-sm text-gray-500">חובה:</strong>
                  <span dir="ltr" className="tabular-nums">
                    {tx.debit || 0}
                  </span>
                </div>
                <div className="flex items-center gap-x-2">
                  <strong className="text-sm text-gray-500">זכות:</strong>
                  <span dir="ltr" className="tabular-nums">
                    {tx.credit || 0}
                  </span>
                </div>
                <div className="flex items-center gap-x-2">
                  <strong className="text-sm text-gray-500">יתרה:</strong>
                  <span dir="ltr" className="tabular-nums">
                    {currentBalance > 0 ? `+${currentBalance}` : currentBalance}
                  </span>
                </div> */}
                {/* <div className="flex flex-1 gap-x-6">
                  {isCreditTransaction(tx) ? (
                    tx.method === PaymentMethod.PAYPAL ? (
                      <IconBrandPaypal className="text-gray-500" />
                    ) : tx.method === PaymentMethod.CREDIT_CARD ? (
                      <IconCreditCard className="text-gray-500" />
                    ) : tx.method === PaymentMethod.CASH ? (
                      <IconCoins className="text-gray-500" />
                    ) : (
                      <IconCurrencyShekel className="text-gray-500" />
                    )
                  ) : (
                    <IconCalendarEvent className="text-gray-500" />
                  )}
                  {isCreditTransaction(tx) ? (
                    <div className="flex-auto">
                      <div className="flex items-center gap-x-0.5 text-sm font-medium leading-6 text-gray-900">
                        <span dir="ltr">
                          {tx.sum > 0
                            ? `+${tx.sum.toFixed(2)}`
                            : tx.sum.toFixed(2)}
                        </span>
                        <IconCurrencyShekel className="h-5 w-auto" />
                      </div>
                      <div className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                        {`תשלום: ${formatPaymentMethod(tx.method)}`}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-x-0.5 text-sm font-medium leading-6 text-gray-900">
                          <span dir="ltr">
                            {tx.sum > 0
                              ? `+${tx.sum.toFixed(2)}`
                              : tx.sum.toFixed(2)}
                          </span>
                          <IconCurrencyShekel className="h-5 w-auto" />
                          {isPaid && (
                            <div className="rounded-full border border-green-400 px-1 ltr:ml-2 rtl:mr-2">
                              <div className="flex items-center gap-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                                <span className="text-xs text-green-600">
                                  שולם
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <Link
                          to={{
                            pathname: "/lessons/calendar",
                            search: `?l=${tx.id}`,
                          }}
                          className="rounded-md border-0 border-sky-400 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100 sm:rounded-lg sm:bg-sky-100 sm:px-3 sm:text-sm sm:hover:bg-sky-200"
                        >
                          הצג שיעור
                        </Link>
                      </div>
                      {tx.lesson && hasStudentFetched(tx.lesson) && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <div className="flex items-center gap-x-1 text-xs leading-6 text-gray-500 sm:text-sm">
                            <UserIconSolid className="inline-block h-3 text-gray-400" />
                            <span>{tx.lesson?.student.fullName}</span>
                          </div>
                          <div className="flex items-center gap-x-1 text-xs leading-6 text-gray-500 sm:text-sm">
                            <CalendarDaysIconSolid className="inline-block h-3.5 text-gray-400" />
                            <span>
                              {dayjs(tx.date).format("DD.MM.YYYY, HH:mm")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div> */}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

function generateTransactionsHistory(account: PaymentAccount): Transaction[] {
  const payments = account.payments;
  const billings = account.billings;
  const transactions = billings.map((billing) => {
    const payment = payments.find(
      (payment) => !!payment.lesson && payment.lesson.id === billing.lesson?.id
    );
    return {
      id: billing.id,
      method: payment?.method,
      date: billing.date,
      debit: billing.sum,
      credit: payment?.sum,
    };
  });
  return [
    ...transactions,
    ...payments
      .filter((payment) => !payment.lesson)
      .map((payment) => ({
        id: payment.id,
        method: payment.method,
        date: payment.paidAt,
        debit: undefined,
        credit: payment.sum,
      })),
  ];
}
