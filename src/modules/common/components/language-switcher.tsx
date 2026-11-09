import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { languageNames, languages } from '@/i18n';

import { useLanguage } from '../hooks/use-language';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const selectId = useId();

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        {t('language.label')}
      </label>
      <select
        id={selectId}
        value={language}
        onChange={(event) => void changeLanguage(event.target.value)}
        className="h-11 rounded-md border border-neutral-300 bg-transparent px-2 dark:border-neutral-700 dark:bg-neutral-950"
      >
        {languages.map((option) => (
          <option key={option} value={option} lang={option}>
            {languageNames[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
