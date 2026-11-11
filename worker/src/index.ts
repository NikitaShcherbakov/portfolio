const audioPathPattern = /^\/(audio\/[a-z0-9-]+\.[0-9a-f]{8}\.mp3)$/;
const allowedMethods = ['GET', 'HEAD'];

const httpStatus = {
  ok: 200,
  partialContent: 206,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
} as const;

type LooseRange = { offset?: number; length?: number; suffix?: number };

function getAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin');

  if (!origin) return null;

  return env.ALLOWED_ORIGINS.split(',').includes(origin) ? origin : null;
}

function createCorsHeaders(origin: string | null) {
  const headers = new Headers({ Vary: 'Origin' });

  if (origin) headers.set('Access-Control-Allow-Origin', origin);

  return headers;
}

function createErrorResponse(status: number, origin: string | null) {
  const headers = createCorsHeaders(origin);

  headers.set('Cache-Control', 'no-store');

  if (status === httpStatus.methodNotAllowed) {
    headers.set('Allow', allowedMethods.join(', '));
  }

  return new Response(null, { status, headers });
}

function getContentRange(range: R2Range, size: number) {
  // R2 returns every key of the range, with `undefined` for the unused ones.
  const { offset, length, suffix } = range as LooseRange;
  const start = suffix === undefined ? (offset ?? 0) : size - suffix;
  const end = length === undefined ? size - 1 : start + length - 1;

  return `bytes ${String(start)}-${String(end)}/${String(size)}`;
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (!allowedMethods.includes(request.method)) {
      return createErrorResponse(httpStatus.methodNotAllowed, origin);
    }

    const key = audioPathPattern.exec(new URL(request.url).pathname)?.[1];

    if (!key) return createErrorResponse(httpStatus.notFound, origin);

    // Media elements with crossOrigin send Origin; a typed URL or a download link does not.
    if (!origin) return createErrorResponse(httpStatus.forbidden, null);

    const hasRange = request.headers.has('Range');
    const object = hasRange
      ? await env.AUDIO.get(key, { range: request.headers })
      : await env.AUDIO.get(key);

    if (!object) return createErrorResponse(httpStatus.notFound, origin);

    const headers = createCorsHeaders(origin);

    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Disposition', 'inline');

    const { range } = object;
    const isPartial = hasRange && range !== undefined;

    if (isPartial) {
      headers.set('Content-Range', getContentRange(range, object.size));
    }

    return new Response(request.method === 'HEAD' ? null : object.body, {
      status: isPartial ? httpStatus.partialContent : httpStatus.ok,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
