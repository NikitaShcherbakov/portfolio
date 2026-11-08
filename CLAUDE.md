# portfolio

Personal portfolio site of Nikita Shcherbakov for recruiters (CV plus interactive features), styled as a 2000s rock bedroom: Union Jack header, fairy lights, a rock magazine with 3D page flips, an iPod-style player driven by YouTube, a chart. Tabs: Home (`/`), CV (`/cv`), Games (`/games`).

Talk to the user in Russian. Code, comments and commit messages stay in English. UI copy is Russian.

## Stack

| Area                     | Choice                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Runtime                  | Node 24 LTS (`.nvmrc`), pnpm 10 (`packageManager`)                                                                        |
| Build                    | Vite 8 (Rolldown), static SPA, deployed to Vercel (`vercel.json`, output `build/`)                                        |
| UI                       | React 19, Tailwind CSS 4 (`@tailwindcss/vite`)                                                                            |
| Types                    | TypeScript 6 strict (not 7 until typescript-eslint supports it), `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Unit / integration tests | Vitest + React Testing Library (jsdom)                                                                                    |
| E2E                      | Playwright (desktop + mobile) + axe accessibility checks                                                                  |
| Quality                  | ESLint 10 (typescript-eslint strict type-checked, @eslint-react, jsx-a11y-x), Prettier, husky + lint-staged, commitlint   |

No backend, no auth, no API client. Do not add libraries "just in case": add a dependency only when a feature needs it.

**The project starts empty.** Features are built step by step from designs the user sends. Planned when needed: React Router 7 (`react-router` package) for tabs, Zustand for the player state, Zod for content validation, `cn()` (`clsx` + `tailwind-merge` in `src/lib/utils.ts`) with the first conditional class. Propose each one when the feature needs it and install it only after the user agrees (`pnpm add` asks for permission); never a second library for a capability already chosen.

### Does not exist — never reference

This repo started from a team template whose habits do not apply here:

| Never write                                                                                 | Use instead                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `useApiClient`, axios, `@/services/open-api/*`, `extractErrorMessage`, TanStack Query       | nothing: no backend; data is `src/content/*.json`                 |
| `TextField`, `CustomCheckbox`, `ButtonLoading`, `@/modules/common/components` form controls | plain elements styled with Tailwind; there are no forms yet       |
| react-hook-form, a shadcn `<Form>`, `scrollToError`, validation-message constants           | not installed; Zod only for content validation, when added        |
| `sonner`, `toast`                                                                           | not installed                                                     |
| `lucide-react`, `@/assets/icons/*.svg?react`                                                | not installed (no svgr); inline SVG from the design, or `<img>`   |
| `react-router-dom`, `<BrowserRouter>`                                                       | `react-router` 7, when routing lands                              |
| `export enum Routes`, any `enum`                                                            | an `as const` object (`erasableSyntaxOnly`; ESLint blocks `enum`) |
| `AuthGuardTemplate`, `CanAccessTemplate`, roles                                             | no auth                                                           |
| `interface` for props                                                                       | `type ComponentNameProps`                                         |
| `design/reference.dc.html`, `openspec/AGENTS.md`                                            | removed: designs come from the user in the chat                   |

Knip runs in `pnpm check` and CI: unused files, exports and dependencies fail the build, so delete what is no longer used.

## Commands

```bash
pnpm dev             # http://localhost:5173
pnpm check           # format + lint + typecheck + knip + test + build: run before saying "done"
pnpm knip            # unused files, exports, dependencies
pnpm test:watch      # Vitest in watch mode
pnpm test:coverage
pnpm test:e2e        # Playwright, desktop + mobile (first time: pnpm exec playwright install chromium)
pnpm format          # Prettier
```

## Verification and done

- Before saying "done", run `pnpm check` (the **check** skill); for anything visible in a browser also `pnpm test:e2e`, and the `qa` subagent with a screenshot when the `playwright` MCP server is configured (otherwise say that the visual check is still open). Never claim tests pass without running them in this session.
- Zero ESLint warnings, not just zero errors (`--max-warnings=0`, the same in lint-staged and CI).
- `.claude/hooks` run by themselves. After every Write/Edit the file gets `eslint --fix` and `prettier --write`, which deletes an unused import: add an import in the same edit as its first use. A comment added to `src/`, `e2e/` or `scripts/` is listed back with what looks wrong in it: delete what "Comments" below does not allow. When a turn ends with uncommitted files the type-check reads, `tsc -b` runs and a failure keeps the turn going: fix what your changes caused, report the rest. None of this replaces `pnpm check`.
- Make changes to repo files with the Edit and Write tools, not `sed -i`, heredocs, redirects or ad-hoc scripts in Bash/PowerShell: the hooks match `Write|Edit` only. The repo's own commands (`pnpm lint:fix`, `pnpm format`) are fine.
- Never `git commit` or `git push` unless the user asked for it in this conversation. Messages are Conventional Commits in English: `<type>: <lower-case subject>`, no trailing period, lines ≤ 100 chars (the **git-workflow** skill).
- Other sessions may edit this checkout at the same time. Stage only the files this task changed, by path: never `git add -A`, `git add .`, `git commit -a` or `git stash`, and never revert, reformat or delete a file this task did not touch. Report an error in such a file instead of fixing it.
- Never read, print or edit `.env` or `.env.*.local` (denied to Read/Edit in `.claude/settings.json`; a shell command is not reliably blocked, so this rule is the guard). `.env.example` documents every variable; a `VITE_` variable is bundled into the client, so never a secret there.
- Never run the `vercel` CLI: deploys go through Vercel's Git integration.

## Claude Code setup

- **Skills** (`.claude/skills/`), loaded on demand: `check` (the gate and how to unstick it), `testing`, `styling`, `accessibility`, `youtube-player`, `content-pipeline`, `git-workflow`, and `/new-module <name>` (user-invoked). A skill holds the how-to; a rule that must hold in every session belongs in this file.
- **Agents** (`.claude/agents/`): `code-reviewer` (static review against this file and the skills; run before a commit) and `qa` (drives a real browser through the `playwright` MCP server, takes screenshots to `.claude/qa-artifacts/`; it needs a `playwright` entry in `.mcp.json`).
- **Hooks** (`.claude/hooks/`, wired in `.claude/settings.json`): `post-edit-format`, `post-edit-comments`, `pre-stop-typecheck`.
- Personal overrides go into `.claude/settings.local.json` (ignored by `.claude/.gitignore`).

## Project structure

Current:

```bash
src/
├── main.tsx          # entry: renders <App /> + global styles
├── app/              # App root component
├── styles/index.css  # Tailwind entry
└── test/setup.ts     # Vitest + jest-dom setup
e2e/                  # Playwright specs
```

Target layout as features land:

```bash
src/
├── app/              # App root, providers
├── router/           # routes (exported for tests) + browser router
├── pages/            # route-level components, thin wrappers
├── modules/          # feature modules: common, player, magazine, ...
├── content/          # *.json + Zod schemas; the only data source
├── utils/            # app-wide helpers
├── styles/           # Tailwind entry + project tokens
└── test/             # setup and render helpers
scripts/              # content pipeline; Node 24 runs .ts directly (type stripping, erasable syntax only)
```

Feature module layout (create only the folders a module needs, each with an `index.ts` barrel):

```bash
modules/feature-name/
├── components/   # component-name.tsx (+ component-name.test.tsx)
├── hooks/        # use-hook-name.ts
├── stores/       # Zustand stores
├── utils/
├── types/
└── index.ts
```

- All public pages will be children of one layout route, `SiteTemplate` in `src/modules/common/`, that mounts the header, garland and player once, so music never stops on tab change.
- `scripts/` is not wired into tsconfig, ESLint, Vitest and Knip yet: the first script brings that setup with it (the **content-pipeline** skill §1).
- Route paths will live in one `as const` object (`routes.Home`, ...).

## Coding standards

ESLint enforces most of these; `pnpm lint` must pass with zero warnings.

### Naming

- Files and folders: kebab-case (`site-header.tsx`, `use-player.ts`). Component names: PascalCase, matching the file.
- Variables and functions: camelCase. Functions start with a verb (`get`, `set`, `handle`, `create`, ...); event handlers use `handle*` / `on*`.
- Booleans: `is`, `has`, `should`, `can` prefix.
- Types: PascalCase; props type is `ComponentNameProps`. Use `type`, not `interface`.
- No `enum`: use an `as const` object.

### Components

```tsx
type ComponentNameProps = {
  children: ReactNode;
  isActive?: boolean;
  onSelect: (id: string) => void;
};

export function ComponentName({
  children,
  isActive,
  onSelect,
}: ComponentNameProps) {
  // ...
}
```

- Always destructure props in the parameters. Use `children` for content.
- Do not pass a prop that equals its default. Boolean shorthand: `<Component isVisible />`.
- Generic prop names in specific contexts (`onRemove`, not `onRemoveComment`, inside `Comment`).
- Repetitive UI via `.map()` over data, never hard-coded lists.
- Business logic goes into hooks/stores; components stay presentational.
- Helpers live in `utils/`, not in component files.
- Functions returned from custom hooks are wrapped in `useCallback`.
- Use `React.memo` / `useMemo` only for measured expensive work. Keep state local; use refs for values that do not drive rendering.

### TypeScript

- No `any`. Avoid `unknown` except at real boundaries (JSON, errors), then narrow it.
- Reuse types: derive from Zod (`z.infer`) and from `src/content/schemas.ts`.
- Indexed access returns `T | undefined`: handle the missing case explicitly.

### Imports

Order (auto-fixed by ESLint): external, `@/` aliases, relative, styles. Use `@/` for anything outside the current module.

### Styling

- Tailwind utilities; project tokens and shared classes go into a stylesheet imported by `src/styles/index.css`. Conditional classes via `cn()`, added with the first one. Details: the **styling** skill.
- No CSS modules or styled-components. Inline `style` only for values computed at runtime (band theme colors, animation delays).
- Band colors are not tokens: they come from `bands.json → theme`.
- shadcn/ui primitives are added on demand and only where they fit the look (Dialog, Tooltip); ask before the first one. Its `init` expects the `@/*` alias in the root `tsconfig.json` (today only `tsconfig.app.json` has it) and writes its own theme into `src/styles/index.css`, which must not replace the project's tokens; its components import `lucide-react`, which is not installed. Never restyle the design into shadcn defaults.

### Errors

- Fail loudly: throw specific errors with clear messages. No silent fallbacks that hide a broken main flow.
- `async/await` instead of `.then()` chains.

### Comments

The default is none: a comment is a claim no tool checks, and it goes stale silently. Write one only where a rule requires it (the `-- <why>` of an `eslint-disable`, the reason of a `@ts-expect-error` or of a deliberately silent `catch`), where the user asks for it, or where the code alone would lead the next reader to a wrong "fix": a browser or library quirk (the YouTube IFrame API, 3D transforms in Safari), a workaround, a value whose source is nowhere in the code. Such a comment says **why**, in one or two English lines, without "we" or "I", and states only what was verified in this session; if unsure, write none.

Never in a comment: what the code already says, history or the task ("now", "fixed", "as requested": that is the commit message's job), a pointer to other code ("see X"), commented-out code, an unasked `TODO`. An edit that makes a comment wrong fixes or deletes it in the same edit.

### Scope

Change only what the task needs. Read related code before editing. No drive-by refactors.

## Testing

| Level                 | Tool                             | What to test                                                     | Where                         |
| --------------------- | -------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Unit                  | Vitest (node)                    | stores, content, utils, scripts: pure logic                      | `*.test.ts` next to the code  |
| Component/integration | Vitest + Testing Library (jsdom) | user behavior: render, click, check what the user sees           | `*.test.tsx` next to the code |
| E2E                   | Playwright + axe                 | real browser only: 3D flips, YouTube iframe, mobile layout, a11y | `e2e/*.spec.ts`               |

- The extension picks the environment: `*.test.ts` runs in node, `*.test.tsx` in jsdom. jsdom has no layout, CSS animations, `matchMedia`, `IntersectionObserver` or `scrollIntoView`: geometry and 3D are e2e. How to test around it: the **testing** skill.
- Query by role and accessible name (`getByRole('button', { name: 'Играть' })`), interact via `userEvent`.
- When routing lands, add a `renderApp(path)` helper in `src/test/` that renders the app in a memory router, for flows across pages.
- Reset Zustand stores in `beforeEach` (`store.setState(initialState, true)`).
- Every new component gets a Testing Library test; e2e only for what jsdom cannot check.

## Design rules

- **Designs come from the user**, component by component (prepared in a separate Claude Code session). Port the given markup, styles and sizes as is; do not invent a new style. Nothing design-related is stored in the repo.
- **Magazine:**
  - always open, no cover; spread `aspect-ratio: 3/2` with `container-type: inline-size`, **all sizes inside pages in `cqw`** so the magazine scales as a whole;
  - sheets are `.leaf` elements rotating with `rotateY` around the left edge (`transform-origin: left center`, `backface-visibility: hidden`, 0.9s); the flipping sheet gets z = 100 during the animation;
  - genre stickers stick out on the right from under the pages, the active one sticks out further; the yellow "Случайно" sticker opens a random band and plays its track;
  - every section opens with a spread: genre cover on the left, band list on the right; bands inside a section are ordered by founding year;
  - band spread: photo on the left (full-page poster, or a square cover "sleeve" over a blurred backdrop), article on the right: genre, name in the band font, lead, 3 big stats, dossier, 2 polaroids, "Слушать" button and favorite tracks;
  - photos use the duotone filter (`.duo`: image `grayscale + multiply`, `::after` dark color with `lighten`, halftone `::before`);
  - aged paper: `.aged`, `.coffee`, `.dogear`, staples `.staple`; the `.corner` page curls must not cover content (page numbers sit at the top).
- Fonts: none are loaded yet. The first component that uses one adds a single Google Fonts `<link>` to `index.html` (Anton, Oswald, Caveat, PT Sans, PT Mono, Permanent Marker, Special Elite; only the weights in use). Band fonts (Black Ops One, Cinzel, Cinzel Decorative, Michroma, Rubik Wet Paint, Archivo Black) are added with the magazine.
- Accessibility: real `<button>`/`<a>`, `aria-label` on icon buttons, 4.5:1 contrast, hit areas ≥ 44px, honor `prefers-reduced-motion`. The axe e2e check must stay green.
- Mobile is mandatory: check with the Playwright `mobile` project.
- Performance: every `<img>` has `width`/`height` (no layout shift) and `loading="lazy"` unless it is on the first screen; band photos are WebP; Google Fonts load with `preconnect` and `display=swap`, and only the families and weights the design uses.

## YouTube player constraints

How to build the player within these rules (StrictMode, states, errors, Referer): the **youtube-player** skill.

- Only the official YouTube IFrame Player API. No unofficial YouTube Music APIs, no cookies.
- The video **must stay visible**, at least 200×200. Audio-only playback is against YouTube's terms.
- One player instance in `SiteTemplate`. On Home it sits in the «смотрим клип» block; on other tabs the same element becomes a floating window via CSS. Never unmount it, or the music stops (cover it with an integration test asserting the player is the same DOM node after navigation).
- Browsers block sound without a user gesture: first play only via the ▶ button.
- Skip videos with `embeddable: false`; on player errors 101/150 go to the next track.

## Content pipeline (planned: `scripts/sync-music.ts`, run as `pnpm sync:music`)

The site only reads `src/content/*.json`. The script runs manually or on a GitHub Actions schedule, caches every stage and skips what is already done.

1. ⏳ **Playlist** → `.cache/playlist.json`: video id, artist, title, embeddable.
2. ⏳ **Facts**: MusicBrainz (origin, years, members with instruments, albums, label; **1 request/second**, User-Agent required) + TheAudioDB (photos, genre; key `123`, up to 30 requests/minute) → `.cache/artists/<slug>.json`.
3. ⏳ **Photos**: download and compress to WebP (main ~800px, polaroids ~300px) → `public/img/bands/<slug>/`. If `public/img/override/<slug>/` exists, use it instead.
4. ⏳ **Copy**: Claude Code processes batches of 20–30 bands: lead ≤ 180 chars, 3 stats **only from collected facts**, member roles (≤ 5). Flag doubtful matches for manual review.
5. ⏳ **Build** `src/content/bands.json`, `tracks.json`; new bands get a section from tags, unclear cases are decided manually.

Never: scrape Pinterest, store YouTube cookies, invent facts, copy Wikipedia text (CC BY-SA: facts only, own wording). The MusicBrainz User-Agent names the app and the repository URL as contact, never a personal email without asking. Credit sources in the footer: «данные: MusicBrainz, TheAudioDB, Википедия». Rules and setup: the **content-pipeline** skill.

## MVP plan

One component at a time; after each, verify (`pnpm check`, `pnpm test:e2e`) and take a Playwright screenshot to compare with the design.

- [x] Empty project: tooling, strict TS, ESLint, tests (Vitest + RTL, Playwright + axe), CI
- [ ] Layout: header with flag and sticker tabs, garland, routes `/`, `/cv`, `/games`
- [ ] Content: JSON + Zod schemas, player store
- [ ] `Magazine`: spread, page flips, sections and stickers, "Случайно", duotone photos, typographic fallback poster when there is no photo
- [ ] `IPod`: screen (cover, track, album, year, progress), click wheel (MENU, ⏮, ⏭, ▶❚❚, center), scrollable playlist in menu
- [ ] `YouTubePlayer` wired to the store; `VideoFrame` on Home, floating window on other tabs
- [ ] `RockChart`: top 6, linked to the player
- [ ] Deploy to Vercel
- [ ] Content pipeline stages 2–5
- [ ] CV tab (same look: paper, tape, cut-out letters)
- [ ] Games tab (CD cases, js-dos for shareware, own mini games)

**Done when:** the magazine flips with mouse and touch; the track keeps playing across tabs; Lighthouse accessibility ≥ 90; all checks are green.
