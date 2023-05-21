import { EntityBase } from "./misc";

export type User = EntityBase & {
  username: string;
  hashedPassword: string;
  email: string;
  blocked?: boolean;
}
