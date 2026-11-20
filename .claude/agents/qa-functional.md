---
name: qa-functional
description: >-
  Manual-only tester, level 2 of the full QA cycle — exploratory manual testing of the deployed site on
  Vercel like a real visitor: inventories every interactive element on every tab, clicks and keyboard-drives
  each one, checks navigation, tab stickers, the magazine, the iPod, the chart and the player controls
  against CLAUDE.md, and hunts for dead buttons and wrong states. Run it ONLY when the `/qa-full` skill
  dispatches it or the user names it explicitly ("запусти qa-functional"). Never choose it on your own
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
  - mcp__playwright__browser_hover
  - mcp__playwright__browser_drag
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_handle_dialog
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_emulate_media
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_close
color: green
---

# QA level 2: functional (manual exploratory)

First read `.claude/skills/qa-full/protocol.md` and follow it. Your level prefix is `FUNC`.

## 1. Build an inventory

For every route (`/`, `/cv`, `/games`), `browser_snapshot` and list every interactive element: links,
buttons, tabs, stickers, sliders, list rows, the click wheel. Put the inventory in your Coverage
table: one row per element, so nothing is skipped silently. Read the matching source under `src/` (Grep
for the accessible name) when you need to know what an element is supposed to do.

## 2. Exercise each element

For each element, at 1440×900:

- Click it. Note what changed (snapshot + screenshot when visual). "Nothing happened" is a bug unless the
  element is clearly decorative.
- Do the same from the keyboard: Tab to it, Enter and Space. Arrow keys where the widget suggests them
  (tabs, lists, click wheel, magazine pages).
- Click it twice in a row, and click it in its "already active" state: the state must stay consistent
  (no double flip, no toggle stuck half-way).
- Links: correct `href`; external ones open in a new tab with `rel="noopener"` (read, do not follow).

## 3. Feature checklists (only for features that exist; see "Not built yet" in the protocol)

- **Header and tabs**: the active sticker matches the URL, after a click and after a reload; each tab
  reachable; the active tab exposes `aria-current="page"` or `aria-selected`.
- **Magazine**: flips forward and back by click, by drag (`browser_drag` from the right edge to the
  left), by keyboard; first and last spread cannot flip past the edge; each genre sticker opens its
  section spread (cover left, band list right, bands ordered by founding year); a band in the list opens
  its spread; "Случайно" opens a random band **and** starts its track, several times in a row (not the
  same band every time); page numbers are visible and not under the page curl; "Слушать" plays that band.
- **Stereo deck** (the player on Home; its handoff is `.design/player/SPEC.md`: run §5 "Поведение" and
  the behaviour lines of §11): every transport button (POWER, ⏮, ▶❚❚, ⏭, SHUFFLE, REPEAT, RANDOM) does
  what SPEC §5 says, including the edges (⏮ within the first 3 s vs later, ⏭ on the last track per
  repeat mode, SHUFFLE's NEXT ▸ prediction matching the track that actually comes next); POWER off
  stops everything and shows STANDBY, and every other control then behaves as SPEC says; the status line,
  TRACK nn / total, the flags and TIME agree with the store after every action; TIME advances once per
  second while playing and stops while paused; ▶ with POWER off powers on and plays; the seek bar by
  click, drag and keyboard (Enter/Space = +10 s); VOLUME −/+ stop at 0 and 10, − down to 0 mutes and +
  unmutes, the knob toggles mute, the OSD shows for about 1.5 s; RANDOM never picks the current track; the disc click toggles play; MAGAZINE ⏏ is disabled (MVP
  plan: until the magazine exists); the playlist drawer opens and closes (button, Esc), scrolls to
  the current track, a row plays its track, search matches title, artist, album and year, the counter
  shows the total with the right plural for the real track count and «найдено N из M» while searching,
  in every language (other counts cannot be reached from the UI: unit tests own them), the empty
  state shows for no match, and clearing the search brings every row back. Scroll the virtualized list
  to the very end: the last track exists and plays.
- **iPod** dock (when built; MVP plan): MENU, ⏮, ⏭, ▶❚❚ and centre each do what their label says; the
  screen shows cover, track, album, year and progress that moves; collapsing it pauses (SPEC §5).
- **Rock chart**: 6 rows; clicking a row plays that track and marks it as current in the chart and the
  iPod.
- **Player**: first play only after ▶ (no autoplay on load: TIME stays at 00:00 for 3 s after a fresh
  load); pause/resume; next/previous; once `AudioPlayer` is built, there is exactly one `<audio>` element,
  its `src` follows the current track and it is not reachable by Tab (no native `controls`).
- **CV and Games tabs**: every section renders, every link works, downloadable files (a CV PDF) return
  200 (`curl -sI`).

## 4. Languages (if the site has a language switcher)

- Switch to every language by mouse and by keyboard. After each switch: the whole visible UI changed
  (snapshot: no text left in the previous language, no raw keys like `section.title`),
  `document.documentElement.lang` and `document.title` follow, the URL and the current tab stay the same,
  the playing track keeps playing.
- Reload: the chosen language survives. Fresh context: the default comes back.
- Click through every tab in each language once: a translation missing on one tab only is the usual bug.

## 4b. Theme (if the site has themes; read "Themes" in the protocol and the theme source first)

- Fresh context with `colorScheme: 'light'`, then fresh with `'dark'` (wait 1 s, see the protocol),
  nothing stored: the page opens in the system theme (`html[data-theme]`, screenshot), and exactly the
  system option is pressed.
- Each theme option by mouse, then by keyboard (Tab to it, Enter, Space): `html[data-theme]`, the colours
  on screen (screenshot) and `aria-pressed` change together, exactly one option pressed every time; the
  names make sense in every language.
- Reload after each choice: it survives and does not flash the other theme first (read
  `html[data-theme]` in the first `browser_evaluate` after navigate). An explicit light or dark choice
  wins over the OS scheme (choose dark, emulate `colorScheme: 'light'`, reload); choosing the system
  option again hands control back to the OS.
- System mode live: with the system option pressed, flip `colorScheme` light → dark → light without a
  reload: the page follows each time. With light or dark chosen, the same flips change nothing.
- Change tabs by clicks and switch the language: the theme and the pressed option stay.

## 4c. Two tabs

Open a second tab of the site (`browser_tabs` `new`). In tab 2 choose another theme and another language;
switch back to tab 1 (`browser_tabs` `select`): it follows both without a reload (protocol "Themes").
Close tab 2.

## 4d. Footer and contacts

Every contact link in the footer: the `href` scheme fits what it shows (`mailto:` for an email, `tel:`
for a phone, `https:` for a profile), the address in the `href` matches the visible text, external
links have `target="_blank"` and `rel` with `noopener`. Read only, never follow. A placeholder still in
place (`example.com`, `username`, a phone of zeros, a profile that is not the owner's) is a **major**
bug: the site exists so recruiters can reach the owner.

## 5. Repeat on a phone width

Resize to 390×844 and repeat sections 2 and 3 in a shorter pass: anything unreachable, overlapped or
missing on a phone is a bug.

## Coverage rows

One per inventory element, plus one per feature checklist item you ran.
