---
name: qa-smoke
description: >-
  Manual-only tester, level 1 of the full QA cycle — checks that the deployed site on Vercel is up and sane
  before deeper testing: every route answers, SPA deep links and refreshes work, assets load, security and
  cache headers are set, the HTML head is complete, no console errors on first load. Run it ONLY when the
  `/qa-full` skill dispatches it or the user names it explicitly ("запусти qa-smoke"). Never choose it on
  your own after a change.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - ToolSearch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_navigate_back
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_emulate_media
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_network_request
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_close
  - mcp__playwright__browser_handle_dialog
color: green
---

# QA level 1: smoke

First read `.claude/skills/qa-full/protocol.md` and follow it: target, shared browser, report format,
must-nots. Your level prefix is `SMOKE`. You are the gate: if the site is down, say so loudly, so the
orchestrator stops the other levels.

## HTTP level (Bash, `curl`; Git Bash syntax)

For `/`, `/cv`, `/games`, `/cv/` and an unknown path `/no-such-page-qa`:

- `curl -s -o /dev/null -w '%{http_code} %{content_type} %{time_total}\n' <url>`: expect `200 text/html`
  (the SPA rewrite in `vercel.json` serves `index.html` for every path). Note how the app handles the
  unknown path in the browser later: a blank page is a bug, a 404 view is fine.
- `curl -sI <url>`: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`,
  `Strict-Transport-Security` (Vercel adds it). `index.html` itself is served with
  `max-age=0, must-revalidate`, which is right for it.
- Compression: only on the JS and CSS assets (`curl -s -o /dev/null -D - -H 'Accept-Encoding: br, gzip'`
  must show `content-encoding`). Vercel does not compress tiny responses such as the ~600-byte
  `index.html`: that is not a bug.
- `http://` (no s) must redirect to `https://`.
- `curl -s <target>/` and read the HTML head: `<html lang="ru">` (the static default; JS may change it
  per language later), `<title>`, `meta viewport`,
  `meta description` (a missing one is a minor bug). Open Graph tags (`og:title`, `og:image`: a recruiter
  shares the link) and a favicon are not required by `CLAUDE.md`: if absent, list them under
  Observations, not Bugs.
  Fetch every `/assets/*.js` and `*.css` the HTML references: `200`, and
  `Cache-Control: public, max-age=31536000, immutable`. Fetch `/favicon.ico` or the declared icon,
  `/robots.txt`.

## Browser level

For each route `/`, `/cv`, `/games`, `/no-such-page-qa`:

1. `browser_navigate`, wait for the page, `browser_snapshot`: a `main` landmark, one `h1`, nothing that
   says "error" or is empty.
2. `browser_console_messages` and `browser_network_requests`: zero errors, zero failed requests. A
   `404` for `/favicon.ico` alone is the missing-favicon Observation from the HTTP level, not a bug.
   On the first `browser_evaluate` after loading `/`, read `html[data-theme]` and `html[lang]`: when the
   site has themes, `data-theme` is already `light` or `dark` (set before paint, no flash).
3. `browser_take_screenshot` at 1440×900.
4. Reload the same URL (navigate again): the same page renders (deep link + refresh work).
5. Navigate back and forward between two routes with `browser_navigate_back`: the right page shows.

Then measure `performance.getEntriesByType('navigation')[0]` (`domContentLoadedEventEnd`, `loadEventEnd`)
with `browser_evaluate` for `/` only: a first load over 3 s is an Observation, over 6 s a minor bug.

## Coverage rows

HTTP status per route · HTTPS redirect · security headers · compression · asset caching · HTML head and
OG tags · favicon / robots · render per route · console clean · network clean · reload on deep link ·
back/forward · unknown route view · load timing.
