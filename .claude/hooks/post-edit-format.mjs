// PostToolUse (Write|Edit) hook: autofix the just-touched file with the same tools and bar as
// lint-staged (--max-warnings=0). ts/tsx/js/jsx/mjs/cjs -> eslint --fix, then prettier --write; that is
// wider than .lintstagedrc.json (js/ts/tsx), but the extra extensions occur only under .claude/, which
// ESLint ignores, so in practice they get prettier alone, as lint-staged gives .mjs.
// json/jsonc/md/yml/yaml/css/html (except pnpm-lock.yaml) -> prettier --write.
// Scoped to the one edited file on purpose: a hook that reformats files the tool call never
// touched turns every edit into an unreviewable diff. Files outside the project (the session
// scratchpad in the OS temp dir) and in node_modules are left alone.
//
// Same bar as `pnpm lint` and lint-staged: --max-warnings=0, so a leftover warning is reported now
// instead of at commit time. --no-warn-ignored keeps that honest: without it, ESLint answers an
// ignored file (build, coverage, .cache) with a warning that --max-warnings=0 would turn into a
// fabricated problem. Anything either CLI reports goes back into the model's context.
// CLAUDE.md still stands: run `pnpm check` before claiming done, this hook does not replace it.
//
// Both CLIs are spawned as `node <resolved bin>` with no shell. Under { shell: true } the argv is
// re-parsed by cmd.exe/sh, so a path with a space is word-split and the wrong file gets formatted;
// and spawning a .cmd shim without a shell is rejected on Windows since CVE-2024-27980.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

import {
  getEditedFilePath,
  isInsideProject,
  projectDir,
  readHookInput,
  writeHookContext,
} from './lib/read-hook-input.mjs';

// Per-CLI ceilings, kept below the 180s hook timeout in .claude/settings.json. Type-aware ESLint
// has a slow cold start; a CLI killed at its own ceiling is reported, a hook killed by Claude Code
// at the outer timeout would report nothing.
const ESLINT_TIMEOUT_MS = 110_000;
const PRETTIER_TIMEOUT_MS = 60_000;
// Claude Code passes additionalContext over 10,000 characters only as a short preview.
const REPORT_LIMIT = 8_000;

const scriptPattern = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const prettierOnlyPattern = /\.(json|jsonc|md|yml|yaml|css|html)$/;

// Resolve from the project, so the hook runs the project's own pinned eslint/prettier.
const requireFromProject = createRequire(join(projectDir, 'package.json'));

// Plain-text output only: prettier colours its report from TERM alone.
const cliEnv = { ...process.env, NO_COLOR: '1' };
delete cliEnv.FORCE_COLOR;

const runCli = (packageName, args, timeout, cwd) => {
  let binPath;
  try {
    const packageJsonPath = requireFromProject.resolve(
      `${packageName}/package.json`
    );
    const { bin } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    binPath = resolve(
      dirname(packageJsonPath),
      typeof bin === 'string' ? bin : bin[packageName]
    );
  } catch {
    return null;
  }

  return spawnSync(process.execPath, [binPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: cliEnv,
    timeout,
  });
};

const problems = [];

// A CLI that never ran or was stopped halfway is not a lint finding, and calling it one sends the
// model looking for a defect in code that was never read.
const record = (label, result, timeout) => {
  if (!result) {
    problems.push(
      `${label} could not be resolved from this project's node_modules — run \`pnpm install\``
    );
    return;
  }
  if (result.error?.code === 'ETIMEDOUT') {
    problems.push(
      `${label} did not finish within ${timeout / 1000}s and was stopped, so the file may be only partly fixed. Run \`pnpm exec eslint --fix "${filePath}"\` and \`pnpm exec prettier --write "${filePath}"\` by hand.`
    );
    return;
  }
  if (result.error) {
    problems.push(`${label} could not be spawned: ${result.error.message}`);
    return;
  }
  // ESLint exits 2 when it crashed or could not load its config: not a finding about the code.
  if (label.startsWith('eslint') && result.status === 2) {
    const firstLines = `${result.stdout || ''}${result.stderr || ''}`
      .trim()
      .split(/\r?\n/)
      .slice(0, 5)
      .join('\n');
    problems.push(
      `${label} crashed or could not load its config — not a lint finding. Rerun \`pnpm exec eslint "${filePath}"\` before acting on it:\n${firstLines}`
    );
    return;
  }
  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    problems.push(
      output
        ? `${label} exited ${result.status}:\n${output}`
        : `${label} exited ${result.status} with no output`
    );
  }
};

const filePath = getEditedFilePath(await readHookInput());
if (
  !filePath ||
  !isInsideProject(filePath) ||
  filePath.split(/[\\/]/).includes('node_modules')
)
  process.exit(0);

// In a .claude/worktrees/<name>/ session CLAUDE_PROJECT_DIR stays at the main checkout, whose
// .claude/.gitignore lists worktrees/, so prettier run from there would skip the file. Both CLIs
// run from the edited file's own checkout.
const [top, sub, worktreeName] = relative(
  projectDir,
  resolve(projectDir, filePath)
).split(/[\\/]/);
const cliCwd =
  top === '.claude' && sub === 'worktrees' && worktreeName
    ? join(projectDir, top, sub, worktreeName)
    : projectDir;

if (scriptPattern.test(filePath)) {
  // eslint --fix first, prettier second: the same order as .lintstagedrc.json.
  record(
    'eslint --fix',
    runCli(
      'eslint',
      ['--fix', '--max-warnings=0', '--no-warn-ignored', filePath],
      ESLINT_TIMEOUT_MS,
      cliCwd
    ),
    ESLINT_TIMEOUT_MS
  );
  record(
    'prettier --write',
    runCli('prettier', ['--write', filePath], PRETTIER_TIMEOUT_MS, cliCwd),
    PRETTIER_TIMEOUT_MS
  );
} else if (
  prettierOnlyPattern.test(filePath) &&
  !filePath.endsWith('pnpm-lock.yaml')
) {
  record(
    'prettier --write',
    runCli('prettier', ['--write', filePath], PRETTIER_TIMEOUT_MS, cliCwd),
    PRETTIER_TIMEOUT_MS
  );
}

if (problems.length) {
  const report = problems.join('\n');
  const rerun = scriptPattern.test(filePath)
    ? `\`pnpm exec eslint "${filePath}"\` and \`pnpm exec prettier --check "${filePath}"\``
    : `\`pnpm exec prettier --check "${filePath}"\``;
  const shown =
    report.length > REPORT_LIMIT
      ? `${report.slice(0, REPORT_LIMIT)}\n[cut at ${REPORT_LIMIT} characters: run ${rerun} for the rest]`
      : report;
  await writeHookContext(
    'PostToolUse',
    `Autofix did not come back clean for ${filePath}:\n${shown}`
  );
}
