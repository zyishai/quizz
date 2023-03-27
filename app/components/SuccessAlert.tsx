import { CheckCircleIconSolid } from "~/utils/icons";

type AlertProps = {
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
};
export default function SuccessAlert({ title, body, children }: AlertProps) {
  return (
    <div className="rounded-md bg-emerald-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIconSolid
            className="h-5 w-5 text-emerald-500"
            aria-hidden="true"
          />
        </div>
        <div className="ltr:ml-3 rtl:mr-3">
          <h3 className="text-sm font-semibold text-emerald-800">{title}</h3>
          {body && <div className="mt-2 text-sm text-emerald-700">{body}</div>}
          {children && (
            <div className="mt-2 text-sm text-emerald-700">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
