import { fetchContactById, fetchContactsByTeacherId, updateContactInfo } from "~/adapters/student.adapter";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { UpdateContactDto } from "~/types/student";
import { AppError } from "~/utils/app-error";
import { assertString } from "~/utils/misc";
import { getUserId } from "~/utils/session.server"

export const getContacts = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const contacts = await fetchContactsByTeacherId(teacher.id);
      return contacts;
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}

export const getContact = async (contactId?: string) => {
  assertString(contactId);
  return fetchContactById(contactId);
}

export const constructUpdateContactDto: (request: Request, contactId?: string) => Promise<UpdateContactDto> = async (request: Request, contactId?: string) => {
  assertString(contactId);
  const formData = await request.formData();
  const fullName = formData.get('fullName')?.toString();
  const address = formData.get('address')?.toString();
  const phoneNumber = formData.get('phoneNumber')?.toString();
  const emailAddress = formData.get('emailAddress')?.toString();

  return {
    contactId,
    fullName,
    address,
    phoneNumber,
    emailAddress,
  }
}

export const updateContactDetails = async (dto: UpdateContactDto) => {
  return updateContactInfo(dto);
}
