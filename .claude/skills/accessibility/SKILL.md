---
name: accessibility
description:
  What `jsx-a11y-x` strict and the axe e2e check already catch in Rock Wall, and the gaps they cannot see —
  a focus ring removed by a Tailwind class, hit areas under 44px, contrast over duotone photos and aged
  paper, motion without a reduced-motion path, a page flip or click wheel that works only with a mouse or a
  swipe, a YouTube iframe without a title. Use when adding an interactive element (the sticker tabs, the
  magazine flip, the iPod click wheel, the chart rows, the player controls), an icon-only button, an
  animation, or text over an image.
when_to_use:
  Also for "a11y", "accessible", "keyboard", "focus", "tab order", "aria-label", "aria-pressed",
  "aria-current", "screen reader", "contrast", "reduced motion", "hit area", "touch target", "axe",
  "Lighthouse", "доступность".
---

# Accessibility

The bar (CLAUDE.md): real `<button>`/`<a>`, `aria-label` on icon buttons, 4.5:1 contrast, hit areas
≥ 44px, `prefers-reduced-motion` honored, the axe e2e check green, Lighthouse accessibility ≥ 90.

## What the tools already catch

- `jsx-a11y-x` **strict** runs on `src/**/*.tsx`: `onClick` on a `<div>`/`<span>` without a role and keyboard
  handler, `<img>` without `alt`, an `<a>` without a valid `href`, a non-interactive element with an
  interactive role, `autoFocus`, and more. Raw DOM elements are used everywhere here, so lint sees them.
- `e2e/smoke.spec.ts` runs axe with the `wcag2a`, `wcag2aa` and `wcag21aa` tags and fails on any violation,
  on desktop and mobile. Contrast is checked only where axe can compute it: not over images.
- `index.html` sets `lang="ru"`, matching the Russian UI copy.

## The gaps — check these yourself

- **Focus ring.** Tailwind's `outline-none` or `focus:outline-none` on a focusable element removes the only
  keyboard indicator, and lint cannot see it. Keep the browser ring, or replace it with a visible
  `focus-visible:` style that fits the design (`focus-visible:outline-2 focus-visible:outline-offset-2`).
- **Hit area ≥ 44×44 px**, also for small stickers, the click wheel's segments and the chart rows. A
  visually small control can grow its hit area with padding or a pseudo-element.
- **Contrast over images and paper.** Text on duotone photos, polaroids, aged paper and coffee stains is not
  checked by axe. Measure it against the darkest and lightest area behind the text; 4.5:1 for body text,
  3:1 for text ≥ 24px or bold ≥ 18.66px.
- **Motion.** Page flips, the garland and any transition need a `prefers-reduced-motion` path (the
  **styling** skill §5).
- **Keyboard parity for gestures.** A page flip by drag or swipe also needs buttons ("Следующая страница",
  "Предыдущая страница") reachable by Tab, or arrow keys on a focusable magazine region. The iPod click
  wheel is a set of `<button>`s (MENU, ⏮, ⏭, ▶❚❚, center), each with an `aria-label` in Russian; its
  menu playlist is a list of buttons or links, scrollable with the keyboard.
- **State.** A tab or sticker that shows the current section carries `aria-current` (`"page"` for a route
  link); a play/pause toggle carries `aria-pressed` or swaps its label; the "Случайно" sticker says what it
  does in its accessible name.
- **The YouTube iframe** needs a `title` describing the video ("Клип: <artist> — <track>"). Track changes
  are announced through a `role="status"` element mounted before its text changes, not by moving focus.
- **Icons.** A decorative SVG is `aria-hidden="true"`; an icon-only button has an `aria-label` naming the
  action, not the icon.
- **Focus after a change.** When the focused element unmounts (a flipped page, a closed menu), move focus to
  something meaningful (the new page's heading with `tabIndex={-1}`), only if focus fell to `<body>`.

## Checklist for a new interactive element

- Reachable and operable with Tab, Enter and Space alone (arrows where a group implies them).
- A visible focus indicator.
- An accessible name; icon-only → `aria-label`.
- The state the interaction implies (`aria-current`, `aria-pressed`, `aria-expanded`).
- A hit area ≥ 44×44 px.
- A Testing Library test that finds it by role and name, and acts with `userEvent`.

## Must not

- Must not put `onClick` on a non-interactive element: use `<button>` or `<a>`.
- Must not remove a focus outline without a visible `focus-visible:` replacement.
- Must not add an Enter/Space `onKeyDown` to a native `<button>`: the action fires twice.
- Must not make a gesture (drag, swipe, scroll-wheel) the only way to do something.
- Must not ship text over an image without checking its contrast by hand.
- Must not disable or weaken the axe check in `e2e/` to get a green run.
