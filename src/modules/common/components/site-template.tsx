import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration } from 'react-router';

import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/modules/player';

import { focusRingClassName } from '../utils/focus-ring';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

const contentId = 'content';

export function SiteTemplate() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <AudioPlayer />
      <a
        href={`#${contentId}`}
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-md focus:bg-neutral-900 focus:px-3 focus:text-white dark:focus:bg-neutral-100 dark:focus:text-neutral-900',
          focusRingClassName
        )}
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
