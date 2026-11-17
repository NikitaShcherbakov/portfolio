import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { CutoutHeading, PageContainer, PageTitle } from '@/modules/common';
import { Magazine } from '@/modules/magazine';
import { DeckPoster } from '@/modules/player';

export function HomePage() {
  const { t } = useTranslation();
  const musicHeadingId = useId();

  return (
    <>
      <PageContainer>
        <PageTitle />
        <h1 className="text-3xl font-bold">{t('site.name')}</h1>
      </PageContainer>
      <div className="overflow-x-clip">
        <div className="mx-auto box-content flex max-w-[1240px] flex-col gap-12 px-6 pt-14 pb-20 phone:px-2.5">
          <Magazine />
          <section aria-labelledby={musicHeadingId}>
            <CutoutHeading id={musicHeadingId}>
              {t('pages.home.music')}
            </CutoutHeading>
            <DeckPoster />
          </section>
        </div>
      </div>
    </>
  );
}
