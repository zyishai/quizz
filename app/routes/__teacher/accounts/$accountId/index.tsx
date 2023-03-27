import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import StudentAvatar from "~/components/student-avatar";
import { getPaymentAccountById } from "~/handlers/payments.server";
import { ErrorType } from "~/types/errors";
import { TransactionType } from "~/types/payment-account";
import { AppError } from "~/utils/app-error";
import {
  ArrowRightIconSolid,
  IconArrowBigDownFilled,
  IconArrowBigUpFilled,
} from "~/utils/icons";
import {
  haveStudentsFetched,
  isCreditTransaction,
  isDebitTransaction,
} from "~/utils/misc";
import { getUserId } from "~/utils/session.server";

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
  console.log(account);
  const studentsFetched = haveStudentsFetched(account);

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

      <main className="flex flex-col overflow-hidden">
        <h1 className="mb-3 text-xl font-semibold text-gray-800">
          חיובים וזיכויים
        </h1>
        {/* Transactions list (only on smallest breakpoint) */}
        <ul
          role="list"
          className="flex-1 divide-y divide-gray-200 overflow-auto sm:hidden"
        >
          {account.transactions.map((transaction, index) => (
            <li key={transaction.id}>
              <Link to="#" className="flex py-4">
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
                {account.transactions.map((transaction, index) => (
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
                                to="#"
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
    </>
  );
}
