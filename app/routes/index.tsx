import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <main
      dir="ltr"
      className="grid h-full w-full grid-cols-1 grid-rows-1 items-center bg-gradient-to-br from-amber-200 to-orange-200"
    >
      <header className="col-start-1 row-start-1 w-full self-start px-8 py-5">
        <img
          src="logo-no-text.svg"
          width="50"
          height="80"
          alt="App logo"
          className="mb-2"
        />
      </header>
      <div className="col-start-1 row-start-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900">The Portal</h1>
        <p className="mb-6 text-xl leading-9 text-green-900">
          Home for teachers of all scales
        </p>
        <div className="flex space-x-3">
          <Link
            to="calendar"
            className="rounded-md bg-orange-500 px-6 py-3 text-lg text-white shadow-sm shadow-neutral-400 transition-colors duration-150 hover:bg-orange-600"
          >
            Start Now
          </Link>
          <Link
            to="demo"
            className="rounded-md bg-white px-6 py-3 text-lg shadow-sm shadow-neutral-400 hover:bg-gray-50"
          >
            See Demo
          </Link>
        </div>
      </div>
    </main>
  );
}
