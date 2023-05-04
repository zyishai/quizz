import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData, useLocation } from "@remix-run/react";
import clsx from "clsx";
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
import { PaymentMethod } from "~/types/payment-account";
import { AppError } from "~/utils/app-error";
import { ArrowRightIconSolid, IconCurrencyShekel } from "~/utils/icons";
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
  const balance = useMemo(() => {
    return (
      account.payments.reduce((sum, payment) => sum + payment.sum, 0) +
      account.billings.reduce((sum, billing) => sum + billing.sum, 0)
    );
  }, [account]);
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  const [editTransactionModalTransactionIndex, setShowEditTransactionModal] =
    useState<number | null>(null);
  const [transactionInfoModalTransactionIndex, setShowTransactionInfoModal] =
    useState<number | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  return (
    <>
      <header className="mb-5 border-b border-gray-200 px-4 pb-2">
        <h1 className="flex items-center text-lg text-gray-800">
          <Link
            to={"/accounts" || searchParams.get("returnTo") || "/students"}
            className="inline-block ltr:mr-2 rtl:ml-2 sm:mt-1"
          >
            <ArrowRightIconSolid className="h-5 w-auto" />
          </Link>
          <span>פרטי כרטיסיה</span>
        </h1>
      </header>

      <section className="my-2">
        {/* [TODO] apply filters */}
        <ul className="flex gap-x-3 gap-y-3 text-sm font-semibold">
          <li className="relative">
            <a
              href="?display=week"
              className={clsx([
                { "text-gray-500": !location.search.includes("display=week") },
                { "text-indigo-600": location.search.includes("display=week") },
              ])}
            >
              שבוע נוכחי
            </a>
            <span
              className={clsx([
                "absolute left-0 -bottom-2 w-full border-b-2 border-indigo-600",
                { block: location.search.includes("display=week") },
                { hidden: !location.search.includes("display=week") },
              ])}
            ></span>
          </li>
          <li className="relative">
            <a
              href="?display=month"
              className={clsx([
                { "text-gray-500": !location.search.includes("display=month") },
                {
                  "text-indigo-600": location.search.includes("display=month"),
                },
              ])}
            >
              חודש נוכחי
            </a>
            <span
              className={clsx([
                "absolute left-0 -bottom-2 w-full border-b-2 border-indigo-600",
                { block: location.search.includes("display=month") },
                { hidden: !location.search.includes("display=month") },
              ])}
            ></span>
          </li>
          <li className="relative">
            <a
              href="?display=all"
              className={clsx([
                { "text-gray-500": !location.search.includes("display=all") },
                { "text-indigo-600": location.search.includes("display=all") },
              ])}
            >
              כל הזמן
            </a>
            <span
              className={clsx([
                "absolute left-0 -bottom-2 w-full border-b-2 border-indigo-600",
                { block: location.search.includes("display=all") },
                { hidden: !location.search.includes("display=all") },
              ])}
            ></span>
          </li>
        </ul>
      </section>

      <main className="flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-y-0 gap-x-4 border-t border-b border-gray-900/5 px-4 py-5 sm:px-6 lg:border-t-0 xl:px-8">
          <dt className="text-sm font-medium leading-6 text-gray-500">מאזן</dt>
          {/* <dd
                className={classNames(
                  stat.changeType === 'negative' ? 'text-rose-600' : 'text-gray-700',
                  'text-xs font-medium'
                )}
              >
                {stat.change}
              </dd> */}
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            <span dir="ltr">{balance}</span>
            <IconCurrencyShekel className="inline-block leading-9" size={30} />
          </dd>
        </div>
      </main>

      {/* <div className="flex-1 overflow-auto">
        <div className="mb-5">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">
                יתרה נוכחית
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                <span dir="ltr" className="tabular-nums">
                  {account.balance}
                </span>{" "}
                <span>&#8362;</span>
              </dd>
            </div>
          </dl>
        </div>

        {studentsFetched && (
          <div className="mb-8 overflow-hidden">
            <h1 className="mb-3 text-xl font-semibold text-gray-800">
              תלמידים
            </h1>

            <div className="isolate flex -space-x-2 overflow-x-auto rtl:space-x-reverse">
              {account.students.map((student) => (
                <Link
                  to="/students"
                  key={student.id}
                  className="z-20 rounded-full border-2 border-white"
                >
                  <StudentAvatar
                    fullName={student.fullName}
                    size={32}
                    radius={999}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <main className="flex flex-1 flex-col overflow-auto sm:overflow-hidden">
          <div className="mb-3 flex items-center justify-between py-1 ltr:pr-1 rtl:pl-1">
            <h1 className="text-xl font-semibold text-gray-800">
              פעולות בחשבון
            </h1>

            <button
              type="button"
              className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:inline-flex"
              onClick={() => setShowMakePaymentModal(true)}
            >
              <IconPlus
                className="h-4 w-4 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
                aria-hidden="true"
              />
              <span>הוסף תשלום</span>
            </button>
          </div>
          Transactions list (only on smallest breakpoint)
          <ul role="list" className="flex-1 divide-y divide-gray-200 sm:hidden">
            {account.transactions
              .sort((a, b) => {
                const first: string = isCreditTransaction(a)
                  ? a.paidAt
                  : a.date;
                const second: string = isCreditTransaction(b)
                  ? b.paidAt
                  : b.date;
                return Date.parse(first) - Date.parse(second);
              })
              .map((transaction, index) => (
                <li key={transaction.id}>
                  <Link
                    to="#"
                    className="flex py-4"
                    onClick={(e) => {
                      if (isCreditTransaction(transaction)) {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTransactionInfoModal(index);
                        return false;
                      }
                    }}
                  >
                    <div className="inline-block">
                      {transaction.type === TransactionType.CREDIT ? (
                        <IconArrowBigUpFilled className="h-8 w-auto text-emerald-500" />
                      ) : (
                        <IconArrowBigDownFilled className="h-8 w-auto text-red-500" />
                      )}
                    </div>
                    <div className="ltr:ml-3 rtl:mr-3">
                      <p className="text-base font-semibold text-gray-900">
                        {transaction.type === TransactionType.CREDIT
                          ? "שולם: "
                          : "חיוב: "}
                        <span dir="ltr" className="tabular-nums">
                          {transaction.sum}
                        </span>{" "}
                        <span>&#8362;</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        יתרה:{" "}
                        <span dir="ltr" className="tabular-nums">
                          {account.transactions
                            .slice(0, index + 1)
                            .reduce((sum, tx) => sum + tx.sum, 0)}
                        </span>{" "}
                        <span>&#8362;</span>
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 ltr:ml-auto rtl:mr-auto">
                      {isCreditTransaction(transaction)
                        ? dayjs(transaction.paidAt).format("DD.MM.YYYY")
                        : isDebitTransaction(transaction)
                        ? dayjs(transaction.date).format("DD.MM.YYYY")
                        : null}
                    </p>
                  </Link>
                </li>
              ))}
          </ul>
          Transactions table (small breakpoint and up)
          <div className="hidden flex-1 overflow-hidden sm:block">
            <div className="block h-full min-w-full overflow-y-scroll border-b border-gray-200 align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      <span className="lg:ltr:pl-2 lg:rtl:pr-2">סוג פעולה</span>
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      סכום (בשקלים)
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      תאריך
                    </th>
                    <th
                      className="hidden border-b border-gray-200 bg-white px-6 py-3 text-right text-sm font-semibold text-gray-600 md:table-cell"
                      scope="col"
                    >
                      יתרה (בשקלים)
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white py-3 pr-6 text-right text-sm font-semibold text-gray-600"
                      scope="col"
                    />
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {account.transactions
                    .sort((a, b) => {
                      const first: string = isCreditTransaction(a)
                        ? a.paidAt
                        : a.date;
                      const second: string = isCreditTransaction(b)
                        ? b.paidAt
                        : b.date;
                      return Date.parse(first) - Date.parse(second);
                    })
                    .map((transaction, index) => (
                      <tr key={transaction.id} className="group">
                        <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center rtl:space-x-reverse md:space-x-3 lg:ltr:pl-2 lg:rtl:pr-2">
                            <div className="block">
                              {transaction.type === TransactionType.CREDIT ? (
                                <IconArrowBigUpFilled className="h-5 w-auto text-emerald-500" />
                              ) : (
                                <IconArrowBigDownFilled className="h-5 w-auto text-red-500" />
                              )}
                            </div>
                            <p className="font-medium">
                              {transaction.type === TransactionType.CREDIT ? (
                                <span>תשלום</span>
                              ) : (
                                <span>שיעור</span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm text-gray-500">
                          <span dir="ltr" className="tabular-nums">
                            {transaction.sum}
                          </span>{" "}
                          <span>&#8362;</span>
                        </td>
                        <td className="border-b border-gray-100 py-3 px-6 text-sm font-normal text-gray-500">
                          {isCreditTransaction(transaction)
                            ? dayjs(transaction.paidAt).format("DD.MM.YYYY")
                            : isDebitTransaction(transaction)
                            ? dayjs(transaction.date).format("DD.MM.YYYY")
                            : null}
                        </td>
                        <td className="hidden whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm text-gray-700 md:table-cell">
                          <span dir="ltr" className="tabular-nums">
                            {account.transactions
                              .slice(0, index + 1)
                              .reduce((sum, tx) => sum + tx.sum, 0)}
                          </span>{" "}
                          <span>&#8362;</span>
                        </td>
                        <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm font-medium">
                          {isCreditTransaction(transaction) ? (
                            <Menu
                              as="div"
                              className="relative inline-block text-left rtl:text-right"
                            >
                              <div>
                                <Menu.Button className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-white px-2 py-1 text-sm font-normal text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                  פעולות
                                  <ChevronDownIconSolid
                                    className="h-4 w-auto text-gray-400 ltr:-mr-1 rtl:-ml-1"
                                    aria-hidden="true"
                                  />
                                </Menu.Button>
                              </div>

                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          type="button"
                                          className={clsx([
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700",
                                            "block w-full px-4 py-2 text-sm ltr:text-left rtl:text-right",
                                          ])}
                                          onClick={() =>
                                            setShowEditTransactionModal(index)
                                          }
                                        >
                                          ערוך פרטי תשלום
                                        </button>
                                      )}
                                    </Menu.Item>

                                    <Menu.Item>
                                      {({ active }) => (
                                        <Form method="post">
                                          <input
                                            type="hidden"
                                            name="_action"
                                            value="deleteTransaction"
                                          />
                                          <input
                                            type="hidden"
                                            name="accountId"
                                            value={account.id}
                                          />
                                          <button
                                            name="transactionId"
                                            value={transaction.id}
                                            className={clsx([
                                              active
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-red-600",
                                              "block w-full px-4 py-2 text-sm rtl:text-right",
                                            ])}
                                            onClick={(e) => {
                                              if (
                                                !confirm(
                                                  `האם ברצונך למחוק תשלום ע״ס ${transaction.sum} ש״ח?`
                                                )
                                              ) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return false;
                                              }
                                              return true;
                                            }}
                                          >
                                            מחק תשלום
                                          </button>
                                        </Form>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <MakePaymentModal
        open={showMakePaymentModal}
        onClose={() => setShowMakePaymentModal(false)}
        account={account}
      />
      <EditTransactionModal
        open={editTransactionModalTransactionIndex !== null}
        onClose={() => setShowEditTransactionModal(null)}
        account={account}
        transaction={
          typeof editTransactionModalTransactionIndex === "number"
            ? (account.transactions[
                editTransactionModalTransactionIndex
              ] as CreditTransaction)
            : undefined
        }
      />
      <TransactionInfoModal
        open={transactionInfoModalTransactionIndex !== null}
        onClose={() => setShowTransactionInfoModal(null)}
        account={account}
        transaction={
          typeof transactionInfoModalTransactionIndex === "number"
            ? account.transactions[transactionInfoModalTransactionIndex]
            : undefined
        }
      />

      <footer className="mt-6">
        <button
          type="button"
          className="mb-2 flex w-full items-center justify-center rounded-md border border-transparent bg-amber-500 px-2.5 py-3 font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
          onClick={() => setShowMakePaymentModal(true)}
        >
          <IconPlus
            className="h-5 w-5 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
            aria-hidden="true"
          />
          <span>הוסף תשלום</span>
        </button>
      </footer> */}
    </>
  );
}
