import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { badRequest } from "remix-utils";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import ContactForm from "~/components/contact-form";
import {
  constructUpdateContactDto,
  getContact,
  updateContactDetails,
} from "~/handlers/contacts.server";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getUserId, requireUserId } from "~/utils/session.server";

// function validateFullName(name?: string) {
//   if (!name) return;

//   if (!validator.isLength(name, { min: 2 })) {
//     return `שם קצר מדי.`;
//   }
//   if (!validator.isAlpha(name, "he", { ignore: " " })) {
//     return `שם לא תקין. יש לציין שם באותיות עבריות בלבד`;
//   }
// }
// function validatePhoneNumber(phoneNo?: string) {
//   if (!phoneNo) return;

//   if (!validator.isMobilePhone(phoneNo, "he-IL")) {
//     return `מספר פלאפון לא תקין`;
//   }
// }
// function validateEmailAddress(emailAddress?: string) {
//   if (!emailAddress) return;

//   if (!validator.isEmail(emailAddress)) {
//     return `כתובת מייל לא תקינה`;
//   }
// }

export const action = async ({ request, params }: ActionArgs) => {
  await requireUserId(request);

  const { contactId } = params;
  const fields = await constructUpdateContactDto(request, contactId);
  const fieldErrors = {
    fullName: undefined,
    address: undefined,
    phoneNumber: undefined,
    emailAddress: undefined,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: null,
    });
  }

  // Update contact information
  const contact = await updateContactDetails(fields);
  if (!contact) {
    throw new AppError({ errType: ErrorType.ContactUpdateFailed });
  }

  return redirect(`/contacts/${contact.id}`);
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { contactId } = params;
      const contact = await getContact(contactId);
      if (!contact) {
        throw new AppError({ errType: ErrorType.ContactNotFound });
      }
      return json({ contact });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function EditContactPage() {
  const actionData = useActionData<typeof action>();
  const { contact } = useLoaderData<typeof loader>();

  return (
    <div className="flex-1 overflow-auto px-2 pb-2">
      <ContactForm
        id="update-contact-form"
        fields={actionData?.fields || contact || undefined}
        fieldErrors={actionData?.fieldErrors || undefined}
      />

      <div className="mt-6 flex max-w-[672px] flex-col justify-end space-y-5 space-y-reverse rtl:space-x-reverse sm:flex-row sm:items-center sm:space-y-0 sm:space-x-5">
        <Link
          to={`/contacts/${contact.id}`}
          className="order-2 rounded-md border-0 border-gray-300 bg-white text-center font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
        >
          ביטול
        </Link>
        <button
          type="submit"
          form="update-contact-form"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          שמור שינויים
        </button>
      </div>
    </div>
  );
}
