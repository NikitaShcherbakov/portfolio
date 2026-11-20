import { useTranslation } from 'react-i18next';

import {
  HomeLink,
  PageContainer,
  PageTitle,
  ReloadButton,
} from '@/modules/common';

export function ErrorPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageTitle page={t('errors.pageTitle')} />
      <h1 className="text-3xl font-bold">{t('errors.pageTitle')}</h1>
      <p className="mt-4">{t('errors.pageText')}</p>
      <div className="mt-4 flex flex-wrap gap-6">
        <ReloadButton />
        <HomeLink>{t('errors.backHome')}</HomeLink>
      </div>
    </PageContainer>
  );
}
