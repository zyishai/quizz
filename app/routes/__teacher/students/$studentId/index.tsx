import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { requireMobile } from "~/utils/mobile.server";
import { getStudent } from "~/handlers/students.server";
import StudentAvatar from "~/components/student-avatar";
import {
  IconPencil,
  IconTrashX,
  MapPinIconOutline,
  ArrowRightIconSolid,
} from "~/utils/icons";
import { formatGrade } from "~/utils/format";

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireMobile(request);

  const { studentId } = params;
  const student = await getStudent(studentId);

  return json({ student });
};

export default function StudentDetails() {
  const { student } = useLoaderData<typeof loader>();
  const grade = formatGrade(student.grade);

  return (
    <>
      <header className="border-b border-gray-200 px-4 pb-2">
        <h1 className="flex items-center text-lg text-gray-800">
          <Link
            to="/students"
            className="inline-block ltr:mr-2 rtl:ml-2 sm:mt-1"
          >
            <ArrowRightIconSolid className="h-5 w-auto" />
          </Link>
          <span>פרטי תלמיד</span>
        </h1>
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
                      <p className="truncate text-base font-medium text-blue-700">
                        {contact.fullName}
                      </p>
                    </Link>
                    <div className="mt-1 flex items-center space-x-1 rtl:space-x-reverse">
                      <MapPinIconOutline
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

      <footer className="mt-4 mb-2">
        <div className="justify-stretch flex flex-wrap">
          <Link
            to="edit"
            className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100"
          >
            <IconPencil
              className="h-5 w-auto ltr:mr-2 rtl:ml-2"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base">
              עריכת פרטי תלמיד
            </span>
          </Link>

          <Form
            method="post"
            action="/students?index"
            className="ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
          >
            <input type="hidden" name="studentId" value={student.id} />
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-red-400 bg-red-50 p-3 text-sm font-medium text-red-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={(e) => {
                if (!confirm("האם ברצונך למחוק את התלמיד?")) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                return true;
              }}
            >
              <IconTrashX className="h-5 w-5 text-red-400" aria-hidden="true" />
              <span className="sr-only">מחק תלמיד</span>
            </button>
          </Form>

          <Link
            to="/students"
            className="mt-5 basis-full rounded-md bg-white text-center text-base font-medium text-orange-500 shadow-none hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:text-sm"
          >
            חזרה לתלמידים
          </Link>
        </div>
      </footer>
    </>
  );
}
