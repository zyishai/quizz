import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { CreateEventDto } from "~/types/event";
import { AppError } from "~/utils/app-error";
import { assertNumber, assertString } from "~/utils/misc";
import { getUserId } from "~/utils/session.server";
import { createEvent } from "~/adapters/event.adapter";

export const constructNewEventDto: (request: Request) => Promise<CreateEventDto> = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const dateAndTime = formData.get('datetime');
      assertString(dateAndTime);
      const duration = Number(formData.get('duration'));
      assertNumber(duration);

      return {
        teacherId: teacher.id,
        dateAndTime,
        duration
      }
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}

export const createNewEvent = async (dto: CreateEventDto) => {
  return createEvent(dto);
}
