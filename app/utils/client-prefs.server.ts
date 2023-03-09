import { createCookieSessionStorage } from "@remix-run/node";

type ClientPrefs = {
  lastLessonsView?: 'calendar' | 'list';
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "client_prefs",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function getClientPreferences(request: Request): Promise<ClientPrefs> {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return session.has('clientPrefs') ? session.get('clientPrefs') : {};
}

export async function setLastLessonsView(request: Request, view: 'calendar' | 'list') {
  const session = await storage.getSession(request.headers.get('Cookie'));
  const clientPrefs = await getClientPreferences(request);
  clientPrefs.lastLessonsView = view;
  session.set('clientPrefs', clientPrefs);
  return storage.commitSession(session);
}
