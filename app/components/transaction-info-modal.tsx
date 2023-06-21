import Dialog from "./dialog";
import type { Transaction } from "~/types/payment-account";
import EditTransactionModal from "./edit-transaction-modal";
import { useState } from "react";
import { Form } from "@remix-run/react";
import DeleteTransactionModal from "./delete-transaction-modal";

type TransactionInfoProps = {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
};
export default function TransactionInfoModal({
  open,
  onClose,
  transaction,
}: TransactionInfoProps) {
  const [showEditTransactionModal, setShowEditTransactionModal] =
    useState(false);
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] =
    useState(false);

  return (
    <>
      <Dialog open={open} onClose={onClose} title="בחר פעולה">
        <Dialog.Body>
          <div className="sm:flex sm:min-w-[360px] sm:flex-col">
            <button
              type="button"
              className="flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500"
              onClick={() => setShowEditTransactionModal(true)}
              autoFocus
            >
              ערוך
            </button>
            <Form
              method="post"
              className="mt-3 block w-full"
              onSubmit={onClose}
            >
              <input
                type="hidden"
                name="paymentId"
                value={transaction?.paymentId}
              />
              <input
                type="hidden"
                name="lessonId"
                value={transaction?.billingId}
              />
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-amber-200"
                onClick={(e) => {
                  if (!transaction?.paymentId || !transaction.billingId) {
                    if (
                      transaction?.paymentId &&
                      !confirm(
                        `האם ברצונך למחוק תשלום ע״ס ${transaction?.credit} ש״ח?`
                      )
                    ) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                    if (
                      transaction?.billingId &&
                      !confirm(
                        `האם ברצונך למחוק חיוב ע״ס ${transaction.debit} ש״ח? פעולה זו תמחק את השיעור.`
                      )
                    ) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  } else {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteTransactionModal(true);
                    return false;
                  }
                }}
                name="_action"
                value={transaction?.paymentId ? "deleteCredit" : "deleteDebit"}
              >
                מחק
              </button>
            </Form>
            <button
              type="button"
              className="mt-3 flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
          <DeleteTransactionModal
            open={showDeleteTransactionModal}
            onClose={() => {
              setShowDeleteTransactionModal(false);
              onClose();
            }}
            transaction={transaction}
          />
        </Dialog.Body>
      </Dialog>
    </>
  );
}
