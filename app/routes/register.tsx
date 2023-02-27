import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { badRequest } from "~/utils/request.server";
import {
  createUserSession,
  register,
  requireGuest,
} from "~/utils/session.server";
import { validator } from "~/utils/validator.server";

function validateUsername(username: string) {
  if (!validator.isLength(username, { min: 5 })) {
    return `שם המשתמש קצר מדי. אורך מינימלי: 5 תוים`;
  }
}

function validatePassword(password: string) {
  if (!validator.isLength(password, { min: 8 })) {
    return `סיסמה קצרה מדי. אורך מינימלי: 8 תוים`;
  }

  if (!validator.isStrongPassword(password)) {
    return `סיסמה חלשה. יש להשתמש באות גדולה, מספרים וסימן אחד לפחות`;
  }
}

function validateFirstName(name: string) {
  if (!validator.isLength(name, { min: 2 })) {
    return `שם לא תקין`;
  }
}

function validateLastName(name: string) {
  if (!validator.isLength(name, { min: 2 })) {
    return `שם לא תקין`;
  }
}

function validateEmail(email: string) {
  if (!validator.isEmail(email)) {
    return `אימייל לא תקין`;
  }
}

function validateUrl(url: string) {
  if (
    validator.isURL(url, {
      require_host: false,
      require_tld: false,
      require_valid_protocol: false,
    })
  ) {
    return url;
  }

  return "/";
}

export const loader = async ({ request }: LoaderArgs) => {
  await requireGuest(request);
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const redirectTo = validateUrl(
    (formData.get("redirectTo") as string | undefined) || "/"
  );

  const fieldErrors = {
    firstName: validateFirstName(firstName),
    lastName: validateLastName(lastName),
    email: validateEmail(email),
    username: validateUsername(username),
    password: validatePassword(password),
  };
  const fields = { firstName, lastName, email, username, password };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  // handle auth flow (and server error)
  const user = await register({
    firstName,
    lastName,
    email,
    username,
    password,
  });
  console.log(user);
  if (!user) {
    return badRequest({
      fieldErrors: null,
      fields,
      formError: "לא הצלחנו ליצור את המשתמש. אנא נסה שנית.",
    });
  }

  return createUserSession(user.id, redirectTo);
};

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();

  return (
    <main className="grid h-full w-full grid-cols-1 grid-rows-1 bg-gradient-to-br from-amber-100 to-amber-200">
      <div className="col-start-1 row-start-1 flex flex-col items-center bg-white p-12 shadow-lg shadow-orange-200 sm:my-0 sm:place-self-center sm:rounded-2xl">
        <img
          src="logo-no-text.svg"
          alt="App logo"
          width="50"
          height="50"
          className="mb-5"
        />
        <h1 className="mb-1 text-3xl font-semibold text-gray-900">
          צור חשבון חדש
        </h1>
        <p className="mb-6 space-x-1 rtl:space-x-reverse">
          <span className="text-gray-600">כבר יש לך חשבון?</span>
          <Link
            to="/login"
            className="whitespace-nowrap text-amber-600 hover:text-amber-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            התחבר לחשבונך
          </Link>
        </p>
        <Form replace method="post" className="self-stretch">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") || undefined}
          />
          <fieldset>
            <div className="grid grid-flow-row gap-3 sm:grid-flow-col">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  שם פרטי
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:w-auto sm:text-sm"
                    dir="auto"
                    required
                    minLength={2}
                    defaultValue={actionData?.fieldErrors?.firstName}
                    aria-invalid={
                      Boolean(actionData?.fieldErrors?.firstName) || undefined
                    }
                    aria-errormessage={
                      actionData?.fieldErrors?.firstName
                        ? "first-name-error"
                        : undefined
                    }
                  />
                </div>
                {actionData?.fieldErrors?.firstName ? (
                  <p
                    className="mt-2 max-w-[35ch] text-sm text-red-600"
                    id="first-name-error"
                    role="alert"
                  >
                    {actionData?.fieldErrors?.firstName}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  שם משפחה
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:w-auto sm:text-sm"
                    dir="auto"
                    required
                    minLength={2}
                    defaultValue={actionData?.fieldErrors?.lastName}
                    aria-invalid={
                      Boolean(actionData?.fieldErrors?.lastName) || undefined
                    }
                    aria-errormessage={
                      actionData?.fieldErrors?.lastName
                        ? "last-name-error"
                        : undefined
                    }
                  />
                </div>
                {actionData?.fieldErrors?.lastName ? (
                  <p
                    className="mt-2 max-w-[35ch] text-sm text-red-600"
                    id="last-name-error"
                    role="alert"
                  >
                    {actionData?.fieldErrors?.lastName}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                כתובת אימייל
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:max-w-[45ch] sm:text-sm"
                  dir="ltr"
                  required
                  defaultValue={actionData?.fieldErrors?.email}
                  aria-invalid={
                    Boolean(actionData?.fieldErrors?.email) || undefined
                  }
                  aria-errormessage={
                    actionData?.fieldErrors?.email ? "email-error" : undefined
                  }
                />
              </div>
              {actionData?.fieldErrors?.email ? (
                <p
                  className="mt-2 max-w-[35ch] text-sm text-red-600"
                  id="email-error"
                  role="alert"
                >
                  {actionData?.fieldErrors?.email}
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                בחר שם משתמש
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:max-w-[45ch] sm:text-sm"
                  dir="ltr"
                  required
                  minLength={5}
                  defaultValue={actionData?.fieldErrors?.username}
                  aria-invalid={
                    Boolean(actionData?.fieldErrors?.username) || undefined
                  }
                  aria-errormessage={
                    actionData?.fieldErrors?.username
                      ? "username-error"
                      : undefined
                  }
                />
              </div>
              {actionData?.fieldErrors?.username ? (
                <p
                  className="mt-2 max-w-[35ch] text-sm text-red-600"
                  id="username-error"
                  role="alert"
                >
                  {actionData?.fieldErrors?.username}
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                בחר סיסמה
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:max-w-[45ch] sm:text-sm"
                  dir="ltr"
                  required
                  minLength={8}
                  defaultValue={actionData?.fieldErrors?.password}
                  aria-invalid={
                    Boolean(actionData?.fieldErrors?.password) || undefined
                  }
                  aria-errormessage={
                    actionData?.fieldErrors?.password
                      ? "password-error"
                      : undefined
                  }
                />
              </div>
              {actionData?.fieldErrors?.password ? (
                <p
                  className="mt-2 max-w-[35ch] text-sm text-red-600"
                  id="password-error"
                  role="alert"
                >
                  {actionData?.fieldErrors?.password}
                </p>
              ) : null}
            </div>
          </fieldset>
          <div className="mt-7">
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              צור חשבון
            </button>
          </div>
        </Form>
      </div>
    </main>
  );
}
