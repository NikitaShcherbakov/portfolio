import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration } from 'react-router';

import { PlaybackClock } from '@/modules/player';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

const contentId = 'content';

export function SiteTemplate() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <PlaybackClock />
      <a
        href={`#${contentId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:py-2.5 focus:text-white"
      >
        {t('site.skipToContent')}
      </a>
      <SiteHeader />
      <main id={contentId} tabIndex={-1} className="w-full flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
