---
name: new-module
description:
  Creates a new feature module under `src/modules/` by hand (there is no generator) — only the folders the
  module needs, each with its `index.ts` barrel, the root barrel, a first component with its Testing Library
  test — and wires a page and route if the module has a screen. Run it as `/new-module <module-name>` when a
  feature from the MVP plan (magazine, player, chart, cv, games) has no home yet.
disable-model-invocation: true
argument-hint: [module-name]
---

# Create module `$ARGUMENTS`

One name, three casings: folder `rock-chart` → components `RockChart…`, hooks `useRockChart…` → route key
`routes.Chart` if it has a screen. File and folder names are kebab-case; ESLint's `check-file` rules reject
anything else under `src/`.

**No name, no run.** If no module name was passed (the heading above shows none or still the placeholder),
ask for it and create nothing.

## Step 1 — is a module warranted?

Read `src/modules/` first. A module owns one feature area of CLAUDE.md's MVP plan (`magazine`, `player`,
`chart`, `cv`, `games`); `common` holds what two or more modules render (header, union jack, fairy lights,
the layout template, the routes object). Extend the owner instead of creating a twin. If `src/modules/`
does not exist yet, this is the first module: create the folder too.

## Step 2 — the folders it needs, nothing more

CLAUDE.md "Feature module layout": `components/`, `hooks/`, `stores/`, `utils/`, `types/`. Create only the
ones the first real file needs, never empty placeholders. Each folder gets an `index.ts` with one
`export * from './<file>';` per file; the root `index.ts` re-exports the folders:

```ts
// src/modules/<name>/index.ts
export * from './components';
export * from './hooks';
```

Barrel lines are sorted by `simple-import-sort/exports` (an ESLint error); the edit hook's `eslint --fix`
sorts them when you save with Edit/Write.

**Knip and barrels.** Knip reports a barrel that nothing imports as an unused file, and a test that imports
the component directly does not count, so `pnpm check` fails on a module nobody renders yet (verified). In
the same change, render the module from its consumer through `@/modules/<name>`: `App` until routing lands,
the page afterwards. Never silence it with a `knip.json` entry.

## Step 3 — the first component

```tsx
// src/modules/<name>/components/<component-name>.tsx
type ComponentNameProps = {
  isActive?: boolean;
};

export function ComponentName({ isActive }: ComponentNameProps) {
  // ...
}
```

Next to it, `<component-name>.test.tsx` (`.tsx`, so it runs in jsdom) that renders it and queries by role
and accessible name. Port the markup and sizes from the design the user sent; the **styling** skill has the
rules.

- A store: `stores/<name>-store.ts`, Zustand, once the user has agreed to add Zustand (CLAUDE.md
  "Planned when needed"). Its test resets it in `beforeEach` with `setState(initialState, true)`.
- A pure helper: `utils/<verb-noun>.ts` with a `.test.ts` next to it (node project).
- Content types: derived from the Zod schemas in `src/content/` once they exist, never redeclared.

## Step 4 — page and route, only if the module has a screen

Only after routing has landed (CLAUDE.md MVP plan, "Layout"). Then:

1. `src/pages/<name>/<name>-page.tsx` with a named export, a thin wrapper around the module's components,
   plus `index.ts` and a line in `src/pages/index.ts`.
2. A key in the routes `as const` object — never a path literal elsewhere.
3. A child of the layout route in `src/router/`, so the header, garland and player stay mounted.

## Step 5 — verify

```bash
pnpm check
```

Then run the `qa` subagent on the screen, with a screenshot to compare with the design (it needs the
`playwright` MCP server; without it, say that the visual check is still open).

## Must not

- Must not create empty folders or barrels "for later".
- Must not import the module's own root barrel from inside the module: an import cycle that tsc does not
  report and that breaks module-level values at runtime. Use relative paths inside the module and `@/` from
  outside.
- Must not leave a helper inside a component file (`react-refresh/only-export-components` also flags it).
- Must not add a dependency (router, store, Zod) while scaffolding without the user agreeing.
- Must not add a component without its test.
