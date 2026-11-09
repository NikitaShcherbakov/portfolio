import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { routes } from '@/router/routes';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-3xl font-bold">{t('pages.notFound.title')}</h1>
      <Link
        to={routes.Home}
        className="mt-4 inline-flex min-h-11 items-center underline underline-offset-4"
      >
        {t('pages.notFound.backHome')}
      </Link>
    </>
  );
}
