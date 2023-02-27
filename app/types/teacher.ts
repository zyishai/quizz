import { EntityBase } from "./misc";

export type Teacher = EntityBase & {
  firstName: string;
  lastName: string;
  address?: string;
  bio?: string;
}
