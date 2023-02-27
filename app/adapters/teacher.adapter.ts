import { Result } from "surrealdb.js";
import { Teacher } from "~/types/teacher";
import { getDatabaseInstance } from "./db.adapter";

type CreateTeacherDto = {
  firstName: string;
  lastName: string;
  userId: string;
}

// function mapToTeacher(teacherResponse: Teacher): Teacher {
//   let createdAt = new Date(teacherResponse.createdAt);
//   let lastUpdatedAt = undefined;
//   if (isNaN(Date.parse(teacherResponse.createdAt))) {
//     createdAt = new Date();
//   }
//   if (teacherResponse.lastUpdatedAt && !isNaN(Date.parse(teacherResponse.lastUpdatedAt))) {
//     lastUpdatedAt = new Date(teacherResponse.lastUpdatedAt);
//   }

//   return {
//     ...teacherResponse,
//     createdAt,
//     lastUpdatedAt
//   }
// }

type GetTeacherProps = {
  fetchUser: boolean
}
export async function getTeacherByUserId(userId: string, props?: GetTeacherProps): Promise<Teacher | null> {
  const db = await getDatabaseInstance();
  const query = props?.fetchUser
    ? 'select * from teacher where user = $userId fetch user'
    : 'select * from teacher where user = $userId';
  const [teacher] = await db.query<Result<Teacher[]>[]>(query, { userId });
  if (teacher.error) {
    throw teacher.error;
  }
  return teacher.result.length > 0 ? teacher.result[0] : null;
}

export async function createTeacher(dto: CreateTeacherDto): Promise<Teacher | null> {
  const db = await getDatabaseInstance();
  const [teacher] = await db.query<Result<Teacher[]>[]>(`create teacher content {
    firstName: $firstName,
    lastName: $lastName,
    address: '',
    bio: '',
    user: $userId,
    createdAt: time::now()
  }`, dto);
  if (teacher.error) {
    throw teacher.error;
  }
  return teacher.result.length > 0 ? teacher.result[0] : null;
}

type UpdateTeacherDto = {
  teacherId: string;
  firstName?: string;
  lastName?: string;
}
export async function updateTeacherInfo({ teacherId, ...updateData }: UpdateTeacherDto): Promise<Teacher | null> {
  const db = await getDatabaseInstance();
  const teacher = await db.change<Teacher, {}>(teacherId, updateData);
  if (Array.isArray(teacher)) {
    return null;
  } else {
    return teacher;
  }
}
