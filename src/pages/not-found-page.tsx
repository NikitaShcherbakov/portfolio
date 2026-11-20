import { useTranslation } from 'react-i18next';

import { HomeLink, PageContainer, PageTitle } from '@/modules/common';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageTitle page={t('pages.notFound.title')} />
      <h1 className="text-3xl font-bold">{t('pages.notFound.title')}</h1>
      <HomeLink className="mt-4">{t('pages.notFound.backHome')}</HomeLink>
    </PageContainer>
  );
}
