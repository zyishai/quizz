import { Menu, Transition } from "@headlessui/react";
import { Form } from "@remix-run/react";
import clsx from "clsx";
import { Fragment, useMemo, useState } from "react";
import { Student } from "~/types/student";
import {
  ChevronDownIconSolid,
  ExclamationCircleIconOutline,
} from "~/utils/icons";

interface PaymentAccountFormProps {
  students: Student[];
  fields?: FormFields;
  fieldErrors?: FormFieldErrors;
  id: string;
}

interface FormFields {
  accountId?: string;
  accountName?: string;
  students?: string[];
  contacts?: string[];
}
interface FormFieldErrors {}

export default function PaymentAccountForm({
  id,
  fields,
  fieldErrors,
  students,
}: PaymentAccountFormProps) {
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const availableStudents = useMemo(
    () => students.filter((student) => !studentIds.includes(student.id)),
    [students, studentIds]
  );

  return (
    <Form
      id={id}
      method="post"
      replace
      className="mb-6 grid max-w-[672px] grid-cols-6 gap-6"
    >
      <input type="hidden" name="_action" value="save" />
      <input type="hidden" name="accountId" value={fields?.accountId} />
      {studentIds.map((id) => (
        <input type="hidden" name="student" value={id} key={id} />
      ))}

      <div className="col-span-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="accountName"
            className="text-sm font-semibold text-gray-700"
          >
            שם הכרטיסיה
          </label>
          <p className="mt-0.5 text-xs font-medium text-gray-400">
            ניתן להשאיר שדה זה ריק
          </p>
        </div>
        <input
          type="text"
          name="accountName"
          id="accountName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          defaultValue={fields?.accountName}
        />
      </div>

      <div className="col-span-6 mt-3">
        {students.length === 0 ? (
          <div className="mt-3 flex">
            <ExclamationCircleIconOutline className="mt-0.5 h-4 w-auto flex-shrink-0 stroke-2 text-red-400 ltr:mr-1.5 rtl:ml-1.5" />
            <p className="text-sm leading-5 text-red-500">
              אין תלמידים זמינים להוספה לחשבונית. זה יכול להיות במקרה ולא הוספת
              תלמידים למערכת או לחילופין אם כל התלמידים משויכים לחשבונית כלשהי.
            </p>
          </div>
        ) : studentIds.length > 0 ? (
          <div className="flex flex-wrap space-x-3 rtl:space-x-reverse">
            {studentIds.map((id) => {
              const student = students.find((s) => s.id === id);
              return student ? (
                <span
                  key={id}
                  className="inline-flex items-center rounded-full bg-indigo-100 py-0.5 text-sm font-medium text-indigo-700 ltr:pl-2.5 ltr:pr-1 rtl:pr-2.5 rtl:pl-1"
                >
                  {student.fullName}
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:bg-indigo-500 focus:text-white focus:outline-none ltr:ml-0.5 rtl:mr-0.5"
                    onClick={() =>
                      setStudentIds(
                        studentIds.filter((studentId) => studentId !== id)
                      )
                    }
                  >
                    <span className="sr-only">הסר תלמיד</span>
                    <svg
                      className="h-2 w-2"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 8 8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth="1.5"
                        d="M1 1l6 6m0-6L1 7"
                      />
                    </svg>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-400">
            אין תלמידים משויכים לכרטיסיה זאת. לחץ/י על ״הוסף תלמיד״ כדי לשייך
            תלמיד לכרטיסיה.
          </p>
        )}

        {availableStudents.length > 0 ? (
          <Menu as="div" className="relative mt-3 ltr:text-left rtl:text-right">
            <div>
              <Menu.Button className="inline-flex items-center justify-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                הוסף תלמיד
                <ChevronDownIconSolid
                  className="h-4 w-auto text-gray-500 ltr:-mr-1 rtl:-ml-1"
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {availableStudents.map((student) => (
                    <Menu.Item key={student.id}>
                      {({ active }) => (
                        <button
                          type="button"
                          className={clsx([
                            { "bg-gray-100 text-gray-900": active },
                            { "text-gray-700": !active },
                            "block w-full px-4 py-2 text-sm rtl:text-right",
                          ])}
                          onClick={() =>
                            setStudentIds([...studentIds, student.id])
                          }
                        >
                          {student.fullName}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : null}
      </div>

      {/* <div className="col-span-6">
        <label
          htmlFor="datetime"
          className="block text-sm font-semibold text-gray-700"
        >
          בחר שעה
        </label>
        <select
          name="datetime"
          id="datetime"
          key="datetime"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
          defaultValue={dayjs(fields?.datetime).toISOString()}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors?.datetime) || undefined}
          aria-errormessage={
            fieldErrors?.datetime ? "datetime-error" : undefined
          }
        >
          {(fetcher.data || timeSlotsRef.current || fields?.slots)?.map(
            (slot) => (
              <option
                key={dayjs(slot).format("HH:mm")}
                value={new Date(slot).toISOString()}
              >
                {dayjs(slot).format("HH:mm")}
              </option>
            )
          )}
        </select>
        {fieldErrors?.datetime ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="datetime-error"
            role="alert"
          >
            <ExclamationCircleIconOutline
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.datetime}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <label
          htmlFor="duration"
          className="block text-sm font-semibold text-gray-700"
        >
          אורך שיעור
        </label>
        <select
          name="duration"
          id="duration"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
          defaultValue={fields?.duration ? +fields.duration : 60}
          ref={durationInputRef}
          onChange={(e) => !!e.target.value && fetchAvailableSlots()}
          required
          aria-required="true"
          aria-invalid={Boolean(fieldErrors?.duration) || undefined}
          aria-errormessage={
            fieldErrors?.duration ? "duration-error" : undefined
          }
        >
          {durations.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
        {fieldErrors?.duration ? (
          <p
            className="mt-2 max-w-[35ch] text-sm text-red-600"
            id="duration-error"
            role="alert"
          >
            <ExclamationCircleIconOutline
              className="inline-block h-4 w-4 ltr:mr-1 rtl:ml-1"
              aria-hidden="true"
            />
            {fieldErrors?.duration}
          </p>
        ) : null}
      </div>

      <div className="col-span-6">
        <label
          htmlFor="topic"
          className="block text-sm font-semibold text-gray-700"
        >
          נושא השיעור
        </label>
        <input
          type="text"
          name="topic"
          id="topic"
          autoComplete="none"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          defaultValue={fields?.topic}
        />
      </div>

      <div className="col-span-6">
        <label
          htmlFor="studentId"
          className="block text-sm font-semibold text-gray-700"
        >
          בחר תלמיד
        </label>
        <select
          name="studentId"
          id="studentId"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
          required
          aria-required="true"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-6">
        <label
          htmlFor="topic"
          className="block text-sm font-semibold text-gray-700"
        >
          מחיר השיעור (לשעה)
        </label>
        <input
          type="number"
          name="price"
          id="price"
          autoComplete="none"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          defaultValue={fields?.price || 180}
        />
      </div> */}
    </Form>
  );
}
