import { ActionArgs, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { namedAction } from "remix-utils";
import {
  constructLookupAvailableTimesConstraint,
  findAvailableTimes,
} from "~/handlers/lessons.server";

export const action = async ({ request }: ActionArgs) => {
  return namedAction(request, {
    async lookupAvailableTime() {
      const availableTimesConstraint =
        await constructLookupAvailableTimesConstraint(request);
      if (!availableTimesConstraint) {
        return json([]);
      }

      // Find available slots
      const availableSlots = await findAvailableTimes(
        request,
        availableTimesConstraint
      );

      return json(availableSlots);
    },
  });
};

export default function CalendarLayoutPage() {
  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <Outlet />
    </main>
  );
}
