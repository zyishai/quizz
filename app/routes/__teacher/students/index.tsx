import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import Avvvatars from "avvvatars-react";
import { badRequest, namedAction } from "remix-utils";
import {
  addContact,
  deleteExistingStudent,
  getStudents,
  removeContact,
  updateStudentPersonalInfo,
} from "~/handlers/students.server";
import { AppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import {
  IconUserPlus,
  ChevronLeftIconOutline,
  ChevronDownIconSolid,
} from "~/utils/icons";
import { formatGrade } from "~/utils/format";
import {
  attachStudentToPaymentAccount,
  createNewPaymentAccount,
  detachStudentFromPaymentAccount,
  getPaymentAccountsList,
} from "~/handlers/payments.server";
import { getUserId } from "~/utils/session.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import clsx from "clsx";
import {
  assertCreateContactDtoType,
  assertGrade,
  assertPaymentAccountType,
  assertString,
} from "~/utils/misc";
import AddOrCreatePaymentAccountModal from "~/components/add-or-create-account-modal";
import AddContactModal from "~/components/add-contact-modal";
import { getContacts } from "~/handlers/contacts.server";
import AddStudentModal from "~/components/add-student-modal";
import { createStudent } from "~/adapters/student.adapter";
import EditStudentDetailsModal from "~/components/edit-student-details-modal";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    async createNewStudent() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.formData();
          const noAccount = formData.get("noAccount")?.toString();
          const accountId = formData.get("paymentAccountId")?.toString();
          const fullName = formData.get("fullName")?.toString();
          assertString(fullName);
          const grade = Number(formData.get("grade"));
          assertGrade(grade);
          const contacts = formData.getAll("contact").map((value) => {
            const dto = JSON.parse(value.toString());
            assertCreateContactDtoType(dto);
            return dto;
          });
          const student = await createStudent({
            teacherId: teacher.id,
            fullName,
            grade,
            accountType:
              noAccount === "on" ? "absent" : accountId ? "existing" : "new",
            paymentAccountId: accountId,
            contacts,
          });
          if (!student) {
            throw new AppError({ errType: ErrorType.StudentNotCreated });
          }
          return json({ student });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async editStudentDetails() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.formData();
          const studentId = formData.get("studentId")?.toString();
          assertString(studentId);
          const fullName = formData.get("fullName")?.toString();
          assertString(fullName);
          const grade = Number(formData.get("grade"));
          assertGrade(grade);

          const student = await updateStudentPersonalInfo(studentId, {
            fullName,
            grade,
          });
          if (!student) {
            throw new AppError({ errType: ErrorType.StudentUpdateFailed });
          }

          return json({ student });
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async deleteStudent() {
      if (!(await deleteExistingStudent(request))) {
        throw badRequest({
          message: "לא הצלחנו למחוק את הסטודנט. אנא נסו שנית",
        });
      }

      return json({
        message: "סטודנט נמחק בהצלחה",
      });
    },
    async addPaymentAccount() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.clone().formData();
          const studentId = formData.get("studentId")?.toString();
          assertString(studentId);
          const accountType = formData.get("paymentAccount")?.toString();
          assertPaymentAccountType(accountType);

          if (accountType === "new") {
            const account = await createNewPaymentAccount({
              teacherId: teacher.id,
              students: [studentId],
              contacts: [],
            });
            if (!account) {
              throw new AppError({ errType: ErrorType.AccountNotCreated });
            }

            return json({ account });
          } else if (accountType === "existing") {
            const paymentAccountId = formData
              .get("paymentAccountId")
              ?.toString();
            assertString(paymentAccountId);
            const account = await attachStudentToPaymentAccount(
              paymentAccountId,
              studentId
            );
            if (!account) {
              throw new AppError({ errType: ErrorType.StudentUpdateFailed });
            }

            return json({ account });
          } else {
            throw new AppError({
              errType: ErrorType.InvalidOrMissingPaymentInformation,
            });
          }
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async removePaymentAccount() {
      const formData = await request.clone().formData();
      const studentId = formData.get("studentId")?.toString();
      assertString(studentId);
      if (!(await detachStudentFromPaymentAccount(studentId))) {
        throw new AppError({ errType: ErrorType.StudentUpdateFailed });
      }

      return json({ message: "חשבון הוסר בהצלחה" });
    },
    async addContactToStudent() {
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.formData();
          const studentId = formData.get("studentId")?.toString();
          assertString(studentId);

          if (formData.has("contactId")) {
            const contactId = formData.get("contactId")?.toString();
            assertString(contactId);
            const student = await addContact({
              teacherId: teacher.id,
              studentId,
              contact: {
                id: contactId,
                type: "existing",
              },
            });
            if (!student) {
              throw new AppError({ errType: ErrorType.StudentUpdateFailed });
            }
            return json({ student });
          } else if (formData.has("contactName")) {
            const contactName = formData.get("contactName")?.toString();
            assertString(contactName);
            const student = await addContact({
              teacherId: teacher.id,
              studentId,
              contact: {
                fullName: contactName,
                type: "new",
              },
            });
            if (!student) {
              throw new AppError({ errType: ErrorType.StudentUpdateFailed });
            }
            return json({ student });
          } else {
            throw new AppError({ errType: ErrorType.Other });
          }
        } else {
          throw new AppError({ errType: ErrorType.TeacherNotFound });
        }
      } else {
        throw new AppError({ errType: ErrorType.UserNotFound });
      }
    },
    async removeContactById() {
      const formData = await request.formData();
      const studentId = formData.get("studentId")?.toString();
      assertString(studentId);
      const contactId = formData.get("contactId");
      assertString(contactId);
      const student = await removeContact({ studentId, contactId });
      if (!student) {
        throw new AppError({ errType: ErrorType.StudentUpdateFailed });
      }

      return json({ student });
    },
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const now = Date.now();
      const students = await getStudents(request);
      console.log("students:", dayjs().diff(now, "milliseconds"));
      const accounts = await getPaymentAccountsList(teacher.id);
      console.log("accounts:", dayjs().diff(now, "milliseconds"));
      const contacts = await getContacts(request);
      console.log("contacts:", dayjs().diff(now, "milliseconds"));
      return json({ students, accounts, contacts });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function ListStudents() {
  const { students, accounts, contacts } = useLoaderData<typeof loader>();
  const [accountModalStudentId, setShowAddAccountModalForStudent] = useState<
    number | null
  >(null);
  const [contactModalStudentId, setShowContactsModal] = useState<number | null>(
    null
  );
  const [
    editStudentDetailsModalStudentId,
    setShowEditStudentDetailsModalForStudent,
  ] = useState<number | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  return (
    <>
      <header className="flex flex-row items-center justify-between border-b border-gray-200 py-2 pb-4 sm:ltr:pr-1 sm:rtl:pl-1">
        <h1 className="text-lg font-semibold leading-none text-gray-900 sm:text-xl sm:font-medium">
          התלמידים שלי
        </h1>
        <button
          type="button"
          className="hidden items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:inline-flex"
          onClick={() => setShowStudentModal(true)}
        >
          <IconUserPlus
            className="h-4 w-4 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
            aria-hidden="true"
          />
          <span>הוסף תלמיד</span>
        </button>
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
                  {students.map((student, index) => {
                    const account = accounts.find((acc) =>
                      acc.students.some(
                        (s) => typeof s !== "string" && s.id === student.id
                      )
                    );
                    return (
                      <tr className="group" key={student.id}>
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
                              <li key={contact.id} className="text-gray-500">
                                <span>{contact.fullName}</span>
                                &nbsp;
                                <Form method="post" className="inline-block">
                                  <input
                                    type="hidden"
                                    name="_action"
                                    value="removeContactById"
                                  />
                                  <input
                                    type="hidden"
                                    name="studentId"
                                    value={student.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="contactId"
                                    value={contact.id}
                                  />
                                  <button
                                    type="submit"
                                    onClick={(e) => {
                                      if (
                                        !confirm(
                                          `להסיר איש קשר ${contact.fullName} מ${student.fullName}?`
                                        )
                                      ) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                      }
                                    }}
                                    className="text-sm text-red-300"
                                  >
                                    (הסר)
                                  </button>
                                </Form>
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
                          <Menu
                            as="div"
                            className="relative inline-block text-left rtl:text-right"
                          >
                            <div>
                              <Menu.Button className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-white px-2 py-1 text-sm font-normal text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                פעולות
                                <ChevronDownIconSolid
                                  className="h-4 w-auto text-gray-400 ltr:-mr-1 rtl:-ml-1"
                                  aria-hidden="true"
                                />
                              </Menu.Button>
                            </div>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        type="button"
                                        className={clsx([
                                          active
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-700",
                                          "block w-full px-4 py-2 text-sm ltr:text-left rtl:text-right",
                                        ])}
                                        onClick={() =>
                                          setShowEditStudentDetailsModalForStudent(
                                            index
                                          )
                                        }
                                      >
                                        ערוך פרטי תלמיד
                                      </button>
                                    )}
                                  </Menu.Item>

                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        type="button"
                                        className={clsx([
                                          active
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-700",
                                          "block w-full px-4 py-2 text-sm ltr:text-left rtl:text-right",
                                        ])}
                                        onClick={() =>
                                          setShowContactsModal(index)
                                        }
                                      >
                                        הוסף איש קשר
                                      </button>
                                    )}
                                  </Menu.Item>

                                  <Menu.Item>
                                    {({ active }) => (
                                      <Form method="post">
                                        <input
                                          type="hidden"
                                          name="_action"
                                          value="deleteStudent"
                                        />
                                        <button
                                          name="studentId"
                                          value={student.id}
                                          className={clsx([
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-red-600",
                                            "block w-full px-4 py-2 text-sm rtl:text-right",
                                          ])}
                                          onClick={(e) => {
                                            if (
                                              !confirm(
                                                "האם ברצונך למחוק את התלמיד?"
                                              )
                                            ) {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              return false;
                                            }
                                            return true;
                                          }}
                                        >
                                          מחק תלמיד
                                        </button>
                                      </Form>
                                    )}
                                  </Menu.Item>
                                </div>
                                {account ? (
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          to={`/accounts/${account.id}`}
                                          className={clsx([
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700",
                                            "block px-4 py-2 text-sm",
                                          ])}
                                        >
                                          הצג פרטי חשבון תשלום
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Form method="post">
                                          <input
                                            type="hidden"
                                            name="_action"
                                            value="removePaymentAccount"
                                          />
                                          <input
                                            type="hidden"
                                            name="studentId"
                                            value={student.id}
                                          />
                                          <button
                                            type="submit"
                                            className={clsx([
                                              active
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-gray-700",
                                              "block w-full px-4 py-2 text-sm rtl:text-right",
                                            ])}
                                            onClick={(e) => {
                                              if (
                                                !confirm(
                                                  `להסיר חשבון תשלום מ${student.fullName}?`
                                                )
                                              ) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return false;
                                              }
                                            }}
                                          >
                                            הסר חשבון
                                          </button>
                                        </Form>
                                      )}
                                    </Menu.Item>
                                  </div>
                                ) : (
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          type="button"
                                          className={clsx([
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700",
                                            "block w-full px-4 py-2 text-sm ltr:text-left rtl:text-right",
                                          ])}
                                          onClick={() =>
                                            setShowAddAccountModalForStudent(
                                              index
                                            )
                                          }
                                        >
                                          הוסף / צור חשבון תשלום
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                )}
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <AddOrCreatePaymentAccountModal
                student={
                  typeof accountModalStudentId === "number"
                    ? students[accountModalStudentId]
                    : undefined
                }
                accounts={accounts}
                open={accountModalStudentId !== null}
                onClose={() => setShowAddAccountModalForStudent(null)}
              />
              <AddContactModal
                open={contactModalStudentId !== null}
                onClose={() => setShowContactsModal(null)}
                student={
                  typeof contactModalStudentId === "number"
                    ? students[contactModalStudentId]
                    : undefined
                }
                contacts={contacts}
              />
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
              <button
                type="button"
                className="text-amber-500"
                onClick={() => setShowStudentModal(true)}
              >
                הוסף תלמיד
              </button>{" "}
              כדי להציג אותו כאן
            </span>
          </div>
        </>
      )}

      <AddStudentModal
        open={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        contacts={contacts}
        accounts={accounts}
      />
      <EditStudentDetailsModal
        open={editStudentDetailsModalStudentId !== null}
        onClose={() => setShowEditStudentDetailsModalForStudent(null)}
        student={
          typeof editStudentDetailsModalStudentId === "number"
            ? students[editStudentDetailsModalStudentId]
            : undefined
        }
      />

      <button
        type="button"
        className="mb-2 inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-2.5 py-3 font-medium leading-4 text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:hidden"
        onClick={() => setShowStudentModal(true)}
      >
        <IconUserPlus
          className="h-5 w-5 ltr:mr-2 ltr:-ml-0.5 rtl:ml-2 rtl:-mr-0.5"
          aria-hidden="true"
        />
        <span>הוסף תלמיד</span>
      </button>
    </>
  );
}
