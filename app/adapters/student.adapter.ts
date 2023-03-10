import { Result } from "surrealdb.js";
import { Credit, PaymentMethod } from "~/types/payment";
import { Contact, CreateContactDto, CreateStudentDto, Grade, Student, UpdateContactDto, UpdateStudentDto } from "~/types/student";
import { truthy } from "~/utils/misc";
import { getDatabaseInstance } from "./db.adapter";
import { addStudentToPaymentAccount, createPaymentAccount, moveStudentToPaymentAccount } from "./payment.adapter";

// Module level types

type StudentResponse = Omit<Student, 'contacts'> & { contacts:  Contact[] | string[] };
// type ContactResponse = DatabaseResponse<Contact>;
// type CreditResponse = DatabaseResponse<Credit>;

// Helper functions (i.e mappers, type narrowers, assertion functions etc)

// function mapToContact(contactResponse: string): string;
// function mapToContact(contactResponse: ContactResponse): Contact;
// function mapToContact(contactResponse: string | ContactResponse): string | Contact;
// function mapToContact(contactResponse: string | ContactResponse): string | Contact {
//   if (typeof contactResponse === 'string') {
//     return contactResponse;
//   }

//   let createdAt = new Date();
//   let lastUpdatedAt = undefined;

//   if (!isNaN(Date.parse(contactResponse.createdAt?.toString()))) {
//     createdAt = new Date(contactResponse.createdAt);
//   }
//   if (contactResponse.lastUpdatedAt && !isNaN(Date.parse(contactResponse.lastUpdatedAt.toString()))) {
//     lastUpdatedAt = new Date(contactResponse.lastUpdatedAt);
//   }

//   return {
//     id: contactResponse.id,
//     fullName: contactResponse.fullName,
//     address: contactResponse.address,
//     phoneNumber: contactResponse.phoneNumber,
//     emailAddress: contactResponse.emailAddress,
//     createdAt,
//     lastUpdatedAt
//   };
// }
function mapToStudent(response: StudentResponse): Student {
  const contacts = response.contacts
    .map((contact) => typeof contact === 'string' ? undefined : contact)
    .filter(truthy);

  return {
    ...response,
    contacts,
  }
}
// function mapToCredit(creditResponse: CreditResponse): Credit {
//   let paidAt = new Date(creditResponse.paidAt);
//   if (isNaN(Date.parse(creditResponse.paidAt))) {
//     paidAt = new Date();
//   }
//   return {
//     ...creditResponse,
//     paidAt
//   }
// }

// Student methods

type FetchStudentsProps = {
  fetchContacts?: boolean;
}
export async function fetchStudentsByTeacherId(teacherId: string, props?: FetchStudentsProps): Promise<Student[]> {
  const db = await getDatabaseInstance();

  const query = props?.fetchContacts
  ? 'select * from student where <-teach<-teacher.id contains $teacherId fetch contacts'
  : 'select * from student where <-teach<-teacher.id contains $teacherId';
  const [students] = await db.query<Result<StudentResponse[]>[]>(query, { teacherId });
  if (students.error) {
    throw students.error;
  }
  return students.result.map(mapToStudent);
}

type FindStudentProps = {
  fetchContacts?: boolean;
}
export async function findStudentById(studentId: string, props?: FindStudentProps): Promise<Student | null> {
  const db = await getDatabaseInstance();

  const query = props?.fetchContacts
    ? 'select * from $studentId fetch contacts'
    : 'select * from $studentId';
  const [student] = await db.query<Result<StudentResponse[]>[]>(query, { studentId });
  if (student.error) {
    throw student.error;
  }
  return student.result.length > 0 ? mapToStudent(student.result[0]) : null;
}

export async function fetchStudentsByContactId(contactId: string): Promise<Student[]> {
  const db = await getDatabaseInstance();

  const [students] = await db.query<Result<StudentResponse[]>[]>('select * from student where contacts contains $contactId fetch contacts', { contactId });
  if (students.error) {
    throw students.error;
  }

  return students.result.map(mapToStudent);
}

export async function createStudent(dto: CreateStudentDto): Promise<Student | null> {
  const db = await getDatabaseInstance();
  const contacts = await getContactIds(dto.contacts, dto.teacherId);
  
  // Create student entity
  const [student] = await db.query<Result<StudentResponse[]>[]>(`create student content {
    fullName: $fullName,
    grade: $grade,
    contacts: $contacts,
    createdAt: time::now()
  }`, { fullName: dto.fullName, grade: dto.grade, contacts });
  if (student.error) {
    throw student.error;
  }

  if (student.result.length > 0) {
    // Attach student and contacts to existing or new payment account
    if (dto.paymentAccountId) {
      if (!await addStudentToPaymentAccount({ accountId: dto.paymentAccountId, studentId: student.result[0].id, contactIds: contacts })) {
        throw new Error(`Could not attach student to payment account: ${dto.paymentAccountId}`);
      }
    } else {
      if (!await createPaymentAccount({ teacherId: dto.teacherId, students: [student.result[0].id], contacts })) {
        throw new Error(`Could not create payment account for the student`);
      }
    }

    // Relate student to teacher
    const [relationResponse] = await db.query('relate $teacherId -> teach -> $studentId', { teacherId: dto.teacherId, studentId: student.result[0].id });
    if (relationResponse.error) {
      throw relationResponse.error;
    }
    return mapToStudent(student.result[0]);
  } else {
    return null
  }
}

export async function updateStudent({ studentId, teacherId, accountType, paymentAccountId, ...updateData }: UpdateStudentDto): Promise<Student | null> {
  const db = await getDatabaseInstance();
  const contacts = await getContactIds(updateData.contacts, teacherId);
  const student = await db.change<StudentResponse, {}>(studentId, {
    ...updateData,
    contacts
  });
  if (Array.isArray(student)) {
    return null;
  } else {
    if (accountType === 'new') {
      // remove student from existing payment account and create new payment account
      await moveStudentToPaymentAccount({ teacherId, studentId })
    } else {
      await moveStudentToPaymentAccount({ teacherId, studentId, accountId: paymentAccountId });
    }

    return mapToStudent(student);
  }
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const db = await getDatabaseInstance();
  await db.delete(studentId);
  return true;
}

// Contact methods

function getContactIds(contacts: CreateContactDto[], teacherId: string): Promise<string[]> {
  return Promise.all(contacts.map((contact) => {
    if (shouldCreateNewContact(contact)) {
      return createContact(contact, teacherId).then((contact) => contact?.id);
    }
    return contact.id;
  })).then(results => results.filter(truthy));
}

function shouldCreateNewContact(contact: CreateContactDto): boolean {
  return contact.id.startsWith('temp:') || contact.type === 'new';
}

export async function fetchContactsByTeacherId(teacherId: string): Promise<Contact[]> {
  const db = await getDatabaseInstance();
  const [contacts] = await db.query<Result<Contact[]>[]>('select * from contact where <-has_contact<-teacher.id contains $teacherId', { teacherId });
  if (contacts.error) {
    throw contacts.error;
  }
  return contacts.result;
}

export async function fetchContactById(contactId: string): Promise<Contact | null> {
  const db = await getDatabaseInstance();

  const [contact] = await db.query<Result<Contact[]>[]>('select * from $contactId', { contactId });
  if (contact.error) {
    throw contact.error;
  }

  return contact.result.length > 0 ? contact.result[0] : null;
}

export async function createContact(dto: CreateContactDto, teacherId: string): Promise<Contact | null> {
  const db = await getDatabaseInstance();
  
  // Create contact entity
  const [contact] = await db.query<Result<Contact[]>[]>(`create contact content {
    fullName: $fullName,
    address: $address,
    phoneNumber: $phoneNumber,
    emailAddress: $emailAddress,
    createdAt: time::now()
  }`, dto);
  if (contact.error) {
    throw contact.error;
  }

  if (contact.result.length > 0) {
    // Relate contact to teacher
    const [relationResponse] = await db.query('relate $teacherId -> has_contact -> $contactId', { teacherId, contactId: contact.result[0].id });
    if (relationResponse.error) {
      throw relationResponse.error;
    }
    return contact.result[0];
  } else {
    return null;
  }
}

export async function updateContactInfo({ contactId, ...updateData }: UpdateContactDto): Promise<Contact | null> {
  const db = await getDatabaseInstance();
  const contact = await db.change<Contact, {}>(contactId, updateData);
  if (Array.isArray(contact)) {
    return null;
  } else {
    return contact;
  }
}

export async function fetchCreditsByContactId(contactId: string): Promise<Credit[]> {
  const db = await getDatabaseInstance();
  const [credits] = await db.query<Result<Credit[]>[]>('select * from credit where ->for->contact ?= $contactId', { contactId });
  if (credits.error) {
    throw credits.error;
  }
  return credits.result;
}

export async function fetchCreditById(creditId: string): Promise<Credit | null> {
  const db = await getDatabaseInstance();
  const [credit] = await db.query<Result<Credit[]>[]>('select * from $creditId', { creditId });
  if (credit.error) {
    throw credit.error;
  }
  return credit.result.length > 0 ? credit.result[0] : null;
}

type AddCreditDto = {
  sum: number;
  paymentMethod: PaymentMethod;
}
export async function addCreditToContact(contactId: string, dto: AddCreditDto): Promise<Credit | null> {
  const db = await getDatabaseInstance();
  const [credit] = await db.query<Result<Credit[]>[]>(`create credit content {
    sum: $sum,
    remaining: <future>{ sum - math::sum((select math::sum(payments[where creditId = $parent.id].sum) from lesson where student.contacts[where <-for.in ?= $parent.id] is not [])) },
    paymentMethod: $paymentMethod,
    paidAt: time::now()
  }`, dto);
  if (credit.error) {
    throw credit.error;
  }
  
  if (credit.result.length > 0) {
    const [relationResponse] = await db.query('relate $creditId -> for -> $contactId', { creditId: credit.result[0].id, contactId });
    if (relationResponse.error) {
      throw relationResponse.error;
    }
    return credit.result[0];
  } else {
    return null;
  }
}

type UpdateCreditDto = {
  creditId: string;
  sum?: number;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
}
export async function updateCreditDetails({ creditId, ...updateData }: UpdateCreditDto): Promise<Credit | null> {
  const db = await getDatabaseInstance();
  const credit = await db.change<Credit, {}>(creditId, { ...updateData, paidAt: updateData.paidAt?.toISOString() });
  if (Array.isArray(credit)) {
    return null;
  } else {
    return credit;
  }
}

export async function deleteCredit(creditId: string): Promise<boolean> {
  const db = await getDatabaseInstance();
  await db.delete(creditId);
  return true;
}
