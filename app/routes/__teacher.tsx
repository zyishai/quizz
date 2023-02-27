import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import React, { Fragment } from "react";
import { json, LoaderArgs } from "@remix-run/node";
import { getUserId, requireUserId } from "~/utils/session.server";
import clsx from "clsx";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { AppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import { Teacher } from "~/types/teacher";
import { User } from "~/types/user";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);

  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId, { fetchUser: true });
    if (teacher) {
      return json({
        teacher: teacher as Teacher & { user: User },
        navigation: [
          { name: "בית", href: "/home" },
          { name: "תלמידים", href: "/students" },
          { name: "שיעורים", href: "/calendar" },
          { name: "תשלומים", href: "/payments" },
        ],
        userMenu: [
          { name: "הפרופיל שלי", href: "/profile", type: "link" },
          { name: "הגדרות", href: "/settings", type: "link" },
          { name: "התנתק", href: "/logout", type: "button" },
        ],
      });
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

export default function TeacherView() {
  const { teacher, navigation, userMenu } = useLoaderData<typeof loader>();
  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <Disclosure as="nav" className="z-50 border-b border-gray-200 bg-white">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    <div className="flex flex-shrink-0 items-center">
                      <img
                        className="h-7 w-auto"
                        src="/logo-no-text.svg"
                        alt="The Portal Logo"
                      />
                    </div>
                    <div className="hidden rtl:space-x-reverse sm:-my-px sm:flex sm:space-x-8 sm:ltr:ml-6 sm:rtl:mr-6">
                      {navigation.map((item) => (
                        <NavLink
                          to={item.href}
                          key={item.name}
                          className={({ isActive }) =>
                            clsx([
                              "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500",
                              {
                                "border-orange-500 text-gray-900": isActive,
                                "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700":
                                  !isActive,
                              },
                            ])
                          }
                        >
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:flex sm:items-center sm:ltr:ml-6 sm:rtl:mr-6">
                    <button
                      type="button"
                      className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">צפה בהתראות</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ltr:ml-3 rtl:mr-3">
                      <div>
                        <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                          <span className="sr-only">פתח תפריט משתמש</span>
                          <UserCircleIcon
                            className="h-8 w-8 rounded-full fill-gray-400 hover:fill-amber-500"
                            aria-hidden="true"
                          />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userMenu.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) =>
                                item.type === "button" ? (
                                  <Form
                                    action={item.href}
                                    method="post"
                                    className={clsx([
                                      "block px-4 py-2 text-sm text-gray-700",
                                      { "bg-gray-100": active },
                                    ])}
                                  >
                                    <button className="block w-full ltr:text-left rtl:text-right">
                                      {item.name}
                                    </button>
                                  </Form>
                                ) : (
                                  <Link
                                    to={item.href}
                                    className={clsx([
                                      "block px-4 py-2 text-sm text-gray-700",
                                      { "bg-gray-100": active },
                                    ])}
                                  >
                                    {item.name}
                                  </Link>
                                )
                              }
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                  <div className="flex items-center ltr:-mr-2 rtl:-ml-2 sm:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                      <span className="sr-only">פתח תפריט ראשי</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 pt-2 pb-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={React.forwardRef(
                        (props, ref: React.ForwardedRef<HTMLAnchorElement>) => (
                          <NavLink
                            {...props}
                            ref={ref}
                            to={item.href}
                            className={({ isActive }) =>
                              clsx([
                                "block py-2 text-base font-medium ltr:border-l-4 ltr:pr-4 ltr:pl-3 rtl:border-r-4 rtl:pr-3 rtl:pl-4",
                                {
                                  "border-orange-500 bg-orange-50 text-orange-700":
                                    isActive,
                                },
                                {
                                  "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800":
                                    !isActive,
                                },
                              ])
                            }
                          />
                        )
                      )}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <span className="sr-only">פתח תפריט משתמש</span>
                      <UserCircleIcon
                        className="h-10 w-10 rounded-full fill-gray-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ltr:ml-3 rtl:mr-3">
                      <div className="text-base font-medium text-gray-800">
                        {teacher?.firstName} {teacher?.lastName}
                      </div>
                      <div className="text-sm font-light text-gray-500">
                        {teacher?.user?.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ltr:ml-auto rtl:mr-auto"
                    >
                      <span className="sr-only">צפה בהתראות</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    {userMenu.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as={
                          item.type === "button"
                            ? React.forwardRef(
                                (
                                  { className, to, ...props }: any,
                                  ref: any
                                ) => (
                                  <Form action={item.href} method="post">
                                    <button
                                      type="submit"
                                      className={clsx([
                                        "block w-full px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 ltr:text-left rtl:text-right",
                                        className,
                                      ])}
                                    >
                                      {item.name}
                                    </button>
                                  </Form>
                                )
                              )
                            : Link
                        }
                        to={item.href}
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <div className="flex flex-1 flex-col overflow-hidden bg-white py-6">
          {/* <header>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Dashboard</h1>
            </div>
          </header> */}
          <main className="flex flex-1 overflow-hidden">
            <div className="mx-auto max-w-7xl flex-1 overflow-hidden sm:px-6 lg:px-8">
              {/* <div className="px-4 py-8 sm:px-0">
                <div className="h-96 rounded-lg border-4 border-dashed border-gray-200" />
              </div> */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
