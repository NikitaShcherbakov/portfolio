---
name: qa-integration
description: >-
  Manual-only tester, level 3 of the full QA cycle — tests how the features of the deployed site on Vercel
  work together: the one YouTube player surviving tab changes as the same DOM node, the magazine, iPod and
  chart driving one shared player state, the floating video window, skipped unplayable videos, state
  after reload and history navigation, third-party requests. Run it ONLY when the `/qa-full` skill
  dispatches it or the user names it explicitly ("запусти qa-integration"). Never choose it on your own
  after a change.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - ToolSearch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_navigate_back
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_find
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_hover
  - mcp__playwright__browser_drag
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

# QA level 3: integration

First read `.claude/skills/qa-full/protocol.md` and follow it. Your level prefix is `INT`. Also read the
"YouTube player constraints" in `CLAUDE.md` and `.claude/skills/youtube-player/SKILL.md`: they are your
expected behavior.

Navigate between tabs by **clicking the tab stickers**, not by `browser_navigate`: a full page load always
recreates the player, which hides exactly the bugs you are here for.

## Flows

Run every flow whose features exist at the commit under test. Only the steps that need a feature the
MVP plan has not checked yet (YouTube, iPod dock, chart, magazine) are "Not built yet"; flows 0, 4, 5,
9 and 10 need none of them, so run them in full.

0. **Playback survives tab changes (simulated clock, protocol "Playback before YouTube").** On `/`,
   start a track on the stereo deck, set a non-default volume, SHUFFLE on and REPEAT ONE. Note TIME,
   the track, and `Date.now()`. Click to `/cv`, wait 5 s, click to `/games`, wait 5 s, click Home.
   Expected: the same track, still playing, TIME advanced by the time spent away (± 2 s), and volume,
   shuffle, repeat and power as you left them. Repeat with the deck paused: TIME must not move while
   away. Repeat with the playlist drawer open and a search typed: report what the deck restores as an
   Observation. Then reload on `/cv` and go Home: report what survives a reload (no source requires it).
1. **Player survives tab changes.** On `/`, press ▶. Tag the iframe:
   `document.querySelector('iframe[src*="youtube"]').dataset.qaMark = 'same'`. Click to `/cv`, then
   `/games`, then back home. After each step: the iframe with `data-qa-mark="same"` still exists (same
   node, not remounted), is visible and ≥ 200×200, and the player state (track title on the iPod, the
   iframe `src` video id) did not change. On non-Home tabs it is the floating window; on Home it is back
   in the «смотрим клип» block.
2. **One state, many controls.** Start a track from the chart, then press ⏭ on the iPod: the chart's
   current row, the iPod screen and the video all move to the same next track. Start from the magazine
   "Слушать", then from "Случайно": the same check. Rapidly mixing sources must never leave two "current"
   tracks.
3. **Floating window.** On `/cv`: the floating video does not cover the tab stickers or primary content
   at 1440×900 and at 390×844; it stays ≥ 200×200; it stays put while the page scrolls.
4. **History.** Play a track, change tabs by clicks, then `browser_navigate_back` twice: the URL, the
   active tab sticker and the page agree; whether the music keeps playing is reported as observed.
5. **Reload.** Reload during playback: no autoplay after reload (browsers block sound without a gesture),
   no error state; whatever state is restored (track, favorites) matches what was there.
6. **Unplayable video.** If the playlist has a video that errors (look for YouTube error 101/150 or
   `embeddable: false` in `src/content/tracks.json`), select it: the player skips to the next track by
   itself. If none exists, mark COULD NOT VERIFY.
7. **Third parties.** `browser_network_requests` over the whole session: only YouTube, Google Fonts and
   the site's own origin. Every request must succeed; list any other host as an Observation; a request
   to YouTube Music or with cookies being set for YouTube outside the iframe is a critical bug.
8. **Mobile flow.** Repeat flows 1 and 3 at 390×844.
9. **Shared settings across the app.** Set a non-default language (through the switcher) and the
   dark theme (through its button), then: change tabs by clicks, go back and forward, reload, open
   an unknown path and follow its link home. After each step the language, `html[lang]`, the title, the
   theme, `html[data-theme]` and the pressed theme button all still agree, on every page, and the music
   (if any) keeps playing.
10. **Scroll and focus across tabs.** Scroll down a long page, change tab by click: the new page starts at
    the top; go back: report where the scroll lands. Skip link and focus after a tab change are a11y's.

## Coverage rows

One per flow, split per viewport for flows 1, 3 and 8.
