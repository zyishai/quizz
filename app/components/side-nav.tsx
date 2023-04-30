import { Form, NavLink } from "@remix-run/react";
import clsx from "clsx";
import { PowerIconOutline } from "~/utils/icons";

type NavItem = {
  label: string;
  href: string;
  icon: React.FC<any>;
  isPro?: boolean;
  disabled?: boolean;
};
type SideNavProps = {
  navigation: NavItem[];
  proEnabled?: boolean;
  onClose: () => void;
};
export default function SideNav({
  navigation,
  proEnabled,
  onClose,
}: SideNavProps) {
  return (
    <nav className="space-y-1 bg-white px-2" onClick={onClose}>
      {navigation
        .filter((item) => !item.disabled)
        .map((item) =>
          item.isPro && !proEnabled ? (
            <button
              type="button"
              key={item.label}
              className="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              disabled
            >
              <item.icon
                className="h-6 w-auto flex-shrink-0 text-gray-400 group-hover:text-gray-500 ltr:mr-3 rtl:ml-3"
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
              <span className="inline-block rounded-full bg-yellow-100 py-0.5 px-3 text-xs text-gray-800 ltr:ml-auto rtl:mr-auto">
                מתקדם
              </span>
            </button>
          ) : (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                clsx([
                  { "bg-gray-100 text-gray-900": isActive },
                  {
                    "text-gray-600 hover:bg-gray-50 hover:text-gray-900":
                      !isActive,
                  },
                  "group flex items-center rounded-md px-2 py-2 text-base font-medium",
                ])
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={clsx([
                      { "text-gray-500": isActive },
                      {
                        "text-gray-400 group-hover:text-gray-500": !isActive,
                      },
                      "h-6 w-6 flex-shrink-0 ltr:mr-4 rtl:ml-4",
                    ])}
                    aria-hidden="true"
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        )}
      <Form method="post" action="logout">
        <button
          type="submit"
          className="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <PowerIconOutline
            className="h-6 w-auto flex-shrink-0 text-gray-400 group-hover:text-gray-500 ltr:mr-3 rtl:ml-3"
            aria-hidden="true"
          />
          <span className="truncate">התנתק</span>
        </button>
      </Form>
    </nav>
  );
}
