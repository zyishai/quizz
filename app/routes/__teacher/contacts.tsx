import { Outlet } from "@remix-run/react";

export default function ContactsLayoutPage() {
  return (
    <div className="container mx-auto flex h-full flex-col overflow-hidden px-4 sm:px-6 lg:px-8">
      <Outlet />
    </div>
  );
}
