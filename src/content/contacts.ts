import contactsJson from './contacts.json';
import { contactsSchema } from './schemas';

export const contacts = contactsSchema.parse(contactsJson);
