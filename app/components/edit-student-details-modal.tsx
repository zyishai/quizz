import { Form } from "@remix-run/react";
import { Student } from "~/types/student";
import { grades } from "~/utils/grades";
import Dialog from "./dialog";

type EditStudentDetailsProps = {
  open: boolean;
  onClose: () => void;
  action?: string;
  student?: Student;
};
export default function EditStudentDetailsModal({
  open,
  onClose,
  action,
  student,
}: EditStudentDetailsProps) {
  return (
    <Dialog open={open} onClose={onClose} title="ערוך פרטי תלמיד">
      <Dialog.Body>
        <Form
          method="post"
          action={action}
          className="mt-4"
          id="edit-student-details-form"
          onSubmit={onClose}
        >
          <input type="hidden" name="_action" value="editStudentDetails" />
          <input type="hidden" name="studentId" value={student?.id} />
          <div className="flex space-x-2 pb-0 rtl:space-x-reverse">
            <div className="flex-1">
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-500"
              >
                שם מלא
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                autoComplete="given-name"
                className="mt-1 block w-full rounded-md border-gray-300 py-1 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:py-2 sm:text-sm"
                defaultValue={student?.fullName}
                required
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-semibold text-gray-500"
              >
                כיתה
              </label>
              <select
                id="grade"
                name="grade"
                autoComplete="none"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-1 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:py-2 sm:text-sm"
                defaultValue={student?.grade}
                aria-required="true"
              >
                {grades.map((grade) => (
                  <option value={grade.value} key={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Form>
      </Dialog.Body>

      <Dialog.Footer>
        <div className="sm:flex sm:flex-row-reverse sm:ltr:pl-40 sm:rtl:pr-40">
          <button
            type="submit"
            form="edit-student-details-form"
            className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 sm:w-auto sm:ltr:ml-3 sm:rtl:mr-3"
            autoFocus
          >
            שמירה
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            ביטול
          </button>
        </div>
      </Dialog.Footer>
    </Dialog>
  );
}
