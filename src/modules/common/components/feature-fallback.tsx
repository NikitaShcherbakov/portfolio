import { useTranslation } from 'react-i18next';

import { ReloadButton } from './reload-button';

export function FeatureFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-4 bg-paper px-6 py-5 text-ink shadow-cutout">
      <p>{t('errors.sectionText')}</p>
      <ReloadButton className="focus-visible:outline-ink dark:focus-visible:outline-ink" />
    </div>
  );
}
