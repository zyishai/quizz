import {
  ArrowLongRightIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { grades } from "~/utils/grades";
import { requireMobile } from "~/utils/mobile.server";
import { getStudent } from "~/handlers/students.server";
import StudentAvatar from "~/components/student-avatar";

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireMobile(request);

  const { studentId } = params;
  const student = await getStudent(studentId);

  return json({ student });
};

export default function StudentDetails() {
  const { student } = useLoaderData<typeof loader>();
  const grade = grades.find((grade) => grade.value === student.grade)?.label;

  return (
    <>
      <header className="px-4">
        <nav className="flex" aria-label="ניווט חזרה">
          <div className="flex">
            <Link
              to="/students"
              className="group inline-flex space-x-3 text-sm font-medium text-gray-500 hover:text-gray-700 rtl:space-x-reverse"
            >
              <ArrowLongRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              <span>חזרה לרשימת התלמידים</span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="mt-6 flex flex-1 flex-col overflow-hidden px-4">
        <section className="flex">
          <div className="flex-shrink-0 ltr:mr-3 rtl:ml-3">
            <StudentAvatar fullName={student.fullName} size={50} radius={10} />
          </div>
          <div>
            <h4 className="text-lg font-bold">{student.fullName}</h4>
            <p className="text-gray-500">{grade}</p>
          </div>
        </section>
        <div className="justify-stretch mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Link
            to={`/students/${student.id}/edit`}
            className="inline-flex justify-center rounded-md border border-indigo-700 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PencilIcon
              className="h-5 w-5 text-white ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2"
              aria-hidden="true"
            />
            <span>עריכת פרטי התלמיד</span>
          </Link>
          <Form method="post" action="/students?index" className="w-full">
            <input type="hidden" name="studentId" value={student.id} />
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={(e) => {
                if (!confirm("האם ברצונך למחוק את התלמיד?")) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                return true;
              }}
            >
              <TrashIcon
                className="h-5 w-5 text-red-400 ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2"
                aria-hidden="true"
              />
              <span>מחק תלמיד</span>
            </button>
          </Form>
        </div>
        <div className="mt-6 flow-root flex-1 overflow-hidden">
          <h1 className="mb-1 text-sm font-semibold text-gray-500">אנשי קשר</h1>
          <ul
            role="list"
            className="h-full divide-y divide-gray-200 overflow-scroll"
          >
            {student.contacts?.map((contact) => (
              <li key={contact.id} className="py-4 last:mb-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="min-w-0 flex-1">
                    <Link to={`/contacts/${contact.id}`}>
                      <p className="truncate text-base font-medium text-indigo-800">
                        {contact.fullName}
                      </p>
                    </Link>
                    <div className="mt-1 flex items-center space-x-1 rtl:space-x-reverse">
                      <MapPinIcon
                        className="h-3.5 w-3.5 flex-shrink-0 text-gray-500"
                        aria-hidden="true"
                      />
                      <p className="truncate text-sm text-gray-500">
                        {contact.address || "--"}
                      </p>
                    </div>
                  </div>
                  <div className="space-x-1.5 rtl:space-x-reverse">
                    {contact.phoneNumber && (
                      <a
                        href={`tel:${contact.phoneNumber}`}
                        className="inline-block rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-center text-sm font-medium leading-5 text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        שיחה
                      </a>
                    )}
                    {contact.emailAddress && (
                      <a
                        href={`mailto:${contact.emailAddress}`}
                        className="inline-block rounded-md border border-gray-300 bg-white px-2.5 py-0.5 text-center text-sm font-medium leading-5 text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        הודעה
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
