// PreToolUse (Bash|PowerShell|Monitor) hook: refuses a shell command that could read a secrets file —
// `.env`, `.env.local`, `.env.<mode>[.local]` or wrangler's `.dev.vars`. The Read/Edit deny rules in
// .claude/settings.json do not reach the shell, so without this the only guard is a sentence in
// CLAUDE.md. `.env.example` is allowed: it holds no values.
//
// It reads the command text, so it is a best-effort net against mistakes, not a sandbox: a command
// that builds the name at run time (variables, char codes, an interpreter) is out of its reach, and
// the obvious encodings of that (`$'\x2e'`, `[char]`, base64, `iex`) are refused instead. What it
// does catch:
// - the name in any spelling a shell would join or strip: quotes, escapes, `+` concatenation, %XX,
//   brace lists, trailing dots (Windows drops them), and 8.3 short names such as `ENV~1.LOC`;
// - a glob that can match one: in Bash only a dot-leading glob reaches a dotfile, while PowerShell
//   wildcards, `find -name` and `rg -g` match dotfiles too;
// - a recursive content search (grep family, findstr, Select-String, rg/git grep with ignore files
//   off) over the repo root or `worker/`; one limited to other folders, or outside the repo, passes.
// A command that only mentions such a file (an `echo`, a commit message) is refused as well: a false
// refusal costs one rephrased command, a false pass leaks a secret.
import { homedir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';

import {
  projectDir,
  readHookInput,
  writeHookOutput,
} from './lib/read-hook-input.mjs';

const secretNames = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
  '.env.test',
  '.env.test.local',
  '.dev.vars',
];

const isSecretName = (segment) => {
  const name = segment.replace(/[. ]+$/, '');
  if (/^\.env\.example$/i.test(name)) return false;
  return /^\.env(\.[\w.-]+)?$/i.test(name) || /^\.dev\.vars$/i.test(name);
};

// 8.3 names of the secrets start with ENV or DEV (`ENV~1.LOC`, `ENVPRO~1.LOC`, `DEV~1.VAR`); a bare
// `~\d` would also refuse every `HEAD~1`.
const isShortName = (segment) => /^(env|dev)[\w$-]*~\d/i.test(segment);

const decodePercent = (text) =>
  text.replace(/%([0-9a-f]{2})/gi, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );

// Two readings of a backslash: a POSIX escape (dropped) and a Windows path separator (a slash).
const getNormalizedTexts = (command) => {
  const base = decodePercent(command).replace(/["'`^+]/g, '');
  return [base.replace(/\\/g, ''), base.replace(/\\/g, '/')];
};

const getSegments = (text) => text.split(/[\s;|&<>()=:,{}@/]+/).filter(Boolean);

// Every bracket expression becomes "any one character": wider than the real set, never narrower.
const globToRegex = (glob) =>
  new RegExp(
    `^${glob
      .replace(/\[[^\]]*\]/g, '\u0000')
      .replace(/[.+^${}()|\\[\]]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\u0000/g, '.')}$`,
    'i'
  );

const canMatchSecret = (glob) =>
  secretNames.some((name) => globToRegex(glob).test(name));

// PowerShell readers that take a wildcard path; a bare `*` there includes the dotfiles.
const powerShellReader =
  /\b(gc|Get-Content|cat|type|sls|Select-String|Copy-Item|cp|copy|Import-\w+|more)\b/i;

const isRiskyGlob = (segment, { isPowerShell, isAnyFileGlob, hasReader }) => {
  if (!/[*?[]/.test(segment)) return false;
  if (!canMatchSecret(segment)) return false;
  if (segment.startsWith('.') || isAnyFileGlob) return true;
  if (!isPowerShell) return false;
  return !/^\*(\.\*)?$/.test(segment) || hasReader;
};

// `find -name`, `rg -g` and `tar --wildcards` match dotfiles whatever the glob's first character.
const anyFileGlobPattern =
  /\b(find\b[\s\S]*-(i?name|i?path|wholename|regex)|rg\b[\s\S]*(\s-g|--i?glob)|tar\b[\s\S]*--wildcards)/i;

const obfuscationPattern =
  /\$'[^']*\\(x[0-9a-f]|[0-7]{3})|\bprintf\b[^|;&]*\\(x[0-9a-f]|[0-7]{3})|\[char\]|FromBase64String|fromCharCode|\b(iex|Invoke-Expression)\b|\bbase64\s+(-d|--decode)\b|\bshopt\s+-s\s+dotglob\b/i;

// A listing that includes dotfiles, piped into something that reads each listed file.
const dotfileListingIntoReaderPattern =
  /\bls\b[^;|]*\s-\w*[aA]\w*\b[^;]*\|[\s\S]*\bxargs\b|\b(gci|ls|dir|Get-ChildItem)\b[^;|]*\s-(fo|force|h|hidden)\b[^;]*\|[\s\S]*\b(gc|Get-Content|cat|type|sls|Select-String|Copy-Item)\b/i;

const recursiveSearchPattern =
  /\b([efz]?grep|rgrep)\b[^;&]*?\s(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive|--dereference-recursive|-d\s*recurse|--directories=recurse)\b|\brgrep\b|\bfindstr\b[^;&]*\s\/s\b|\b(gci|ls|dir|Get-ChildItem)\b[^;]*\s-r(ecurse)?\b[^;]*\|\s*(sls|Select-String)\b|\b(sls|Select-String)\b[^;]*-(Recurse|r)\b|\brg\b[^;&]*\s(-[a-zA-Z]*u[a-zA-Z]*|--no-ignore\S*|--hidden)\b|\bgit\s+grep\b[^;&]*--(no-index|no-exclude-standard|untracked)\b/i;

// Folders a recursive search may walk: none of them holds a secrets file.
const safeSearchRoots = [
  'src',
  'e2e',
  'scripts',
  '.claude',
  'public',
  '.github',
  'node_modules',
  'music',
];

const isInside = (child, parent) => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

// Git Bash spells `C:\x` as `/c/x`, and `~` is the home folder; both have to resolve to real paths
// before the repo can be told from its ancestors.
const toAbsolutePath = (token) => {
  const drivePath = token.replace(/^\/([a-z])(\/|$)/i, '$1:/');
  const homePath = drivePath.replace(/^~(?=\/|$)/, homedir());
  return resolve(projectDir, homePath);
};

const isSafeSearchPath = (token) => {
  const absolute = toAbsolutePath(token);
  // The repo root, or a folder that contains the repo (`/`, `~`, `..`), walks into the secrets.
  if (isInside(projectDir, absolute)) return false;
  const rel = relative(projectDir, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) return true;
  const [top, sub] = rel.split(/[\\/]/);
  if (top === 'worker') return sub === 'src';
  return safeSearchRoots.includes(top ?? '');
};

// The paths a recursive search walks: its non-flag operands after the program name, minus the
// pattern (the first operand, unless the pattern came with -e/-f/--regexp/-Pattern).
const getSearchPaths = (text) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const start = tokens.findIndex((token) =>
    /^([efz]?grep|rgrep|rg|findstr|gci|ls|dir|Get-ChildItem|git)$/i.test(token)
  );
  const operands = [];
  let hasPatternFlag = false;
  for (const token of tokens.slice(start + 1)) {
    if (token === '|') break;
    if (/^(-e|-f|--regexp|--file|-Pattern)$/i.test(token)) {
      hasPatternFlag = true;
      continue;
    }
    if (
      token.startsWith('-') ||
      (token.startsWith('/') && /^\/\w$/.test(token))
    )
      continue;
    if (token === 'grep') continue;
    operands.push(token);
  }
  const isPowerShellWalk = /^(gci|ls|dir|Get-ChildItem)$/i.test(
    tokens[start] ?? ''
  );
  return isPowerShellWalk || hasPatternFlag ? operands : operands.slice(1);
};

const isUnsafeRecursiveSearch = (text) => {
  if (!recursiveSearchPattern.test(text)) return false;
  const paths = getSearchPaths(text);
  return paths.length === 0 || !paths.every(isSafeSearchPath);
};

const getRefusal = (command, toolName) => {
  const isPowerShell = toolName === 'PowerShell';
  if (obfuscationPattern.test(command))
    return 'This command builds text at run time from escapes, char codes or base64, which hides what it reads from the secrets guard. Write the literal command.';
  const texts = getNormalizedTexts(command);
  if (dotfileListingIntoReaderPattern.test(texts[0] ?? ''))
    return 'This command lists dotfiles and reads every listed file, which includes the secrets files. Read the files you need by name.';
  const isAnyFileGlob = anyFileGlobPattern.test(texts[0] ?? '');
  const hasReader = isPowerShell && powerShellReader.test(texts[0] ?? '');
  for (const text of texts) {
    for (const segment of getSegments(text)) {
      if (
        isSecretName(segment) ||
        isShortName(segment) ||
        isRiskyGlob(segment, { isPowerShell, isAnyFileGlob, hasReader })
      )
        return 'This command names, globs or short-names (8.3) a secrets file (.env, .env.*, .dev.vars).';
    }
  }
  if (isUnsafeRecursiveSearch(texts[0] ?? ''))
    return 'A recursive content search over the repo root or worker/ also reads the gitignored secrets files. Use the Grep tool or `git grep`, or limit the search to src/, e2e/, scripts/ or another folder without secrets.';
  return null;
};

const input = await readHookInput();
const command = input?.tool_input?.command;
if (typeof command !== 'string') process.exit(0);
const refusal = getRefusal(command, input?.tool_name);
if (!refusal) process.exit(0);

await writeHookOutput({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: `${refusal} CLAUDE.md: never read, print or edit them; \`.env.example\` documents every variable. If the task really needs the values, ask the user to do that step.`,
  },
});
