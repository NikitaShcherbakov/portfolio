import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();

  return <h1 className="text-3xl font-bold">{t('site.name')}</h1>;
}
