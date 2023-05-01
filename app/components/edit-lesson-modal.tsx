import { RadioGroup } from "@headlessui/react";
import { Form, useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Student } from "~/types/student";
import Dialog from "./dialog";
import dayjs from "dayjs";
import { DateTimeString } from "~/types/misc";
import { durations } from "~/utils/durations";
import { Lesson } from "~/types/lesson";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";

type EditLessonProps = {
  open: boolean;
  onClose: (date?: string) => void;
  action?: string;
  lesson?: Lesson;
  students: Student[];
};
export default function EditLessonModal({
  open,
  onClose,
  action,
  lesson,
  students,
}: EditLessonProps) {
  if (!lesson || !hasEventFetched(lesson) || !hasStudentFetched(lesson))
    return null;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<number | null>(null);
  const timeSlotsRef = useRef<DateTimeString[] | Date[] | null>(null);
  const fetcher = useFetcher<Date[]>();
  const fetchAvailableSlots = (defaultDate?: string) =>
    fetcher.submit(
      {
        _action: "lookupAvailableTime",
        date: dateInputRef.current?.value || defaultDate || "",
        duration: (durationInputRef.current || 60).toString(),
        lessonId: lesson.id,
      },
      { method: "post", action: "/lessons" }
    );

  useEffect(() => {
    if (fetcher.data) {
      timeSlotsRef.current = fetcher.data;
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (open && lesson) {
      fetchAvailableSlots(dayjs(lesson.event.dateAndTime).format("YYYY-MM-DD"));
    }
  }, [open, lesson]);

  return (
    <Dialog open={open} onClose={onClose} title="שינוי פרטי שיעור">
      <Dialog.Body>
        {/* <p className="text-sm text-gray-500">מלא את פרטי השיעור</p> */}

        <Form
          method="post"
          action={action}
          className="mt-5"
          id="edit-lesson-form"
          onSubmit={() => onClose(dateInputRef.current?.value)}
        >
          <input type="hidden" name="_action" value="updateLessonDetails" />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="eventId" value={lesson.event.id} />

          <div className="flex space-x-2 rtl:space-x-reverse">
            <div className="flex-1">
              <label
                htmlFor="date"
                className="block text-sm font-semibold text-gray-500"
              >
                בחר תאריך
              </label>
              <input
                type="date"
                name="date"
                id="date"
                autoComplete="none"
                className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
                ref={dateInputRef}
                onClick={() => dateInputRef.current?.showPicker?.()}
                onChange={(e) => {
                  if (!!e.target.value) {
                    fetchAvailableSlots();
                  }
                }}
                defaultValue={dayjs(lesson.event.dateAndTime).format(
                  "YYYY-MM-DD"
                )}
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="datetime"
                className="block text-sm font-semibold text-gray-500"
              >
                בחר שעת התחלה
              </label>
              {fetcher.data || timeSlotsRef.current ? (
                <select
                  name="datetime"
                  id="datetime"
                  key="datetime"
                  className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:py-2 sm:text-sm"
                  defaultValue={dayjs(lesson.event.dateAndTime).toISOString()}
                  required
                  aria-required="true"
                >
                  {(fetcher.data || timeSlotsRef.current) /*|| fields?.slots*/
                    ?.map((slot) => (
                      <option
                        key={dayjs(slot).tz("utc").format("HH:mm")}
                        value={dayjs.tz(slot, "Israel").toISOString()}
                      >
                        {dayjs(slot).tz("utc").format("HH:mm")}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  id="datetime"
                  className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:py-2 sm:text-sm"
                  required
                  aria-required="true"
                ></select>
              )}
            </div>
          </div>

          <div className="mt-6 border-b border-gray-200 pb-6">
            <RadioGroup
              name="duration"
              className="mt-2"
              onChange={(value: number) =>
                (durationInputRef.current = value) && fetchAvailableSlots()
              }
              defaultValue={lesson.event.duration}
            >
              <RadioGroup.Label className="sr-only">
                בחר אורך שיעור
              </RadioGroup.Label>
              <label className="block text-sm font-semibold text-gray-500">
                בחר אורך שיעור
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {durations.map((option) => (
                  <RadioGroup.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, checked }) =>
                      clsx([
                        true /* is allowed? (enough space until next lesson?) */
                          ? "cursor-pointer focus:outline-none"
                          : "cursor-not-allowed opacity-25",
                        active ? "ring-2 ring-indigo-600 ring-offset-2" : "",
                        checked
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
                        "flex flex-wrap items-center justify-center rounded-md py-3 px-3 text-sm font-medium uppercase sm:flex-1",
                      ])
                    }
                    disabled={
                      !true /* is allowed? (enough space until next lesson?) */
                    }
                  >
                    <RadioGroup.Label
                      as="span"
                      className="whitespace-nowrap text-xs leading-none"
                    >
                      {option.label}
                    </RadioGroup.Label>
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="mt-6">
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-500"
            >
              מחיר השיעור (לשעה)
            </label>
            <input
              type="number"
              name="price"
              id="price"
              autoComplete="none"
              className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
              defaultValue={lesson.price}
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="studentId"
              className="block text-sm font-semibold text-gray-500"
            >
              בחר תלמיד
            </label>
            <select
              name="studentId"
              id="studentId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
              defaultValue={lesson.student.id}
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
        </Form>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:ml-40 sm:rtl:mr-40">
          <button
            type="submit"
            form="edit-lesson-form"
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
            autoFocus
          >
            צור שיעור
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={() => onClose()}
          >
            ביטול
          </button>
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}
