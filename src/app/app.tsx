import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { router } from '@/router';
import { captureError } from '@/utils/capture-error';

const isVercelDeployment = import.meta.env.VITE_VERCEL_ENV !== undefined;

export function App() {
  return (
    <>
      <RouterProvider
        router={router}
        onError={(error, { errorInfo }) => {
          // Render errors also reach createRoot's onCaughtError; only lazy() and loader failures are new here.
          if (!errorInfo) captureError(error, { source: 'router' });
        }}
      />
      {isVercelDeployment && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );
}
