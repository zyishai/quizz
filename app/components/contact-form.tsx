import {
  AtSymbolIcon,
  ExclamationCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Form } from "@remix-run/react";

interface ContactFormProps {
  id: string;
  fields?: FormFields;
  fieldErrors?: FormFieldErrors;
}
interface FormFields {
  id?: string;
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
}
interface FormFieldErrors {
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
}

export default function ContactForm({
  id,
  fields,
  fieldErrors,
}: ContactFormProps) {
  return (
    <Form
      id={id}
      method="post"
      replace
      className="mb-6 grid max-w-[672px] grid-cols-6 gap-6"
    >
      <input type="hidden" name="id" value={fields?.id} />

      <div className="col-span-6">
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700"
        >
          שם איש/אשת הקשר
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          autoComplete="given-name"
          defaultValue={fields?.fullName}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          required
          minLength={2}
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
            <ExclamationCircleIcon
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.fullName}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="address"
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
          name="address"
          id="address"
          defaultValue={fields?.address}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          aria-required="false"
          aria-invalid={Boolean(fieldErrors?.address) || undefined}
          aria-errormessage={fieldErrors?.address ? "address-error" : undefined}
        />
        {fieldErrors?.address ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="address-error"
            role="alert"
          >
            <ExclamationCircleIcon
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.address}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="phoneNumber"
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
            <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            defaultValue={fields?.phoneNumber}
            className="block w-full rounded-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 ltr:pl-10 rtl:pr-10 sm:text-sm"
            placeholder="000-000-0000"
            inputMode="tel"
            aria-required="false"
            aria-invalid={Boolean(fieldErrors?.phoneNumber) || undefined}
            aria-errormessage={
              fieldErrors?.phoneNumber ? "phonenumber-error" : undefined
            }
          />
        </div>
        {fieldErrors?.phoneNumber ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="phonenumber-error"
            role="alert"
          >
            <ExclamationCircleIcon
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.phoneNumber}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="emailAddress"
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
            <AtSymbolIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="email"
            name="emailAddress"
            id="emailAddress"
            defaultValue={fields?.emailAddress}
            className="block w-full rounded-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 ltr:pl-10 rtl:pr-10 sm:text-sm"
            inputMode="email"
            placeholder="demo@example.com"
            aria-required="false"
            aria-invalid={Boolean(fieldErrors?.emailAddress) || undefined}
            aria-errormessage={
              fieldErrors?.emailAddress ? "emailaddress-error" : undefined
            }
          />
        </div>
        {fieldErrors?.emailAddress ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="emailaddress-error"
            role="alert"
          >
            <ExclamationCircleIcon
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.emailAddress}
          </p>
        ) : null}
      </div>

      {/* <div className="col-span-6 flex flex-col justify-end space-y-3 space-y-reverse rtl:space-x-reverse sm:flex-row sm:space-y-0 sm:space-x-3">
        {typeof back === "string" ? (
          <Link
            to={back}
            className="order-2 rounded-md border border-gray-300 bg-white py-2.5 px-4 text-center font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:py-2 sm:text-sm"
          >
            ביטול
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            className="order-2 rounded-md border border-gray-300 bg-white py-2.5 px-4 text-center font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:py-2 sm:text-sm"
          >
            ביטול
          </button>
        )}
        <button
          type="submit"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          שמור שינויים
        </button>
      </div> */}
    </Form>
  );
}
