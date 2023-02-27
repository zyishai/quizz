import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
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
    <div className="overflow-auto px-2 pb-2">
      <header className="mb-4 sm:mb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          עריכת פרטי איש קשר
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          מלא את פרטי איש הקשר בטופס בבקשה.
        </p>
      </header>
      <ContactForm
        fields={actionData?.fields || contact || undefined}
        fieldErrors={actionData?.fieldErrors || undefined}
        back={`/contacts/${contact.id}`}
      />
    </div>
  );
}
