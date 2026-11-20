import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

import { focusRingClassName } from '../utils/focus-ring';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

const tabs = [
  { path: routes.Home, labelKey: 'nav.home' },
  { path: routes.Cv, labelKey: 'nav.cv' },
  { path: routes.Games, labelKey: 'nav.games' },
] as const;

function handleTabClick(event: MouseEvent<HTMLAnchorElement>) {
  const isRepeatedClick = event.detail > 1;

  if (isRepeatedClick) {
    event.preventDefault();
  }
}

export function SiteHeader() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-neutral-300 dark:border-neutral-700">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav aria-label={t('nav.label')}>
          <ul className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <li key={tab.path}>
                <NavLink
                  to={tab.path}
                  end={tab.path === routes.Home}
                  className={cn(
                    'inline-flex h-11 items-center rounded-md px-3 font-medium hover:bg-neutral-100 aria-[current=page]:bg-neutral-900 aria-[current=page]:text-white dark:hover:bg-neutral-800 dark:aria-[current=page]:bg-neutral-100 dark:aria-[current=page]:text-neutral-900',
                    focusRingClassName
                  )}
                  onClick={handleTabClick}
                >
                  {t(tab.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
