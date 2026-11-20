type ErrorContext = {
  source: string;
  componentStack?: string | undefined;
};

export function captureError(
  error: unknown,
  { source, componentStack }: ErrorContext
) {
  console.error(
    `[${source}]`,
    error,
    ...(componentStack ? [componentStack] : [])
  );
}
