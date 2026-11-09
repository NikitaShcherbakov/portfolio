import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/use-theme';
import { themePreferences } from '../utils/theme';

const options = [
  { value: themePreferences.Light, labelKey: 'theme.light', icon: '☀' },
  { value: themePreferences.Dark, labelKey: 'theme.dark', icon: '☾' },
  { value: themePreferences.System, labelKey: 'theme.system', icon: '◐' },
] as const;

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { preference, changeTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label={t('theme.label')}
      className="flex rounded-md border border-neutral-300 dark:border-neutral-700"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={t(option.labelKey)}
          title={t(option.labelKey)}
          aria-pressed={preference === option.value}
          onClick={() => {
            changeTheme(option.value);
          }}
          className="inline-flex size-11 items-center justify-center rounded-md text-xl aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:bg-neutral-100 dark:aria-pressed:text-neutral-900"
        >
          <span aria-hidden="true">{option.icon}</span>
        </button>
      ))}
    </div>
  );
}
