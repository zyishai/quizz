import Dialog from "./dialog";
import type { Transaction } from "~/types/payment-account";
import { Form } from "@remix-run/react";

type DeleteTransactionProps = {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
};
export default function DeleteTransactionModal({
  open,
  onClose,
  transaction,
}: DeleteTransactionProps) {
  if (!transaction) return null;
  return (
    <>
      <Dialog open={open} onClose={onClose} title="בחר פעולה">
        <Dialog.Body>
          <Form id="delete-credit" method="post" onSubmit={onClose}>
            <input type="hidden" name="_action" value="deleteCredit" />
            <input
              type="hidden"
              name="paymentId"
              value={transaction.paymentId}
            />
          </Form>
          <Form id="delete-debit" method="post" onSubmit={onClose}>
            <input type="hidden" name="_action" value="deleteDebit" />
            <input
              type="hidden"
              name="lessonId"
              value={transaction.billingId}
            />
          </Form>
          <Form id="delete-both" method="post" onSubmit={onClose}>
            <input type="hidden" name="_action" value="deleteTransaction" />
            <input
              type="hidden"
              name="paymentId"
              value={transaction.paymentId}
            />
            <input
              type="hidden"
              name="lessonId"
              value={transaction.billingId}
            />
          </Form>

          <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
            <button
              type="submit"
              form="delete-credit"
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              autoFocus
              onClick={(e) => {
                if (
                  !confirm(
                    `האם ברצונך למחוק תשלום ע״ס ${transaction.credit} ש״ח?`
                  )
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
            >
              מחק תשלום בלבד
            </button>
            <button
              type="submit"
              form="delete-debit"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              onClick={(e) => {
                if (
                  !confirm(
                    `האם ברצונך למחוק חיוב ע״ס ${transaction.debit} ש״ח? פעולה זו תמחק את השיעור.`
                  )
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
            >
              מחק חיוב בלבד
            </button>
            <button
              type="submit"
              form="delete-both"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              onClick={(e) => {
                if (
                  !confirm(
                    "פעולה זו תמחק גם את השיעור וגם את התשלום. האם אתה בטוח?"
                  )
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
            >
              מחק הכל
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              ביטול
            </button>
          </div>
        </Dialog.Body>
      </Dialog>
    </>
  );
}
