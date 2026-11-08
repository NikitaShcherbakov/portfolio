---
name: git-workflow
description:
  The commit-to-deploy path in the portfolio — what the two husky hooks run, the commitlint rules that apply
  (plain `@commitlint/config-conventional`), the house commit style, what CI runs, and how to recover a
  rejected message. Use when writing a commit message, preparing a commit or a branch, or when facing
  "subject may not be empty", "type may not be empty", "subject must not be sentence-case", "header must not
  be longer than 100 characters", `husky - commit-msg script failed`, a pre-commit that rewrote staged files,
  or a red CI job.
when_to_use:
  Also for "commit", "conventional commits", "commitlint", "husky", "lint-staged", "pre-commit hook",
  "branch", "CI failed", "GitHub Actions", "deploy", "Vercel", "закоммить", "сообщение коммита".
---

# Git workflow

**Agent rule:** never `git commit` or `git push` unless the user asked for it in this conversation.
Otherwise prepare the change, the message and the verification, and show the exact command. Both commands
ask for permission (`.claude/settings.json`); force-push, `git reset --hard` and `git clean` are denied.

## 1. What runs when

Hooks live in `.husky/` and run once `pnpm install` has run `prepare: husky`. A clone that was never
installed, and a `.claude/worktrees/` checkout before its own `pnpm install`, has no hooks.

| Hook                | Command                                        | Blocks? |
| ------------------- | ---------------------------------------------- | ------- |
| `.husky/pre-commit` | `pnpm exec lint-staged`, then `pnpm typecheck` | yes     |
| `.husky/commit-msg` | `pnpm exec commitlint --edit "$1"`             | yes     |

**pre-commit.** `.lintstagedrc.json` runs `eslint --fix --max-warnings=0` then `prettier --write` on staged
`js ts tsx`, and `prettier --write` alone on staged `json css md html yml yaml`. Both **rewrite and
re-stage** files, so a commit can contain fixes you never typed. Then `tsc -b` over the working tree, not
the index: an unstaged broken file still blocks the commit. Tests and the build do not run here: run
`/check` first.

There is no pre-push hook. CI (`.github/workflows/ci.yml`) runs on every push to `main` and `develop` and on
every pull request: `format:check`, `lint`, `typecheck`, `knip`, `test:coverage`, `build`, then Playwright on
desktop and mobile. It also runs commitlint over the pushed commits (or the pull request's), which catches
commits made on github.com where husky never ran. A failed e2e run uploads `playwright-report` as an
artifact for 7 days.

## 2. Commit messages

`commitlint.config.ts` extends `@commitlint/config-conventional` with no overrides. The errors:

| Rule                                             | Meaning                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `type-enum`, `type-case`, `type-empty`           | one of `build chore ci docs feat fix perf refactor revert style test`, lower-case |
| `subject-empty`, `subject-full-stop`             | a subject is required and must not end with `.`                                   |
| `subject-case`                                   | not sentence-case, start-case, PascalCase or UPPER CASE                           |
| `header-max-length`, `header-trim`               | header ≤ 100 characters, no leading/trailing whitespace                           |
| `body-max-line-length`, `footer-max-line-length` | every body and footer line ≤ 100 characters                                       |

**House style:** `<type>: <imperative lower-case subject>` in English (CLAUDE.md), optional scope for a
module (`feat(magazine): add the page flip`), a body of `- ` bullets that explains _why_, wrapped near 80
columns.

```text
feat(player): keep the youtube player mounted across tabs

- mount the player once in the layout route so the music does not stop
- move the frame with css instead of re-parenting the iframe
```

Check a message exactly as the hook does, through a file, in the **Bash** tool:

```bash
printf '%s\n' "feat: add the sticker tabs" > "${TMPDIR:-/tmp}/msg" && pnpm exec commitlint --edit "${TMPDIR:-/tmp}/msg"
```

### Fixing a rejected message

Use Bash, never PowerShell: there `"${TMPDIR:-/tmp}/msg"` expands to `/msg` at the drive root, and `>` writes
a byte-order mark that commitlint rejects as `header-trim` / `type-empty`.

1. Not committed yet: the rejected text is in `.git/COMMIT_EDITMSG` and the staged changes are untouched.
   Copy it to `"${TMPDIR:-/tmp}/msg"`, fix the header there, then
   `git commit --cleanup=strip -F "${TMPDIR:-/tmp}/msg"`. Agents run with `GIT_EDITOR=true`, so `-e` would
   resubmit the text unchanged.
2. Already committed and not pushed: `git log -1 --format=%B > "${TMPDIR:-/tmp}/msg"`, fix it, then
   `git commit --amend -F "${TMPDIR:-/tmp}/msg"`, with the user's agreement. Not `--amend -m`: it drops the
   body.

## 3. Branches and deploy

- Two long-lived branches: `develop` (work lands here) and `main` (production). A ruleset on `main` requires
  a pull request with green CI and allows merge commits only; squash or rebase would give `main` commits that
  `develop` lacks. A ruleset on `develop` blocks deletion and force pushes. Commit and push to `develop`;
  `main` changes only through a pull request `develop → main` that the user merges.
- After that merge, fast-forward `develop` to `origin/main` (`git merge --ff-only origin/main`) and push, so
  the next pull request shows only new commits.
- `.github/workflows/open-pull-request.yml` opens the pull request on a branch's first push (`develop` into
  `main`, other branches into `develop`) with the commit headers, type boxes and labels from
  `.github/labels.json`. After every push run the **pr-description** skill: it writes the summary and test
  plan, in English, through the personal account's token.
- For a larger piece (a component of the MVP plan), the user may prefer a branch
  `<type>/<kebab-slug>` (`feat/magazine-page-flip`) off `develop`, the type from the commitlint enum. Ask
  once; create it with `git switch -c <branch>` (`git checkout` asks for permission, as it can overwrite
  files).
- Deploy is Vercel's Git integration, configured in `vercel.json` (`pnpm build`, output `build/`, SPA
  rewrites, security headers): a merge into `main` deploys production, `develop` and pull requests get
  preview URLs behind Vercel login. Never run the `vercel` CLI: it asks for permission on purpose.

## Must not

- Never commit or push unless asked; never force-push or `reset --hard`.
- Never `--no-verify` or `HUSKY=0` past a red hook: CI runs the same checks and more.
- Never retype a rejected message: recover it from `COMMIT_EDITMSG`.
- Never start a subject with a capital letter, end it with a period, or exceed 100 characters on a line.
- Never use `bugfix`, `feature`, `wip` or `improvement` as a type.
- Never `git add -A` / `git add .` when the tree holds changes this task did not make: stage by path.
