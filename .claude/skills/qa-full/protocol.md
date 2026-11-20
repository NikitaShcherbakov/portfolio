# QA protocol (shared by every `qa-*` tester agent)

Read this whole file before your first browser action. Your agent file adds what your level checks; this
file says how every level works and how to report.

## Target

- Test the URL the prompt gives. Default: production, `https://rockfolio-dev.vercel.app` (public).
- Vercel preview and branch URLs (`*-portfolio-42ae1.vercel.app`) are behind Vercel auth and answer
  `302` to a login page. If the target redirects to `vercel.com/login` or `vercel.com/sso-api`, stop with
  verdict BLOCKED and say so: never try to sign in.
- The prompt also gives a **run id** (e.g. `2026-11-09-1430`). Give every screenshot the full `filename`
  `.claude/qa-artifacts/<run-id>/<level>-<what>.png` (e.g.
  `.claude/qa-artifacts/2026-11-09-1430/visual-home-390.png`). The MCP server resolves `filename` against
  the project root, not against its output folder: a bare `home.png` lands in the repo root, outside
  `.gitignore`. Read the saved path back from the tool result.
- The prompt also gives the **commit under test**. Production is built from `main`, while the working tree
  may be `develop` with newer, undeployed code: when you read source to learn what an element should do,
  read it at that commit (`git show <hash>:src/...`), not from the working tree. When it says
  `unknown`, read the working tree and write under Observations that the deployed code may differ.

### Local target

When the prompt says "Local target" (`http://localhost:4317`, the working tree built by `vite build` and
served by `vite preview`): read source from the working tree, not with `git show`. `vercel.json` does
not apply there, so security headers, `Cache-Control`, compression and the HTTP→HTTPS redirect are
**NOT APPLICABLE**: mark those rows so, never as bugs. Everything that runs in the browser is tested
the same way.

## What counts as expected behavior

1. `CLAUDE.md` **at the commit under test** (`git show <hash>:CLAUDE.md`; the working tree's for a
   local or unknown target): design rules, audio player constraints, accessibility and performance
   rules.
2. The **MVP plan** in that same `CLAUDE.md`: an unchecked item is not built yet. A missing magazine,
   iPod or chart is "not built yet", **not a bug**: list it once under "Not built yet" and move on. A
   feature that is checked, or that is visibly on the page, is fair game. Before testing a feature,
   confirm its code exists at the commit under test (for the stereo deck: `src/modules/player/`, via
   `git ls-tree -r --name-only <hash> src/modules`); if it does not, every check of it is "Not built
   yet" for this target, never a bug.
3. **Design handoffs** in `.design/<feature>/` (git-ignored, on the owner's machine; list them with the
   Glob tool, `.design/*/SPEC.md`):
   `SPEC.md` (behaviour, states, breakpoints, aria-labels verbatim, and an acceptance checklist) and
   `screens/` (reference PNGs per width and state). For a checked MVP item that has a handoff, the
   SPEC's acceptance checklist is your test list for that feature: give every line that your level can
   check a Coverage row. The SPEC also describes parts whose MVP item is still unchecked at the commit
   under test (for the player, read that commit's MVP plan: the iPod dock, preloading the next track and
   the magazine links may still be open): those are "Not built yet", not bugs. Where the SPEC and `CLAUDE.md` disagree, `CLAUDE.md` wins; say so under Observations.
4. Common sense of a real visitor (a recruiter on a laptop or a phone): broken layout, dead buttons, text
   cut off, errors in the console, music that stops, things that only work with a mouse.

Your agent file names features as they were planned (an iPod, an `<audio>` element, a chart). The project
moves faster than these files: the checked MVP items and their handoffs are the truth. Test what is
built under its real name, apply your level's checks to it, and never report "the iPod is missing"
when the plan says the player is a different, built component.

Read `CLAUDE.md` and `git log --oneline -15` first, so you know what was built recently: recent work is
where bugs live.

## Routes

Wherever your agent file says "every route" or names `/`, `/cv`, `/games`, use the real list: the paths
in `src/router/` at the commit under test (`git show <hash>:src/router/...`; `git ls-tree -r --name-only
<hash> src/router` lists the files), plus any link on the page that leads to a path of the same site.
Fall back to `/`, `/cv`, `/games` only when there is no router yet.

## Breakpoints

Layout changes at the widths in the stylesheets: the Grep tool with pattern `@media[^{]*`, glob
`*.css`, path `src`, output mode content (not Bash `grep`, which is not in the allow list), plus
Tailwind's `max-[…]`/`min-[…]` and `sm:`/`md:`/`lg:` classes in `src/`. Bugs hide right at a boundary:
wherever your agent file picks widths, add each breakpoint width and that width + 1.

## Playback

Check the MVP item `AudioPlayer` in `CLAUDE.md` at the commit under test.

- **Checked**: one hidden `<audio>` element appended to `body` plays the tracks from the audio Worker;
  TIME and buffering come from its events. The Worker answers only allowed origins (`ALLOWED_ORIGINS` in
  `worker/wrangler.jsonc`: production, `localhost:5173/4173/4317`): a `403` for audio on another origin
  is a configuration Observation, not a player bug.
- **Unchecked** (an older deployment): playback is simulated by a clock that advances the time in the
  store once per second, with no `<audio>` element and no sound. Test the simulation like the real thing
  (state, time, track changes, controls), and mark sound "Not built yet".

## Languages

The browser runs with locale `ru-RU` (`.claude/playwright-mcp.json`), so a fresh context shows the
default Russian UI. If the commit under test has `src/i18n/` (`git show <hash>:src/i18n/languages.ts`),
the site is multilingual: the language comes from `localStorage` (the `languageStorageKey` there), then
from the browser languages, then the default. Do your level's full pass in Russian; the checks your agent
file lists per language run in every other language too, switched **through the UI's language
switcher**, not by editing storage. Bugs in any language count: a raw key such as `nav.home` on screen,
text left in another language, text that overflows only in a longer translation, `html[lang]` or the
title not following the switch.

The `select` language switcher is driven with `browser_select_option` (a native dropdown does not open
for `browser_click` in headless Chromium). Detection from the browser language cannot be tested here:
the locale is fixed to `ru-RU`; mark it COULD NOT VERIFY (a unit test covers `detectLanguage`).

## Themes

If the commit under test has themes (Grep `src/` for `data-theme`), read the theme code there first
(`src/modules/common/utils/theme.ts`, `hooks/use-theme.ts`, `components/theme-*.tsx`): it is the
expected behaviour, and it changes often. At the time of writing it is a "Тема" group of three
`aria-pressed` buttons — light, dark, "Как в системе" (system, the default) — and:

- a script injected into `<head>` sets `html[data-theme]` to `light` or `dark` before the first paint,
  from `localStorage` key `theme` when it holds `light`/`dark`, otherwise from `prefers-color-scheme`;
- in system mode the page follows a change of the OS scheme live, without a reload;
- a choice made in one tab reaches the other open tabs of the site (the `storage` event); so does the
  language.

Emulate the OS scheme with `browser_emulate_media` `colorScheme`; choose the theme with the buttons. Do
your full pass in the theme a fresh context gives (system → light); the checks your agent file lists per
theme run in dark too. Bugs in either theme count: unreadable text, a component still in light colours,
a flash of the wrong theme on load, more or fewer than one pressed button, the pressed button and
`html[data-theme]` disagreeing.

**Wait after emulating.** `browser_emulate_media` returns before the page has handled the change: call
`browser_wait_for` with `time: 1` before reading `data-theme`, computed colours or a screenshot.
Reading at once shows the old theme, a false bug.

## The browser is shared

All testers drive one browser through one `playwright` MCP server, and run one after another.

- At the start: `browser_close`, then `browser_navigate`. The server runs `--isolated`, so this opens a
  fresh context: empty `localStorage`, no emulated media, no extra tabs, viewport back to 1280×720. Then
  `browser_resize` to 1440×900.
- At the end: `browser_close` again, so the next tester starts clean.
- Use the same `browser_close` + `browser_navigate` whenever a step says "fresh page" or "fresh load":
  a plain navigate keeps `localStorage`, emulated media and the viewport.
- Load the MCP tools with ToolSearch first (`select:mcp__playwright__browser_navigate,...`). If none is
  found, stop with verdict BLOCKED: "playwright MCP server not connected: approve it in /mcp".
- Never substitute a hand-written Playwright or Node script for the MCP tools.

## How to work

- `browser_snapshot` before acting on a page: act on roles and accessible names, like a user with a
  screen reader would. Re-snapshot after every meaningful step. `browser_navigate` only links the
  snapshot as a `.yml` file; call `browser_snapshot` to get it inline. Those `.yml` and console `.log`
  files land in `.claude/qa-artifacts/` itself (git-ignored): leave them, never cite them as evidence.
- `browser_console_messages` with `level: "warning"` **before every `browser_navigate`**, and at the end
  of every flow: the list is cleared on each navigation, so errors from the previous page are lost
  otherwise (`all: true` returns the whole session when you need it). Any tool result that shows
  `Console: N errors` is a cue to read them.
- `browser_network_requests` after every flow: by default it hides successful static files (scripts,
  fonts, images); pass `static: true` when you need them. Anything 4xx/5xx or failed is a finding.
- A JS dialog (`alert`, `confirm`, `prompt`) blocks every tool until `browser_handle_dialog`; the tool
  results show it under "Modal state". Handle it with `accept: false`, and report the dialog itself.
- `browser_wait_for` waits at most 30 s per call.
- Never claim anything visual from a snapshot alone: take a screenshot.
- When something looks wrong, **reproduce it twice** from a fresh `browser_navigate` before you report it,
  and write the reproducibility you saw (always / 2 of 3 / once). One-off glitches are reported too, as
  `once`, never silently dropped.
- Try to break things: you are paid per bug found, not per check passed. But report only what you saw.
- `browser_evaluate` is for reading state (geometry, computed styles, `document.fonts`, performance
  entries, tagging a DOM node to check it is the same node later). Never use it to click, to change the
  app's state or to "fix" the page to continue a flow: a flow that needs that is a bug. The exceptions
  are the steps your agent file spells out (injecting axe, corrupting `localStorage`, `history.forward()`
  to go forward, since there is no forward tool; it returns mid-navigation, so read the page in a
  separate call), and, for the verifier, any `browser_evaluate` step written in the bug it reproduces.
- A missing favicon (a `404` for `/favicon.ico` and its console error) is one Observation for every
  level, never a bug: `CLAUDE.md` does not require a favicon. The error shows only in a fresh context.

## Must not

- Must not edit repo files, by any tool. The only files you create are screenshots via the MCP server.
- Must not load-test: no loops of requests, at most a handful of `curl` calls per URL. A `curl` runs
  without a prompt only in the read-only form the `pre-curl-allow` hook approves: plain `curl` with
  `-s`/`-S`/`-I`/`-i`/`-v`, `-o /dev/null`, `-D -`, `-w '…'` (plain text, `\n` and `%{variable}` only), `-X GET|HEAD`, `-m <s>`, `--compressed`, and
  `-H` for `Accept-Encoding`, `Accept`, `Origin`, `Range` or `Cache-Control`, to the site or the audio
  Worker; one command per call, no pipes, redirects or `-L`. Anything else stops on a prompt. The site is on a
  Vercel Hobby plan.
- Must not sign in anywhere, submit anything to a third party, or follow external links beyond reading
  their `href` and `target`/`rel`.
- Must not claim that sound plays (headless: nobody hears it) or that a touch gesture works (a resized
  desktop browser has a mouse): mark those COULD NOT VERIFY and name `pnpm test:e2e --project mobile`.
- Must not report "not built yet" items as bugs, or invent an expected behavior that no source states;
  if a rule is your own opinion, file it under Observations.

## Report format

Return exactly these sections, in this order, in English (the orchestrator translates the summary).

### Coverage

A table: `Check | Result (PASS / FAIL / COULD NOT VERIFY / NOT APPLICABLE / BLOCKED) | Note`, one row per check your level
lists, so it is clear what was and was not tested.

### Bugs

One block per bug:

```
#### <LEVEL>-<n>: <short title, what is broken where>
- Severity: critical | major | minor | trivial
- URL / viewport / media: https://…/cv · 390×844 · reduced-motion
- Steps (from a fresh page load):
  1. …
- Expected: … (source: CLAUDE.md "<section>" | MVP plan | .design/<feature>/SPEC.md §<n> | design screen <path> | common sense)
- Actual: …
- Evidence: screenshot path, console text, failed request (method, URL, status)
- Reproducibility: always | 2 of 3 | once
```

Severity:

- **critical**: the site or a whole tab does not load, the player cannot play at all, a JS crash, a
  security header missing on every page, a deploy serving stale or broken assets.
- **major**: a feature does not work in a common case (a button does nothing, music stops on a tab
  change, layout broken on a phone, something unreachable by keyboard, an axe "serious"/"critical").
- **minor**: works, but wrong in a less common case or looks wrong (overflow at one width, a focus ring
  missing, a console warning, layout shift).
- **trivial**: cosmetic, typos, a pixel off.

### Observations

Things that are not bugs by any source but a reviewer should see (risky, slow, odd, inconsistent).

### Not built yet

Features from the MVP plan that are absent, one line each.
