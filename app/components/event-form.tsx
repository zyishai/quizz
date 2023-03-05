import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Form, useFetcher } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { DateTimeString } from "~/types/misc";
import { Student } from "~/types/student";

const durations = [
  { value: 15, label: "רבע שעה" },
  { value: 30, label: "חצי שעה" },
  { value: 45, label: "45 דקות" },
  { value: 60, label: "שעה" },
  { value: 90, label: "שעה וחצי" },
  { value: 120, label: "שעתיים" },
];

interface EventFormProps {
  students: Student[];
  fields?: FormFields;
  fieldErrors?: FormFieldErrors;
  defaultDate?: string | Date | null;
  id: string;
}

interface FormFields {
  datetime?: string;
  duration?: string;
  topic?: string;
  price?: string;
  studentId?: string;
  slots?: DateTimeString[] | Date[];
  eventId?: string;
  lessonId?: string;
}
interface FormFieldErrors {
  datetime?: string;
  duration?: string;
}

export default function EventForm({
  id,
  fields,
  fieldErrors,
  defaultDate,
  students,
}: EventFormProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLSelectElement>(null);
  const timeSlotsRef = useRef<DateTimeString[] | Date[] | null>(null);

  const fetcher = useFetcher<Date[]>();
  const fetchAvailableSlots = () =>
    fetcher.submit(
      {
        _action: "lookupAvailableTime",
        date:
          dateInputRef.current?.value ||
          fields?.datetime ||
          dayjs(defaultDate).toISOString() ||
          "",
        duration: durationInputRef.current?.value || fields?.duration || "60",
        lessonId: fields?.lessonId || "",
      },
      { method: "post", action: "/lessons" }
    );

  useEffect(() => {
    if (fields?.datetime || defaultDate) {
      fetchAvailableSlots();
    }
  }, [defaultDate, fields?.datetime]);
  useEffect(() => {
    if (fetcher.data) {
      timeSlotsRef.current = fetcher.data;
    } else if (fields?.slots) {
      timeSlotsRef.current = fields.slots;
    }
  }, [fetcher.data, fields?.slots]);

  return (
    <Form
      id={id}
      method="post"
      replace
      className="mb-6 grid max-w-[672px] grid-cols-6 gap-6"
    >
      <input type="hidden" name="_action" value="save" />
      <input type="hidden" name="eventId" value={fields?.eventId} />

      <div className="col-span-6">
        {/* <h2 className="mb-4 font-semibold text-gray-800">בחר שבוע</h2> */}
        <label
          htmlFor="date"
          className="block text-sm font-semibold text-gray-700"
        >
          בחר תאריך
        </label>
        <input
          type="date"
          name="date"
          id="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
          defaultValue={
            fields?.datetime
              ? dayjs(fields.datetime).format("YYYY-MM-DD")
              : defaultDate
              ? dayjs(defaultDate).format("YYYY-MM-DD")
              : undefined
          }
          ref={dateInputRef}
          onClick={() => dateInputRef.current?.showPicker?.()}
          onChange={(e) => !!e.target.value && fetchAvailableSlots()}
          required
          aria-required="true"
        />
      </div>

      <div className="col-span-6">
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
            <ExclamationCircleIcon
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
            <ExclamationCircleIcon
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
      </div>

      {/* <div className="col-span-6 flex flex-col justify-end space-y-3 space-y-reverse rtl:space-x-reverse sm:flex-row sm:space-y-0 sm:space-x-3">
        {typeof back === "string" ? (
          <Link
            to={back}
            className="order-2 rounded-md border border-gray-300 bg-white py-2.5 px-4 text-center font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:py-2 sm:text-sm"
          >
            ביטול
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            className="order-2 rounded-md border border-gray-300 bg-white py-2.5 px-4 text-center font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:py-2 sm:text-sm"
          >
            ביטול
          </button>
        )}
        <button
          type="submit"
          className="order-1 inline-flex justify-center rounded-md border border-transparent bg-amber-500 py-2.5 px-4 font-medium text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:order-3 sm:py-2 sm:text-sm"
        >
          שלח
        </button>
      </div> */}
    </Form>
  );
}
