import { createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export const redirectCookie = createCookieSessionStorage({
  cookie: {
    name: "portal_redirect_to",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})
