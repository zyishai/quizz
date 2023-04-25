import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwind from "./tailwind.css";
import globalStyles from "./styles/global.css";
import React from "react";
import dayjs from "dayjs";
import localeHebrew from "dayjs/locale/he";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.locale(localeHebrew);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Israel");

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwind },
    { rel: "stylesheet", href: globalStyles },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "The Portal",
  viewport: "width=device-width,initial-scale=1",
});

function Document({
  children,
  title = "הפורטל | עמוד הבית",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        <LiveReload />
      </body>
    </html>
  );
}

export const loader = async () => {
  console.log(process.env.NODE_ENV);
  return null;
};

export default function App() {
  return (
    <Document>
      <Outlet />
      <ScrollRestoration />
      <Scripts />
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document title="אופס">
      <div className="bg-red-400 px-7 pt-2 pb-4 shadow">
        <h1 className="text-4xl font-semibold leading-snug text-white">
          קרתה שגיאה
        </h1>
        <pre className="font-sans tracking-wide text-white">
          {error.message}
        </pre>
      </div>
    </Document>
  );
}
