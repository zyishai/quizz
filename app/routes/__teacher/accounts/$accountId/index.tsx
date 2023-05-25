import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useLocation } from "@remix-run/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import AddDetachedPaymentModal from "~/components/add-detached-payment-modal";
import ResetInitialBalanceModal from "~/components/reset-initial-balance-modal";
import TransactionInfoModal from "~/components/transaction-info-modal";
import {
  deleteCredit,
  deleteDebit,
  deleteTransaction,
  makePayment,
  resetAccount,
  resetInitialBalance,
  updateTransaction,
} from "~/handlers/payments.server";
import { getPaymentAccountById } from "~/handlers/payments.server";
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
  IconPlus,
} from "~/utils/icons";
import { haveStudentsFetched } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    makePayment: () => makePayment(request),
    updateTransaction: () => updateTransaction(request),
    deleteCredit: () => deleteCredit(request),
    deleteDebit: () => deleteDebit(request),
    deleteTransaction: () => deleteTransaction(request),
    resetAccount: () => resetAccount(request),
    resetInitialBalance: () => resetInitialBalance(request),
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
        (sum, tx) => sum + Number(tx.credit || 0) + Number(tx.debit || 0),
        account.initialBalance || 0
      ),
    [transactions]
  );
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  // const [editTransactionModalTransactionIndex, setShowEditTransactionModal] =
  //   useState<number | null>(null);
  const [transactionInfoModalTransactionIndex, setShowTransactionInfoModal] =
    useState<number | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  return (
    <>
      <Form id="reset-account-form" method="post">
        <input type="hidden" name="_action" value="resetAccount" />
        <input type="hidden" name="accountId" value={account.id} />
      </Form>

      <div>
        <Link
          to={"/accounts" || searchParams.get("returnTo") || "/students"}
          className="inline-flex items-center gap-x-1 text-gray-400"
        >
          <ArrowRightIconSolid className="h-3.5 w-auto" />
          <span className="text-xs font-medium">כל הכרטיסיות</span>
        </Link>
      </div>

      {haveStudentsFetched(account) && (
        <header className="mt-2">
          <h1 className="text-lg font-semibold text-gray-800">
            {account.students.map((student) => student.fullName).join(", ")}
          </h1>
        </header>
      )}

      <main className="mt-3 flex-1 overflow-auto">
        <section className="flex border-b border-t border-gray-200 py-6">
          <button
            type="button"
            className="grid h-10 w-10 flex-none place-content-center rounded-lg border border-gray-300 bg-white shadow-sm ltr:mr-3 rtl:ml-3"
            onClick={() => setShowInitialBalanceModal(true)}
          >
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
          </button>
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

          <button
            type="submit"
            form="reset-account-form"
            className="self-center rounded bg-red-100 px-3 py-1 text-xs text-red-700"
            onClick={(e) => {
              if (
                !confirm(
                  "בטוח? פעולה זו תמחק את כל התשלומים וגם את השיעורים של התלמיד."
                )
              ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }

              return true;
            }}
          >
            אפס כרטיסיה
          </button>
        </section>

        <div className="mt-5 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-600">
            תנועות בכרטיסיה
          </h1>

          <button
            type="button"
            className="flex items-center gap-x-1 rounded bg-indigo-500 px-2 py-1.5 text-white"
            onClick={() => {
              setShowMakePaymentModal(true);
            }}
          >
            <IconPlus className="h-3 w-auto" />
            <span className="text-xs leading-none">הוסף תשלום</span>
          </button>
        </div>

        <ul className="mt-3 divide-y divide-gray-100">
          {transactions
            .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
            .map((tx, index) => {
              const currentBalance =
                balance -
                transactions
                  .slice(0, index)
                  .reduce(
                    (sum, tx) => sum + (tx.credit || 0) + (tx.debit || 0),
                    0
                  );
              return (
                <li key={tx.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-x-3 py-3 text-start"
                    onClick={() => setShowTransactionInfoModal(index)}
                  >
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
                          <span className="text-lg font-medium tabular-nums leading-none text-red-400">
                            חובה: {Math.abs(tx.debit)}
                          </span>
                        )}
                        {tx.debit && tx.credit ? (
                          <span className="self-center text-xs leading-none text-gray-500">
                            /
                          </span>
                        ) : null}
                        {tx.credit ? (
                          <span className="text-lg font-medium tabular-nums leading-none text-green-600">
                            זכות: {Math.abs(tx.credit || 0)}
                            <span className="text-xs text-gray-500">
                              {tx.method
                                ? `(${formatPaymentMethod(tx.method)})`
                                : null}
                            </span>
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-400">
                        {dayjs(tx.date).format("DD MMM YYYY")}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-stretch">
                      <div className="mb-1.5 flex items-end gap-x-0.5">
                        <span
                          dir="ltr"
                          className="text-lg font-medium tabular-nums leading-none text-gray-500"
                        >
                          {currentBalance}
                        </span>
                        <IconCurrencyShekel
                          className="text-gray-500"
                          size={15}
                        />
                      </div>
                      <span className="rounded-full bg-amber-100 text-center text-xs text-amber-500">
                        יתרה
                      </span>
                    </div>
                  </button>
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

      <TransactionInfoModal
        open={typeof transactionInfoModalTransactionIndex === "number"}
        onClose={() => setShowTransactionInfoModal(null)}
        transaction={
          typeof transactionInfoModalTransactionIndex === "number"
            ? transactions[transactionInfoModalTransactionIndex]
            : undefined
        }
      />
      <AddDetachedPaymentModal
        open={showMakePaymentModal}
        onClose={() => setShowMakePaymentModal(false)}
        account={account}
      />
      <ResetInitialBalanceModal
        open={showInitialBalanceModal}
        onClose={() => setShowInitialBalanceModal(false)}
        account={account}
      />
    </>
  );
}

function generateTransactionsHistory(account: PaymentAccount): Transaction[] {
  const payments = account.payments;
  const billings = account.billings;
  const transactions = billings.map((billing) => {
    const payment = payments.find(
      (payment) =>
        !!payment.lesson &&
        (payment.lesson.id === billing.lesson?.id ||
          (payment.lesson as unknown as string) === billing.lesson?.id)
    );
    return {
      id: billing.id,
      billingId: billing.id,
      paymentId: payment?.id,
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
        paymentId: payment.id,
        method: payment.method,
        date: payment.paidAt,
        debit: undefined,
        credit: payment.sum,
      })),
  ];
}
