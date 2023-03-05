import { EntityBase, InclusiveRange, Replace } from "./misc";

export type Grade = InclusiveRange<1, 12>;
export type Student = EntityBase & {
  fullName: string;
  grade: Grade;
  contacts?: Contact[];
};
export type Contact = EntityBase & {
  fullName: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
};
export type ContactDraft = {
  id: string;
  type?: 'new' | 'existing'
};
export type CreateContactDto = Partial<Contact> & ContactDraft;
export type CreateStudentDto = {
  fullName: string;
  grade: Grade;
  contacts: CreateContactDto[];
  teacherId: string;
  paymentAccountId?: string;
}
export type UpdateContactDto = {
  contactId: string;
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
}
export type UpdateStudentDto = {
  studentId: string;
  teacherId: string;
  fullName?: string;
  grade?: Grade;
  contacts: CreateContactDto[];
}
