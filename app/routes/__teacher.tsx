import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { json, LoaderArgs } from "@remix-run/node";
import { getUserId, logout, requireUserId } from "~/utils/session.server";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { AppError } from "~/utils/app-error";
import { ErrorType } from "~/types/errors";
import { Teacher } from "~/types/teacher";
import { User } from "~/types/user";
import { Outlet, useLoaderData } from "@remix-run/react";
import BetaNoticeBanner from "~/components/beta-banner";
import SideNav from "~/components/side-nav";
import UpgradeToProCTA from "~/components/upgrade-to-pro-cta";
import {
  Bars3IconOutline,
  CalendarDaysIconOutline,
  CreditCardIconOutline,
  FolderIconOutline,
  HomeIconOutline,
  ReceiptPercentIconOutline,
  UserIconOutline,
  UsersIconOutline,
  XMarkIconOutline,
} from "~/utils/icons";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request);

  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId, { fetchUser: true });
    if (teacher) {
      return json({
        teacher: teacher as Teacher & { user: User },
        // userMenu: [
        //   { name: "הפרופיל שלי", href: "/profile", type: "link" },
        //   { name: "הגדרות", href: "/settings", type: "link" },
        //   { name: "התנתק", href: "/logout", type: "button" },
        // ],
      });
    } else {
      return logout(request);
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
};

const navigation = [
  {
    label: "בית",
    href: "/",
    icon: HomeIconOutline,
    isPro: false,
    disabled: true,
  },
  {
    label: "מערכת שעות",
    href: "/lessons",
    icon: CalendarDaysIconOutline,
    isPro: false,
  },
  {
    label: "רשימת תלמידים",
    href: "/students",
    icon: UsersIconOutline,
    isPro: false,
  },
  {
    label: "חומרי לימוד",
    href: "/documents",
    icon: FolderIconOutline,
    isPro: true,
    disabled: true,
  },
  {
    label: "קבלות",
    href: "/receipts",
    icon: ReceiptPercentIconOutline,
    isPro: true,
    disabled: true,
  },
  {
    label: "הפרופיל שלי",
    href: "/profile",
    icon: UserIconOutline,
    isPro: false,
  },
];

export default function TeacherView() {
  const { teacher } = useLoaderData<typeof loader>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const proEnabled = false; // [TODO] fetch dynamically from user/teacher.

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <BetaNoticeBanner />
      <div className="flex flex-1 flex-row overflow-hidden">
        {/* Floating dialog for mobile */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50 lg:hidden"
            onClose={setSidebarOpen}
          >
            {/* Dark Overlay */}
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>

            {/* Dialog panel */}
            <div className="fixed inset-0 z-40 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pb-4">
                  {/* Close button */}
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 pt-2 ltr:right-0 ltr:-mr-12 rtl:left-0 rtl:-ml-12">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ltr:ml-1 rtl:mr-1"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIconOutline
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Content (logo & navigation) */}
                  <div className="flex-1 overflow-y-auto pt-5 pb-4">
                    {/* App Logo */}
                    <div className="mb-10 flex flex-shrink-0 items-center px-4">
                      <img
                        className="h-8 w-auto"
                        src="/logo-no-text.svg"
                        alt="Portal logo"
                      />
                    </div>
                    <SideNav
                      navigation={navigation}
                      proEnabled={proEnabled}
                      onClose={() => setSidebarOpen(false)}
                    />
                  </div>
                  <UpgradeToProCTA />
                </Dialog.Panel>
              </Transition.Child>
              <div className="w-14 flex-shrink-0">
                {/* Force sidebar to shrink to fit close icon */}
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:relative lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex min-h-0 flex-1 flex-col border-gray-200 bg-white pb-4 ltr:border-r rtl:border-l">
            {/* App logo & navigation menu */}
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="mb-5 flex flex-shrink-0 items-center px-4">
                <img
                  className="h-8 w-auto"
                  src="/logo-no-text.svg"
                  alt="Portal logo"
                />
              </div>
              <SideNav
                navigation={navigation}
                proEnabled={proEnabled}
                onClose={() => {}}
              />
            </div>

            {/* Pro CTA notice */}
            <UpgradeToProCTA />
          </div>
        </div>

        {/* Main content area (& hamburger menu button for mobile) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Hamburger menu for mobile */}
          <div className="sticky top-0 z-10 flex items-center border-b bg-white pt-1 ltr:pl-1 rtl:pr-1 sm:pt-3 sm:ltr:pl-3 sm:rtl:pr-3 lg:hidden">
            <button
              type="button"
              className="-mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ltr:-ml-0.5 rtl:-mr-0.5"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3IconOutline className="mt-1 h-6 w-6" aria-hidden="true" />
            </button>
            <h1 className="text-2xl font-medium text-gray-800">
              הפורטל
              <span className="font-bold text-amber-600"> למורה</span>
            </h1>
          </div>

          <main className="flex max-w-7xl flex-1 overflow-hidden py-6 px-4 sm:px-6 lg:px-8">
            {/* Your content */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
