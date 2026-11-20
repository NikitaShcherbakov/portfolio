import { createHash } from 'node:crypto';
import { copyFile, readFile, stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';
import * as z from 'zod/mini';

import { createThemeScript } from '../src/modules/common/utils/theme.ts';
import { routes } from '../src/router/routes.ts';
import { invariant } from '../src/utils/invariant.ts';
import { readContentFiles } from './content-files.ts';

const siteHeadersSource = '/(.*)';
const spaEntry = '/index.html';
const notFoundPage = '404.html';

const headerSchema = z.object({ key: z.string(), value: z.string() });

const vercelConfigSchema = z.object({
  rewrites: z.array(z.object({ source: z.string(), destination: z.string() })),
  headers: z.array(
    z.object({ source: z.string(), headers: z.array(headerSchema) })
  ),
});

type Header = z.infer<typeof headerSchema>;
type VercelConfig = z.infer<typeof vercelConfigSchema>;

type ContentUrl = {
  key: string;
  url: string;
};

async function readVercelConfig() {
  const url = new URL('../vercel.json', import.meta.url);

  return vercelConfigSchema.parse(JSON.parse(await readFile(url, 'utf8')));
}

function getSiteHeaders(config: VercelConfig): Header[] {
  const siteHeaders = config.headers.find(
    ({ source }) => source === siteHeadersSource
  );

  invariant(
    siteHeaders,
    `vercel.json has no headers for "${siteHeadersSource}".`
  );

  return siteHeaders.headers;
}

function getCspSources(headers: Header[], directive: string) {
  const csp = headers.find(({ key }) => key === 'Content-Security-Policy');

  invariant(csp, 'vercel.json sets no Content-Security-Policy.');

  const entry = csp.value
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .find(([name]) => name === directive);

  invariant(entry, `The CSP has no ${directive} directive.`);

  return entry.slice(1);
}

function isOriginAllowed(url: string, sources: string[]) {
  const { protocol, host } = new URL(url);

  return sources.some((source) => {
    if (!source.startsWith(`${protocol}//`)) return false;

    const sourceHost = source.slice(protocol.length + 2);

    return sourceHost.startsWith('*.')
      ? host.endsWith(sourceHost.slice(1))
      : host === sourceHost;
  });
}

function collectUrls(value: unknown): ContentUrl[] {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => collectUrls(item));
  }

  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([key, item]: [string, unknown]) =>
    key.endsWith('Url') && typeof item === 'string'
      ? [{ key, url: item }]
      : collectUrls(item)
  );
}

function getRouteErrors(config: VercelConfig) {
  const pagePaths: string[] = Object.values(routes).filter(
    (route) => route !== '/'
  );
  const rewriteSources = new Set(
    config.rewrites
      .filter(({ destination }) => destination === spaEntry)
      .map(({ source }) => source)
  );

  return [
    ...pagePaths
      .filter((route) => !rewriteSources.has(route))
      .map(
        (route) => `vercel.json has no rewrite of "${route}" to ${spaEntry}.`
      ),
    ...[...rewriteSources]
      .filter((source) => !pagePaths.includes(source))
      .map((source) => `vercel.json rewrites "${source}", which is no route.`),
  ];
}

function getThemeScriptErrors(headers: Header[]) {
  const scriptHash = createHash('sha256')
    .update(createThemeScript())
    .digest('base64');
  const source = `'sha256-${scriptHash}'`;

  return getCspSources(headers, 'script-src').includes(source)
    ? []
    : [`The CSP script-src must allow the inline theme script: ${source}.`];
}

async function getContentUrlErrors(headers: Header[]) {
  const urls = collectUrls(await readContentFiles());

  return urls.flatMap(({ key, url }) => {
    const directive = key === 'audioUrl' ? 'media-src' : 'img-src';

    return isOriginAllowed(url, getCspSources(headers, directive))
      ? []
      : [`The CSP ${directive} does not allow ${key} ${url}.`];
  });
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    // A malformed escape names no file, so the request falls through to the 404 page.
    return '';
  }
}

async function isFile(filePath: string) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    // A missing path is the normal "not a static file" answer.
    return false;
  }
}

async function sendNotFoundPage(response: ServerResponse, outDir: string) {
  const notFoundHtml = await readFile(path.join(outDir, notFoundPage));

  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(notFoundHtml);
}

export function vercelConfig(): Plugin {
  let outDir = '';

  return {
    name: 'vercel-config',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async buildStart() {
      const config = await readVercelConfig();
      const headers = getSiteHeaders(config);
      const errors = [
        ...getRouteErrors(config),
        ...getThemeScriptErrors(headers),
        ...(await getContentUrlErrors(headers)),
      ];

      if (errors.length > 0) this.error(errors.join('\n'));
    },
    async writeBundle() {
      await copyFile(
        path.join(outDir, 'index.html'),
        path.join(outDir, notFoundPage)
      );
    },
    async configurePreviewServer(server) {
      const headers = getSiteHeaders(await readVercelConfig());
      const pagePaths = new Set<string>(Object.values(routes));

      server.middlewares.use((request, response, next) => {
        for (const { key, value } of headers) response.setHeader(key, value);

        const { pathname, search } = new URL(
          request.url ?? '/',
          'http://localhost'
        );

        if (pathname.length > 1 && pathname.endsWith('/')) {
          response.statusCode = 308;
          response.setHeader('Location', `${pathname.slice(0, -1)}${search}`);
          response.end();
          return;
        }

        const serveRequest = async () => {
          try {
            const isServedPath =
              pagePaths.has(pathname.toLowerCase()) ||
              (await isFile(path.join(outDir, decodePathname(pathname))));

            if (isServedPath) {
              next();
              return;
            }

            await sendNotFoundPage(response, outDir);
          } catch (error) {
            next(error);
          }
        };

        void serveRequest();
      });
    },
  };
}
