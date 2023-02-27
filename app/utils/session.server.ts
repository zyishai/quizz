import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { createTeacher } from "~/adapters/teacher.adapter";
import { createUser, getUserById, getUserByUsername } from "~/adapters/user.adapter";
import { ErrorType } from "~/types/errors";
import { User } from "~/types/user";
import { AppError } from "./app-error";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
};
type LoginForm = {
  username: string;
  password: string;
};

export function getUserWhitelistedFields(user: User) {
  const { hashedPassword, ...whitelistedUser } = user;
  return whitelistedUser;
}

export async function register({
  firstName,
  lastName,
  email,
  username,
  password,
}: RegisterForm) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({
    email,
     username,
     hashedPassword
  });
  if (!user) {
    throw new AppError({ errType: ErrorType.UserNotCreated });
  }
  const teacher = await createTeacher({
    firstName,
    lastName,
    userId: user.id
  });
  if (!teacher) {
    throw new AppError({ errType: ErrorType.TeacherNotCreated });
  }
  return getUserWhitelistedFields(user);
}

export async function login({ username, password }: LoginForm) {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
  // const db = await getDatabaseInstance();
  // const [users] = await db.query<Result<User[]>[]>(
  //   "select * from user where username = $username",
  //   {
  //     username,
  //   }
  // );

  // if (users.error) {
  //   console.error(users.error);
  //   throw users.error;
  // }

  // if (users.result.length === 0) {
  //   return null;
  // }

  // const user = users.result[0];
  const isCorrectPassword = await bcrypt.compare(password, user.hashedPassword);
  if (!isCorrectPassword) {
    return null;
  }

  return getUserWhitelistedFields(user);
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  const redirectTo = new URL(request.url).pathname;
  const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
  return redirect(`/login?${searchParams}`, {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "portal_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireGuest(request: Request, redirectTo = "/") {
  const userId = await getUserId(request);
  if (typeof userId === "string") {
    throw redirect(redirectTo);
  }

  return null;
}

export async function getUser(request: Request) {
  // const db = await getDatabaseInstance();
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  if (!user) {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }

  // const [users] = await db.query<Result<User[]>[]>(
  //   "select * from user where id = $userId",
  //   {
  //     userId,
  //   }
  // );
  // if (users.error) {
  //   console.error(`Operation getUser failed: ${users.error}`);
  //   return null
  // }
  // if (!users.result || users.result?.length === 0) {
  //   console.error(`Operation getUser failed: user not found. Operation result: ${users.result}`)
  //   return null;
  // }
  return getUserWhitelistedFields(user);
}
