import { useTranslation } from 'react-i18next';

import { PageContainer, PageTitle } from '@/modules/common';

export function GamesPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageTitle page={t('nav.games')} />
      <h1 className="text-3xl font-bold">{t('nav.games')}</h1>
    </PageContainer>
  );
}
