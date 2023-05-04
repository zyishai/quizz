import Dialog from "./dialog";
import type { Payment, PaymentAccount } from "~/types/payment-account";
import EditTransactionModal from "./edit-transaction-modal";
import { useState } from "react";
import { Form } from "@remix-run/react";

type TransactionInfoProps = {
  open: boolean;
  onClose: () => void;
  account: PaymentAccount;
  transaction?: Payment;
};
export default function TransactionInfoModal({
  open,
  onClose,
  account,
  transaction,
}: TransactionInfoProps) {
  const [showEditTransactionModal, setShowEditTransactionModal] =
    useState(false);

  return (
    <>
      <Dialog open={open} onClose={onClose} title="בחר פעולה">
        <Dialog.Body>
          <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              onClick={() => setShowEditTransactionModal(true)}
              autoFocus
            >
              ערוך פרטי תשלום
            </button>
            <Form method="post" className="mt-3">
              <input type="hidden" name="_action" value="deleteTransaction" />
              <input type="hidden" name="accountId" value={account.id} />
              <input
                type="hidden"
                name="transactionId"
                value={transaction?.id}
              />
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-amber-200 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
                onClick={(e) => {
                  if (
                    !confirm(
                      `האם ברצונך למחוק תשלום ע״ס ${transaction?.sum} ש״ח?`
                    )
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  onClose();
                }}
              >
                מחק תשלום
              </button>
            </Form>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              ביטול
            </button>
          </div>
          <EditTransactionModal
            open={showEditTransactionModal}
            onClose={() => {
              setShowEditTransactionModal(false);
              onClose();
            }}
            transaction={transaction}
          />
        </Dialog.Body>
      </Dialog>
    </>
  );
}
