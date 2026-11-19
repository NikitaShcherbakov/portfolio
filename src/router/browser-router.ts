import { createBrowserRouter, createPath } from 'react-router';

import { routeObjects } from './route-objects';

export const router = createBrowserRouter(routeObjects);

export function getIntendedPath() {
  const { navigation, location } = router.state;

  return createPath(navigation.location ?? location);
}
