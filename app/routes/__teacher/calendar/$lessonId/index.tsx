import {
  ArrowLongRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import StudentAvatar from "~/components/student-avatar";
import {
  deleteLesson,
  deletePayment,
  fetchPaymentsDetails,
  getLesson,
} from "~/handlers/lessons.server";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import {
  formatDateAndTime,
  formatDuration,
  formatPaymentMethod,
} from "~/utils/format";
import {
  assertNumber,
  assertString,
  hasEventFetched,
  hasStudentFetched,
} from "~/utils/misc";
import { getUserId } from "~/utils/session.server";
import isMobile from "ismobilejs";
import { badRequest, namedAction } from "remix-utils";
import clsx from "clsx";

export const action = async ({ request, params }: ActionArgs) => {
  return namedAction(request, {
    async delete() {
      const { lessonId } = params;
      if (!lessonId) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }
      if (!(await deleteLesson(lessonId))) {
        throw badRequest({
          message: "לא הצלחנו למחוק את השיעור. אנא נסו שנית",
        });
      }

      return redirect("/calendar");
    },
    async deletePayment() {
      const { lessonId } = params;
      assertString(lessonId);
      const formData = await request.formData();
      const paymentIndex = Number(formData.get("paymentIndex"));
      assertNumber(paymentIndex);
      if (!(await deletePayment(lessonId, paymentIndex))) {
        throw badRequest({
          message: "לא הצלחנו למחוק את התשלום המבוקש. אנא נסו שנית.",
        });
      }

      return redirect(".");
    },
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { lessonId = "" } = params;
      const lesson = await getLesson(teacher.id, lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }
      const payments = await fetchPaymentsDetails(lesson.payments);
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);
      return json({ lesson, payments, isMobilePhone });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function LessonOverview({}) {
  const { lesson, payments, isMobilePhone } = useLoaderData<typeof loader>();
  const eventFetched = hasEventFetched(lesson);
  const studentFetched = hasStudentFetched(lesson);

  return (
    <>
      <header className="px-4">
        <nav className="flex" aria-label="ניווט חזרה">
          <div className="flex">
            <Link
              to="/calendar"
              className="group inline-flex space-x-3 text-sm font-medium text-gray-500 hover:text-gray-700 rtl:space-x-reverse"
            >
              <ArrowLongRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              <span>חזרה לשיעורים</span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="mt-6 flex flex-1 flex-col overflow-hidden px-4 py-1">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5 sm:rtl:space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">פרטי שיעור</h1>

          <div className="justify-stretch mt-6 hidden flex-wrap sm:flex sm:space-x-4 sm:rtl:space-x-reverse">
            <Link
              to="edit"
              className={clsx([
                "inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100",
                { hidden: lesson.ended },
              ])}
            >
              <PencilIcon
                className="h-5 w-5" /** ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 */
                aria-hidden="true"
              />
              <span className="sr-only">עריכת פרטי שיעור</span>
            </Link>

            <Form
              method="post"
              className="flex-1 ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
            >
              <input type="hidden" name="_action" value="delete" />
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={(e) => {
                  if (!confirm("האם ברצונך למחוק את השיעור?")) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  return true;
                }}
              >
                <TrashIcon
                  className="h-5 w-5 text-red-400" /** ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 */
                  aria-hidden="true"
                />
                <span className="sr-only">מחק שיעור</span>
              </button>
            </Form>

            <Link
              to="update-status"
              className={clsx([
                "mt-3 inline-flex basis-full items-center justify-center rounded-md border border-gray-300 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100 sm:mt-0 sm:basis-0",
                { hidden: lesson.ended },
              ])}
            >
              <span className="whitespace-nowrap">סיום שיעור</span>
            </Link>
          </div>
        </div>

        <section className="overflow-auto">
          <div className="px-4 py-5 sm:px-0">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {eventFetched && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    תאריך ושעה
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {dayjs(lesson.event.dateAndTime).format(
                      "DD MMMM YYYY, HH:mm"
                    )}
                  </dd>
                </div>
              )}
              {eventFetched && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    אורך השיעור
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDuration(lesson.event.duration)}
                  </dd>
                </div>
              )}
              <div
                className={clsx([
                  {
                    "sm:col-span-1": studentFetched,
                    "sm:col-span-2": !studentFetched,
                  },
                ])}
              >
                <dt className="text-sm font-medium text-gray-500">
                  נושא השיעור
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lesson.topic || "--"}
                </dd>
              </div>
              {studentFetched && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">תלמיד</dt>
                  <dd className="mt-1 flex items-center space-x-2 rtl:space-x-reverse">
                    <StudentAvatar
                      fullName={lesson.student.fullName}
                      size={24}
                      radius={8}
                    />
                    <Link
                      to={
                        isMobilePhone
                          ? `/students/${lesson.student.id}`
                          : "/students"
                      }
                      className="text-sm text-blue-700 hover:text-blue-800"
                    >
                      {lesson.student.fullName}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">מחיר</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lesson.price} <span>&#8362;</span>{" "}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">שולם</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lesson.paid} <span>&#8362;</span>{" "}
                </dd>
              </div>
              {lesson.summary && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    סיכום השיעור
                  </dt>
                  <dd className="mt-1 rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-900">
                    {lesson.summary}
                  </dd>
                </div>
              )}
              {lesson.ended && (
                <div className="sm:col-span-2">
                  <dt className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      תשלומים
                    </span>
                    <Link to="pay" className="text-sm text-indigo-500">
                      <PlusIcon
                        strokeWidth={2}
                        className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
                      />
                      <span>הוסף תשלום</span>
                    </Link>
                  </dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    {/* Mobile - List View */}
                    <div className="mt-4 flow-root flex-1 overflow-auto sm:hidden">
                      <ul
                        role="list"
                        className="divide-y divide-gray-200 lg:-my-5"
                      >
                        {payments.map((payment, paymentIndex) => (
                          <li
                            key={payment.paidAt + paymentIndex}
                            className="py-4"
                          >
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {payment.sum} <span>&#8362;</span>
                                </p>
                                <p className="truncate text-sm text-gray-500">
                                  {formatPaymentMethod(payment.paymentMethod)}
                                </p>
                              </div>
                              <div className="flex divide-x divide-gray-200 rtl:divide-x-reverse">
                                <Link
                                  to={`payments/${paymentIndex}/edit`}
                                  className="px-3 text-indigo-600 hover:text-indigo-900"
                                >
                                  עריכה
                                </Link>
                                <Form method="post" className="group">
                                  <input
                                    type="hidden"
                                    name="_action"
                                    value="deletePayment"
                                  />
                                  <input
                                    type="hidden"
                                    name="paymentIndex"
                                    value={paymentIndex}
                                  />
                                  <button
                                    type="submit"
                                    className="px-3 text-red-500"
                                    onClick={(e) => {
                                      if (
                                        !confirm("האם ברצונך למחוק את התשלום?")
                                      ) {
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
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tablets and Desktops - Table View */}
                    <div className="mt-4 hidden flex-1 overflow-hidden sm:block">
                      <div className="block h-full min-w-full overflow-y-scroll border-b border-gray-200 align-middle">
                        <table className="min-w-full border-separate border-spacing-0">
                          <thead className="sticky top-0 z-20">
                            <tr>
                              <th
                                className="border-b border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-900 ltr:text-left rtl:text-right"
                                scope="col"
                              >
                                <span className="lg:ltr:pl-2 lg:rtl:pr-2">
                                  סכום
                                </span>
                              </th>
                              <th
                                className="border-b border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-900 ltr:text-left rtl:text-right"
                                scope="col"
                              >
                                צורת תשלום
                              </th>
                              <th
                                className="hidden border-b border-t border-gray-200 bg-gray-50 px-6 py-3 text-right text-sm font-semibold text-gray-900 md:table-cell"
                                scope="col"
                              >
                                תאריך
                              </th>
                              <th
                                className="border-b border-t border-gray-200 bg-gray-50 py-3 pr-6 text-right text-sm font-semibold text-gray-900"
                                scope="col"
                              />
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {payments
                              .sort(
                                (a, b) =>
                                  Date.parse(a.paidAt) - Date.parse(b.paidAt)
                              )
                              .map((payment, index) => (
                                <tr
                                  key={payment.paidAt + index}
                                  className="group"
                                >
                                  <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-sm font-medium text-gray-900">
                                    <p className="inline">{payment.sum}</p>{" "}
                                    <span>&#8362;</span>
                                  </td>
                                  <td className="border-b border-gray-100 py-3 px-6 text-sm font-medium text-gray-500">
                                    {formatPaymentMethod(payment.paymentMethod)}
                                  </td>
                                  <td className="hidden whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm text-gray-500 md:table-cell">
                                    {formatDateAndTime(payment.paidAt)}
                                  </td>
                                  <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm font-medium">
                                    <div className="flex divide-x divide-gray-200 rtl:divide-x-reverse">
                                      <Link
                                        to={`payments/${index}/edit`}
                                        className="px-3 text-indigo-600 hover:text-indigo-900"
                                      >
                                        עריכה
                                      </Link>
                                      <Form method="post" className="group">
                                        <input
                                          type="hidden"
                                          name="_action"
                                          value="deletePayment"
                                        />
                                        <input
                                          type="hidden"
                                          name="paymentIndex"
                                          value={index}
                                        />
                                        <button
                                          type="submit"
                                          className="px-3 text-indigo-600 group-hover:text-indigo-900"
                                          onClick={(e) => {
                                            if (
                                              !confirm(
                                                "האם ברצונך למחוק את התשלום?"
                                              )
                                            ) {
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
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <footer className="mt-4 sm:hidden">
          <div className="justify-stretch mt-6 flex flex-wrap">
            <Link
              to="edit"
              className={clsx([
                "inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100",
                { hidden: lesson.ended },
              ])}
            >
              <PencilIcon
                className="h-5 w-5" /** ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 */
                aria-hidden="true"
              />
              <span className="sr-only">עריכת פרטי שיעור</span>
            </Link>

            <Form
              method="post"
              className="flex-1 ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
            >
              <input type="hidden" name="_action" value="delete" />
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-red-400 bg-red-50 px-2.5 py-3 text-sm font-medium text-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={(e) => {
                  if (!confirm("האם ברצונך למחוק את השיעור?")) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  return true;
                }}
              >
                <TrashIcon
                  className="h-5 w-5 text-red-400" /** ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 */
                  aria-hidden="true"
                />
                <span className="sr-only">מחק שיעור</span>
              </button>
            </Form>

            <Link
              to="update-status"
              className={clsx([
                "mt-3 inline-flex basis-full items-center justify-center rounded-md border border-gray-300 bg-amber-500 px-2.5 py-3 text-sm font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100 sm:mt-0 sm:basis-0",
                { hidden: lesson.ended },
              ])}
            >
              <span className="whitespace-nowrap">סיום שיעור</span>
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
