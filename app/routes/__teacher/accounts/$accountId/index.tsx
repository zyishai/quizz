import { Menu, Transition } from "@headlessui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { Fragment, useState } from "react";
import { namedAction } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import EditTransactionModal from "~/components/edit-transaction-modal";
import MakePaymentModal from "~/components/make-payment-modal";
import StudentAvatar from "~/components/student-avatar";
import {
  addPaymentToAccount,
  deleteCreditPayment,
  editCreditPaymentDetails,
  getPaymentAccountById,
} from "~/handlers/payments.server";
import { ErrorType } from "~/types/errors";
import {
  CreditTransaction,
  PaymentMethod,
  TransactionType,
} from "~/types/payment-account";
import { AppError } from "~/utils/app-error";
import {
  ArrowRightIconSolid,
  ChevronDownIconSolid,
  IconArrowBigDownFilled,
  IconArrowBigUpFilled,
  IconPlus,
} from "~/utils/icons";
import {
  assertNumber,
  assertPaymentMethod,
  assertString,
  haveStudentsFetched,
  isCreditTransaction,
  isDebitTransaction,
} from "~/utils/misc";
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
  const studentsFetched = haveStudentsFetched(account);
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  const [editTransactionModalTransactionIndex, setShowEditTransactionModal] =
    useState<number | null>(null);

  return (
    <>
      <header className="mb-5 border-b border-gray-200 px-4 pb-2">
        <h1 className="flex items-center text-lg text-gray-800">
          <Link
            to="/students"
            className="inline-block ltr:mr-2 rtl:ml-2 sm:mt-1"
          >
            <ArrowRightIconSolid className="h-5 w-auto" />
          </Link>
          <span>פרטי כרטיסיה</span>
        </h1>
      </header>

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
          {/* <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              מאזן חודשי
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {item.stat}
            </dd>
          </div> */}
          {/* <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">
              {item.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {item.stat}
            </dd>
          </div> */}
        </dl>
      </div>

      {studentsFetched && (
        <div className="mb-8 overflow-hidden">
          <h1 className="mb-3 text-xl font-semibold text-gray-800">תלמידים</h1>

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

          {/* <ul
            role="list"
            className="divide-y-0 divide-gray-200 overflow-auto sm:hidden"
          >
            {account.students.map((student) => (
              <li key={student.id}>
                <Link
                  to={`/students/${student.id}`}
                  className="flex items-center py-4 first:py-2"
                >
                  <StudentAvatar
                    fullName={student.fullName}
                    size={26}
                    radius={999}
                  />
                  <div className="ltr:ml-2.5 rtl:mr-2.5">
                    <p className="text-sm font-medium text-gray-900">
                      {student.fullName}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul> */}
        </div>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex items-center justify-between py-1 ltr:pr-1 rtl:pl-1">
          <h1 className="text-xl font-semibold text-gray-800">פעולות בחשבון</h1>

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

        {/* Transactions list (only on smallest breakpoint) */}
        <ul
          role="list"
          className="flex-1 divide-y divide-gray-200 overflow-auto sm:hidden"
        >
          {account.transactions.map((transaction, index) => (
            <li key={transaction.id}>
              <Link to={`/lessons/${transaction.id}`} className="flex py-4">
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

        {/* Transactions table (small breakpoint and up) */}
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
                              "זיכוי"
                            ) : (
                              <span>
                                חיוב{" "}
                                <Link
                                  to={`/lessons/${transaction.id}`}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  (מקור)
                                </Link>
                              </span>
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
                        {/* <div className="flex divide-x divide-gray-200 rtl:divide-x-reverse">
                        {isCreditTransaction(transaction) ? <Link
                          to={`/accounts/${account.id}/transactions/${transaction.id}/edit`}
                          className="px-3 text-indigo-600 hover:text-indigo-900"
                        >
                          עריכה
                        </Link> : null}
                        <Form method="post" className="group">
                          <input
                            type="hidden"
                            name="transactionId"
                            value={transaction.id}
                          />
                          <button
                            type="submit"
                            className="px-3 text-indigo-600 group-hover:text-indigo-900"
                            onClick={(e) => {
                              if (!confirm("האם ברצונך למחוק את התלמיד?")) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                              }
                              return true;
                            }}
                          >
                            מחק
                          </button>
                        </Form>
                      </div> */}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
      </footer>
    </>
  );
}
