type Contacts = {
  email: string;
  phone: string;
  telegram: string;
  linkedin: string;
  github: string;
};

type ContactLink = {
  id: keyof Contacts;
  href: string;
  isExternal: boolean;
};

export function getContactLinks(contacts: Contacts): ContactLink[] {
  return [
    { id: 'email', href: `mailto:${contacts.email}`, isExternal: false },
    {
      id: 'phone',
      href: `tel:${contacts.phone.replace(/[^\d+]/g, '')}`,
      isExternal: false,
    },
    {
      id: 'telegram',
      href: `https://t.me/${contacts.telegram.replace(/^@/, '')}`,
      isExternal: true,
    },
    { id: 'linkedin', href: contacts.linkedin, isExternal: true },
    {
      id: 'github',
      href: `https://github.com/${contacts.github}`,
      isExternal: true,
    },
  ];
}
