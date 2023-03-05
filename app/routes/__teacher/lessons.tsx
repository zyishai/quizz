import { CalendarDaysIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { ActionArgs, json } from "@remix-run/node";
import { NavLink, Outlet, useLocation, useNavigate } from "@remix-run/react";
import clsx from "clsx";
import { namedAction } from "remix-utils";
import {
  constructLookupAvailableTimesConstraint,
  findAvailableTimes,
} from "~/handlers/lessons.server";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    async lookupAvailableTime() {
      const availableTimesConstraint =
        await constructLookupAvailableTimesConstraint(request);
      if (!availableTimesConstraint) {
        return json([]);
      }

      // Find available slots
      const availableSlots = await findAvailableTimes(
        request,
        availableTimesConstraint
      );

      return json(availableSlots);
    },
  });
};

const tabs = [
  { label: "לוח שנה", href: "calendar", icon: CalendarDaysIcon },
  { label: "רשימת שיעורים", href: "list", icon: ListBulletIcon },
];

export default function LessonsLayoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="mb-5">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            בחר תצוגת שיעורים
          </label>
          {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            defaultValue={
              tabs.find(
                (tab) =>
                  location.pathname.endsWith(tab.href) ||
                  location.state === tab.href
              )?.href
            }
            onChange={(e) => navigate(e.target.value, { replace: true })}
          >
            {tabs.map((tab) => (
              <option key={tab.label} value={tab.href}>
                תצוגת {tab.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav
              className="-mb-px flex space-x-8 rtl:space-x-reverse"
              aria-label="רשימת תצוגות"
            >
              {tabs.map((tab) => (
                <NavLink
                  key={tab.label}
                  to={tab.href}
                  className={({ isActive }) =>
                    clsx([
                      { "border-indigo-500 text-indigo-600": isActive },
                      {
                        "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700":
                          !isActive,
                      },
                      "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium",
                    ])
                  }
                  // aria-current={tab.current ? 'page' : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <tab.icon
                        className={clsx(
                          { "text-indigo-500": isActive },
                          {
                            "text-gray-400 group-hover:text-gray-500":
                              !isActive,
                          },
                          "h-5 w-5 ltr:-ml-0.5 ltr:mr-2 rtl:-mr-0.5 rtl:ml-2"
                        )}
                        aria-hidden="true"
                      />
                      <span>{tab.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <Outlet />
    </main>
  );
}
