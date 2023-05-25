import { Form } from "@remix-run/react";
import Dialog from "./dialog";
import { PaymentAccount } from "~/types/payment-account";
import InfoAlert from "./InfoAlert";

type ResetInitialBalanceProps = {
  open: boolean;
  onClose: () => void;
  action?: string;
  account: PaymentAccount;
};
export default function ResetInitialBalanceModal({
  open,
  onClose,
  action,
  account,
}: ResetInitialBalanceProps) {
  return (
    <>
      <Dialog open={open} onClose={onClose} title="מאזן התחלתי">
        <Dialog.Body>
          <InfoAlert title="מה זה?">
            <p>
              במידה ויש תלמיד שהתחיל עם מאזן שלילי/חיובי בחשבון לפני התחלת
              השימוש באפליקציה, ניתן להכניס כאן את המאזן ההתחלתי של התלמיד.
            </p>
          </InfoAlert>

          <Form
            method="post"
            action={action}
            className="mt-5"
            id="reset-initial-balance-form"
            onSubmit={onClose}
          >
            <input type="hidden" name="_action" value="resetInitialBalance" />
            <input type="hidden" name="accountId" value={account.id} />

            <div>
              <label
                htmlFor="balance"
                className="block text-sm font-semibold text-gray-500"
              >
                סכום
              </label>
              <input
                type="number"
                name="balance"
                id="balance"
                autoComplete="none"
                dir="ltr"
                className="mt-1 block w-full rounded-md border-gray-300 py-1 text-right shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
                required
                aria-required="true"
              />
            </div>
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <div className="sm:flex sm:flex-row-reverse sm:ltr:ml-40 sm:rtl:mr-40">
            <button
              type="submit"
              form="reset-initial-balance-form"
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
              autoFocus
            >
              שמור שינויים
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
