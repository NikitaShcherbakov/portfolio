const audioPathPattern = /^\/(audio\/[a-z0-9-]+\.[0-9a-f]{8}\.mp3)$/;
const allowedMethods = ['GET', 'HEAD'];

const httpStatus = {
  Ok: 200,
  PartialContent: 206,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  BadGateway: 502,
} as const;

type LooseRange = { offset?: number; length?: number; suffix?: number };

function getAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get('Origin');

  if (!origin) return null;

  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((allowed) =>
    allowed.trim()
  );

  return allowedOrigins.includes(origin) ? origin : null;
}

function createCorsHeaders(origin: string | null) {
  const headers = new Headers({ Vary: 'Origin' });

  if (origin) headers.set('Access-Control-Allow-Origin', origin);

  return headers;
}

function createErrorResponse(status: number, origin: string | null) {
  const headers = createCorsHeaders(origin);

  headers.set('Cache-Control', 'no-store');

  if (status === httpStatus.MethodNotAllowed) {
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

function readAudioObject(request: Request, bucket: R2Bucket, key: string) {
  return request.headers.has('Range')
    ? bucket.get(key, { range: request.headers })
    : bucket.get(key);
}

function createAudioResponse(
  request: Request,
  object: R2ObjectBody,
  origin: string
) {
  const headers = createCorsHeaders(origin);

  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Disposition', 'inline');

  const { range } = object;
  const isPartial = request.headers.has('Range') && range !== undefined;

  if (isPartial) {
    headers.set('Content-Range', getContentRange(range, object.size));
  }

  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: isPartial ? httpStatus.PartialContent : httpStatus.Ok,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (!allowedMethods.includes(request.method)) {
      return createErrorResponse(httpStatus.MethodNotAllowed, origin);
    }

    const key = audioPathPattern.exec(new URL(request.url).pathname)?.[1];

    if (!key) return createErrorResponse(httpStatus.NotFound, origin);

    if (!origin) return createErrorResponse(httpStatus.Forbidden, null);

    try {
      const object = await readAudioObject(request, env.AUDIO, key);

      return object
        ? createAudioResponse(request, object, origin)
        : createErrorResponse(httpStatus.NotFound, origin);
    } catch (error) {
      console.error(`R2 read of "${key}" failed.`, error);

      return createErrorResponse(httpStatus.BadGateway, origin);
    }
  },
} satisfies ExportedHandler<Env>;
