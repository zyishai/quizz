import { Outlet } from "@remix-run/react";

export default function ContactsLayoutPage() {
  return (
    <div className="container mx-auto flex h-full flex-col overflow-hidden">
      <Outlet />
    </div>
  );
}
