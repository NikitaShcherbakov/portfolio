---
name: qa-visual
description: >-
  Manual-only tester, level 4 of the full QA cycle — checks the look and the responsive layout of the
  deployed site on Vercel at six widths: horizontal overflow, clipped or overlapping text, broken or
  missing images, fonts that fail to load, the magazine scaling as a whole, page curls over content, dark
  color scheme and 200% zoom, with a screenshot of every tab at every width. Run it ONLY when the
  `/qa-full` skill dispatches it or the user names it explicitly ("запусти qa-visual"). Never choose it
  on your own after a change.
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
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_hover
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_emulate_media
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_close
  - mcp__playwright__browser_handle_dialog
color: green
---

# QA level 4: visual and responsive

First read `.claude/skills/qa-full/protocol.md` and follow it. Your level prefix is `VIS`. Also read the
"Design rules" in `CLAUDE.md`.

## Matrix

Widths × heights: 320×640, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080. For each route (`/`, `/cv`,
`/games`) at each size:

1. `browser_resize`, navigate, wait until `document.fonts.status === 'loaded'`.
2. `browser_take_screenshot` with `fullPage: true` and
   `filename: .claude/qa-artifacts/<run-id>/visual-<route>-<width>.png`. **Look at it**: read the image back with
   Read and describe what is wrong, the way a designer would (misaligned, cut off, overlapping, empty
   gaps, unreadable text on a photo).
3. One `browser_evaluate` that returns:
   - `document.documentElement.scrollWidth > innerWidth` (horizontal scroll is a bug), and the elements
     whose `getBoundingClientRect().right > innerWidth + 1` (tag, class, text start);
   - elements whose text is clipped: `scrollWidth > clientWidth` with `overflow: hidden` and visible text;
   - `img` with `naturalWidth === 0` (broken), without `width`/`height` attributes, or below the fold
     without `loading="lazy"`;
   - `document.fonts` entries with `status === 'error'`, and families the page uses but did not load
     (computed `font-family` of headings falls back to a system font);
   - interactive elements overlapping each other (centre point `elementFromPoint` returns another
     element).

## Feature-specific checks (only for what exists)

- Magazine: the spread keeps `aspect-ratio: 3/2` at every width and scales as a whole (text inside does
  not reflow differently from the page); genre stickers stick out on the right and the active one sticks
  out further; `.corner` curls cover no text; page numbers visible; duotone photos look duotone, not plain
  colour or black boxes; a band without a photo shows the typographic poster.
- Flip animation: screenshot mid-flip (click, wait ~400 ms, screenshot): no z-fighting, no page showing
  through, the flipping sheet on top.
- Header: the Union Jack and the fairy lights do not cover the tabs at any width.

## Languages

If the site has a language switcher, switch to each non-default language through it and repeat the
matrix at 320×640, 390×844 and 1440×900 (filenames `visual-<route>-<width>-<lang>.png`): longer
translations overflow buttons, stickers and headings where Russian fits.

## Media and zoom

- **Themes** (protocol "Themes"): if the site has themes, repeat the matrix in the dark theme at
  320×640, 390×844 and 1440×900 (filenames `visual-<route>-<width>-dark.png`), chosen with its button.
  The theme group must fit next to the language switcher at 320 px without overflowing the header.
  Look for a component left in light colours, borders that vanish, native controls (the language
  `select` and its open options, scrollbars) in the wrong scheme, text whose contrast collapses. If the
  site has no themes, `colorScheme: 'dark'` on `/` at 1440 and 390: anything that turns unreadable is a
  bug.
- No flash of the wrong theme: choose dark, emulate `colorScheme: 'light'`, wait 1 s, reload, and take a
  screenshot right after `browser_navigate` returns: it must already be dark.
- 200% zoom: `document.body.style.zoom` is not real zoom; instead resize to 720×450 (equivalent CSS pixels
  of 1440×900 at 200%) and check nothing overlaps or disappears.

## Coverage rows

One per route × width, plus one per route × width × language and per route × width in the dark theme,
plus magazine, flip, header, theme flash, zoom. List every screenshot path at the
end.
