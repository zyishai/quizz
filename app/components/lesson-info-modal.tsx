import Dialog from "./dialog";
import { useEffect, useState } from "react";
import { hasEventFetched, hasStudentFetched } from "~/utils/misc";
import { Form } from "@remix-run/react";
import { Lesson } from "~/types/lesson";
import EditLessonModal from "./edit-lesson-modal";
import { Student } from "~/types/student";
import AddPaymentModal from "./add-payment-modal";

type LessonInfoProps = {
  open: boolean;
  onClose: () => void;
  // account: PaymentAccount;
  lesson?: Lesson;
  students: Student[];
};
export default function LessonInfoModal({
  open,
  onClose,
  // account,
  lesson,
  students,
}: LessonInfoProps) {
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [ended, setEnded] = useState(!!lesson?.ended);

  useEffect(() => {
    if (lesson && ended !== lesson.ended) {
      setEnded(!!lesson.ended);
    }
  }, [lesson, ended]);

  return (
    <>
      <Dialog
        open={
          !!lesson &&
          hasEventFetched(lesson) &&
          hasStudentFetched(lesson) &&
          open
        }
        onClose={onClose}
        title="בחר פעולה"
      >
        <Dialog.Body>
          <div className="flex flex-col sm:min-w-[240px]">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500"
              onClick={() => setShowEditLessonModal(true)}
              autoFocus
            >
              ערוך פרטי שיעור
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-orange-100 px-3 py-2 text-sm font-medium shadow-sm hover:bg-orange-200 disabled:bg-gray-200 disabled:text-gray-500"
              onClick={() => setShowPaymentModal(true)}
              disabled={ended}
            >
              {ended ? "תשלום בוצע" : "בצע תשלום עבור שיעור זה"}
            </button>
            <Form method="post" className="mt-3 w-full">
              <input type="hidden" name="_action" value="deleteLesson" />
              <input type="hidden" name="lessonId" value={lesson?.id} />
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-amber-200"
                onClick={(e) => {
                  if (!confirm(`האם ברצונך למחוק שיעור זה?`)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  onClose();
                }}
              >
                מחק שיעור
              </button>
            </Form>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={onClose}
            >
              ביטול
            </button>
          </div>
          <EditLessonModal
            action="/lessons?index"
            open={showEditLessonModal}
            onClose={() => {
              setShowEditLessonModal(false);
              onClose();
            }}
            lesson={lesson}
            students={students}
          />
          <AddPaymentModal
            action="/lessons?index"
            open={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              onClose();
            }}
            lesson={lesson}
          />
        </Dialog.Body>
      </Dialog>
    </>
  );
}