---
name: qa-full
description: >-
  Runs the full manual QA cycle against the deployed site on Vercel — automated suites, a static code
  review, then seven tester agents one after another (smoke, functional, integration, visual,
  accessibility, performance, chaos), a verifier that re-reproduces every bug, and one consolidated bug
  report. Run it as `/qa-full [url|local] [levels…]`, e.g. `/qa-full`, `/qa-full smoke a11y`,
  `/qa-full local`, `/qa-full https://rockfolio-dev.vercel.app functional`. Only by the user's command.
disable-model-invocation: true
argument-hint: '[url|local] [smoke|functional|integration|visual|a11y|performance|chaos|auto|review]…'
---

# Full QA cycle: `$ARGUMENTS`

You are the QA lead. You dispatch testers, you do not test in the browser yourself, and you never fix
bugs during this run: the output is a report. Talk to the user in Russian; the report file is in English
except the summary, which is in Russian.

## 0. Parse the arguments

- A word starting with `http` is the **target**. Default: `https://rockfolio-dev.vercel.app`.
- The word `local` makes the target the **working tree**, built and served on this machine (step 1):
  the way to test code that is not deployed yet. Target `http://localhost:4317`.
- The rest are **levels**. None means all, in this order: `auto`, `review`, `smoke`, `functional`,
  `integration`, `visual`, `a11y`, `performance`, `chaos`. Any unknown word: tell the user the valid
  levels and stop.
- **Run id**: the current local time as `YYYY-MM-DD-HHmm`. Create `.claude/qa-artifacts/<run-id>/`
  (Bash `mkdir -p`; the folder is git-ignored).

## 1. Preflight (stop on failure)

- **`local` only**, before anything else: `netstat -ano` and look for `:4317` LISTENING. If a process
  holds it, it is a preview left from an earlier run serving an old build (a `200` from it proves
  nothing): stop it as below, and if it is still listening, stop the run and tell the user its PID.
  Then `pnpm exec vite build --outDir node_modules/.cache/qa-site`
  (a separate folder: `pnpm check` in `auto` empties `build/` while the testers browse, and ESLint would
  lint anything under `.claude/`), then in the background
  `pnpm exec vite preview --outDir node_modules/.cache/qa-site --port 4317 --strictPort`. Check it with
  single `curl -s -o /dev/null -w '%{http_code}' http://localhost:4317/` calls, not a shell loop (a loop
  matches no allow rule, and `sleep` is blocked): read the task's output for vite's ready line between
  tries. The **commit under test** is `working tree (<git rev-parse --short HEAD> + uncommitted
changes)`. Vercel's headers, caching, compression and HTTPS do not exist locally: tell the testers so
  in their prompt (the protocol's "Local target" section). After step 5, also when the run stops early:
  load TaskStop with ToolSearch (`select:TaskStop`), stop that task, then run `netstat -ano` and look
  for `:4317`; if it is still listening, a `vite` child survived on Windows: check with PowerShell
  `Get-Process -Id <pid>` that it is `node`, then `Stop-Process -Id <pid> -Confirm:$false` once, and
  run `netstat` again. If the stop is denied or the port is still held, tell the user the PID.
- `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' <target>` must print `200`. A `302` to
  `vercel.com` means a protected preview deployment: tell the user only production is public and stop.
- ToolSearch `select:mcp__playwright__browser_navigate`. If it is missing, tell the user: the
  `playwright` server from `.mcp.json` has to be approved (run `/mcp`, or restart Claude Code and accept
  the prompt), then stop the browser levels; `auto` and `review` can still run.
- Default target only (skip for `local` and for any other URL): `git fetch -q origin main`, then note
  `git log -1 --format='%h %s' origin/main`: production is built from `main`, so this is the **commit
  under test**. For any other URL write `unknown (testers read the working tree)`, and warn the user
  that its `curl` calls are not in the allow list, so testers will stop on permission prompts. Say so if
  the working tree is ahead of it (`git log --oneline origin/main..HEAD`, `git status --short`): those
  changes are not deployed yet, and the testers must not expect them. In that case tell the user in one
  line that `/qa-full local` tests those changes, then go on with the target given.

## 2. Non-browser levels

`review` starts first and runs in parallel with the browser levels (static, light). `auto` loads the
CPU and the site, which would skew timing checks (TIME, the OSD, LCP, interaction delay) into false
bugs: start it only after the verifier has finished (the verifier replays those timing bugs too), or
after the last browser level when there is nothing to verify; for `local`, while the preview still runs.
The `E2E_BASE_URL=…` prefix matches no allow rule, so the e2e step asks the user once: expected.

- **auto**: in Bash, in the background: `pnpm check`, then `E2E_BASE_URL=<target> pnpm test:e2e`
  (the scripted Playwright suite, desktop + mobile, against the deployment; no local server starts when
  `E2E_BASE_URL` is set). Capture each exit code and the failing test names. Both use the specs and code
  of the working tree: when it is ahead of the commit under test, a failing e2e spec may test a feature
  that is not deployed yet; say so next to that failure instead of calling it a production bug.
- **review**: an Agent `code-reviewer` in the background with the prompt: "Review all of `src/`,
  `index.html`, `vercel.json` and `public/` as a whole (not a diff) for bugs a visitor would hit, against
  CLAUDE.md. Report only findings, ranked, and write them out in your final message as text." Its
  findings go into the report under "Static review", labelled as the working tree's code.

## 3. Browser levels, strictly one at a time

All testers share one browser through one MCP server: **never run two browser testers in parallel**.
Dispatch each with the Agent tool, `subagent_type: qa-<level>` (`qa-smoke`, `qa-functional`,
`qa-integration`, `qa-visual`, `qa-a11y`, `qa-performance`, `qa-chaos`). An agent runs in the
background: wait for its completion notification before you dispatch the next one, and do not touch the
`mcp__playwright__*` tools yourself while it runs. If an agent type is missing from the Agent tool's list,
its file under `.claude/agents/` failed to load: tell the user which one and skip that level. Prompt for
each:

> Target: `<target>`. Run id: `<run-id>`. Commit under test: `<hash subject>`. Follow your agent file and
> `.claude/skills/qa-full/protocol.md`. Return the report in the protocol's format.

For `local`, add: "Local target: read the source from the working tree, and follow the protocol's
'Local target' section."

After `smoke`: if it reports a critical bug that makes the site unusable (does not load, blank page, JS
crash on load), stop the browser levels, skip to step 5, and tell the user why.

Between levels, tell the user one line: which level finished, how many bugs, which level starts next.

## 4. Verify

Collect every bug block from all browser levels. If there is at least one, dispatch `qa-verifier` with
the target, the run id, the commit under test (and the local-target line, for `local`) and all the bug
blocks verbatim. Keep its verdicts; NOT REPRODUCED bugs move to a "Rejected" section of the report with
the verifier's note, never deleted. A DUPLICATE is folded into the bug it duplicates (both ids kept).
The verifier's own `VERIFY-<n>` bugs go into the report as found by the verifier, unverified by a second
pass: say so next to each.

## 5. Report

Wait for `auto` and `review` to finish (their notifications), then write
`.claude/qa-artifacts/<run-id>/report.md`:

1. **Сводка** (Russian): target, commit, date, levels run, totals by severity, the 3 most important bugs
   in one line each, what could not be verified and why.
2. **Automated suites**: `pnpm check` and e2e results, the failing test names.
3. **Bugs**: CONFIRMED and FLAKY, merged across levels, duplicates folded together (keep all ids), sorted
   critical → trivial; each in the protocol's block format with the final verdict added.
4. **Static review**: the `code-reviewer` findings.
5. **Coverage**: each level's coverage table, unchanged.
6. **Observations**, **Not built yet**, **Rejected**.
7. **Screenshots**: every path, grouped by level.

Then show the user the Russian summary and the report path, and offer, without doing it: fix the bugs one
by one, or open GitHub issues for them (`gh issue create`, one per confirmed bug, only after the user
says yes).

## Must not

- Must not run browser testers in parallel, or let any agent edit repo files.
- Must not fix code, commit or push during the run.
- Must not run this skill on its own initiative or schedule it: the user starts every run.
- Must not report a bug the verifier marked NOT REPRODUCED as a bug.
- Must not leave the `local` preview server running after the run.
