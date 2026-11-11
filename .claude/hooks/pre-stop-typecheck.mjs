// Stop hook: if the working tree has uncommitted changes that `pnpm typecheck` covers, run the
// type-check and surface any failure so the agent can fix it before the task is considered done.
//
// A Stop hook returning hookSpecificOutput.additionalContext keeps the turn going — the same
// loop-protection path as decision:"block" (Claude Code 2.1.163 and later). That is the point of a
// mechanical backstop: the agent sees and acts on the failure instead of a human having to notice
// a passive message. On the continuation that forces (stop_hook_active) the hook checks again, and
// a failure that remains goes to the user as a systemMessage, which does not continue the turn, so
// it cannot loop.
//
// Scope is what the type-check reads. The script is `tsc -b` over the tsconfig.json references:
// tsconfig.app.json (src/), tsconfig.node.json (vite.config.ts, playwright.config.ts,
// commitlint.config.ts, e2e/, scripts/) and worker/tsconfig.json (worker/). PATHSPECS mirrors those
// `include` lists, plus package.json and the lockfile, because a dependency change alone can break
// types. src/ is taken whole: resolveJsonModule puts imported .json (src/content/*.json) into the
// program. Widen it when an include list or the references grow.
//
// Stop fires at the end of every turn, not only when the work is done, and uncommitted files stay
// dirty across turns — so a plain "dirty files present" gate would re-run the full type-check
// after every question-and-answer turn too. The fingerprint below (HEAD plus the content of every
// dirty file in scope) skips a run when nothing has changed since the last run that passed. A
// failed run is never cached, so the next Stop checks again. This is detection, not prevention:
// it backs up CLAUDE.md ("run pnpm check before claiming done") rather than replacing it.
//
// tsc is spawned straight from node_modules when the script is nothing but `tsc` steps joined by
// `&&`, as it is today. Without a shell, a timeout kills tsc itself; through `shell: true` Node
// kills only cmd.exe and tsc went on burning CPU after the hook had given up (reproduced on
// Windows). Any other script shape falls back to `pnpm run typecheck`.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

import {
  projectDir,
  readHookInput,
  writeHookContext,
  writeHookOutput,
} from './lib/read-hook-input.mjs';

const PATHSPECS = [
  'src',
  'e2e',
  'scripts',
  'worker',
  'vite.config.ts',
  'playwright.config.ts',
  'commitlint.config.ts',
  'tsconfig*.json',
  'package.json',
  'pnpm-lock.yaml',
];
// Kept below the 300s hook timeout in .claude/settings.json. A normal run takes seconds; on a
// machine under full CPU load it was measured at over two minutes.
const TYPE_CHECK_TIMEOUT_MS = 280_000;
// Claude Code passes additionalContext over 10,000 characters to Claude only as a 2,000-character
// preview plus a file path it is not asked to read, so the report stays under the cap.
const REPORT_LIMIT = 8_000;
// tsc's full error list can be large; spawnSync's 1 MB default would kill it mid-run.
const MAX_BUFFER = 32 * 1024 * 1024;

// Plain-text output only: it goes into the model's context. FORCE_COLOR is dropped because some
// colour libraries switch on when the variable merely exists.
const childEnv = { ...process.env, NO_COLOR: '1' };
delete childEnv.FORCE_COLOR;

// A null payload (no stdin, or a shape this version cannot read) reads as a first fire rather
// than a re-invocation, so a failure reaches the agent and not only the user.
const input = await readHookInput();

// In a .claude/worktrees/<name>/ session CLAUDE_PROJECT_DIR stays at the main checkout, so the
// checkout to type-check comes from the payload's cwd. node_modules is resolved upwards from there,
// so a worktree without its own install still finds the main checkout's typescript.
const getCheckoutDir = (cwd) => {
  if (typeof cwd !== 'string') return projectDir;
  const [top, sub, name] = relative(projectDir, resolve(projectDir, cwd)).split(
    /[\\/]/
  );
  return top === '.claude' && sub === 'worktrees' && name
    ? join(projectDir, top, sub, name)
    : projectDir;
};
const checkoutDir = getCheckoutDir(input?.cwd);

// One cache file per checkout, so sessions in different worktrees do not evict each other's pass.
const CACHE_FILE = join(
  projectDir,
  'node_modules',
  '.cache',
  'claude-hooks',
  `type-check-${createHash('sha256').update(checkoutDir).digest('hex').slice(0, 12)}.json`
);

// --no-optional-locks: a plain `git status` refreshes the index and takes .git/index.lock, which
// made a `git add` running at the same moment fail with "index.lock: File exists" (reproduced).
// The hook runs in the background of every turn, exactly the case the flag exists for.
const git = (args) =>
  spawnSync('git', ['--no-optional-locks', ...args], {
    cwd: checkoutDir,
    encoding: 'utf8',
  });

const hasGitFailed = (result) => Boolean(result.error) || result.status !== 0;

// Already continuing because a Stop hook said so. The agent's fix is exactly what needs checking,
// so run again, but hand a remaining failure to the user as a systemMessage, which does not
// continue the turn, so a failure the agent cannot fix never loops.
const isContinuation = Boolean(input?.stop_hook_active);
const report = (text) =>
  isContinuation
    ? writeHookOutput({ systemMessage: text })
    : writeHookContext('Stop', text);

// No shell here, deliberately: with shell:true a POSIX shell glob-expands the pathspecs against
// cwd before git ever sees them, so a dirty file elsewhere silently never gets reported. Passing
// them straight through to git's own argv lets git match them recursively (a pathspec `*` also
// matches `/`), the same on every OS. -z keeps paths with spaces or non-ASCII characters intact,
// and --untracked-files=all lists the files inside a brand-new directory, not just the directory.
const getStatus = () =>
  git([
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all',
    '--',
    ...PATHSPECS,
  ]);
const status = getStatus();

// A failed spawn (git missing or unspawnable in this subprocess environment) leaves stdout empty,
// indistinguishable from "clean tree" by the output alone — which would make the one hook whose
// job is catching silent failures fail silently itself. Surface that instead of guessing, to the
// user only: an environment problem is not the agent's to fix, and continuing every turn over it
// would only repeat the message. A checkout that is not a git repository at all has nothing to say.
if (hasGitFailed(status)) {
  if (/not a git repository/i.test(status.stderr || '')) process.exit(0);
  await writeHookOutput({
    systemMessage: `pre-stop-typecheck could not run \`git status\` (${status.error?.message || `exit ${status.status}: ${(status.stderr || '').trim()}`}), so it could not tell whether type-checked files are dirty. Run \`pnpm check\` by hand before relying on this work.`,
  });
  process.exit(0);
}

// Porcelain v1 with -z: "XY path\0" per entry, and a rename or copy (in either status column)
// carries its source path as one extra "\0"-terminated field, which is skipped here.
const parseDirtyPaths = (stdout) => {
  const paths = [];
  const fields = stdout.split('\0');
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    if (!field) continue;
    paths.push(field.slice(3));
    if (/[RC]/.test(field.slice(0, 2))) i += 1;
  }
  return paths;
};

const dirtyPaths = parseDirtyPaths(status.stdout);
if (!dirtyPaths.length) process.exit(0);

// Reads a file for the fingerprint. A deleted or unreadable file still has to change the
// fingerprint, so it contributes a marker instead of throwing.
const readForFingerprint = (relativePath) => {
  try {
    return readFileSync(join(checkoutDir, relativePath));
  } catch (error) {
    return `<unreadable: ${error.code}>`;
  }
};

// Everything in scope that is not dirty is exactly HEAD's version, so HEAD plus the dirty files
// pins the whole input of the type-check. The status code is left out: tsc reads the working tree,
// so staging a file without changing it must not cost a full re-run.
const getFingerprint = (paths) => {
  const head = git(['rev-parse', '--verify', '--quiet', 'HEAD']);
  const hash = createHash('sha256');
  hash.update(`HEAD ${hasGitFailed(head) ? '<none>' : head.stdout.trim()}\0`);
  for (const path of [...paths].sort((a, b) => a.localeCompare(b))) {
    hash.update(`\0${path}\0`).update(readForFingerprint(path));
  }
  return hash.digest('hex');
};
const fingerprint = getFingerprint(dirtyPaths);

// The cache is an optimisation only: a missing, unreadable or corrupt file means "run it", which
// is the safe direction, so those errors are deliberately not reported.
const readLastPassedFingerprint = () => {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8')).fingerprint;
  } catch {
    return '';
  }
};
if (readLastPassedFingerprint() === fingerprint) process.exit(0);

// The type-check script from package.json, or '' when package.json is unreadable or has no such
// script. runTypeCheck reports that case itself instead of handing it to pnpm.
const readTypeCheckScript = () => {
  try {
    return (
      JSON.parse(readFileSync(join(checkoutDir, 'package.json'), 'utf8'))
        .scripts?.typecheck ?? ''
    );
  } catch {
    return '';
  }
};

// The script as tsc argument lists, one per `&&` step — or null when it is anything else, so a
// changed script is run as written instead of being second-guessed here.
const toTscSteps = (script) => {
  const steps = script.split('&&').map((step) => step.trim().split(/\s+/));
  const isPlainTsc = steps.every(
    ([bin, ...args]) =>
      bin === 'tsc' && args.every((arg) => /^[\w@./:=-]+$/.test(arg))
  );
  return script && isPlainTsc ? steps.map(([, ...args]) => args) : null;
};

const resolveTscBin = () => {
  try {
    const packageJsonPath = createRequire(
      join(checkoutDir, 'package.json')
    ).resolve('typescript/package.json');
    const { bin } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return resolve(dirname(packageJsonPath), bin.tsc);
  } catch {
    return null;
  }
};

const outputOf = (result) => `${result.stdout || ''}${result.stderr || ''}`;

// Each outcome is reported differently: a timeout or a runner that never started says nothing
// about the code, and must not be presented as type errors to fix. Every step runs, unlike the
// script's `&&`: errors of the second program (vite.config.ts, scripts) would otherwise stay hidden
// until the first one is clean, and then reach only the user, on the continuation.
const runTscDirectly = (steps, tscBin) => {
  const deadline = Date.now() + TYPE_CHECK_TIMEOUT_MS;
  const failures = [];
  let isCutOff = false;
  for (const args of steps) {
    const result = spawnSync(process.execPath, [tscBin, ...args], {
      cwd: checkoutDir,
      encoding: 'utf8',
      env: childEnv,
      maxBuffer: MAX_BUFFER,
      timeout: Math.max(1_000, deadline - Date.now()),
    });
    if (result.error?.code === 'ETIMEDOUT') {
      if (!failures.length) return { kind: 'timed-out' };
      return {
        kind: 'failed',
        output: failures.join('\n'),
        isCutOff,
        isPartial: true,
      };
    }
    if (result.error?.code === 'ENOBUFS') {
      failures.push(outputOf(result));
      isCutOff = true;
    } else if (result.error) {
      return { kind: 'not-started', reason: result.error.message };
    } else if (result.status !== 0) {
      failures.push(outputOf(result));
    }
  }
  return failures.length
    ? { kind: 'failed', output: failures.join('\n'), isCutOff }
    : { kind: 'passed' };
};

// shell:true is required here — pnpm is a .cmd shim on Windows — and is safe because no argument
// contains a glob or a space. On timeout this route can leave tsc running (see the header).
const runThroughPnpm = () => {
  const result = spawnSync('pnpm', ['run', 'typecheck'], {
    cwd: checkoutDir,
    encoding: 'utf8',
    env: childEnv,
    maxBuffer: MAX_BUFFER,
    shell: true,
    timeout: TYPE_CHECK_TIMEOUT_MS,
  });
  if (result.error?.code === 'ETIMEDOUT') return { kind: 'timed-out' };
  if (result.error?.code === 'ENOBUFS')
    return { kind: 'failed', output: outputOf(result), isCutOff: true };
  if (result.status === 0) return { kind: 'passed' };
  // A real `pnpm run` always prints its "> name@version typecheck" banner. Without it either pnpm
  // refused to run the script and said why on an "ERR_PNPM_<CODE>" or "ERROR" line (padded with
  // U+2009, not ASCII spaces; UTF-8, so it is passed on), or it never started and the shell's own
  // message may be in a legacy code page, so that one is not passed on.
  if (!/^> \S+ typecheck\b/m.test(result.stdout || '')) {
    const pnpmError = outputOf(result).match(
      /^\s?(?:ERR_PNPM_\w+|ERROR)\s.*$/m
    );
    return {
      kind: 'not-started',
      reason: pnpmError
        ? `pnpm refused to run it: ${pnpmError[0].trim()}`
        : 'pnpm could not be started (is it on PATH?)',
    };
  }
  return { kind: 'failed', output: outputOf(result) };
};

const runTypeCheck = () => {
  const script = readTypeCheckScript();
  if (!script)
    return {
      kind: 'not-started',
      reason: 'package.json is unreadable or has no `typecheck` script',
    };
  const steps = toTscSteps(script);
  const tscBin = steps && resolveTscBin();
  if (steps && !tscBin)
    return {
      kind: 'not-started',
      reason:
        'typescript is not installed in node_modules (run `pnpm install`)',
    };
  return steps ? runTscDirectly(steps, tscBin) : runThroughPnpm();
};

// Whole error blocks up to REPORT_LIMIT (an error's indented continuation lines belong to it), pnpm's
// banner and ELIFECYCLE noise removed, and a count of its own: under NO_COLOR tsc prints no
// "Found N errors" summary.
const formatFailure = (output, isCutOff = false, isPartial = false) => {
  const lines = output
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^> |ELIFECYCLE/.test(line.trim()));
  const blocks = [];
  for (const line of lines) {
    if (/^\s/.test(line) && blocks.length) blocks.at(-1).push(line);
    else blocks.push([line]);
  }
  const errorPattern = /^(.+?)\(\d+,\d+\): error TS\d+:/;
  const errors = lines.map((line) => line.match(errorPattern)).filter(Boolean);
  const files = new Set(errors.map((match) => match[1]));
  const shown = [];
  let length = 0;
  for (const block of blocks) {
    const text = block.join('\n');
    if (length + text.length + 1 > REPORT_LIMIT) {
      // One huge error (a TS2769 overload list) must not hide every error behind it.
      if (!shown.length)
        shown.push(
          `${text.slice(0, REPORT_LIMIT - 40)}\n  [this error was cut]`
        );
      break;
    }
    shown.push(text);
    length += text.length + 1;
  }
  const shownErrors = shown.filter((text) => errorPattern.test(text)).length;
  const more = isCutOff ? '+' : '';
  const summary = !errors.length
    ? 'The type-check exited with an error'
    : shown.length < blocks.length
      ? `Showing ${shownErrors} of ${errors.length}${more} TypeScript error(s) in ${files.size}${more} file(s)`
      : `${errors.length}${more} TypeScript error(s) in ${files.size}${more} file(s)`;
  const cutOff = isCutOff
    ? ' The output passed 32 MB and was cut off, so the real count is higher.'
    : '';
  const partial = isPartial
    ? ' A later tsc program did not finish in time, so there may be more.'
    : '';
  return `${shown.join('\n')}\n\n${summary}.${cutOff}${partial} Run \`pnpm typecheck\` for the full output.`;
};

const outcome = runTypeCheck();

if (outcome.kind === 'passed') {
  // Another session may have edited a file while tsc ran: record the pass only if the files in
  // scope are still the ones it read.
  const after = getStatus();
  const isUnchanged =
    !hasGitFailed(after) &&
    getFingerprint(parseDirtyPaths(after.stdout)) === fingerprint;
  if (isUnchanged) {
    try {
      mkdirSync(dirname(CACHE_FILE), { recursive: true });
      writeFileSync(CACHE_FILE, JSON.stringify({ fingerprint }));
    } catch {
      // Not recording a pass only costs a repeat run on the next Stop; nothing is lost.
    }
  }
  process.exit(0);
}

// Never leave a stale pass behind a failure. Defensive only — the fingerprints already differ —
// so a failed delete must not take the hook down before it reports.
try {
  rmSync(CACHE_FILE, { force: true });
} catch {
  // The report below is what matters; a leftover cache file cannot match this state.
}

if (outcome.kind === 'timed-out') {
  // Tells the user rather than continuing the turn: a timeout says nothing about the code, and a
  // forced continuation would only start another long type-check on an already loaded machine.
  await writeHookOutput({
    systemMessage: `The pre-stop type-check did not finish within ${TYPE_CHECK_TIMEOUT_MS / 1000}s and was stopped (machine under load?). No type errors were reported. Run \`pnpm typecheck\` before relying on this work.`,
  });
} else if (outcome.kind === 'not-started') {
  await report(
    `pre-stop-typecheck could not run the type-check: ${outcome.reason}. Run \`pnpm check\` by hand before claiming this work done.`
  );
} else {
  // Names what triggered the run: a dirty package.json or lockfile alone can surface errors in
  // committed code, and the agent should not go looking for TypeScript edits it never made.
  // Other sessions may share this checkout, so an error in a file this session never touched is
  // reported, not fixed (CLAUDE.md).
  const morePaths =
    dirtyPaths.length > 10 ? ` and ${dirtyPaths.length - 10} more` : '';
  await report(
    `pnpm typecheck fails while files it reads have uncommitted changes (${dirtyPaths.slice(0, 10).join(', ')}${morePaths}); the errors can also be in committed code those changes affect. Fix the errors your changes caused before claiming this work done; an error only in files this session did not touch may be another session's work in progress — tell the user instead of fixing it:\n${formatFailure(outcome.output, outcome.isCutOff, outcome.isPartial)}`
  );
}
