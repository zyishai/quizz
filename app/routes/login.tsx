import { ActionArgs, LoaderArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login, requireGuest } from "~/utils/session.server";
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

  // if (!validator.isStrongPassword(password)) {
  //   return `סיסמה חלשה. יש להשתמש באות גדולה, מספרים וסימן אחד לפחות`;
  // }
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
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const redirectTo = validateUrl(
    (formData.get("redirectTo") as string | undefined) || "/"
  );

  // Handle field errors
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };
  const fields = { username, password };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  // handle auth flow
  console.log("username", username);
  console.log("password", password);
  const user = await login({ username, password });
  console.log("user", user);
  if (!user) {
    return badRequest({
      fieldErrors: null,
      fields,
      formError: "שם משתמש או סיסמה לא תקינים",
    });
  }

  return createUserSession(user.id, redirectTo);
};

export default function LoginPage() {
  const transition = useTransition();
  const isLoading = !!transition.submission;
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

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
          התחבר לחשבונך
        </h1>
        <p className="mb-6 space-x-1 rtl:space-x-reverse">
          <span className="text-gray-600">פעם ראשונה כאן?</span>
          <Link
            to="/register"
            className="whitespace-nowrap text-amber-600 hover:text-amber-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            הירשם למערכת
          </Link>
        </p>
        {actionData?.formError ? (
          <p className="mb-6 w-full rounded-md border border-red-600 bg-red-50 py-2 text-center text-sm font-semibold text-red-600">
            {actionData?.formError}
          </p>
        ) : null}
        <Form replace method="post" className="self-stretch">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") || undefined}
          />
          <fieldset disabled={isLoading}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                שם משתמש
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-800 sm:w-[35ch] sm:text-sm"
                  dir="ltr"
                  required
                  minLength={5}
                  defaultValue={actionData?.fields?.username}
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
                סיסמה
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-800 sm:w-[35ch] sm:text-sm"
                  dir="ltr"
                  required
                  minLength={8}
                  defaultValue={actionData?.fields?.password}
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
              className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "אנא המתן.." : "התחבר"}
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="forgot-password"
              className="text-sm text-amber-600 hover:text-amber-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              שכחתי סיסמה
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
