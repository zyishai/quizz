import { Result } from "surrealdb.js";
import { OmitDeep } from "~/types/misc";
import { Teacher } from "~/types/teacher";
import { getDatabaseInstance } from "./db.server";
import { getUserWhitelistedFields, requireUserId } from "./session.server";

export async function getTeacher(request: Request, redirectTo = new URL(request.url).pathname): Promise<OmitDeep<Teacher, 'user.hashedPassword'> | null> {
  const userId = await requireUserId(request);

  const db = await getDatabaseInstance();
  const [teachers] = await db.query<Result<Teacher[]>[]>('select * from teacher where user = $userId fetch user', {
    userId
  });
  if (teachers.error) {
    console.error(`Operation getTeacher failed: ${teachers.error}`);
    return null;
  }
  if (!teachers.result || teachers.result?.length === 0) {
    console.error(`Operation getTeacher failed: teacher not found. Operation result: ${teachers.result}`)
    return null;
  }
  return {
    ...teachers.result[0],
    user: getUserWhitelistedFields(teachers.result[0].user)
  }
}
