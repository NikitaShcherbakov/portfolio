import { useTranslation } from 'react-i18next';

import contacts from '@/content/contacts.json';
import { cn } from '@/lib/utils';

import { focusRingClassName } from '../utils/focus-ring';
import { getContactLinks } from '../utils/get-contact-links';

const contactLinks = getContactLinks(contacts);
const currentYear = new Date().getFullYear();

const labelKeys = {
  email: 'footer.email',
  phone: 'footer.phone',
  telegram: 'footer.telegram',
  linkedin: 'footer.linkedin',
  github: 'footer.github',
} as const;

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-neutral-300 dark:border-neutral-700">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {currentYear} {t('site.name')}
        </p>
        <nav aria-label={t('footer.contacts')}>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {contactLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-4',
                    focusRingClassName
                  )}
                >
                  {t(labelKeys[link.id])}
                  {link.isExternal && (
                    <>
                      {' '}
                      <span className="sr-only">{t('footer.newTab')}</span>
                    </>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
