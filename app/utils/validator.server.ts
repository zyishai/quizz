import validator from 'validator';
import { Contact } from '~/types/student';

export { validator };

// NOT IN USE CURRENTLY
export function assertContact(value: string | Contact): asserts value is Contact {
  if (typeof value === 'string') {
    throw new Error('Expected contact, got string instead');
  }
}
