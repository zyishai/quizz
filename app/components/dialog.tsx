import { Form } from "@remix-run/react";

interface DialogProps {
  open: boolean;
}

export default function Dialog({ open }: DialogProps) {
  return (
    <dialog
      open={open}
      className="fixed inset-0 z-[999] h-full w-full bg-gray-600/70 text-gray-400"
    >
      <div className="h-96 w-64 bg-white">
        <Form method="post" replace>
          <button type="submit" name="_action" value="dialog:cancel">
            ביטול
          </button>
        </Form>
      </div>
    </dialog>
  );
}
