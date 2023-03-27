import { Switch } from "@headlessui/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Contact, CreateContactDto } from "~/types/student";
import Dialog from "./dialog";

type SelectContactProps = {
  open: boolean;
  onClose: (dto?: CreateContactDto) => void;
  contacts: Contact[];
};
export default function SelectContactModal({
  open,
  onClose,
  contacts,
}: SelectContactProps) {
  const [newContact, setNewContact] = useState(false);
  const contactNameRef = useRef<HTMLInputElement | null>(null);
  const contactIdRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!open) {
      setNewContact(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={() => onClose()} title="הוספת איש קשר">
      <Dialog.Body>
        {newContact ? (
          <input
            type="text"
            name="contactName"
            required
            aria-required="true"
            placeholder="שם איש/אשת הקשר"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            ref={contactNameRef}
          />
        ) : (
          <select
            name="contactId"
            required
            aria-required="true"
            autoComplete="none"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            ref={contactIdRef}
          >
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName}
              </option>
            ))}
          </select>
        )}

        <Switch.Group as="div" className="mt-5 flex items-center">
          <Switch
            checked={newContact}
            onChange={setNewContact}
            className={clsx(
              newContact ? "bg-amber-500" : "bg-gray-200",
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-amber-600 focus:ring-offset-2"
            )}
          >
            <span className="sr-only">צור איש קשר חדש</span>
            <span
              className={clsx(
                newContact ? "-translate-x-4" : "translate-x-0",
                "pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              )}
            >
              <span
                className={clsx(
                  newContact
                    ? "opacity-0 duration-100 ease-out"
                    : "opacity-100 duration-200 ease-in",
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className={clsx(
                  newContact
                    ? "opacity-100 duration-200 ease-in"
                    : "opacity-0 duration-100 ease-out",
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                </svg>
              </span>
            </span>
          </Switch>
          <Switch.Label as="span" className="text-sm ltr:ml-3 rtl:mr-3">
            <span className="font-medium text-gray-400">צור איש קשר חדש</span>
          </Switch.Label>
        </Switch.Group>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:ml-40 sm:rtl:mr-40">
          <button
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
            onClick={() =>
              onClose(
                newContact
                  ? {
                      type: "new",
                      fullName: contactNameRef.current?.value as string,
                    }
                  : {
                      type: "existing",
                      id: contactIdRef.current?.value as string,
                    }
              )
            }
          >
            הוסף את איש הקשר
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
