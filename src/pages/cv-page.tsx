import { useTranslation } from 'react-i18next';

export function CvPage() {
  const { t } = useTranslation();

  return <h1 className="text-3xl font-bold">{t('nav.cv')}</h1>;
}
