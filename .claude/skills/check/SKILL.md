---
name: check
description:
  Runs the portfolio's real verification gate before a "done" claim or a commit — `pnpm check`, which is
  `format:check` → `lint` → `typecheck` → `knip` → `test` → `build`, plus `pnpm test:e2e` when the change is visible
  in a browser — and says how to unstick each gate. The same steps CI runs (`.github/workflows/ci.yml`,
  with `test:coverage` and the Playwright job). Run it as `/check` before saying a task is complete, before a
  commit, and whenever a gate goes red.
when_to_use:
  Also for "am I done", "verify my changes", "run the checks", "is this green", "will CI fail", "проверь",
  "прогони проверки", a red `lint`, `typecheck`, `format:check`, a failing Vitest or Playwright test.
---

# Check gate

`pnpm check` is `pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build`.
CI's `checks` job runs the same six in the same order (`test:coverage` instead of `test`), then the `e2e` job runs
`pnpm test:e2e` on desktop and mobile. The husky pre-commit hook runs only `lint-staged` and
`pnpm typecheck`, so a commit can pass while tests or the build are red.

## Run, in order

```bash
pnpm check        # && chains: it stops at the first red gate
```

Fix the first failure, re-run, don't chase a later gate over a red one. While iterating, run only that gate
(`pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm test`, `pnpm exec vitest run <path>`), but finish on the
full script.
Then `git status --short`: a file the change needs that is untracked or unstaged passes locally and fails in
CI.

```bash
# Also, when the change is visible in a browser (a component, a route, styles, fonts, index.html):
pnpm test:e2e                       # builds, serves on :4173, runs e2e/ on desktop + mobile with axe
pnpm test:e2e --project mobile      # only the Pixel 7 touch context
# First run on a machine: pnpm exec playwright install chromium
```

`test:e2e` reuses a server already listening on 4173 outside CI (`reuseExistingServer`): a stale
`pnpm preview` there serves an old build. Stop it first.

## If format:check fails

It lists the files. Rewrite the ones this task changed: `pnpm exec prettier --write <paths>`. `pnpm format`
rewrites the whole repo: only when `git status` shows nothing but this task's changes. Tailwind class order
is a Prettier matter here (`prettier-plugin-tailwindcss`, also inside `cn()` and `clsx()`), not ESLint's.

## If lint fails

Warnings fail too (`--max-warnings=0`). `pnpm exec eslint --fix <paths>` first; what stays red needs a real
edit:

- `no-restricted-syntax` — an `enum` (use an `as const` object), or `prop={true}` (use the shorthand).
- `@typescript-eslint/consistent-type-definitions` — `interface` → `type`.
- `@typescript-eslint/naming-convention` — a boolean without `is`/`has`/`should`/`can`, a type not in
  PascalCase.
- `check-file/*` — a file or a folder under `src/` not in kebab-case.
- `@typescript-eslint/no-unused-vars` — remove it, or prefix a deliberately unused one with `_`.
- `@typescript-eslint/no-unnecessary-condition` (from `strictTypeChecked`) — the type says the check is
  dead; fix the type or drop the check, don't silence it.
- `react-refresh/only-export-components` — a component file also exports a non-component; move the helper
  to `utils/`.
- `jsx-a11y-x/*` — the **accessibility** skill.
- "was not found by the project service" — the file is in no tsconfig `include`; a new root config file
  goes into `tsconfig.node.json`.
- an unused `eslint-disable` directive (`reportUnusedDisableDirectives: 'error'`) — delete it.

## If typecheck fails

`tsc -b` builds two projects: `tsconfig.app.json` (`src/`) and `tsconfig.node.json` (root configs, `e2e/`).
Both are strict with `noUncheckedIndexedAccess` (an indexed read is `T | undefined`: handle the missing case)
and `exactOptionalPropertyTypes` (an optional prop does not accept an explicit `undefined`: omit it, or type
it `prop?: T | undefined`). `erasableSyntaxOnly` rejects `enum`, `namespace` and constructor parameter
properties. Read the first error: later ones are often consequences.

## If knip fails

Knip (`knip.json`; `.claude/**` is ignored) reports unused files, exports and dependencies. Delete what is no
longer used rather than ignoring it (CLAUDE.md). An export used only inside its own file loses `export`. A
new dependency that nothing imports yet fails here: add it together with its first use, not ahead of the
feature. Adding to `ignore` / `ignoreDependencies` in `knip.json` is a config change: ask first.

## If test fails

Vitest has two projects (`vite.config.ts`): `*.test.ts` runs in `node`, `*.test.tsx` in `jsdom` with
`src/test/setup.ts`. "document is not defined" means a DOM test in a `.test.ts` file: rename it to
`.test.tsx`. Mocks, stubbed globals and env vars are restored after every test (`restoreMocks`,
`unstubGlobals`, `unstubEnvs`), so a test that depends on another's mock is wrong, not flaky. "matchMedia is
not a function", "scrollIntoView is not a function" or a test waiting for an animation: jsdom lacks them, the
**testing** skill §3.

## Must not

- Must not claim done with any gate red or a warning outstanding.
- Must not "fix" a gate by editing its config (`eslint.config.js`, `.prettierrc.json`, a `tsconfig*.json`,
  `vite.config.ts`) or by adding `eslint-disable` / `@ts-expect-error` without the user agreeing.
- Must not commit with `--no-verify` or `HUSKY=0` past a red hook: CI runs the same checks.
- Must not say "tests pass" without having run them in this session.
