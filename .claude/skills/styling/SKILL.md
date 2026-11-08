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

`src/styles/index.css` is `@import 'tailwindcss';` today. Add a project stylesheet next to it and import it
there when the first token or shared class arrives.

## 3. Tooling facts

- `prettier-plugin-tailwindcss` sorts classes in `className`, `cn()` and `clsx()` (`.prettierrc.json`, its
  `tailwindStylesheet` is `./src/styles/index.css`). Never hand-sort; the edit hook runs Prettier on save.
- `cn()` does not exist yet (CLAUDE.md "Planned when needed"). The first conditional class adds `clsx` and
  `tailwind-merge` (with the user's agreement: it asks for permission) and `src/lib/utils.ts` in the same
  change, or Knip fails on unused dependencies. `tailwind-merge` resolves conflicts so the last class wins:
  put the caller's `className` last (`cn('base classes', className)`).
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

None are loaded yet. The first component that uses a font adds one Google Fonts `<link>` to `index.html`
(CLAUDE.md lists the families) with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` and
`display=swap`; later families and band fonts go into that same link, only the weights the design uses. A font family is a token; never a raw
`font-['Anton']` scattered through components.

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
