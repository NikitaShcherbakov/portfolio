---
name: qa-performance
description: >-
  Manual-only tester, level 6 of the full QA cycle — measures the deployed site on Vercel the way
  Lighthouse would without running it: LCP, CLS, INP-like input delay, total transfer size by type, JS
  bundle weight, image formats and sizes, lazy loading, font loading, caching and compression, long tasks
  and memory growth while using the site. Run it ONLY when the `/qa-full` skill dispatches it or the user
  names it explicitly ("запусти qa-performance"). Never choose it on your own after a change.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - ToolSearch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
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

# QA level 6: performance

First read `.claude/skills/qa-full/protocol.md` and follow it. Your level prefix is `PERF`. Also read the
"Performance" line of the "Design rules" in `CLAUDE.md`. The numbers come from a desktop machine on a fast
network: report them as measured, and treat the budgets below as thresholds for bugs, not as a Lighthouse
score.

## 1. Load metrics, per route, at 1440×900 and at 390×844

Fresh context (`browser_close`, `browser_navigate`, `browser_resize`, then navigate again so the load
happens at the right size), wait 3 s, then one `browser_evaluate`:

- LCP: `new PerformanceObserver` on `largest-contentful-paint` with `buffered: true`, the last entry's
  `startTime` and `element` (tag + class);
- CLS: sum of `layout-shift` entries without `hadRecentInput`, and the sources of the biggest shift;
- long tasks: `longtask` entries (count, longest);
- read each entry type through its own observer wrapped in a promise that also resolves with `[]`
  after 1 s: a type with no entries never calls the observer back, and an unguarded `await` hangs the
  call. No LCP entry means nothing contentful was painted (a page holding only an `sr-only` heading):
  that row is COULD NOT VERIFY with the reason, never PASS. No `layout-shift` or `longtask` entry means
  zero of them;
- `performance.getEntriesByType('resource')`: per `initiatorType`, count and total `transferSize`; the
  ten biggest resources. Cross-origin entries (Google Fonts, YouTube) report `transferSize` 0 without
  `Timing-Allow-Origin`: say so instead of counting them as free.

Budgets (bug above): LCP 2.5 s (minor), 4 s (major); CLS 0.1 (minor), 0.25 (major); own JS over 300 KB
transferred (minor); any single image over 300 KB (minor); a long task over 200 ms on load (minor).

## 2. Assets

- Images: band photos are WebP (`Content-Type` via `curl -sI`); rendered size vs natural size (an 800px
  image drawn at 100px is waste); every `img` has `width`/`height`; below-the-fold images are
  `loading="lazy"`, first-screen ones are not.
- Fonts: Google Fonts preconnected (`link rel=preconnect` to `fonts.googleapis.com` and
  `fonts.gstatic.com` with `crossorigin`), `display=swap` in the CSS URL, only families and weights the
  page uses (compare the requested `family=` list with computed `font-family` values in use).
- Caching and compression: hashed `/assets/*` have `immutable` and a year `max-age`; `index.html` is not
  cached long; the JS and CSS assets come compressed (a GET, not `-I`: `curl -s -o /dev/null -D -
-H 'Accept-Encoding: br, gzip' <url>` must show `content-encoding`). Vercel does not compress tiny
  responses such as the ~1 KB `index.html`: not a bug. On a local target these rows are NOT APPLICABLE.
- The YouTube iframe API script is loaded once (count requests to `iframe_api` / `www-widgetapi`), not on
  every tab change.

## 3. Runtime

- Interaction delay (INP-like): before clicking, start an Event Timing observer with `browser_evaluate`:
  `window.__qaEvents = []; new PerformanceObserver((l) => window.__qaEvents.push(...l.getEntries().filter((e) => ['click', 'pointerdown', 'pointerup', 'keydown'].includes(e.name)).map((e) => ({ name: e.name, duration: e.duration, target: e.target?.tagName })))).observe({ type: 'event', durationThreshold: 16, buffered: true })`
  (unfiltered, one click logs dozens of `pointerenter`/`mouseover` entries). Durations are rounded to
  8 ms and include the next frame, so 48–64 ms per click in headless Chromium is the baseline, not slow.
  Click each main control (tab stickers, magazine flip, player buttons, LIST ▾, a playlist row) with
  `browser_click`, then read
  `window.__qaEvents`. A `click`/`pointerup` entry over 200 ms is a minor bug, over 500 ms major. Start it once
  per page load: a second observer on the same page keeps running and doubles every entry. A full
  navigation wipes it: start it again after one.
- Leaks: read `performance.memory.usedJSHeapSize` (Chromium; coarse-grained, so only large growth means
  anything), then do 20 tab changes and 20 page flips by
  clicks, read it again; growth over 20 MB, or a DOM node count (`document.getElementsByTagName('*')`)
  that keeps growing, is a minor bug. Once the YouTube player is built, check that the number of `iframe` elements stays 1 (0 before it is).
- Smoothness of the flip: `requestAnimationFrame` frame times during one flip (record for 1 s); frames
  over 50 ms are an Observation.
- Player: the playlist is virtualized, so count the row elements in the open drawer (a few dozen at
  most, not one per track) and record frame times while scrolling it from top to bottom. Let a track
  play for 60 s on Home with the drawer closed: count long tasks and DOM growth over that minute (a
  clock that re-renders the whole page each second shows up here). The spinning disc and spectrum must
  not keep the main thread busy: frames over 50 ms during playback are an Observation.

## Coverage rows

LCP · CLS · long tasks · transfer by type · JS weight · image format · image sizing · width/height · lazy
loading · fonts · caching · compression · YouTube API loaded once · interaction delay · memory · DOM
growth · flip smoothness, each per route and viewport where it applies.
