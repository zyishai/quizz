import { Form } from "@remix-run/react";
import { CreditTransaction, PaymentAccount } from "~/types/payment-account";
import Dialog from "./dialog";
import { IconCurrencyShekel } from "~/utils/icons";
import { paymentMethods } from "~/utils/payment-methods";
import { haveStudentsFetched } from "~/utils/misc";

type EditTransactionProps = {
  open: boolean;
  onClose: () => void;
  action?: string;
  account: PaymentAccount;
  transaction?: CreditTransaction;
};
export default function EditTransactionModal({
  open,
  onClose,
  action,
  account,
  transaction,
}: EditTransactionProps) {
  const studentsFetched = haveStudentsFetched(account);

  return (
    <Dialog open={open} onClose={onClose} title="ערוך תשלום">
      <Dialog.Body>
        <p className="text-sm text-gray-500">ערוך תשלום עבור החשבון</p>

        <Form
          method="post"
          action={action}
          className="mt-5"
          id="edit-transaction-form"
          onSubmit={onClose}
        >
          <input type="hidden" name="_action" value="editTransaction" />
          <input type="hidden" name="accountId" value={account.id} />
          <input type="hidden" name="transactionId" value={transaction?.id} />

          <div className="flex space-x-2 rtl:space-x-reverse">
            <div className="flex-1">
              <label
                htmlFor="sum"
                className="block text-sm font-semibold text-gray-500"
              >
                סכום
              </label>
              <div className="group relative mt-1 rounded-md shadow-sm">
                <input
                  type="number"
                  name="sum"
                  id="sum"
                  inputMode="numeric"
                  className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:py-2.5 sm:text-sm"
                  defaultValue={transaction?.sum}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <IconCurrencyShekel
                    className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="method"
                className="block text-sm font-semibold text-gray-500"
              >
                אופן תשלום
              </label>
              <select
                id="method"
                name="method"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:py-2 sm:text-sm"
                defaultValue={transaction?.method}
                aria-required="true"
              >
                {paymentMethods.map((method) => (
                  <option value={method.value} key={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {studentsFetched ? (
            <div className="mt-5">
              <label
                htmlFor="method"
                className="block text-sm font-semibold text-gray-500"
              >
                בחר תלמיד עבורו בוצע התשלום
              </label>
              <select
                id="studentId"
                name="studentId"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:py-2 sm:text-sm"
                defaultValue={transaction?.student}
                aria-required="true"
              >
                {account.students.map((student) => (
                  <option value={student.id} key={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </Form>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
          <button
            type="submit"
            form="edit-transaction-form"
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
            autoFocus
          >
            שמירה
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
