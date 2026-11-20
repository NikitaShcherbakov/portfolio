import { useTranslation } from 'react-i18next';

type PageTitleProps = {
  page?: string;
};

export function PageTitle({ page }: PageTitleProps) {
  const { t } = useTranslation();
  const siteName = t('site.name');

  return (
    <title>
      {page ? t('site.pageTitle', { page, name: siteName }) : siteName}
    </title>
  );
}
