import { ArrowLongRightIcon, PencilIcon } from "@heroicons/react/24/outline";
import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate } from "@remix-run/react";
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
      return json({ contact, relatedStudents });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function ContactDetailsPage() {
  const navigate = useNavigate();
  const { contact, relatedStudents } = useLoaderData<typeof loader>();

  return (
    <>
      <header className="px-4">
        <nav className="flex" aria-label="ניווט חזרה">
          <Form action="/" method="get" className="flex">
            <button
              type="submit"
              className="group inline-flex space-x-3 text-sm font-medium text-gray-500 hover:text-gray-700 rtl:space-x-reverse"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(-1);
                return false;
              }}
            >
              <ArrowLongRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              <span>חזרה</span>
            </button>
          </Form>
        </nav>
      </header>
      <main className="mt-6 flex flex-1 flex-col overflow-hidden px-4 py-1">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5 sm:rtl:space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">
            {contact.fullName}
          </h1>
          <Link
            to="edit"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          >
            <PencilIcon
              className="h-5 w-5 ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2"
              aria-hidden="true"
            />
            <span>עריכת פרטי איש הקשר</span>
          </Link>
        </div>

        <section aria-labelledby="contact-information-title">
          <h1 id="contact-information-title" className="sr-only">
            פרטי איש הקשר
          </h1>
          <div className="px-4 py-5 sm:px-0">
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
      </main>
    </>
  );
}
