import { Form } from "@remix-run/react";
import Dialog from "./dialog";
import { Lesson } from "~/types/lesson";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { paymentMethods } from "~/utils/payment-methods";
import InfoAlert from "./InfoAlert";
import SuccessAlert from "./SuccessAlert";

type AddPaymentProps = {
  open: boolean;
  onClose: () => void;
  action?: string;
  lesson?: Lesson;
};
export default function AddPaymentModal({
  open,
  onClose,
  action,
  lesson,
}: AddPaymentProps) {
  if (!lesson || !hasEventFetched(lesson) || !hasStudentFetched(lesson)) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="תשלום עבור שיעור">
        <Dialog.Body>
          <Form
            method="post"
            action={action}
            className="mt-5"
            id="add-payment-form"
            onSubmit={onClose}
          >
            <input type="hidden" name="_action" value="makePayment" />
            <input type="hidden" name="lessonId" value={lesson?.id} />

            {lesson.paid > 0 &&
              (lesson.paid < (lesson.price * lesson.event.duration) / 60 ? (
                <InfoAlert title="שולם חלקית">
                  <p>
                    בוצעו תשלומים ע״ס <strong>{lesson.paid}</strong> ש״ח עבור
                    שיעור זה.
                  </p>
                </InfoAlert>
              ) : (
                <SuccessAlert title="שולם במלואו">
                  <p>
                    בוצעו תשלומים ע״ס <strong>{lesson.paid}</strong> ש״ח עבור
                    שיעור זה.
                  </p>
                </SuccessAlert>
              ))}

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-2 sm:rtl:space-x-reverse">
              <div className="flex-1">
                <label
                  htmlFor="sum"
                  className="block text-sm font-semibold text-gray-500"
                >
                  סכום
                </label>
                <input
                  type="number"
                  name="sum"
                  id="sum"
                  autoComplete="none"
                  className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
                  defaultValue={Math.max(
                    (lesson.price * lesson.event.duration) / 60 - lesson.paid,
                    0
                  )}
                />
              </div>
              <div className="">
                <label
                  htmlFor="paymentMethod"
                  className="block text-sm font-semibold text-gray-500"
                >
                  אופן תשלום
                </label>
                <select
                  name="paymentMethod"
                  id="paymentMethod"
                  className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:py-2 sm:text-sm"
                  required
                  aria-required="true"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <div className="sm:flex sm:flex-row-reverse sm:ltr:ml-40 sm:rtl:mr-40">
            <button
              type="submit"
              form="add-payment-form"
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              autoFocus
            >
              שמור תשלום
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => onClose()}
            >
              ביטול
            </button>
          </div>
        </Dialog.Footer>
      </Dialog>
    </>
  );
}
