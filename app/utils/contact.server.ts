import { Patch, Result } from 'surrealdb.js';
import invariant from 'tiny-invariant';
import { Contact, ContactData } from '~/types/contact';
import { Student } from '~/types/student';
import { getDatabaseInstance } from './db.server';
import { truthy } from './misc';
import { getTeacher } from './teacher.server';

export async function getContacts(request: Request): Promise<Contact[]> {
  const teacher = await getTeacher(request);
  if (!teacher) return [];
  const db = await getDatabaseInstance();
  /** This was the previous query:
  * select * from contact where id inside array::distinct($teacherId->teach->student.contacts);
  * That query has an issue that if a contact is not referenced by any student - it won't be selected..
  * That's why we need to relate a contact to a teacher directly, by `has_contact` relation.
  */
  const [response] = await db.query<Result<{contacts: Contact[]}[]>[]>(`
    select ->has_contact->contact.* as contacts from $teacherId;
  `, { teacherId: teacher.id });
  if (response.error) {
    console.error('Operation getContacts failed. Error while fetching contacts:', response.error);
    throw response.error;
  }

  return response.result[0].contacts;
}

export async function getContact(request: Request, contactId: string): Promise<Contact | null> {
  const teacher = await getTeacher(request);
  if (!teacher) return null;
  
  const db = await getDatabaseInstance();
  const [contact] = await db.query<Result<Contact[]>[]>('select * from contact where <-has_contact<-teacher.id contains $teacherId and id = $contactId', 
  { teacherId: teacher.id, contactId });
  if (contact.error) {
    console.error(`Operation getContact failed: ${contact.error}`);
    throw contact.error;
  }
  return contact.result[0];
}

export async function createContact(request: Request, contactData: ContactData): Promise<Contact> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw new Error('Operation createContact failed. Not a teacher.');
  }
  const db = await getDatabaseInstance();
  const contactName = contactData.fullName;
  invariant(typeof contactName === 'string', `Missing contact name for: ${JSON.stringify(contactData)}`);

  const { type, id, ...contactInfo } = contactData;
  const contact = await db.create<Omit<Contact, 'id'>>('contact', {
    ...contactInfo,
    fullName: contactName,
  });
  const [response] = await db.query('relate $teacherId -> has_contact -> $contactId', { teacherId: teacher.id, contactId: contact.id });
  if (response.error) {
    console.error(`Operation createContact failed. Cannot relate contact to teacher: ${response.error}`);
    throw response.error;
  }
  
  return contact;
}

export async function constructContactData(request: Request): Promise<Partial<Contact> & { id: string }> {
  const formData = await request.formData();

  const id = formData.get('id')?.toString();
  if (!id) {
    console.warn('Operation constructContactData failed. Reason: missing id', formData.entries());
    throw new Error('פרטי איש קשר לא תקינים');
  }

  const fullName = formData.get('fullName')?.toString();
  const address = formData.get('address')?.toString();
  const phoneNumber = formData.get('phoneNumber')?.toString();
  const emailAddress = formData.get('emailAddress')?.toString();

  return { id, fullName, address, phoneNumber, emailAddress };
}

export async function updateContactInformation(request: Request, contactData: ContactData): Promise<Contact> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    throw new Error('Operation updateContactInformation failed. Not a teacher.');
  }
  const db = await getDatabaseInstance();
  await db.modify(contactData.id, [
    contactData.fullName ? { op: 'replace', path: 'fullName', value: contactData.fullName } as Patch: null,
    contactData.address ? { op: 'replace', path: 'address', value: contactData.address } as Patch: null,
    contactData.phoneNumber ? { op: 'replace', path: 'phoneNumber', value: contactData.phoneNumber } as Patch: null,
    contactData.emailAddress ? { op: 'replace', path: 'emailAddress', value: contactData.emailAddress } as Patch: null,
  ].filter(truthy));
  const contact = await getContact(request, contactData.id);
  if (!contact) {
    throw new Error(`Operation updateContactInformation failed. Could not fetch after updating contact information`);
  }
  
  return contact;
}

export function getContactIds(request: Request, contacts: ContactData[]) {
  return Promise.all(contacts.map((contact) => {
    if (shouldCreateNewContact(contact)) {
      return createContact(request, contact).then((contact) => contact.id);
    }
    return contact.id;
  }));
}
function shouldCreateNewContact(contact: ContactData): boolean {
  return contact.id.startsWith('temp:') || contact.type === 'new';
}

export async function getRelatedStudents(request: Request, contactId: string): Promise<Student[]> {
  const teacher = await getTeacher(request);
  if (!teacher) {
    console.warn('Operation getRelatedStudents warning. Not a teacher.');
    return [];
  }

  const db = await getDatabaseInstance();
  const [students] = await db.query<Result<Student[]>[]>('select * from student where contacts contains $contactId fetch contacts', { contactId });
  if (students.error) {
    console.error(`Operation getRelatedStudents failed: ${students.error}`);
    throw students.error;
  }
  return students.result;
}
