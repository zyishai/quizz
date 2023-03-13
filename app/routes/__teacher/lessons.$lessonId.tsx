import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import StudentAvatar from "~/components/student-avatar";
import { deleteLesson, getLesson } from "~/handlers/lessons.server";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { formatDuration } from "~/utils/format";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";
import isMobile from "ismobilejs";
import { badRequest, namedAction } from "remix-utils";
import clsx from "clsx";
import {
  ArrowRightIconSolid,
  IconCalendar,
  IconCalendarTime,
  IconPencil,
  IconTrashX,
  UserIconOutline,
} from "~/utils/icons";

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

      return redirect("/lessons");
    },
    // async deletePayment() {
    //   const { lessonId } = params;
    //   assertString(lessonId);
    //   const formData = await request.formData();
    //   const paymentIndex = Number(formData.get("paymentIndex"));
    //   assertNumber(paymentIndex);
    //   if (!(await deletePayment(lessonId, paymentIndex))) {
    //     throw badRequest({
    //       message: "לא הצלחנו למחוק את התשלום המבוקש. אנא נסו שנית.",
    //     });
    //   }

    //   return redirect(".");
    // },
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
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);
      return json({ lesson, isMobilePhone });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function LessonOverviewPage() {
  const { lesson, isMobilePhone } = useLoaderData<typeof loader>();
  const eventFetched = hasEventFetched(lesson);
  const studentFetched = hasStudentFetched(lesson);

  return (
    <main className="flex flex-1 flex-col overflow-hidden px-4 py-1">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5 sm:rtl:space-x-reverse">
        <h1 className="flex items-center text-2xl font-bold text-gray-900">
          <Link
            to="/lessons"
            className="inline-block ltr:mr-2 rtl:ml-2 sm:mt-1"
          >
            <ArrowRightIconSolid className="h-5 w-auto" />
          </Link>
          <span>פרטי שיעור</span>
        </h1>

        <div className="justify-stretch mt-6 hidden flex-wrap sm:flex sm:space-x-4 sm:rtl:space-x-reverse">
          <Link
            to="edit"
            className={clsx([
              "inline-flex flex-1 items-center justify-center rounded-md border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100",
              { hidden: lesson.ended },
            ])}
          >
            <IconPencil
              className="h-5 w-5 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-sm">עריכת פרטי שיעור</span>
          </Link>

          <Form
            method="post"
            className="ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
          >
            <input type="hidden" name="_action" value="delete" />
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-red-300 bg-red-50 px-2.5 py-2 text-sm font-medium text-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={(e) => {
                if (!confirm("האם ברצונך למחוק את השיעור?")) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                return true;
              }}
            >
              <IconTrashX
                className="h-5 w-5 text-red-400" /** ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 */
                aria-hidden="true"
              />
              <span className="sr-only">מחק שיעור</span>
            </button>
          </Form>

          {/* <Link
            to="update-status"
            className={clsx([
              "mt-3 inline-flex basis-full items-center justify-center rounded-md border border-gray-300 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100 sm:mt-0 sm:basis-0",
              { hidden: lesson.ended },
            ])}
          >
            <IconSquareRoundedCheckFilled className="h-4 w-auto ltr:mr-2 rtl:ml-2" />
            <span className="whitespace-nowrap">סיום השיעור ותשלום</span>
          </Link> */}
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-auto border-t border-gray-200">
        <dl className="divide-y divide-gray-200 overflow-auto">
          {eventFetched && (
            <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
              <dt className="flex items-center text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
                <IconCalendar className="h-4 w-auto ltr:mr-1 rtl:ml-1 sm:hidden" />
                <span>תאריך</span>
              </dt>
              <dd className="mt-1 flex text-gray-900 sm:mt-0 sm:text-sm">
                <span className="flex-grow">
                  {dayjs(lesson.event.dateAndTime).format(
                    "DD MMMM YYYY (יום dddd)"
                  )}
                </span>
              </dd>
            </div>
          )}

          {eventFetched && (
            <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
              <dt className="flex items-center text-sm font-semibold text-gray-400  sm:font-medium sm:text-gray-500">
                <IconCalendarTime className="h-4 w-auto ltr:mr-1 rtl:ml-1 sm:hidden" />
                <span>שעה</span>
              </dt>
              <dd className="mt-1 flex text-gray-900 sm:mt-0 sm:text-sm">
                <span className="flex-grow">
                  {dayjs(lesson.event.dateAndTime).format("HH:mm")}
                  {" - "}
                  {dayjs(lesson.event.dateAndTime)
                    .add(lesson.event.duration, "minutes")
                    .format("HH:mm")}
                </span>
              </dd>
            </div>
          )}

          {eventFetched && (
            <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
              <dt className="text-sm font-semibold text-gray-400  sm:font-medium sm:text-gray-500">
                אורך השיעור
              </dt>
              <dd className="mt-1 flex text-gray-900 sm:mt-0 sm:text-sm">
                <span className="flex-grow">
                  {formatDuration(lesson.event.duration)}
                </span>
              </dd>
            </div>
          )}

          <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
            <dt className="text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
              נושא השיעור
            </dt>
            <dd className="mt-1 flex text-gray-900 sm:mt-0 sm:text-sm">
              <span className="flex-grow">{lesson.topic || "--"}</span>
            </dd>
          </div>

          {studentFetched && (
            <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
              <dt className="flex items-center text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
                <UserIconOutline
                  className="h-4 w-auto ltr:mr-1 rtl:ml-1 sm:hidden"
                  strokeWidth={2}
                />
                <span>תלמיד/ה</span>
              </dt>
              <dd className="mt-1 flex flex-grow space-x-2 text-gray-900 rtl:space-x-reverse sm:mt-0 sm:text-sm">
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
                  className="text-blue-700 hover:text-blue-800 sm:text-sm"
                >
                  {lesson.student.fullName}
                </Link>
              </dd>
            </div>
          )}

          {/* <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
            <dt className="text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
              סטטוס תשלום
            </dt>
            <dd className="mt-1 flex text-sm text-gray-900 sm:mt-0">
              <span className="flex-grow">
                {lesson.paid === 0 ? (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">
                    לא שולם
                  </span>
                ) : lesson.paid === lesson.price ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    שולם מלא
                  </span>
                ) : (
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">
                    שולם חלקית
                  </span>
                )}
              </span>
            </dd>
          </div> */}

          {lesson.summary && (
            <div className="py-4 sm:grid sm:grid-cols-[260px,_1fr] sm:gap-4 sm:py-5">
              <dt className="text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
                סיכום השיעור
              </dt>
              <dd className="mt-1 flex text-gray-900 sm:mt-0 sm:text-sm">
                <span className="flex-grow">{lesson.summary}</span>
              </dd>
            </div>
          )}

          {/* {lesson.ended && (
            <div className="py-4 sm:py-5">
              <dt className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-400 sm:font-medium sm:text-gray-500">
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

              <dd className="mt-6 text-sm text-gray-900 sm:mt-4">
                Mobile - List View
                <div className="flow-root flex-1 overflow-auto sm:hidden">
                  <ul role="list" className="divide-y divide-gray-200 lg:-my-5">
                    {payments.map((payment, paymentIndex) => (
                      <li
                        key={payment.paidAt + paymentIndex}
                        className="py-4 first-of-type:pt-0"
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
                                  if (!confirm("האם ברצונך למחוק את התשלום?")) {
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

                Tablets and Desktops - Table View
                <div className="hidden flex-1 overflow-hidden sm:block">
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
                            <tr key={payment.paidAt + index} className="group">
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
          )} */}
        </dl>
      </div>

      <footer className="mt-4 mb-2 sm:hidden">
        <div className="justify-stretch flex flex-wrap">
          <Link
            to="edit"
            className={clsx([
              "inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100",
              { hidden: lesson.ended },
            ])}
          >
            <IconPencil
              className="h-5 w-auto ltr:mr-2 rtl:ml-2"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base">
              עריכת פרטי שיעור
            </span>
          </Link>

          <Form
            method="post"
            className="ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
          >
            <input type="hidden" name="_action" value="delete" />
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-red-400 bg-red-50 p-3 text-sm font-medium text-red-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={(e) => {
                if (!confirm("האם ברצונך למחוק את השיעור?")) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                return true;
              }}
            >
              <IconTrashX className="h-5 w-5 text-red-400" aria-hidden="true" />
              <span className="sr-only">מחק שיעור</span>
            </button>
          </Form>

          {/* <Link
            to="update-status"
            className={clsx([
              "mt-3 inline-flex basis-full items-center justify-center rounded-md border border-gray-300 bg-amber-500 px-2.5 py-3 text-sm font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100 sm:mt-0 sm:basis-0",
              { hidden: lesson.ended },
            ])}
          >
            <IconSquareRoundedCheckFilled className="h-4 w-auto ltr:mr-2 rtl:ml-2" />
            <span className="whitespace-nowrap">סיום השיעור ותשלום</span>
          </Link> */}

          <Link
            to="/lessons"
            className="mt-5 basis-full rounded-md bg-white text-center text-base font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
          >
            חזרה לשיעורים
          </Link>
        </div>
      </footer>
    </main>
  );
}
