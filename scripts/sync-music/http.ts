import { setTimeout as wait } from 'node:timers/promises';
import type * as z from 'zod/mini';

import { userAgent } from './config.ts';

const maxAttempts = 6;
const firstRetryDelayMs = 2000;
const maxRetryDelayMs = 60_000;
const requestTimeoutMs = 20_000;

type RetryRequestInit = Pick<RequestInit, 'redirect'> & {
  headers?: Record<string, string>;
};

function getIsRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function getIsRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function createHttpError(url: string, response: Response): Error {
  return new Error(
    `Request to ${url} failed with HTTP ${String(response.status)}.`
  );
}

function getRetryDelayMs(attempt: number, response?: Response): number {
  const retryAfterSec = Number(response?.headers.get('Retry-After'));
  const delayMs =
    Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? retryAfterSec * 1000
      : firstRetryDelayMs * 2 ** (attempt - 1);

  return Math.min(delayMs, maxRetryDelayMs);
}

async function waitBeforeRetry(
  url: string,
  attempt: number,
  response?: Response
): Promise<void> {
  const delayMs = getRetryDelayMs(attempt, response);
  const reason = response ? `HTTP ${String(response.status)}` : 'no response';

  await response?.body?.cancel();
  console.warn(
    `${reason} from ${new URL(url).host}, retrying in ${String(Math.round(delayMs / 1000))} s`
  );
  await wait(delayMs);
}

export function createThrottle(minGapMs: number): () => Promise<void> {
  let nextSlotAt = 0;

  return async () => {
    const now = Date.now();
    const slotAt = Math.max(now, nextSlotAt);

    nextSlotAt = slotAt + minGapMs;

    if (slotAt > now) await wait(slotAt - now);
  };
}

async function fetchWithRetry(
  url: string,
  { headers, ...init }: RetryRequestInit = {}
): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    const isLastAttempt = attempt >= maxAttempts;
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: { ...headers, 'User-Agent': userAgent },
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      if (isLastAttempt) {
        throw new Error(`Request to ${url} failed.`, { cause: error });
      }

      await waitBeforeRetry(url, attempt);
      continue;
    }

    if (!getIsRetryable(response.status) || isLastAttempt) return response;

    await waitBeforeRetry(url, attempt, response);
  }
}

export async function getRedirectTarget(url: string): Promise<string | null> {
  const response = await fetchWithRetry(url, { redirect: 'manual' });
  const location = response.headers.get('Location');

  if (getIsRedirect(response.status) && location) {
    return new URL(location, url).href;
  }

  if (response.status === 404) return null;

  throw createHttpError(url, response);
}

export async function fetchJson<T>(
  url: string,
  schema: z.ZodMiniType<T>
): Promise<T | null> {
  const response = await fetchWithRetry(url, {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;

  if (!response.ok) throw createHttpError(url, response);

  const result = schema.safeParse(await response.json());

  if (!result.success) {
    throw new Error(`Unexpected response shape from ${url}.`, {
      cause: result.error,
    });
  }

  return result.data;
}
