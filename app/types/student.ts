import { EntityBase, InclusiveRange } from "./misc";

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
export type NewContact = {
  type: 'new';
  fullName: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
}
export type ExistingContact = {
  type: 'existing';
  id: string;
}
export type CreateContactDto = NewContact | ExistingContact;
export type CreateStudentDto = {
  fullName: string;
  grade: Grade;
  contacts: CreateContactDto[];
  teacherId: string;
  paymentAccountId?: string;
  accountType: 'new' | 'existing' | 'absent';
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
  accountType: 'new' | 'existing' | 'absent';
  paymentAccountId?: string;
  contacts: CreateContactDto[];
}
