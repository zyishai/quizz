import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { PaymentAccount } from "~/types/payment-account";
import { Contact, CreateContactDto, Student } from "~/types/student";
import { grades } from "~/utils/grades";
import AddContactModal from "./add-contact-modal";
import Dialog from "./dialog";
import InfoAlert from "./InfoAlert";
import SelectAccountModal from "./select-account-modal";
import SelectContactModal from "./select-contact-modal";
import SuccessAlert from "./SuccessAlert";
import WarningAlert from "./WarningAlert";

type AddStudentProps = {
  open: boolean;
  onClose: () => void;
  action?: string;
  contacts: Contact[];
  accounts: PaymentAccount[];
};
export default function AddStudentModal({
  open,
  onClose,
  action,
  contacts,
  accounts,
}: AddStudentProps) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [contactDtos, setContactDtos] = useState<CreateContactDto[]>([]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setNoAccount(false);
        setShowAccountModal(false);
        setAccountId(undefined);
        setContactDtos([]);
      }, 200);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="הוסף תלמיד חדש">
      <Dialog.Body>
        <Form
          method="post"
          action={action}
          className="mt-4"
          id="add-student-form"
          onSubmit={onClose}
        >
          <input type="hidden" name="_action" value="createNewStudent" />

          <div className="flex space-x-2 border-b border-gray-200 pb-6 rtl:space-x-reverse">
            <div className="flex-1">
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-500"
              >
                שם מלא
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                autoComplete="given-name"
                className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-semibold text-gray-500"
              >
                כיתה
              </label>
              <select
                id="grade"
                name="grade"
                autoComplete="none"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:py-2 sm:text-sm"
                aria-required="true"
              >
                {grades.map((grade) => (
                  <option value={grade.value} key={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="block text-sm font-semibold text-gray-500">
                אנשי קשר
              </h2>

              <button
                type="button"
                className="text-sm text-gray-400 sm:hover:underline"
                onClick={() => setShowContactModal(true)}
              >
                הוסף איש קשר
              </button>
            </div>

            <div className="mt-2">
              {contactDtos.length > 0 ? (
                <ul className="flex flex-wrap gap-x-2 gap-y-1">
                  {contactDtos.map((dto, index) => {
                    const contact =
                      dto.type === "existing"
                        ? contacts.find((c) => c.id === dto.id)
                        : dto;
                    const key =
                      dto.type === "existing" ? dto.id : dto.fullName + index;
                    return contact ? (
                      <>
                        <input
                          type="hidden"
                          name="contact"
                          value={JSON.stringify(dto)}
                        />
                        <li
                          key={key}
                          className="inline-flex items-center rounded-full bg-amber-100 py-0.5 text-xs font-medium text-amber-700 ltr:pl-2 ltr:pr-0.5 rtl:pr-2 rtl:pl-0.5 sm:text-sm ltr:sm:pl-2.5 ltr:sm:pr-1 rtl:sm:pr-2.5 rtl:sm:pl-1"
                        >
                          {contact.fullName}
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-amber-400 hover:bg-amber-200 hover:text-amber-500 focus:bg-amber-500 focus:text-white focus:outline-none ltr:ml-0.5 rtl:mr-0.5"
                            onClick={() =>
                              setContactDtos(
                                dto.type === "existing"
                                  ? contactDtos.filter(
                                      (contact) =>
                                        contact.type === "new" ||
                                        contact.id !== dto.id
                                    )
                                  : contactDtos.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <span className="sr-only">
                              הסר איש קשר {contact.fullName}
                            </span>
                            <svg
                              className="h-2 w-2"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 8 8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeWidth="1.5"
                                d="M1 1l6 6m0-6L1 7"
                              />
                            </svg>
                          </button>
                        </li>
                      </>
                    ) : null;
                  })}
                </ul>
              ) : (
                <WarningAlert title="עוד לא הוספת אנשי קשר" />
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="account"
                className="block text-sm font-semibold text-gray-500"
              >
                חשבון תשלום
              </label>

              <button
                type="button"
                className="text-sm text-gray-400 sm:hover:underline"
              >
                מה זה?
              </button>
            </div>
            {noAccount ? (
              <WarningAlert title="ללא חשבון תשלום (לא מומלץ)">
                <p>
                  לא תוכל לעקוב אחר החיובים והתשלומים שבוצעו עבור תלמיד זה!
                  <br /> אם בטעות בחרת אפשרות זו ודא שהאפשרות ״אל תיצור חשבון
                  תשלום״ לא מסומנת או{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setNoAccount(false)}
                  >
                    לחץ כאן
                  </button>
                  .
                </p>
              </WarningAlert>
            ) : accountId ? (
              <>
                <SuccessAlert title="חשבון נבחר בהצלחה">
                  <p>
                    חשבון נבחר בהצלחה, תלמידים הרשומים לחשבון זה:{" "}
                    {(
                      accounts.find((acc) => acc.id === accountId)
                        ?.students as Student[]
                    )
                      .map((s) => s.fullName)
                      .join(", ")}
                    . <br />
                    ניתן{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setShowAccountModal(true)}
                    >
                      לשנות חשבון
                    </button>{" "}
                    או{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setAccountId(undefined)}
                    >
                      ליצור חשבון חדש
                    </button>
                    .
                  </p>
                </SuccessAlert>
                <input
                  type="hidden"
                  name="paymentAccountId"
                  value={accountId}
                />
              </>
            ) : (
              <InfoAlert title="חשבון חדש">
                <p>
                  חשבון חדש יווצר עבור התלמיד הזה באופן אוטומטי. אם ברצונך
                  להוסיף את התלמיד הזה לחשבון של תלמיד אחר,{" "}
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="underline"
                  >
                    לחץ כאן
                  </button>
                  .
                </p>
              </InfoAlert>
            )}
          </div>

          <div className="relative mt-2 flex items-start">
            <div className="flex h-6 items-center">
              <input
                id="noAccount"
                aria-describedby="no-account-description"
                name="noAccount"
                type="checkbox"
                checked={noAccount}
                onChange={(e) => {
                  setNoAccount(e.target.checked);
                  setAccountId(undefined);
                }}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
              />
            </div>
            <div className="text-sm leading-6 ltr:ml-2 rtl:mr-2">
              <label
                htmlFor="noAccount"
                className="font-medium text-gray-400"
                id="no-account-description"
              >
                אל תיצור חשבון תשלום
              </label>
            </div>
          </div>

          <SelectAccountModal
            open={showAccountModal}
            onClose={(accountId?: string) => {
              setShowAccountModal(false);
              if (accountId) {
                setAccountId(accountId);
              }
            }}
            accounts={accounts}
          />
          <SelectContactModal
            open={showContactModal}
            onClose={(dto) => {
              setShowContactModal(false);
              if (dto) {
                setContactDtos([...contactDtos, dto]);
              }
            }}
            contacts={contacts.filter(
              (contact) =>
                !contactDtos.some(
                  (dto) => dto.type === "existing" && dto.id === contact.id
                )
            )}
          />
        </Form>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
          <button
            type="submit"
            form="add-student-form"
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
