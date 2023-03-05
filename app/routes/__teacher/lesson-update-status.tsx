import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useState } from "react";
import { badRequest, redirectBack, safeRedirect } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { finishLesson, getLesson } from "~/handlers/lessons.server";
import { getCreditsForStudent } from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { PaymentMethod, PaymentStatus } from "~/types/payment";
import { Student } from "~/types/student";
import { AppError } from "~/utils/app-error";
import { formatDate } from "~/utils/datetime";
import { assertNumber, hasEventFetched } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { lessonId } = params;
      if (!lessonId) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }

      const formData = await request.formData();

      const summary = formData.get("summary")?.toString();

      const price = Number(formData.get("price"));
      assertNumber(price);

      const creditId = formData.get("creditId")?.toString();

      let paymentMethod = formData.get("paymentMethod")?.toString() as
        | PaymentMethod
        | undefined;
      if (paymentMethod && !(paymentMethod in PaymentMethod)) {
        paymentMethod = undefined;
      }

      let sum = undefined;
      if (formData.has("sum")) {
        sum = Number(formData.get("sum"));
        assertNumber(sum);
      }

      if (
        !(await finishLesson({
          lessonId,
          summary,
        }))
      ) {
        throw badRequest({
          message: "לא הצלחנו לעדכן תשלום. אנא נסו שנית מאוחר יותר.",
        });
      }

      return redirect(safeRedirect(`/lessons/${lessonId}`, "/lessons"));
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { lessonId } = params;
      if (!lessonId) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }

      const lesson = await getLesson(teacher.id, lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
      }
      if (lesson.ended) {
        throw redirectBack(request, { fallback: "/lessons" });
      }
      const credits =
        typeof lesson.student === "string"
          ? []
          : await getCreditsForStudent(lesson.student);

      return json({ lesson, credits });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

const payingOptions = [
  { value: PaymentStatus.DEBIT, label: "לא שולם", description: "" },
  {
    value: PaymentStatus.DIRECT,
    label: "תשלום רגיל",
    description: "תשלום חד פעמי עבור השיעור (אשראי, ביט, מזומן וכד׳)",
  },
  {
    value: PaymentStatus.CREDIT,
    label: "תשלום קרדיט",
    description: "עבור שיעורים ששולמו מראש (קרדיט)",
  },
];

const paymentMethods = [
  { value: PaymentMethod.CASH, label: "מזומן" },
  { value: PaymentMethod.CREDIT_CARD, label: "כרטיס אשראי" },
  { value: PaymentMethod.BIT, label: "ביט (Bit)" },
  { value: PaymentMethod.PAYPAL, label: "פייפאל (Paypal)" },
];

export default function UpdateLessonStatus() {
  const { lesson, credits } = useLoaderData<typeof loader>();
  // const eventFetched = hasEventFetched(lesson);
  const [selectedPayingOption, setSelectedPayingOption] = useState(
    PaymentStatus.DEBIT
  );

  return (
    <main className="flex flex-1 flex-col overflow-hidden px-4 py-1">
      <section className="overflow-auto ltr:pl-1 rtl:pr-1">
        <Form
          method="post"
          replace
          className="grid max-w-[672px] grid-cols-6 gap-6"
        >
          <div className="col-span-6">
            <label
              htmlFor="summary"
              className="block text-sm font-semibold text-gray-700"
            >
              סיכום השיעור
            </label>
            <textarea
              name="summary"
              id="summary"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              defaultValue={""}
            ></textarea>
          </div>

          <div className="col-span-6">
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-700"
            >
              מחיר
            </label>
            <input
              type="number"
              name="price"
              id="price"
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-gray-300 focus:ring-0 sm:text-sm"
              defaultValue={lesson.price}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div className="col-span-6">
            <label className="text-sm font-semibold text-gray-900">
              סוג תשלום
            </label>
            <fieldset className="mt-0">
              <legend className="sr-only">ביצוע תשלום</legend>
              <div className="divide-y divide-gray-200">
                {payingOptions.map((option) => (
                  <div
                    className="flex items-center py-4 px-1"
                    key={option.value}
                  >
                    <input
                      id={option.value}
                      name="paymentStatus"
                      type="radio"
                      checked={option.value === selectedPayingOption}
                      value={option.value}
                      onChange={(e) => setSelectedPayingOption(option.value)}
                      className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm ltr:ml-3 rtl:mr-3"
                    >
                      <header className="block text-sm font-medium text-gray-800">
                        {option.label}
                      </header>
                      <p className="text-gray-500">{option.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          {selectedPayingOption !== PaymentStatus.DEBIT ? (
            <div className="col-span-6">
              <label className="text-sm font-semibold text-gray-900">
                אופן תשלום
              </label>

              {selectedPayingOption === PaymentStatus.DIRECT ? (
                <>
                  <fieldset className="mt-4 px-1">
                    <legend className="sr-only">תשלום ישיר</legend>
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.value} className="flex items-center">
                          <input
                            id={method.value}
                            name="paymentMethod"
                            value={method.value}
                            type="radio"
                            defaultChecked={method.value === PaymentMethod.CASH}
                            className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <label
                            htmlFor={method.value}
                            className="block text-sm font-medium text-gray-700 ltr:ml-3 rtl:mr-3"
                          >
                            {method.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-6">
                    <label
                      htmlFor="sum"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      סכום (בשקלים)
                    </label>
                    <input
                      type="number"
                      name="sum"
                      id="sum"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
                      defaultValue={lesson.price}
                    />
                  </div>
                </>
              ) : selectedPayingOption === PaymentStatus.CREDIT ? (
                <div className="divide-y divide-gray-200">
                  {credits.map((credit, index) => (
                    <div
                      key={credit.id}
                      className="relative flex items-start py-4 px-1"
                    >
                      <div className="flex h-5 items-center ltr:mr-3 rtl:ml-3">
                        <input
                          id={`credit-${credit.id}`}
                          name="creditId"
                          value={credit.id}
                          type="radio"
                          defaultChecked={index === 0}
                          className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                        />
                      </div>
                      <label
                        className="min-w-0 flex-1 text-sm"
                        htmlFor={`credit-${credit.id}`}
                      >
                        <div className="font-semibold text-gray-700">
                          קרדיט ע״ס {credit.sum} &#8362;
                        </div>
                        <p className="text-gray-500">
                          נותרו: {credit.remaining} &#8362;
                        </p>
                      </label>
                    </div>
                  ))}
                  {credits.length === 0 && (
                    <p className="text-sm text-gray-400">
                      אין קרדיטים עבור תלמיד זה
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="col-span-6 flex flex-col justify-end space-y-3 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <Link
              to={`/lessons/${lesson.id}`}
              className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
            >
              ביטול וחזרה
            </Link>
            <button
              type="submit"
              className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
            >
              סיום
            </button>
          </div>
        </Form>
      </section>
    </main>
  );
}
