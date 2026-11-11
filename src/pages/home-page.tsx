import { useTranslation } from 'react-i18next';

import { CutoutHeading, PageContainer, PageTitle } from '@/modules/common';
import { DeckPoster } from '@/modules/player';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <PageContainer>
        <PageTitle />
        <h1 className="text-3xl font-bold">{t('site.name')}</h1>
      </PageContainer>
      <section className="mx-auto box-content max-w-[1240px] px-6 pt-14 pb-20 phone:px-2.5">
        <CutoutHeading>{t('pages.home.music')}</CutoutHeading>
        <DeckPoster />
      </section>
    </>
  );
}
