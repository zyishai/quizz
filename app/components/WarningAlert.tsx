import { ExclamationTriangleIconSolid } from "~/utils/icons";

type AlertProps = {
  title: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
};
export default function WarningAlert({ title, body, children }: AlertProps) {
  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIconSolid
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        </div>
        <div className="ltr:ml-3 rtl:mr-3">
          <h3 className="text-sm font-semibold text-yellow-800">{title}</h3>
          {body && <div className="mt-2 text-sm text-yellow-700">{body}</div>}
          {children && (
            <div className="mt-2 text-sm text-yellow-700">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
