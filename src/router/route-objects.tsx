import type { RouteObject } from 'react-router';

import { SiteTemplate } from '@/modules/common';
import { CvPage, GamesPage, HomePage, NotFoundPage } from '@/pages';

import { routes } from './routes';

export const routeObjects: RouteObject[] = [
  {
    element: <SiteTemplate />,
    children: [
      { index: true, element: <HomePage /> },
      { path: routes.Cv, element: <CvPage /> },
      { path: routes.Games, element: <GamesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
