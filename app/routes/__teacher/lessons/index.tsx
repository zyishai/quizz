import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { safeRedirect } from "remix-utils";
import { ErrorType } from "~/types/errors";
import { AppError } from "~/utils/app-error";
import { getClientPreferences } from "~/utils/client-prefs.server";

export const action = async ({ request }: ActionArgs) => {
  throw new AppError({
    errType: ErrorType.Other,
    message: "Route /lessons not implemented",
  });
  // return namedAction(request, {
  //   async prev() {
  //     const userId = await getUserId(request);
  //     if (userId) {
  //       const teacher = await getTeacherByUserId(userId);
  //       if (teacher) {
  //         const range = offsetRangeBy(
  //           await getRange(request),
  //           -1,
  //           OffsetUnit.WEEK
  //         );
  //         const events = await findLessonsInRange(teacher.id, range);
  //         console.log(range, events);

  //         return json({ events, range });
  //       } else {
  //         throw new AppError({ errType: ErrorType.TeacherNotFound });
  //       }
  //     } else {
  //       throw new AppError({ errType: ErrorType.UserNotFound });
  //     }
  //   },
  //   async next() {
  //     const userId = await getUserId(request);
  //     if (userId) {
  //       const teacher = await getTeacherByUserId(userId);
  //       if (teacher) {
  //         const range = offsetRangeBy(
  //           await getRange(request),
  //           1,
  //           OffsetUnit.WEEK
  //         );
  //         const events = await findLessonsInRange(teacher.id, range);

  //         return json({ events, range });
  //       } else {
  //         throw new AppError({ errType: ErrorType.TeacherNotFound });
  //       }
  //     } else {
  //       throw new AppError({ errType: ErrorType.UserNotFound });
  //     }
  //   },
  //   async today() {
  //     const userId = await getUserId(request);
  //     if (userId) {
  //       const teacher = await getTeacherByUserId(userId);
  //       if (teacher) {
  //         const range = {
  //           start: dayjs().startOf("week").toISOString(),
  //           end: dayjs().endOf("week").toISOString(),
  //         };
  //         const events = await findLessonsInRange(teacher.id, range);

  //         return json({ events, range });
  //       } else {
  //         throw new AppError({ errType: ErrorType.TeacherNotFound });
  //       }
  //     } else {
  //       throw new AppError({ errType: ErrorType.UserNotFound });
  //     }
  //   },
  // });
};

export const loader = async ({ request }: LoaderArgs) => {
  const clientPrefs = await getClientPreferences(request);
  const lastLessonsView = clientPrefs.lastLessonsView || "calendar";
  return redirect(safeRedirect(`/lessons/${lastLessonsView}`, "/"));
};

// export const loader = async ({ request }: LoaderArgs) => {
//   // const userId = await getUserId(request);
//   // if (userId) {
//   //   const teacher = await getTeacherByUserId(userId);
//   //   if (teacher) {
//   //     const range = await getRange(request);
//   //     const events = await findLessonsInRange(teacher.id, range);

//   //     return json({
//   //       events,
//   //       range,
//   //     });
//   //   } else {
//   //     throw new AppError({ errType: ErrorType.TeacherNotFound });
//   //   }
//   // } else {
//   //   throw new AppError({ errType: ErrorType.UserNotFound });
//   // }

//   return redirect(safeRedirect("/lessons/calendar", "/"));
// };

// export default function CalendarPage() {
//   const loaderData = useLoaderData<typeof loader>();
//   const actionData = useActionData<typeof action>();
//   const events = actionData?.events || loaderData.events;
//   const range = actionData?.range || loaderData.range;
//   const isSameYear = dayjs(range.start).year() === dayjs(range.end).year();

//   return (
//     <>
//       <header className="flex flex-row items-end justify-between border-b border-gray-200 py-2 px-1 pb-4">
//         <div className="inline-block">
//           <p className="mb-2 text-sm font-semibold leading-none text-gray-400">
//             לוח שיעורים שבועי
//           </p>

//           <h1 className="text-2xl font-bold leading-none text-gray-600">
//             {dayjs(range.start).format(`DD MMMM`)}
//             <span className="text-gray-400">
//               {isSameYear ? null : ` ${dayjs(range.start).format("YYYY")}`}
//             </span>
//             {" - "}
//             {dayjs(range.end).format(`DD MMMM`)}
//             <span className="text-gray-400">
//               {isSameYear ? null : ` ${dayjs(range.end).format("YYYY")}`}
//             </span>
//             {isSameYear ? ", " : null}
//             <span className="text-gray-400">
//               {isSameYear ? dayjs(range.start).format("YYYY") : null}
//             </span>
//           </h1>
//         </div>

//         <div className="flex items-center space-x-3 rtl:space-x-reverse">
//           <div className="inline-flex items-center space-x-1.5 ltr:ml-5 rtl:mr-5 rtl:space-x-reverse">
//             <Form method="post" replace>
//               <input type="hidden" name="_action" value="prev" />
//               <input type="hidden" name="rangeStart" value={range.start} />
//               <input type="hidden" name="rangeEnd" value={range.end} />
//               <button
//                 type="submit"
//                 className="inline-flex items-center rounded-full border border-gray-300 bg-white p-1.5 text-gray-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
//               >
//                 <ChevronRightIcon
//                   className="h-3 w-3"
//                   strokeWidth={2.5}
//                   aria-hidden="true"
//                 />
//               </button>
//             </Form>

//             <Form method="post" replace>
//               <input type="hidden" name="_action" value="next" />
//               <input type="hidden" name="rangeStart" value={range.start} />
//               <input type="hidden" name="rangeEnd" value={range.end} />
//               <button
//                 type="submit"
//                 className="inline-flex items-center rounded-full border border-gray-300 bg-white p-1.5 text-gray-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
//               >
//                 <ChevronLeftIcon
//                   className="h-3 w-3"
//                   strokeWidth={2.5}
//                   aria-hidden="true"
//                 />
//               </button>
//             </Form>
//           </div>

//           <Form method="post" replace>
//             <input type="hidden" name="_action" value="today" />
//             <button
//               type="submit"
//               className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
//             >
//               עבור להיום
//             </button>
//           </Form>

//           {/* Create lesson button */}
//           <Link
//             to="new"
//             className="relative inline-flex items-center justify-center rounded-md border border-transparent bg-amber-500 px-3 py-2 text-sm font-medium leading-4 text-white hover:bg-amber-600 focus:z-10 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
//           >
//             <PlusIcon
//               className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1"
//               strokeWidth={2.5}
//               aria-hidden="true"
//             />
//             <span>צור שיעור</span>
//           </Link>
//         </div>
//       </header>
//       <EventsCalendar events={events} range={range} />
//     </>
//   );
// }
