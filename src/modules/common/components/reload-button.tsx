import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { textActionClassName } from '../utils/text-action';

type ReloadButtonProps = {
  className?: string;
};

function handleReload() {
  window.location.reload();
}

export function ReloadButton({ className }: ReloadButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn(textActionClassName, className)}
      onClick={handleReload}
    >
      {t('errors.reload')}
    </button>
  );
}
