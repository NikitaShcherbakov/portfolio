import type { RouteObject } from 'react-router';

import { SiteTemplate } from '@/modules/common';
import { ErrorPage, HomePage, NotFoundPage, PageFallback } from '@/pages';

import { routes } from './routes';

export const routeObjects: RouteObject[] = [
  {
    element: <SiteTemplate />,
    errorElement: <ErrorPage />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: routes.Cv,
            HydrateFallback: PageFallback,
            lazy: async () => {
              const { CvPage } = await import('@/pages/cv-page');

              return { Component: CvPage };
            },
          },
          {
            path: routes.Games,
            HydrateFallback: PageFallback,
            lazy: async () => {
              const { GamesPage } = await import('@/pages/games-page');

              return { Component: GamesPage };
            },
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
