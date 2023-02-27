import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { safeRedirect } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import PaymentForm from "~/components/payment-form";
import { addPayment, getLesson } from "~/handlers/lessons.server";
import { getCreditsForStudent } from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { PaymentMethod, PaymentStatus } from "~/types/payment";
import { AppError } from "~/utils/app-error";
import { assertNumber } from "~/utils/misc";
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
      const price = Number(formData.get("price"));
      assertNumber(price);
      const paymentMethod = formData.get("paymentMethod")?.toString() as
        | PaymentMethod
        | undefined;
      let sum = undefined;
      if (formData.has("sum") && !isNaN(Number(formData.get("sum")))) {
        sum = Number(formData.get("sum"));
      }
      const creditId = formData.get("creditId")?.toString();

      if (
        !(await addPayment({ lessonId, price, paymentMethod, sum, creditId }))
      ) {
        return json({
          fields: {
            paymentStatus: formData
              .get("paymentStatus")
              ?.toString() as PaymentStatus,
            paymentMethod,
            sum,
            creditId,
          },
          error: "לא הצלחנו להוסיף את התשלום המבוקש.",
        });
      }

      return redirect(safeRedirect(`/calendar/${lessonId}`, "/calendar"));
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
      const { lessonId = "" } = params;
      const lesson = await getLesson(teacher.id, lessonId);
      if (!lesson) {
        throw new AppError({ errType: ErrorType.LessonNotFound });
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

export default function AddPaymentPage() {
  const { lesson, credits } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="overflow-auto px-2 pb-2">
      <header className="mb-4 sm:mb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          ביצוע תשלום
        </h3>
        {/* <p className="mt-1 text-sm text-gray-500">
          מלא את פרטי איש הקשר בטופס בבקשה.
        </p> */}
      </header>
      <PaymentForm
        price={lesson.price}
        credits={credits}
        fields={actionData?.fields}
        back={`/calendar/${lesson.id}`}
      />
    </div>
  );
}
