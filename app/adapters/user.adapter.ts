import { Result } from "surrealdb.js";
import { User } from "~/types/user";
import { getDatabaseInstance } from "./db.adapter";

type CreateUserDto = {
  username: string;
  hashedPassword: string;
  email: string;
}

// function mapToUser(userResponse: UserResponse): User {
//   let createdAt = new Date(userResponse.createdAt);
//   let lastUpdatedAt = undefined;
//   if (isNaN(Date.parse(userResponse.createdAt))) {
//     createdAt = new Date();
//   }
//   if (userResponse.lastUpdatedAt && !isNaN(Date.parse(userResponse.lastUpdatedAt))) {
//     lastUpdatedAt = new Date(userResponse.lastUpdatedAt);
//   }

//   return {
//     ...userResponse,
//     createdAt,
//     lastUpdatedAt
//   }
// }

export async function getUserById(userId: string): Promise<User | null> {
  const db = await getDatabaseInstance();
  const [user] = await db.query<Result<User[]>[]>('select * from user where id = $userId', { userId });
  if (user.error) {
    throw user.error;
  }
  return user.result.length > 0 ? user.result[0] : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await getDatabaseInstance();
  console.log(username);
  const [user] = await db.query<Result<User[]>[]>('select * from user where username = $username', { username });
  console.log(user);
  if (user.error) {
    throw user.error;
  }
  return user.result.length > 0 ? user.result[0] : null;
}

export async function createUser(dto: CreateUserDto): Promise<User | null> {
  const db = await getDatabaseInstance();
  const [user] = await db.query<Result<User[]>[]>(`create user content {
    username: $username,
    hashedPassword: $hashedPassword,
    email: $email,
    createdAt: time::now()
  }`, dto);
  if (user.error) {
    throw user.error;
  }
  return user.result.length > 0 ? user.result[0] : null;
}

type UpdateUserDto = {
  userId: string;
  username?: string;
  hashedPassword?: string;
  email?: string;
}
export async function updateUserCredentials({ userId, ...updateData }: UpdateUserDto): Promise<User | null> {
  const db = await getDatabaseInstance();
  const userResponse = await db.change<User, {}>(userId, updateData);
  if (Array.isArray(userResponse)) {
    return null;
  } else {
    return userResponse;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = await getDatabaseInstance();
  await db.delete(userId);
  return true;
}
