import { Patch, Result } from "surrealdb.js";
import { Replace } from "~/types/misc";
import { getContactIds } from "./contact.server";
import { getDatabaseInstance } from "./db.server";
import { getTeacher } from "./teacher.server";
import { truthy } from "./misc";
import { Contact, ContactDraft, Student } from "~/types/student";

export async function getStudents(request: Request): Promise<Student[]> {
  const teacher = await getTeacher(request);
  if (!teacher) return [];
  const db = await getDatabaseInstance();
  
  const [response] = await db.query<Result<Student[]>[]>(`
    select * from student where <-teach<-teacher.id contains $teacherId fetch contacts
  `, { teacherId: teacher.id });
  if (response.error) {
    console.error(`Operation getStudents failed: ${response.error}`);
    throw response.error;
  }
  return response.result;
}

export async function getStudent(request: Request, studentId: string): Promise<Student | null> {
  const teacher = await getTeacher(request);
  if (!teacher) return null;
  const db = await getDatabaseInstance();

  const [response] = await db.query<Result<Student[]>[]>(`
    select * from student where <-teach<-teacher.id contains $teacherId and id = $studentId fetch contacts
  `, { teacherId: teacher.id, studentId });
  if (response.error) {
    console.error(`Operation getStudent failed: ${response.error}`);
    throw response.error;
  }
  return response.result[0];
}

export async function createStudent(request: Request, studentData: StudentData): Promise<Student> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw new Error('Operation createStudent failed. Reason: Not a teacher, not allowed');
  }
  const db = await getDatabaseInstance();
  const contacts = await getContactIds(request, studentData.contacts);
  const createdStudent = await db.create<Replace<StudentData, 'contacts', string[]>>('student', {
    ...studentData,
    contacts,
    lastUpdated: new Date().toISOString()
  });
  const [response] = await db.query(`relate $teacherId -> teach -> $studentId;`, { teacherId: teacher.id, studentId: createdStudent.id });
  if (response.error) {
    console.error(`Operation createStudent failed. Failed to relate student to teacher: ${response.error}`);
    throw response.error;
  }
  const [student] = await db.query<Result<Student[]>[]>(`select * from $studentId fetch contacts`, { studentId: createdStudent.id });
  if (student.error) {
    console.error(`Operation createStudent failed. Failed to fetch the created student: ${student.error}`);
    throw student.error;
  }

  return student.result[0];
}

export async function updateStudentDetails(request: Request, studentData: Partial<StudentData> & { id: string }): Promise<Student> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw new Error('Operation updateStudentDetails failed. Reason: Not a teacher, not allowed');
  }

  const db = await getDatabaseInstance();
  const contacts = await getContactIds(request, studentData.contacts || []);
  
  await db.modify(studentData.id, [
    studentData.fullName ? { op: 'replace', path: 'fullName', value: studentData.fullName } as Patch : null,
    studentData.grade ? { op: 'replace', path: 'grade', value: studentData.grade } as Patch : null,
    (contacts && contacts.length) ? { op: 'replace', path: 'contacts', value: contacts } as Patch : null
  ].filter(truthy));
  const student = await getStudent(request, studentData.id);
  if (!student) {
    throw new Error(`Operation updateStudnetDetails failed. Could not fetch after updating student information`);
  }
  return student;
}

export async function deleteStudent(request: Request, studentId: string): Promise<void> {
  const student = await getStudent(request, studentId);
  if (!student) {
    throw new Error('Operation deleteStudent failed. Student not exists');
  }

  const db = await getDatabaseInstance();
  await db.delete(studentId);
}

export async function constructStudentData(request: Request): Promise<Partial<Student>> {
  const formData = await request.formData();

  const contacts: Array<ContactDraft & Partial<Contact>> = [];
  let id;
  let i = 0;
  while ((id = formData.get(`contact[${i}]['id']`)) !== null) {
    let type = undefined;
    let tempType =
      formData.get(`contact[${i}]['type']`)?.toString().trim() || "";
    if (tempType === "new") {
      type = "new" as const;
    }
    if (tempType === "existing") {
      type = "existing" as const;
    }

    if (id.toString().startsWith("temp:")) {
      // we're dealing with new contact to create
      const fullName = formData.get(`contact[${i}]['fullName']`)?.toString().trim(); // prettier-ignore
      if (typeof fullName !== "string") {
        i++;
        continue;
      }

      contacts.push({
        id: id.toString(),
        type,
        fullName,
        address: formData.get(`contact[${i}]['address']`)?.toString().trim(),
        phoneNumber: formData
          .get(`contact[${i}]['phoneNumber']`)
          ?.toString()
          .trim(),
        emailAddress: formData
          .get(`contact[${i}]['emailAddress']`)
          ?.toString()
          .trim(),
      });
    } else {
      // we're dealing with existing contact to attach to this student
      contacts.push({ id: id.toString(), type });
    }

    i++;
  }
  const fullName = formData.get("fullName")?.toString().trim();
  const grade = formData.get("grade")?.toString().trim();

  return { fullName, grade, contacts };
}

// TO SAVE vv
