# portfolio

Personal portfolio site of Nikita Shcherbakov for recruiters (CV plus interactive features), styled as a 2000s rock bedroom: Union Jack header, fairy lights, a rock magazine with 3D page flips, an iPod-style player with free tracks served from the project's own storage, a chart. Tabs: Home (`/`), CV (`/cv`), Games (`/games`).

Talk to the user in Russian. Code, comments and commit messages stay in English. UI copy is written in Russian (the default language) and translated into English and Ukrainian (the **i18n** skill).

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

**The project started empty.** Features are built step by step from designs the user sends. Chosen so far: `react-router` 8 for tabs, `i18next` + `react-i18next` for the ru/en/uk UI (`src/i18n/`), Zustand for the player state (`createSelectors` in `src/utils/`), Zod for content validation (`src/content/schemas.ts`), `cn()` (`clsx` + `tailwind-merge` in `src/lib/utils.ts`), `@tanstack/react-virtual` for the playlist. Propose any new one when the feature needs it and install it only after the user agrees (`pnpm add` asks for permission); never a second library for a capability already chosen.

### Does not exist — never reference

This repo started from a team template whose habits do not apply here:

| Never write                                                                                 | Use instead                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `useApiClient`, axios, `@/services/open-api/*`, `extractErrorMessage`, TanStack Query       | nothing: no backend; data is `src/content/*.json`                 |
| `TextField`, `CustomCheckbox`, `ButtonLoading`, `@/modules/common/components` form controls | plain elements styled with Tailwind; there are no forms yet       |
| react-hook-form, a shadcn `<Form>`, `scrollToError`, validation-message constants           | not installed; Zod is only for content validation                 |
| `sonner`, `toast`                                                                           | not installed                                                     |
| `lucide-react`, `@/assets/icons/*.svg?react`                                                | not installed (no svgr); inline SVG from the design, or `<img>`   |
| `react-router-dom`, `<BrowserRouter>`                                                       | `react-router` (v8), routes in `src/router/`                      |
| `export enum Routes`, any `enum`                                                            | an `as const` object (`erasableSyntaxOnly`; ESLint blocks `enum`) |
| `AuthGuardTemplate`, `CanAccessTemplate`, roles                                             | no auth                                                           |
| `interface` for props                                                                       | `type ComponentNameProps`                                         |
| `design/reference.dc.html`, `openspec/AGENTS.md`                                            | removed: designs come from the user in the chat                   |

Knip runs in `pnpm check` and CI: unused files, exports and dependencies fail the build, so delete what is no longer used.

## Commands

```bash
pnpm dev             # http://localhost:5173
pnpm check           # format + lint + typecheck + knip + test + build: run before saying "done"
pnpm lint            # ESLint, zero warnings (pnpm lint:fix to autofix)
pnpm typecheck       # tsc -b: src, root configs + e2e + scripts, worker
pnpm knip            # unused files, exports, dependencies
pnpm test:watch      # Vitest in watch mode
pnpm test:coverage
pnpm test:e2e        # Playwright, desktop + mobile (first time: pnpm exec playwright install chromium)
pnpm format          # Prettier, whole repo: only when the tree holds nothing but this task's changes
pnpm sync:music      # music/ → MusicBrainz → covers → R2 → tracks.json (writes to R2: only when asked)
pnpm worker:types    # regenerate worker/worker-configuration.d.ts after a wrangler.jsonc change
pnpm worker:deploy   # deploy the audio Worker (production: only when asked)
```

## Verification and done

- Before saying "done", run `pnpm check` (the **check** skill); for anything visible in a browser also `pnpm test:e2e`, and the `qa` subagent with a screenshot when the `playwright` MCP server is configured (otherwise say that the visual check is still open). Never claim tests pass without running them in this session.
- Zero ESLint warnings, not just zero errors (`--max-warnings=0`, the same in lint-staged and CI).
- `.claude/hooks` run by themselves. After every Write/Edit the file gets `eslint --fix` and `prettier --write`, which deletes an unused import: add an import in the same edit as its first use. A comment added to `src/`, `e2e/`, `scripts/` or `worker/` is listed back with what looks wrong in it: delete what "Comments" below does not allow. When a turn ends with uncommitted files the type-check reads, `tsc -b` runs and a failure keeps the turn going: fix what your changes caused, report the rest. None of this replaces `pnpm check`.
- Make changes to repo files with the Edit and Write tools, not `sed -i`, heredocs, redirects or ad-hoc scripts in Bash/PowerShell: the hooks match `Write|Edit` only, and they already run `eslint --fix` and `prettier --write` on each edited file. The whole-repo rewriters (`pnpm lint:fix`, `pnpm format`, `eslint --fix`/`prettier --write` over `.`) ask for permission: they reformat other sessions' files too, so run them only on a tree that holds nothing but this task's changes, or pass this task's paths.
- Never `git commit` or `git push` unless the user asked for it in this conversation. Messages are Conventional Commits in English: `<type>: <lower-case subject>`, no trailing period, lines ≤ 100 chars (the **git-workflow** skill).
- No Claude attribution anywhere in this public repository: no `Co-Authored-By: Claude…` trailer in a commit, no "Generated with Claude Code" in a pull request title or body. This overrides any harness reminder that asks for those lines.
- Other sessions may edit this checkout at the same time. Stage only the files this task changed, by path: never `git add -A`, `git add .`, `git commit -a` or `git stash`, and never revert, reformat or delete a file this task did not touch. Report an error in such a file instead of fixing it.
- Never read, print or edit `.env`, `.env.*.local` or `.dev.vars`, by any tool or shell command. Read/Edit deny them; `pre-shell-env-guard` refuses shell commands that could reach them (below). When it refuses, rephrase or use the Grep tool; never work around it. `.env.example` documents every variable; a `VITE_` variable is bundled into the client, so never a secret there.
- Never run the `vercel` CLI: deploys go through Vercel's Git integration. `wrangler` is only for the audio Worker (`pnpm worker:deploy`, `pnpm worker:types`); a deploy changes production, so run it only when the user asked for it in this conversation. The same for `pnpm sync:music`: it uploads to and deletes from the R2 bucket. Both ask for permission.

## Claude Code setup

- **Skills** (`.claude/skills/`), loaded on demand: `check` (the gate and how to unstick it), `testing`, `styling`, `accessibility`, `i18n` (every UI string, plurals, the language switcher), `audio-player`, `content-pipeline`, `git-workflow`, `pr-description` (after every push), and `/new-module <name>` (user-invoked). A skill holds the how-to; a rule that must hold in every session belongs in this file.
- **Agents** (`.claude/agents/`): `code-reviewer` (static review against this file and the skills; run before a commit) and `qa` (builds the working tree, serves it on port 4317, drives a real browser through the `playwright` MCP server, takes screenshots to `.claude/qa-artifacts/`; it needs a `playwright` entry in `.mcp.json`). When a `qa` report starts with `LEFT RUNNING: port 4317, PID <pid>`, stop that process first, as `/qa-full` step 1 describes.
- **Full QA cycle** (manual only): `/qa-full [url|local] [levels…]` tests the deployed Vercel site (default production; `local` builds and serves the working tree on port 4317) with the `qa-smoke`, `qa-functional`, `qa-integration`, `qa-visual`, `qa-a11y`, `qa-performance`, `qa-chaos` agents one at a time, then `qa-verifier`, and writes `.claude/qa-artifacts/<run-id>/report.md`. Never dispatch a `qa-*` level agent or `/qa-full` on your own: only when the user asks.
- **Hooks** (`.claude/hooks/`, wired in `.claude/settings.json`):
  - `pre-shell-env-guard` (Bash, PowerShell, Monitor): a best-effort net over the command text, not a sandbox. It refuses a command that names, globs or 8.3-short-names (`ENV~1.LOC`) a secrets file, even in an `echo` or a commit message; one that builds text from escapes, char codes or base64; and a recursive content search over the repo root, `worker/` or a folder above the repo (one limited to `src/`, `e2e/`, `scripts/` and similar passes).
  - `pre-curl-allow` (Bash): auto-approves a read-only `curl` to the site, the `localhost` QA ports and the audio Worker, so background `qa-*` agents run without prompts; anything else still asks.
  - `post-edit-format`, `post-edit-comments` (Write, Edit) and `pre-stop-typecheck` (Stop), described under "Verification and done".
- Personal overrides go into `.claude/settings.local.json` (ignored by `.claude/.gitignore`).

## Project structure

```bash
src/
├── main.tsx          # entry: renders <App /> + global styles
├── app/              # App root, providers
├── router/           # `routes` paths (as const) + route objects + browser router
├── pages/            # route-level components, thin wrappers (flat: cv-page.tsx, ...)
├── modules/          # feature modules: common (layout, header, switchers), player; later magazine, chart, ...
├── content/          # *.json + Zod schemas; the only data source
├── i18n/             # i18next setup, languages, locales/{ru,en,uk}.json
├── lib/utils.ts      # cn()
├── utils/            # app-wide helpers (createSelectors, storage, clamp)
├── styles/           # Tailwind entry, theme tokens, shared scrapbook classes
└── test/             # Vitest setup and helpers
e2e/                  # Playwright specs
scripts/              # music pipeline; Node 24 runs .ts directly (type stripping, erasable syntax only)
worker/               # Cloudflare Worker that serves audio from the private R2 bucket
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

- All public pages are children of one layout route, `SiteTemplate` in `src/modules/common/`, that mounts the header, the footer and the audio player once (the garland and the iPod dock join it when built), so music never stops on tab change.
- `scripts/` is covered by `tsconfig.node.json` and ESLint's Node block (`console.info` allowed there); `worker/` has its own `tsconfig.json` with types generated by `pnpm worker:types` (`worker/worker-configuration.d.ts`, ignored by ESLint and Prettier). Script tests, when tests resume, need `scripts/**/*.test.ts` in the Vitest `unit` project.
- Route paths live in one `as const` object, `routes` in `src/router/routes.ts` (`routes.Home`, ...); never a path literal elsewhere.

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

- Tailwind utilities; project tokens and shared classes go into a stylesheet imported by `src/styles/index.css`. Conditional classes via `cn()` (`src/lib/utils.ts`). Details: the **styling** skill.
- No CSS modules or styled-components. Inline `style` only for values computed at runtime (band theme colors, animation delays).
- **Player exception:** `src/modules/player/styles/player.css` is the design's stylesheet, kept as delivered (never sort, dedupe or rewrite it into Tailwind: rule order is the result). `player-compat.css` before it is unlayered and reverts only what Tailwind preflight sets inside `.player-deck`/`.ipod-dock` (never `all: revert`: on every element it made style recalculation about 4× slower), so a Tailwind utility there would apply and fight the design: inside the player use the design's classes and the design's inline `style` positions, not utilities. Fixes to the design's CSS (hit areas, disabled states, breakpoints it was not checked at) go into `player-overrides.css`, imported after `player.css`. The design's phone breakpoint is inclusive: use the `phone:` variant, not `max-[640px]:`. The design handoff lives in `.design/player/` (ignored by git, ESLint and Prettier).
- Band colors are not tokens: they come from `bands.json → theme`.
- shadcn/ui primitives are added on demand and only where they fit the look (Dialog, Tooltip); ask before the first one. Its `init` expects the `@/*` alias in the root `tsconfig.json` (today only `tsconfig.app.json` has it) and writes its own theme into `src/styles/index.css`, which must not replace the project's tokens; its components import `lucide-react`, which is not installed. Never restyle the design into shadcn defaults.

### Errors

- Fail loudly: throw specific errors with clear messages. No silent fallbacks that hide a broken main flow.
- `async/await` instead of `.then()` chains.

### Comments

The default is none: a comment is a claim no tool checks, and it goes stale silently. Write one only where a rule requires it (the `-- <why>` of an `eslint-disable`, the reason of a `@ts-expect-error` or of a deliberately silent `catch`), where the user asks for it, or where the code alone would lead the next reader to a wrong "fix": a browser or library quirk (media autoplay policy, 3D transforms in Safari), a workaround, a value whose source is nowhere in the code. Such a comment says **why**, in one or two English lines, without "we" or "I", and states only what was verified in this session; if unsure, write none.

Never in a comment: what the code already says, history or the task ("now", "fixed", "as requested": that is the commit message's job), a pointer to other code ("see X"), commented-out code, an unasked `TODO`. An edit that makes a comment wrong fixes or deletes it in the same edit.

### Scope

Change only what the task needs. Read related code before editing. No drive-by refactors.

## Testing

| Level                 | Tool                             | What to test                                                     | Where                         |
| --------------------- | -------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Unit                  | Vitest (node)                    | stores, content, utils, scripts: pure logic                      | `*.test.ts` next to the code  |
| Component/integration | Vitest + Testing Library (jsdom) | user behavior: render, click, check what the user sees           | `*.test.tsx` next to the code |
| E2E                   | Playwright + axe                 | real browser only: 3D flips, audio playback, mobile layout, a11y | `e2e/*.spec.ts`               |

- The extension picks the environment: `*.test.ts` runs in node, `*.test.tsx` in jsdom. jsdom has no layout, CSS animations, `matchMedia`, `IntersectionObserver` or `scrollIntoView`: geometry and 3D are e2e. How to test around it: the **testing** skill.
- Query by role and accessible name (`getByRole('button', { name: 'Играть' })`), interact via `userEvent`.
- Add a `renderApp(path)` helper in `src/test/` (memory router over the route objects in `src/router/`) with the first test that needs flows across pages; it does not exist yet.
- Reset Zustand stores in `beforeEach` (`store.setState(initialState, true)`).
- When tests are not paused (below), every new component gets a Testing Library test; e2e only for what jsdom cannot check.
- **Paused since 2026-11-09, until the user lifts it:** write no new tests (`*.test.ts(x)`, e2e specs), and do not flag a missing one in review. The existing unit tests and `e2e/*.spec.ts` still run in `pnpm check` / `pnpm test:e2e`: keep them green, delete none without asking. `src/test/setup.ts`, `src/test/stub-match-media.ts` and `@testing-library/user-event` (ignored in `knip.json`) stay for when tests return.

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
- Fonts: one Google Fonts `<link>` in `index.html`, only the families and weights in use; extend that link, never add a second. Loaded now: Caveat 700, Michroma, Oswald 600/700, PT Mono, PT Serif 700, Rubik Mono One, Russo One (player and cut-out headings). Still to come when used: PT Sans 400/700 (the iPod dock), Anton, Permanent Marker, Special Elite; band fonts (Black Ops One, Cinzel, Cinzel Decorative, Rubik Wet Paint, Archivo Black) with the magazine.
- All UI text, including aria-labels and the deck's English engravings, lives in `src/i18n/locales/{ru,en,uk}.json`; plurals use i18next `_one/_few/_many/_other` keys (every locale keeps all four so the key-parity type check holds). How: the **i18n** skill.
- Accessibility: real `<button>`/`<a>`, `aria-label` on icon buttons, 4.5:1 contrast, hit areas ≥ 44px, honor `prefers-reduced-motion`. The axe e2e check must stay green.
- Mobile is mandatory: check with the Playwright `mobile` project.
- Performance: every `<img>` has `width`/`height` (no layout shift) and `loading="lazy"` unless it is on the first screen; covers are never drawn much smaller than their natural size in a long list (the playlist); Google Fonts load with `preconnect` and `display=swap`, and only the families and weights the design uses.

## Audio player constraints

Final decision of the user, not to be reopened: music is free tracks the user downloads, played by an HTML `<audio>` element from the project's Cloudflare R2 bucket. No YouTube, no streaming services, no previews. How to build it (StrictMode, events, errors, preloading, tests): the **audio-player** skill.

- One `<audio>` element, created once outside React's render (appended to `body`) and wired up by `SiteTemplate`; never unmount or re-create it on navigation, or the music stops (cover it with an integration test asserting the same DOM node after navigation).
- Browsers block sound without a user gesture: the first `play()` runs inside the ▶ click handler; handle its rejected promise.
- The deck, the iPod dock and the chart are the controls; time, duration and buffering come from the element's events, not from a simulated clock.
- A track that fails to load (`error` event) is reported and skipped; stop after one full cycle of failures instead of looping.
- Listen-only: the R2 bucket `portfolio-music` is private (no `r2.dev`, no custom domain). The `portfolio-audio` Worker (`worker/`, deployed with `pnpm worker:deploy`) is the only way in: it serves `GET`/`HEAD /audio/<id>.<hash8>.mp3` only to requests whose `Origin` is in `ALLOWED_ORIGINS` (`worker/wrangler.jsonc`: production, `localhost:5173/4173/4317`), with CORS for that origin and range requests (`206`, seeking). A typed URL or a download link sends no `Origin` and gets `403`. So the element needs `crossOrigin="anonymous"`, which makes it send `Origin`. A new site origin (custom domain, a Vercel preview) is added to `ALLOWED_ORIGINS` and redeployed. After a change to `wrangler.jsonc`, run `pnpm worker:types`.

## Music pipeline (`scripts/sync-music.ts`, run as `pnpm sync:music`)

The site only reads `src/content/*.json`. Audio lives in R2, never in git. The script caches every MusicBrainz response and cover lookup in `.cache/` (gitignored), so a rerun only asks about new tracks; `pnpm sync:music --force` drops that cache.

**Fully automatic**: the user's only steps are dropping mp3 files into `music/` and running `pnpm sync:music`. Every match, choice and fallback is decided by the script with fixed rules and listed in the run report; nothing waits for a manual review.

**Images come only through APIs, as URLs**: never downloaded, converted, uploaded to R2 or committed (no WebP step, no `public/img/`, no cover from the mp3 tags).

Now (for the player):

1. ✅ **Files**: the user drops mp3 files into `music/` (gitignored); the script reads their tags (title, artist, album, year) and the decoded duration; `Artist - Title.mp3` when the tags lack them.
2. ✅ **Artist and original album**: MusicBrainz finds the artist MBID through a recording search (normalized artist and title match), then walks the artist's own release groups oldest first (`Album` without `Compilation`/`Live`/`Soundtrack`/`Remix`/`Demo`…, then `Single`/`EP`) and takes the first whose earliest official release lists the song (normalized title, length within ±5 s). Search results list only a few releases per recording, so they cannot be trusted to contain the original album. **1 request/second**, User-Agent required. No match → the tag data stays, flagged in the report.
3. ✅ **Album cover** of that exact release group, never a band photo: Cover Art Archive `release-group/<mbid>/front-500` (`front-250` for small sizes), stored as the `archive.org/download/…` URL its redirect points to: one network hop less on every first load, and the JSON index on archive.org is never needed → else the front of the earliest official release in the group → else the TheAudioDB album thumbnail found by release group MBID → else the UI placeholder.
4. ✅ **Upload** new or changed audio to R2 (S3 API, keys `audio/<id>.<hash8>.mp3`, `immutable` caching) and delete objects of removed tracks.
5. ✅ **Build** `src/content/tracks.json` (`id`, `title`, `artist`, `album`, `year`, `durationSec`, `audioUrl`, `coverUrl`, `coverThumbUrl`), validated with Zod; `audioUrl` is the Worker URL (`audioBaseUrl` in `scripts/sync-music/config.ts`).

Later (with the magazine): band facts looked up by the artist MBID from stage 2 (never by name, so there is nothing to disambiguate) from MusicBrainz (origin, years, members with instruments, albums, label) + TheAudioDB (genre, band photo URLs: main ~800px and polaroids ~300px, the closest size the API offers; key `123`, up to 30 requests/minute) + Wikipedia; Russian copy written by Claude Code in its own words only from collected facts (lead ≤ 180 chars, 3 stats, ≤ 5 members); `bands.json`; the section is chosen automatically from genre tags, with a default section when none fits.

Never: invent facts, scrape Pinterest, commit audio, store or re-host covers and photos. The MusicBrainz User-Agent names the app and the repository URL as contact, never a personal email without asking. Secrets (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) live in `.env.local`, without the `VITE_` prefix. Rules and setup: the **content-pipeline** skill.

## MVP plan

One component at a time; after each, verify (`pnpm check`, `pnpm test:e2e`) and take a Playwright screenshot to compare with the design.

- [x] Empty project: tooling, strict TS, ESLint, tests (Vitest + RTL, Playwright + axe), CI
- [x] Layout: `SiteTemplate` with header, sticker tabs, footer with contacts, language and theme switchers, routes `/`, `/cv`, `/games` and a 404 page
- [ ] Header decoration: Union Jack flag and fairy-light garland
- [x] Content: `tracks.json` + Zod schema, player store (`src/modules/player/stores/player-store.ts`)
- [x] `StereoDeck` (STEREO 2000 deck on Home, design in `.design/player/`): screen, transport, volume, TIME, disc, MAGAZINE unit (⏏ disabled until the magazine exists), virtualized playlist with search; album covers from `coverUrl`/`coverThumbUrl` with the initials placeholder as fallback
- [ ] `Magazine`: spread, page flips, sections and stickers, "Случайно", duotone photos, typographic fallback poster when there is no photo
- [x] `AudioPlayer`: one `<audio>` (`utils/audio-element.ts`, appended to `body` once) mounted by `SiteTemplate`; the store calls it inside the click handlers and its events (`timeupdate`, `waiting`/`playing`, `play`/`pause` from outside the deck such as unplugged headphones or OS media keys, `ended`, `error`) drive the store; Media Session metadata, `playbackState` and handlers. Still to come: the iPod dock (`.ipod-dock`, SPEC §5) on other tabs, preloading the next track
- [x] Music pipeline stages 1–5, fully automatic: `music/` → MusicBrainz original album → its cover URL → R2 → `tracks.json`
- [ ] `RockChart`: top 6, linked to the player
- [x] Deploy to Vercel: production `https://rockfolio-dev.vercel.app` is built from `main` by the Git integration
- [ ] Band facts, band photo URLs, magazine copy and `bands.json` (together with the magazine)
- [ ] CV tab (same look: paper, tape, cut-out letters)
- [ ] Games tab (CD cases, js-dos for shareware, own mini games)

**Done when:** the magazine flips with mouse and touch; the track keeps playing across tabs; Lighthouse accessibility ≥ 90; all checks are green.
