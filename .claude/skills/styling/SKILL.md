---
name: styling
description: >-
  How styling works in the portfolio — Tailwind CSS 4 utilities, project tokens and shared classes in a
  stylesheet imported by `src/styles/index.css`, `cn()` for conditional classes, Prettier sorting the
  classes, inline `style` only for runtime values (band theme colors), the magazine's `cqw` sizing inside a
  `container-type: inline-size` spread, and porting the design the user sent as is. Use when writing or
  reviewing `className`, a stylesheet, a color, a font, an animation or a responsive layout, or when porting
  a design into a component.
when_to_use: >-
  Also for "tailwind", "className", "cn", "css", "token", "color", "font", "cqw", "container query",
  "aspect-ratio", "animation", "transition", "rotateY", "duotone", "responsive", "mobile layout", "port the
  design", "стили", "перенеси дизайн".
---

# Styling

## 1. The design is the spec

Designs arrive from the user component by component (CLAUDE.md "Design rules"). Port the given markup,
class names, sizes, colors and fonts as they are. Do not "improve" spacing, swap fonts, round values to the
Tailwind scale or restyle into shadcn defaults. When the design and a rule here disagree, ask the user.

## 2. Where styles live

| What                                                                                         | Where                                                                              |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| layout, spacing, one-off values                                                              | Tailwind utilities in `className`, arbitrary values allowed (`w-[37cqw]`)          |
| project tokens (palette, font families, shadows)                                             | a stylesheet imported by `src/styles/index.css`, as Tailwind 4 `@theme` variables  |
| shared effect classes (`.leaf`, `.duo`, `.aged`, `.coffee`, `.dogear`, `.staple`, `.corner`) | the same kind of stylesheet: they need pseudo-elements and blend modes             |
| a value known only at runtime (a band's theme color, an animation delay)                     | inline `style`, ideally a CSS custom property the stylesheet reads                 |
| conditional classes                                                                          | `cn()` in `src/lib/utils.ts` (`clsx` + `tailwind-merge`), added with the first one |

No CSS modules, no styled-components, no CSS-in-JS. Band colors are never tokens: they come from
`bands.json → theme`.

`src/styles/index.css` imports, in this order: `tailwindcss`, `theme.css` (tokens), the player's three
stylesheets, `scrapbook.css` (shared paper and cut-out classes); it also declares the `dark` and `phone`
custom variants. A new shared stylesheet goes next to them and is imported there; mind the order.

### The player exception

`src/modules/player/styles/player.css` is the design's stylesheet, kept as delivered: never sort, dedupe or
rewrite it into Tailwind (rule order is the result). `player-compat.css` before it reverts only what
Tailwind preflight sets inside `.player-deck`/`.ipod-dock`; fixes to the design's CSS go into
`player-overrides.css` after it. Inside the player use the design's classes and its inline `style`
positions, not utilities: a utility there fights the design (CLAUDE.md "Styling").

### Breakpoints and theme

- The design's phone breakpoint is inclusive (`max-width: 640px`): use the `phone:` variant, never
  `max-[640px]:`, which stops at 639.98px.
- Dark theme: `html[data-theme='dark']`, set before first paint by the script `vite.config.ts` injects.
  Tailwind's `dark:` variant is redefined in `index.css` to follow that attribute, not
  `prefers-color-scheme`. Every new surface gets its dark colors in the same change; check both themes.

## 3. Tooling facts

- `prettier-plugin-tailwindcss` sorts classes in `className`, `cn()` and `clsx()` (`.prettierrc.json`, its
  `tailwindStylesheet` is `./src/styles/index.css`). Never hand-sort; the edit hook runs Prettier on save.
- `cn()` lives in `src/lib/utils.ts` (`clsx` + `tailwind-merge`); never add a second class merger.
  `tailwind-merge` resolves conflicts so the last class wins: put the caller's `className` last
  (`cn('base classes', className)`).
- Tailwind 4 has no `tailwind.config.js`: configuration is CSS (`@theme`, `@utility`, `@custom-variant`).
  Never add a JS config.

## 4. The magazine

- The spread is `aspect-ratio: 3/2` with `container-type: inline-size` (Tailwind's `@container` class).
  **Every size inside a page is in `cqw`** — font sizes, paddings, gaps, borders, offsets — so the magazine
  scales as one object: `text-[2.2cqw]`, `p-[1.5cqw]`. A `px`/`rem` value inside a page is a bug on phones.
- Sheets are `.leaf` elements: `transform-origin: left center`, `backface-visibility: hidden`, `rotateY`,
  0.9s. The sheet that is flipping gets z-index 100 for the duration of the animation; the resting z-index
  order comes from the design.
- Photos use `.duo`: the image `grayscale` + `mix-blend-mode: multiply`, `::after` a dark color with
  `lighten`, `::before` the halftone.
- `.corner` page curls must not cover content: page numbers sit at the top.
- 3D needs `perspective` on an ancestor and `transform-style: preserve-3d` between it and the leaf; a
  wrapper with `overflow: hidden` flattens the 3D.

## 5. Motion

Every animation and transition has a reduced-motion path: Tailwind's `motion-safe:` / `motion-reduce:`
variants, or `@media (prefers-reduced-motion: reduce)` in the stylesheet. A page flip under reduced motion
switches the page without the rotation. The fairy-light twinkle stops.

## 6. Fonts

`index.html` has one Google Fonts `<link>` with `preconnect` to `fonts.googleapis.com` and
`fonts.gstatic.com` and `display=swap`; CLAUDE.md "Design rules" lists what it loads and what is still to
come. A new family or weight goes into that same link, only the weights the design uses; never a second
link. A font family is a token; never a raw `font-['Anton']` scattered through components.

## 7. Responsive

Mobile is mandatory. Check 390 px, 768 px and 1440 px with the `qa` subagent and the Playwright `mobile`
project. Tailwind breakpoints (`md:`, `lg:`) for page layout; container queries and `cqw` inside the
magazine.

## Must not

- Must not invent a style, round design values to the Tailwind scale, or restyle into shadcn defaults.
- Must not use `px`/`rem` for sizes inside a magazine page.
- Must not use inline `style` for a static value, or put a band color into the tokens.
- Must not add CSS modules, CSS-in-JS, a `tailwind.config.js` or an animation library.
- Must not ship an animation without a `prefers-reduced-motion` path.
- Must not hand-sort classes.
- Must not rewrite `player.css`, or put Tailwind utilities inside `.player-deck`/`.ipod-dock`.
- Must not use `max-[640px]:` for the phone breakpoint, or ship a surface without dark-theme colors.
