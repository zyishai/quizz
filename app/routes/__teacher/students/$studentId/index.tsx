import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { requireMobile } from "~/utils/mobile.server";
import {
  addContact,
  getStudent,
  removeContact,
  updateStudentPersonalInfo,
} from "~/handlers/students.server";
import StudentAvatar from "~/components/student-avatar";
import {
  IconPencil,
  IconTrashX,
  ArrowRightIconSolid,
  EllipsisVerticalIconSolid,
  PlusSmallIconSolid,
} from "~/utils/icons";
import { formatGrade } from "~/utils/format";
import { getUserId } from "~/utils/session.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { AppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import {
  attachStudentToPaymentAccount,
  createNewPaymentAccount,
  detachStudentFromPaymentAccount,
  findPaymentAccountByStudentId,
  getPaymentAccountsList,
} from "~/handlers/payments.server";
import WarningAlert from "~/components/WarningAlert";
import dayjs from "dayjs";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import clsx from "clsx";
import { namedAction } from "remix-utils";
import {
  assertGrade,
  assertPaymentAccountType,
  assertString,
} from "~/utils/misc";
import AddOrCreatePaymentAccountModal from "~/components/add-or-create-account-modal";
import AddContactModal from "~/components/add-contact-modal";
import { getContacts } from "~/handlers/contacts.server";
import EditStudentDetailsModal from "~/components/edit-student-details-modal";

export const action = async ({ request, params }: ActionArgs) => {
  return namedAction(request, {
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
    async removeContactById() {
      const { studentId } = params;
      assertString(studentId);
      const formData = await request.formData();
      const contactId = formData.get("contactId");
      assertString(contactId);
      const student = await removeContact({ studentId, contactId });
      if (!student) {
        throw new AppError({ errType: ErrorType.StudentUpdateFailed });
      }

      return json({ student });
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
      const formData = await request.formData();
      const studentId = formData.get("studentId")?.toString();
      assertString(studentId);
      if (!(await detachStudentFromPaymentAccount(studentId))) {
        throw new AppError({ errType: ErrorType.StudentUpdateFailed });
      }

      return json({ message: "חשבון הוסר בהצלחה" });
    },
    async addContactToStudent() {
      const { studentId } = params;
      assertString(studentId);
      const userId = await getUserId(request);
      if (userId) {
        const teacher = await getTeacherByUserId(userId);
        if (teacher) {
          const formData = await request.formData();

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
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireMobile(request);

  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const { studentId } = params;
      const student = await getStudent(studentId);
      const account = await findPaymentAccountByStudentId(student.id);
      const accounts = await getPaymentAccountsList(teacher.id);
      const contacts = await getContacts(request);

      return json({ student, account, accounts, contacts });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function StudentDetails() {
  const { student, account, accounts, contacts } =
    useLoaderData<typeof loader>();
  const grade = formatGrade(student.grade);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

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
          <div className="ltr:mr-auto rtl:ml-auto">
            <h4 className="text-2xl font-bold">{student.fullName}</h4>
            <p className="text-gray-500">{grade}</p>
          </div>
          <div className="flex-shrink-0">
            <StudentAvatar fullName={student.fullName} size={50} radius={10} />
          </div>
        </section>

        <section className="mt-6 mb-4 flex flex-1 flex-col space-y-6 overflow-hidden">
          <div className="flow-root">
            <h1 className="mb-1 text-sm font-semibold text-gray-500">
              חשבון תשלום
            </h1>

            {account ? (
              <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-sm">
                <Link
                  to={`/accounts/${account.id}`}
                  className="flex flex-1 items-center justify-between p-3"
                >
                  <div>
                    <h2 className="text-base font-medium text-gray-800">
                      יתרה:{" "}
                      <span dir="ltr" className="tabular-nums">
                        {account.balance}
                      </span>{" "}
                      <span>&#8362;</span>
                    </h2>
                    <p className="mt-1 text-xs text-gray-400">
                      נוצר בתאריך{" "}
                      {dayjs(account.createdAt).format("DD.MM.YYYY")}
                    </p>
                  </div>
                </Link>
                <Menu
                  as="div"
                  className="relative flex-shrink-0 border-gray-200 ltr:border-l ltr:text-left rtl:border-r rtl:text-right"
                >
                  <div>
                    <Menu.Button className="inline-flex items-center justify-center rounded-full bg-transparent px-2">
                      <EllipsisVerticalIconSolid
                        className="mt-1 h-6 w-auto text-gray-300"
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
                    <Menu.Items className="absolute left-1 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to={`/accounts/${account.id}`}
                              className={clsx([
                                { "bg-gray-100 text-gray-900": active },
                                { "text-gray-700": !active },
                                "block w-full px-4 py-2 text-sm rtl:text-right",
                              ])}
                            >
                              הצג פרטי חשבון
                            </Link>
                          )}
                        </Menu.Item>
                        {/* <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="#"
                            className={clsx([
                              { "bg-gray-100 text-gray-900": active },
                              { "text-gray-700": !active },
                              "block w-full px-4 py-2 text-sm rtl:text-right",
                            ])}
                          >
                            ערוך חשבון
                          </Link>
                        )}
                      </Menu.Item> */}
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
                                  { "bg-gray-100 text-gray-900": active },
                                  { "text-red-600": !active },
                                  "block w-full px-4 py-2 text-sm rtl:text-right",
                                ])}
                              >
                                הסר חשבון
                              </button>
                            </Form>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <WarningAlert
                title="אין חשבון המשויך עם תלמיד זה"
                body={
                  <button
                    className="rounded-md border border-gray-300 bg-white py-0.5 px-2 shadow-sm"
                    onClick={() => setShowAccountsModal(true)}
                  >
                    הוסף חשבון
                  </button>
                }
              />
            )}

            <AddOrCreatePaymentAccountModal
              accounts={accounts}
              student={student}
              open={showAccountsModal}
              onClose={() => setShowAccountsModal(false)}
            />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-sm font-semibold text-gray-500">אנשי קשר</h1>
              <button
                className="text-blue-600"
                onClick={() => setShowContactsModal(true)}
              >
                <PlusSmallIconSolid className="inline-block h-4 w-auto ltr:mr-0.5 rtl:ml-0.5" />
                <span className="text-sm">הוסף איש קשר</span>
              </button>
            </div>

            <ol
              role="list"
              className="flex-1 divide-y divide-gray-200 overflow-auto"
            >
              {student.contacts?.map((contact, index) => (
                <li
                  key={contact.id}
                  className="py-4 px-2 odd:bg-white even:bg-gray-50 first-of-type:pt-0"
                >
                  <div className="flex items-center">
                    <p className="inline-block truncate text-base font-medium ltr:mr-auto rtl:ml-auto">
                      {index + 1}. {contact.fullName}
                    </p>

                    <div className="divide-x divide-gray-200 rtl:divide-x-reverse">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="px-2 text-sm text-gray-500"
                      >
                        הצג
                      </Link>
                      <Form method="post" className="inline-block px-2">
                        <input
                          type="hidden"
                          name="_action"
                          value="removeContactById"
                        />
                        <input
                          type="hidden"
                          name="contactId"
                          value={contact.id}
                        />
                        <button
                          type="submit"
                          className="text-sm text-red-600"
                          onClick={(e) => {
                            if (
                              !confirm(`להסיר את איש הקשר ${contact.fullName}?`)
                            ) {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }
                          }}
                        >
                          הסר
                        </button>
                      </Form>
                    </div>
                  </div>
                  {/* <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
                  </div> */}
                </li>
              ))}
            </ol>

            <AddContactModal
              open={showContactsModal}
              onClose={() => setShowContactsModal(false)}
              student={student}
              contacts={contacts}
            />
          </div>
        </section>
      </main>

      <footer className="mt-4 mb-2">
        <div className="justify-stretch flex flex-wrap">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-3 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-100"
            onClick={() => setShowStudentModal(true)}
          >
            <IconPencil
              className="h-5 w-auto ltr:mr-2 rtl:ml-2"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base">ערוך פרטי תלמיד</span>
          </button>

          <Form
            method="post"
            action="/students?index"
            className="ltr:ml-4 rtl:mr-4 sm:ltr:ml-0 sm:rtl:mr-0"
          >
            <input type="hidden" name="_action" value="deleteStudent" />
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

      <EditStudentDetailsModal
        open={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        student={student}
      />
    </>
  );
}
