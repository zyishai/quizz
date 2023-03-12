import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { IconPencil } from "@tabler/icons-react";
import isMobile from "ismobilejs";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import StudentAvatar from "~/components/student-avatar";
import { getContact } from "~/handlers/contacts.server";
import { getContactRelatedStudents } from "~/handlers/students.server";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { formatPhoneNumber } from "~/utils/phone-number";
import { getUserId } from "~/utils/session.server";

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
      const relatedStudents = await getContactRelatedStudents(contact.id);
      const userAgent = request.headers.get("user-agent");
      const { any: isMobilePhone } = isMobile(userAgent || undefined);
      return json({
        contact,
        relatedStudents,
        isMobilePhone,
      });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function ContactDetailsPage() {
  const { contact, relatedStudents } = useLoaderData<typeof loader>();

  return (
    <>
      <main className="flex flex-1 flex-col overflow-hidden px-4 py-1">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5 sm:rtl:space-x-reverse">
          <h1 className="flex items-center text-2xl font-bold text-gray-900">
            <Link
              to="/students"
              className="inline-block ltr:mr-2 rtl:ml-2 sm:mt-1"
            >
              <ArrowRightIcon className="h-5 w-auto" />
            </Link>
            <span>{contact.fullName}</span>
          </h1>

          <Link
            to="edit"
            className="hidden items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100 sm:inline-flex"
          >
            <IconPencil
              className="h-5 w-auto ltr:mr-2 rtl:ml-2"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base">
              עריכת פרטי איש קשר
            </span>
          </Link>
        </div>

        <section className="flex-1" aria-labelledby="contact-information-title">
          <h1 id="contact-information-title" className="sr-only">
            פרטי איש הקשר
          </h1>
          <div className="py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  כתובת מגורים
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.address || "--"}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  מספר פלאפון
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatPhoneNumber(contact.phoneNumber) || "--"}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">דוא״ל</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.emailAddress || "--"}
                </dd>
              </div>
              {relatedStudents.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">תלמידים</dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    <ul
                      role="list"
                      className="divide-y divide-gray-200 rounded-md border border-gray-200"
                    >
                      {relatedStudents.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center py-3 text-sm ltr:pl-3 ltr:pr-4 rtl:pr-3 rtl:pl-4"
                        >
                          <div>
                            <StudentAvatar
                              fullName={student.fullName}
                              size={28}
                              radius={6}
                            />
                          </div>
                          <div className="flex-shrink-0 ltr:ml-3 rtl:mr-3">
                            <Link
                              to={`/students/${student.id}?redirectTo=/students`}
                              className="text-indigo-700 hover:text-indigo-800"
                            >
                              {student.fullName}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <footer className="mt-4 mb-2 flex flex-col sm:hidden">
          <Link
            to="edit"
            className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          >
            <IconPencil
              className="h-5 w-auto ltr:mr-2 rtl:ml-2"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base">
              עריכת פרטי איש קשר
            </span>
          </Link>

          <Link
            to="/students"
            className="mt-5 basis-full rounded-md bg-white text-center text-base font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
          >
            חזרה
          </Link>
        </footer>
      </main>
    </>
  );
}
