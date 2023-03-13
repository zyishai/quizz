import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import Avvvatars from "avvvatars-react";
import { badRequest, forbidden, unauthorized, serverError } from "remix-utils";
import { formatPhoneNumber } from "~/utils/phone-number";
import { deleteExistingStudent, getStudents } from "~/handlers/students.server";
import { isAppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import { IconUserPlus, ChevronLeftIconOutline } from "~/utils/icons";
import { formatGrade } from "~/utils/format";

export const action = async ({ request }: ActionArgs) => {
  if (!(await deleteExistingStudent(request))) {
    throw badRequest({ message: "לא הצלחנו למחוק את הסטודנט. אנא נסו שנית" });
  }

  return json({
    message: "סטודנט נמחק בהצלחה",
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  try {
    const students = await getStudents(request);
    return json({ students });
  } catch (error) {
    if (isAppError(error)) {
      switch (error.name) {
        case ErrorType.UserNotFound: {
          throw unauthorized({ message: "המשתמש לא מחובר" });
        }
        case ErrorType.TeacherNotFound: {
          throw forbidden({ message: "המשתמש לא רשום כמורה במערכת" });
        }
      }
    }
    throw serverError({
      message: "אירעה שגיאה בשרת. אנא נסו שנית במועד מאוחר יותר",
    });
  }
};

export default function ListStudents() {
  const { students } = useLoaderData<typeof loader>();

  return (
    <>
      <header className="flex flex-row items-center justify-between border-b border-gray-200 py-2 pb-4">
        <h1 className="text-xl font-medium leading-none text-gray-900">
          התלמידים שלי
        </h1>
        <Link
          to="new"
          className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:inline-flex"
        >
          <IconUserPlus
            className="h-4 w-4 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
            aria-hidden="true"
          />
          <span>הוסף תלמיד</span>
        </Link>
      </header>

      {students.length > 0 ? (
        <>
          {/* Students list (only on smallest breakpoint) */}
          <div className="mb-5 flex-1 overflow-y-scroll sm:hidden">
            <ul role="list" className="divide-y divide-gray-100">
              {students.map((student) => (
                <li key={student.id}>
                  <Link
                    to={student.id}
                    className="group flex items-center justify-between py-4 px-0 hover:bg-gray-50 sm:px-6"
                  >
                    <span className="flex items-center space-x-3 truncate rtl:space-x-reverse">
                      <Avvvatars
                        value={student.fullName}
                        style="shape"
                        radius={10}
                        border
                        borderSize={0}
                        borderColor="transparent; filter: brightness(0.95)"
                      />
                      <div>
                        <h2 className="truncate font-medium leading-6">
                          {student.fullName}
                        </h2>
                        <p className="truncate text-sm text-gray-600">
                          {formatGrade(student.grade)}
                        </p>
                      </div>
                    </span>
                    <ChevronLeftIconOutline
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-500 ltr:ml-4 rtl:mr-4"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Students table (small breakpoint and up) */}
          <div className="hidden flex-1 overflow-hidden sm:block">
            <div className="block h-full min-w-full overflow-y-scroll border-b border-gray-200 align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      <span className="lg:ltr:pl-2 lg:rtl:pr-2">תלמיד</span>
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      כיתה
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 ltr:text-left rtl:text-right"
                      scope="col"
                    >
                      אנשי קשר
                    </th>
                    <th
                      className="hidden border-b border-gray-200 bg-white px-6 py-3 text-right text-sm font-semibold text-gray-900 md:table-cell"
                      scope="col"
                    >
                      עדכון אחרון
                    </th>
                    <th
                      className="border-b border-gray-200 bg-white py-3 pr-6 text-right text-sm font-semibold text-gray-900"
                      scope="col"
                    />
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="group">
                      <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center rtl:space-x-reverse md:space-x-3 lg:ltr:pl-2 lg:rtl:pr-2">
                          <div className="hidden md:block">
                            <Avvvatars
                              value={student.fullName}
                              style="shape"
                              radius={10}
                              border
                              borderSize={0}
                              borderColor="transparent; filter: brightness(0.95)"
                            />
                          </div>
                          <p className="font-medium hover:text-gray-600">
                            {student.fullName}
                          </p>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm text-gray-500 md:table-cell">
                        {formatGrade(student.grade)}
                      </td>
                      <td className="border-b border-gray-100 py-3 px-6 text-sm font-medium text-gray-500">
                        <ul className="space-y-2 truncate">
                          {student?.contacts?.map((contact) => (
                            <li
                              key={contact.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Link to={`/contacts/${contact.id}`}>
                                {contact.fullName}
                                &nbsp;
                                {contact.phoneNumber ? (
                                  <span className="font-normal proportional-nums">
                                    ({formatPhoneNumber(contact.phoneNumber)})
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="hidden whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm text-gray-500 md:table-cell">
                        {student?.lastUpdatedAt
                          ? dayjs(student?.lastUpdatedAt).format(
                              "DD MMMM, YYYY"
                            )
                          : "--"}
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-100 px-6 py-3 text-right text-sm font-medium">
                        <div className="flex divide-x divide-gray-200 rtl:divide-x-reverse">
                          <Link
                            to={`${student.id}/edit`}
                            className="px-3 text-indigo-600 hover:text-indigo-900"
                          >
                            עריכה
                          </Link>
                          <Form method="post" className="group">
                            <input
                              type="hidden"
                              name="studentId"
                              value={student.id}
                            />
                            <button
                              type="submit"
                              className="px-3 text-indigo-600 group-hover:text-indigo-900"
                              onClick={(e) => {
                                if (!confirm("האם ברצונך למחוק את התלמיד?")) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return false;
                                }
                                return true;
                              }}
                            >
                              מחק
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-1 flex-col items-center sm:block">
            <img
              src="/illustrations/no-data.svg"
              alt="no data"
              className="h-40 w-auto opacity-40 sm:hidden"
            />
            <h2 className="mt-5 text-base text-gray-500 sm:mt-0 sm:inline-block sm:ltr:mr-1 sm:rtl:ml-1">
              אופס.. אין תלמידים.
            </h2>
            <span className="text-gray-500">
              <Link to="new" className="text-amber-500">
                הוסף תלמיד
              </Link>{" "}
              כדי להציג אותו כאן
            </span>
          </div>
        </>
      )}

      <Link
        to="new"
        className="mb-2 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-2.5 py-3 font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
      >
        <IconUserPlus
          className="h-5 w-5 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
          aria-hidden="true"
        />
        <span>הוסף תלמיד</span>
      </Link>
    </>
  );
}
