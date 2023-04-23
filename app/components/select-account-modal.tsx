import { useState } from "react";
import { PaymentAccount } from "~/types/payment-account";
import { haveStudentsFetched } from "~/utils/misc";
import Dialog from "./dialog";

type SelectAccountProps = {
  open: boolean;
  onClose: (accountId?: string) => void;
  accounts: PaymentAccount[];
};
export default function SelectAccountModal({
  open,
  onClose,
  accounts,
}: SelectAccountProps) {
  const [accountId, setAccountId] = useState<string>(accounts?.[0]?.id);

  return (
    <Dialog open={open} onClose={() => onClose()} title="בחר חשבון תשלום">
      <Dialog.Body>
        <p className="mb-4 text-sm text-gray-500">
          בחר חשבון מתוך הרשימה. התלמיד שתיצור יתווסף לחשבון זה.
        </p>

        <select
          autoComplete="none"
          className="block w-full rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:py-2 sm:text-sm"
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts?.filter(haveStudentsFetched)?.map((account, index) => (
            <option value={account.id} key={account.id}>
              {index + 1}.{" "}
              {account.students.length > 0
                ? `תלמידים: ${account.students
                    .map((s) => s.fullName)
                    .join(", ")}`
                : "אין תלמידים"}
            </option>
          ))}
        </select>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
            onClick={() => onClose(accountId)}
          >
            שמירה
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
  );
}
