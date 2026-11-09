import { useTranslation } from 'react-i18next';

export function GamesPage() {
  const { t } = useTranslation();

  return <h1 className="text-3xl font-bold">{t('nav.games')}</h1>;
}
