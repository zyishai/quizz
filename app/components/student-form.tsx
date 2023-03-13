import { Form } from "@remix-run/react";
import { useRef, useState } from "react";
import { PaymentAccount } from "~/types/payment-account";
import { Contact, ContactDraft, Grade } from "~/types/student";
import { grades } from "~/utils/grades";
import {
  AtSymbolIconOutline,
  ExclamationCircleIconOutline,
  PhoneIconOutline,
  XMarkIconOutline,
} from "~/utils/icons";

interface StudentFormProps {
  id: string;
  fields?: FormFields;
  fieldErrors?: FormFieldErrors;
  existingContacts?: Contact[];
  existingPaymentAccounts?: PaymentAccount[];
}
interface FormFields {
  fullName?: string;
  grade?: Grade;
  paymentAccountId?: string;
  contacts?: Array<ContactDraft>;
}
interface FormFieldErrors {
  fullName?: string;
  grade?: string;
  contacts?: string;
}

export default function StudentForm({
  id,
  fields,
  fieldErrors,
  existingContacts = [],
  existingPaymentAccounts = [],
}: StudentFormProps) {
  const contactIdRef = useRef<number>(0);
  const [contacts, setContacts] = useState(fields?.contacts || []);
  const addContactEntry = (type: "new" | "existing") => {
    setContacts((savedContacts) => [
      ...savedContacts,
      { id: `temp:${contactIdRef.current++}`, type },
    ]);
  };
  const removeContactEntry = (contactId: string) => {
    setContacts((savedContacts) =>
      savedContacts.filter((contact) => contact.id !== contactId)
    );
  };
  const [showAccountSelector, setShowAccountSelector] = useState(
    !!fields?.paymentAccountId
  );
  return (
    <Form
      id={id}
      method="post"
      replace
      className="mb-6 grid max-w-[672px] grid-cols-6 gap-6"
    >
      <div className="col-span-6">
        <label
          htmlFor="fullName"
          className="block text-sm font-semibold text-gray-700"
        >
          שם מלא
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          autoComplete="given-name"
          defaultValue={fields?.fullName || undefined}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors?.fullName) || undefined}
          aria-errormessage={
            fieldErrors?.fullName ? "fullname-error" : undefined
          }
        />
        {fieldErrors?.fullName ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="fullname-error"
            role="alert"
          >
            <ExclamationCircleIconOutline
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.fullName}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <label
          htmlFor="grade"
          className="block text-sm font-semibold text-gray-700"
        >
          כיתה
        </label>
        <select
          id="grade"
          name="grade"
          autoComplete="none"
          defaultValue={fields?.grade}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors?.grade) || undefined}
          aria-errormessage={fieldErrors?.grade ? "grade-error" : undefined}
        >
          {grades.map((grade) => (
            <option value={grade.value} key={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>
        {fieldErrors?.grade ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="grade-error"
            role="alert"
          >
            <ExclamationCircleIconOutline
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.grade}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <label className="block text-sm font-semibold text-gray-700">
          חשבון תשלום
        </label>
        <p className="text-sm text-gray-500">
          חשבון תשלום זו הכרטיסיה הדיגיטלית של התלמיד. ניתן לשים מספר תלמידים
          באותו החשבון (לדוגמא: אחים) אבל לא ניתן לשים את אותו התלמיד במספר
          חשבונות.
        </p>
        <fieldset className="mt-4 ltr:pl-1 rtl:pr-1">
          <legend className="sr-only">חשבון תשלום</legend>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="newAccount"
                name="paymentAccount"
                type="radio"
                value="new"
                defaultChecked={!fields?.paymentAccountId}
                className="h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-600"
                onChange={() => setShowAccountSelector(false)}
              />
              <label
                htmlFor="newAccount"
                className="block text-sm font-medium leading-6 text-gray-900 ltr:ml-3 rtl:mr-3"
              >
                צור חשבון חדש
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="existingAccount"
                name="paymentAccount"
                type="radio"
                value="existing"
                defaultChecked={!!fields?.paymentAccountId}
                className="h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-600"
                onChange={() => setShowAccountSelector(true)}
              />
              <label
                htmlFor="existingAccount"
                className="block text-sm font-medium leading-6 text-gray-900 ltr:ml-3 rtl:mr-3"
              >
                בחר חשבון קיים
              </label>
            </div>
            {showAccountSelector && (
              <select
                name="paymentAccountId"
                id="paymentAccountId"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 ltr:ml-6 rtl:mr-6 sm:text-sm"
                defaultValue={fields?.paymentAccountId}
              >
                {existingPaymentAccounts.map((account, index) => (
                  <option key={account.id} value={account.id}>
                    חשבון #{index + 1} - תלמידים:{" "}
                    {account.students
                      .map((student) =>
                        typeof student !== "string" ? student.fullName : null
                      )
                      .join(", ")}
                  </option>
                ))}
              </select>
            )}
          </div>
        </fieldset>
      </div>

      <div className="col-span-6">
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          אנשי קשר{" "}
          <span className="font-medium text-gray-800">
            (יש להוסיף לפחות איש קשר אחד)
          </span>
        </label>

        <fieldset
          className="space-y-3"
          aria-invalid={Boolean(fieldErrors?.contacts) || undefined}
          aria-errormessage={
            fieldErrors?.contacts ? "contacts-error" : undefined
          }
        >
          {contacts.map((contact, index) => {
            const type =
              contact.type ||
              (contact.id.startsWith("temp:") ? "new" : "existing");
            return type === "new" ? (
              <NewContactFieldset
                key={contact.id}
                contact={contact}
                index={index}
                onRemove={removeContactEntry}
              />
            ) : (
              <ExistingContactFieldset
                key={contact.id}
                contact={contact}
                index={index}
                contactsList={existingContacts}
                onRemove={removeContactEntry}
              />
            );
          })}
          <div className="relative flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 sm:flex-row sm:gap-3 sm:p-10">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              onClick={() => addContactEntry("existing")}
            >
              <svg
                className="h-5 w-6 ltr:mr-1 rtl:ml-1"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}>
                  <ellipse cx="32" cy="24" rx="12" ry="16" />
                  <path d="M22 33.46s-10.09 2.68-12 8A33 33 0 0 0 8 56h24" />
                  <path
                    d="M 46.095 56 C 46.095 56 36.005 53.32 34.095 48 C 32.345 43.365 31.662 38.395 32.095 33.46 L 56.095 33.46"
                    style={{
                      transformOrigin: "center center",
                      transform: "rotate(-180deg) translate(-40%, -40%)",
                    }}
                  />
                </g>
              </svg>
              <span>הוסף איש קשר קיים</span>
            </button>

            <span className="text-sm">או</span>

            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              onClick={() => addContactEntry("new")}
            >
              <svg
                className="h-5 w-6 ltr:mr-1 rtl:ml-1"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}>
                  <ellipse cx="32" cy="24" rx="12" ry="16"></ellipse>
                  <path d="M22 33.46s-10.09 2.68-12 8A33 33 0 0 0 8 56h24"></path>
                  <line x1="48" y1="56" x2="48" y2="40"></line>
                  <line x1="40" y1="48" x2="56" y2="48"></line>
                </g>
              </svg>
              <span>צור איש קשר חדש</span>
            </button>
          </div>
        </fieldset>

        {fieldErrors?.contacts ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="contacts-error"
            role="alert"
          >
            <ExclamationCircleIconOutline
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.contacts}
          </p>
        ) : null}
      </div>
    </Form>
  );
}

function NewContactFieldset({
  contact,
  index,
  onRemove,
}: {
  contact: ContactDraft & Partial<Contact>;
  index: number;
  onRemove: (contactId: Contact["id"]) => void;
}) {
  return (
    <fieldset className="relative col-span-6 grid gap-3 rounded-md border-2 border-dashed border-gray-300 p-4 pt-4">
      <legend className="absolute flex -translate-y-1/2 items-center bg-white ltr:right-3 rtl:left-3">
        <button
          onClick={() => onRemove(contact.id)}
          className="rounded-md bg-red-100 hover:bg-red-400 hover:text-white"
        >
          <XMarkIconOutline className="h-5 w-5" />
        </button>
      </legend>

      <input
        type="hidden"
        name={`contact[${index}]['type']`}
        value={contact.type || "new"}
      />
      <input
        type="hidden"
        name={`contact[${index}]['id']`}
        value={contact.id}
      />
      <div>
        <label
          htmlFor={`contact[${index}]['fullName']`}
          className="block text-sm font-medium text-gray-700"
        >
          שם איש/אשת הקשר
        </label>
        <input
          type="text"
          name={`contact[${index}]['fullName']`}
          id={`contact[${index}]['fullName']`}
          autoComplete="given-name"
          defaultValue={contact?.fullName}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          required
          minLength={2}
          aria-required="true"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={`contact[${index}]['address']`}
            className="block text-sm font-medium text-gray-700"
          >
            כתובת מגורים
          </label>
          <span className="text-xs text-gray-400" id="address-optional">
            לא חובה למלא
          </span>
        </div>
        <input
          type="text"
          name={`contact[${index}]['address']`}
          id={`contact[${index}]['address']`}
          defaultValue={contact?.address}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          aria-required="false"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={`contact[${index}]['phoneNumber']`}
            className="block text-sm font-medium text-gray-700"
          >
            מספר טלפון
          </label>
          <span className="text-xs text-gray-400" id="phone-optional">
            לא חובה למלא
          </span>
        </div>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 flex items-center ltr:left-0 ltr:pl-3 rtl:right-0 rtl:pr-3">
            <PhoneIconOutline
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="tel"
            name={`contact[${index}]['phoneNumber']`}
            id={`contact[${index}]['phoneNumber']`}
            defaultValue={contact?.phoneNumber}
            className="block w-full rounded-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 ltr:pl-10 rtl:pr-10 sm:text-sm"
            placeholder="000-000-0000"
            inputMode="tel"
            aria-required="false"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={`contact[${index}]['emailAddress']`}
            className="block text-sm font-medium text-gray-700"
          >
            כתובת מייל
          </label>
          <span className="text-xs text-gray-400" id="email-optional">
            לא חובה למלא
          </span>
        </div>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 flex items-center ltr:left-0 ltr:pl-3 rtl:right-0 rtl:pr-3">
            <AtSymbolIconOutline
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="email"
            name={`contact[${index}]['emailAddress']`}
            id={`contact[${index}]['emailAddress']`}
            defaultValue={contact?.emailAddress}
            className="block w-full rounded-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 ltr:pl-10 rtl:pr-10 sm:text-sm"
            inputMode="email"
            placeholder="demo@example.com"
            aria-required="false"
          />
        </div>
      </div>
    </fieldset>
  );
}
function ExistingContactFieldset({
  contact,
  contactsList,
  index,
  onRemove,
}: {
  contact: ContactDraft;
  contactsList: Contact[];
  index: number;
  onRemove: (contactId: Contact["id"]) => void;
}) {
  const defaultValue = contactsList.find((c) => c.id === contact.id)?.id;
  return (
    <fieldset className="relative col-span-6 grid gap-3 rounded-md border-2 border-dashed border-gray-300 p-4 pt-4">
      <legend className="absolute flex -translate-y-1/2 items-center bg-white ltr:right-3 rtl:left-3">
        <button
          onClick={() => onRemove(contact.id)}
          className="rounded-md bg-red-100 hover:bg-red-400 hover:text-white"
        >
          <XMarkIconOutline className="h-5 w-5" />
        </button>
      </legend>

      <input
        type="hidden"
        name={`contact[${index}]['type']`}
        value={contact.type || "existing"}
      />
      <div>
        <label
          htmlFor={`contact[${index}]['id']`}
          className="block text-sm font-medium text-gray-700"
        >
          בחר איש/אשת קשר
        </label>
        <select
          id={`contact[${index}]['id']`}
          name={`contact[${index}]['id']`}
          autoComplete="none"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
          defaultValue={defaultValue}
          required
        >
          <option value={undefined} disabled selected={!defaultValue}></option>
          {contactsList.map((existingContact) => (
            <option value={existingContact.id} key={existingContact.id}>
              {existingContact.fullName}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
