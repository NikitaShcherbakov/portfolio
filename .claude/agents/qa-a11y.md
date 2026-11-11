---
name: qa-a11y
description: >-
  Manual-only tester, level 5 of the full QA cycle — accessibility audit of the deployed site on Vercel:
  axe-core on every tab and state, keyboard-only walkthrough with visible focus and a sane tab order,
  screen-reader names and landmarks, hit areas of 44px, contrast over photos and paper, and
  prefers-reduced-motion emulated for real. Run it ONLY when the `/qa-full` skill dispatches it or the
  user names it explicitly ("запусти qa-a11y"). Never choose it on your own after a change.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - ToolSearch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_emulate_media
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_close
  - mcp__playwright__browser_handle_dialog
  - mcp__playwright__browser_network_requests
color: green
---

# QA level 5: accessibility

First read `.claude/skills/qa-full/protocol.md` and follow it. Your level prefix is `A11Y`. Also read
`.claude/skills/accessibility/SKILL.md`: it lists what lint and the scripted axe test already catch and the
gaps they cannot see. Spend your effort on the gaps.

## 1. axe on every state

Inject axe-core once per page load with `browser_evaluate`:

```js
async () => {
  if (!window.axe) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  const { violations } = await window.axe.run(document, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
  });
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    tags: v.tags.filter((t) => t.startsWith('wcag') || t === 'best-practice'),
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
};
```

If a Content-Security-Policy blocks the script, report it as an Observation and continue with the manual
checks. Run it on `/`, `/cv`, `/games`, and in each interactive state that exists: a magazine section
open, a band spread open, the iPod menu open, the player playing; for the
stereo deck: playing, standby (power off), the playlist drawer open, a search with no results. Check
the deck against its handoff's accessibility section (`.design/player/SPEC.md` §9 and Appendix B):
every listed `aria-*` present and its dynamic label following the state; the seek bar operable by
keyboard (Enter/Space, +10 s) with the time in its label; Esc closing the drawer and returning focus to
LIST ▾; the live region holding only title and artist, never the ticking time (a screen reader would
read it every second). Run it at
1440×900 and 390×844. If the site has themes (protocol "Themes"), run it again on every route
in the dark theme at 1440×900: colour-contrast results differ per theme. Severity: a rule tagged
`best-practice` (and no `wcag*` tag) is at most minor, whatever its impact; otherwise
`critical`/`serious` → major, `moderate`/`minor` → minor.

## 2. Keyboard only

From a fresh load of each route, press Tab until the focus returns to where it started (at most 60
times). After each press read `document.activeElement` with `browser_evaluate` (tag, accessible name,
`getBoundingClientRect`, computed `outline` and `box-shadow`); a full `browser_snapshot` per press is too
expensive. Then check:

- every interactive element from the snapshot is reached, in a visual order that makes sense;
- the focus is visible: the computed `outline`/`box-shadow` of the focused element is not `none`, and a
  screenshot of a few focused elements confirms it (a ring under an overlapping element does not count);
- no keyboard trap (Shift+Tab gets back out), focus never lands on something invisible or off-screen;
- the `<audio>` element is never reached by Tab (no native `controls`; the deck and the iPod are the
  controls);
- Enter/Space activate buttons; Escape closes anything that opened (menus); after a tab change the focus goes somewhere sensible, not lost to `body`;
- the first Tab on a fresh page reaches a "skip to content" link if there is one: it becomes visible on
  focus, and Enter moves the focus to `main` (the next Tab lands inside the content, not in the header);
- the focus ring is visible in the dark theme too, and on the language `select` and each theme button.

## 3. Screen-reader view

From `browser_snapshot`: one `h1` per page, heading levels do not skip; landmarks `banner`, `navigation`,
`main`, `contentinfo`; every button and link has a meaningful name (no "button", "link", "▶" alone);
icon-only buttons have `aria-label`; images have `alt` (decorative ones
`alt=""`); `html[lang]` matches the language on screen, in every language the switcher offers (switch
and re-check; also run axe once per language on `/`); the language switcher exposes its current value to
a screen reader and has a label; the theme control is a named group whose buttons each have a name
and an `aria-pressed` that matches the theme on screen, exactly one pressed; state changes announced (`aria-pressed`,
`aria-current`, `aria-live` for the now-playing track if it exists). After a tab change by click, the
document title or the `h1` tells a screen reader which page is open.

## 4. Targets and contrast

- `browser_evaluate`: every interactive element's box is ≥ 44×44 CSS px (padding counts, a parent hit
  area counts); list the ones below.
- Contrast that axe cannot compute (text over duotone photos, aged paper with gradients, stickers):
  screenshot it, and if it looks under 4.5:1 for body text or 3:1 for large text, report it with the
  screenshot.

## 5. Reduced motion

`browser_emulate_media` with `reducedMotion: 'reduce'`, then repeat the animated flows (magazine flip,
garland, any transitions): animations are off or instant, and every feature still works. Check
`getAnimations()` count and computed `transition-duration` on the flipping sheet. Reset the media at the
end.

## Coverage rows

axe per route and state × viewport · tab order per route · focus visible · traps · audio element · headings ·
landmarks · names · alt · lang · live regions · hit areas · contrast (light and dark) · skip link ·
theme control · reduced motion.
