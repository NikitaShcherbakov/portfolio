import { describe, expect, it } from 'vitest';

import { getContactLinks } from './get-contact-links';

describe('getContactLinks', () => {
  it('builds a link for every contact', () => {
    const links = getContactLinks({
      email: 'me@example.com',
      phone: '+380 (67) 123-45-67',
      telegram: '@nick',
      linkedin: 'https://www.linkedin.com/in/nick',
      github: 'nick',
    });

    expect(links).toEqual([
      { id: 'email', href: 'mailto:me@example.com', isExternal: false },
      { id: 'phone', href: 'tel:+380671234567', isExternal: false },
      { id: 'telegram', href: 'https://t.me/nick', isExternal: true },
      {
        id: 'linkedin',
        href: 'https://www.linkedin.com/in/nick',
        isExternal: true,
      },
      { id: 'github', href: 'https://github.com/nick', isExternal: true },
    ]);
  });
});
