import { useTranslation } from 'react-i18next';

import contacts from '@/content/contacts.json';

import { getContactLinks } from '../utils/get-contact-links';

const contactLinks = getContactLinks(contacts);
const currentYear = new Date().getFullYear();

const brandLabels = {
  email: 'Email',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
  github: 'GitHub',
} as const;

export function SiteFooter() {
  const { t } = useTranslation();
  const labels = { ...brandLabels, phone: t('footer.phone') };

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
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {labels[link.id]}
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
