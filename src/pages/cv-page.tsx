import { useTranslation } from 'react-i18next';

import { PageContainer, PageTitle } from '@/modules/common';

export function CvPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <PageTitle page={t('nav.cv')} />
      <h1 className="text-3xl font-bold">{t('nav.cv')}</h1>
    </PageContainer>
  );
}
