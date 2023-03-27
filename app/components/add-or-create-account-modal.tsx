import { Form } from "@remix-run/react";
import { useState } from "react";
import { PaymentAccount } from "~/types/payment-account";
import { Student } from "~/types/student";
import Dialog from "./dialog";

type AddOrCreateAccountModalProps = {
  student?: Student;
  accounts: PaymentAccount[];
  open: boolean;
  onClose: () => void;
  action?: string;
};
export default function AddOrCreatePaymentAccountModal({
  student,
  accounts,
  open,
  onClose,
  action,
}: AddOrCreateAccountModalProps) {
  const [enableAccountSelector, setEnableAccountSelector] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} title="הוספת חשבון תשלום">
      <Dialog.Body>
        <p className="text-sm text-gray-500">
          הוסף או צור חשבון תשלום עבור {student?.fullName}
        </p>

        <Form
          method="post"
          action={action}
          className="mt-5"
          id="add-account-form"
          onSubmit={onClose}
        >
          <input type="hidden" name="_action" value="addPaymentAccount" />
          <input type="hidden" name="studentId" value={student?.id} />
          <fieldset className="ltr:pl-1 rtl:pr-1">
            <legend className="sr-only">חשבון תשלום</legend>
            <div className="space-y-5">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="new"
                    name="paymentAccount"
                    type="radio"
                    value="new"
                    defaultChecked
                    className="h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-600"
                    onChange={() => setEnableAccountSelector(false)}
                  />
                </div>
                <div className="text-sm leading-6 ltr:ml-3 rtl:mr-3">
                  <label htmlFor="new" className="font-medium text-gray-900">
                    צור חשבון חדש
                  </label>
                </div>
              </div>

              <div className="relative flex items-center">
                <div className="flex h-6 items-center">
                  <input
                    id="existing"
                    name="paymentAccount"
                    type="radio"
                    value="existing"
                    className="h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-600"
                    onChange={() => setEnableAccountSelector(true)}
                  />
                </div>
                <div className="flex items-center space-x-3 text-sm leading-6 ltr:ml-3 rtl:mr-3 rtl:space-x-reverse">
                  <label
                    htmlFor="existing"
                    className="whitespace-nowrap font-medium text-gray-900"
                  >
                    בחר חשבון קיים:
                  </label>
                  <select
                    name="paymentAccountId"
                    id="paymentAccountId"
                    className="block w-full rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-100"
                    disabled={!enableAccountSelector}
                  >
                    {accounts.map((account, index) => (
                      <option key={account.id} value={account.id}>
                        חשבון #{index + 1} - תלמידים:{" "}
                        {account.students
                          .map((student) =>
                            typeof student !== "string"
                              ? student.fullName
                              : null
                          )
                          .join(", ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>
        </Form>
      </Dialog.Body>
      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            form="add-account-form"
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
          >
            שמור שינויים
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            ביטול
          </button>
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}
