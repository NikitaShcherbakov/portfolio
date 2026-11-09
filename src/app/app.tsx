import { createBrowserRouter, RouterProvider } from 'react-router';

import { routeObjects } from '@/router';

const router = createBrowserRouter(routeObjects);

export function App() {
  return <RouterProvider router={router} />;
}
