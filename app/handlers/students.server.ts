import { createStudent, deleteStudent, fetchCreditsByContactId, fetchStudentsByContactId, fetchStudentsByTeacherId, findStudentById, updateStudent } from "~/adapters/student.adapter";
import { getTeacherByUserId } from "~/adapters/teacher.adapter";
import { ErrorType } from "~/types/errors";
import { CreateContactDto, CreateStudentDto, Student, UpdateStudentDto } from "~/types/student";
import { AppError } from "~/utils/app-error";
import { assertContactDtoType, assertGrade, assertString } from "~/utils/misc";
import { getUserId } from "~/utils/session.server"

export const getStudents = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const students = await fetchStudentsByTeacherId(teacher.id, { fetchContacts: true });
      return students;
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound })
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound })
  }
}

export const getStudent = async (studentId?: string) => {
  assertString(studentId);
  const student = await findStudentById(studentId, { fetchContacts: true });
  if (!student) {
    throw new AppError({ errType: ErrorType.StudentNotFound });
  }
  return student;
}

export const getContactRelatedStudents = async (contactId?: string) => {
  assertString(contactId);
  return fetchStudentsByContactId(contactId);
}

export const constructNewStudentDto: (request: Request) => Promise<CreateStudentDto> = async (request: Request) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      const formData = await request.formData();
      const teacherId = teacher.id;
      const fullName = formData.get('fullName')?.toString();
      assertString(fullName);
      const grade = Number(formData.get('grade'));
      assertGrade(grade);
      const contacts: CreateContactDto[] = [];
      let id = 0;
      let contact;
      while ((contact = extractContactDto(formData, id)) !== null) {
        contacts.push(contact);
        id++;
      }

      return {
        teacherId,
        fullName,
        grade,
        contacts
      }
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}
const extractContactDto: (data: FormData, id?: number) => CreateContactDto | null = (formData: FormData, index = 0) => {
  const id = formData.get(`contact[${index}]['id']`)?.toString();
  if (typeof id !== 'string') {
    return null;
  }
  const type = formData.get(`contact[${index}]['type']`);
  assertContactDtoType(type);
  // todo: if type === new - then extract rest of information (name, addresses, phone no)
  if (type === 'new') {
    const fullName = formData.get(`contact[${index}]['fullName']`);
    assertString(fullName);
    const address = formData.get(`contact[${index}]['address']`);
    assertString(address);
    const phoneNumber = formData.get(`contact[${index}]['phoneNumber']`);
    assertString(phoneNumber);
    const emailAddress = formData.get(`contact[${index}]['emailAddress']`);
    assertString(emailAddress);

    return {
      id,
      type,
      fullName,
      address,
      phoneNumber,
      emailAddress
    }
  } else {
    return {
      id,
      type
    }
  }
}

export const createNewStudent = async (dto: CreateStudentDto) => {
  return createStudent(dto);
}

export const constructUpdateStudentDto: (request: Request, studentId?: string) => Promise<UpdateStudentDto> = async (request: Request, studentId?: string) => {
  const userId = await getUserId(request);
  if (userId) {
    const teacher = await getTeacherByUserId(userId);
    if (teacher) {
      assertString(studentId);
      const formData = await request.formData();
      const teacherId = teacher.id;
      const fullName = formData.get('fullName')?.toString();
      assertString(fullName);
      const grade = Number(formData.get('grade'));
      assertGrade(grade);
      const contacts: CreateContactDto[] = [];
      let id = 0;
      let contact;
      while ((contact = extractContactDto(formData, id)) !== null) {
        contacts.push(contact);
        id++;
      }

      return {
        studentId,
        teacherId,
        fullName,
        grade,
        contacts
      }
    } else {
      throw new AppError({ errType: ErrorType.TeacherNotFound });
    }
  } else {
    throw new AppError({ errType: ErrorType.UserNotFound });
  }
}

export const updateStudentDetails = async (dto: UpdateStudentDto) => {
  return updateStudent(dto);
}

export const deleteExistingStudent = async (request: Request) => {
  const formData = await request.formData();
  const studentId = formData.get('studentId');
  assertString(studentId);
  return deleteStudent(studentId);
}

export const getCreditsForStudent = async (student: Student) => {
  if (!student.contacts) {
    return [];
  }

  return (await Promise.all(student.contacts.map((contact) => fetchCreditsByContactId(contact.id)))).flat();
}
