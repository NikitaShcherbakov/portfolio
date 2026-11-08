---
name: content-pipeline
description: >-
  How Rock Wall's band content is collected and written — the `scripts/` stages from the YouTube playlist to
  `src/content/*.json`, the rules for MusicBrainz (1 request per second, an identifying User-Agent),
  TheAudioDB and Wikipedia, per-stage caching in `.cache/`, matching artists without guessing, writing the
  Russian copy only from collected facts, and the one-time setup the first script needs so lint, typecheck
  and Knip accept it. Use when creating or changing anything in `scripts/`, `src/content/`, `.cache/` or
  `public/img/bands/`, or when writing band leads, stats or dossiers.
when_to_use: >-
  Also for "sync music", "playlist", "musicbrainz", "theaudiodb", "wikipedia", "band facts", "band copy",
  "lead", "stats", "dossier", "bands.json", "tracks.json", "photos", "webp", "контент", "группы",
  "описание группы".
---

# Content pipeline

CLAUDE.md "Content pipeline" lists the five stages; this is how to build and run them.

## 1. Before the first script

`scripts/` is not wired into the tooling yet. In the same change as the first script (each is a config
change: say so to the user):

1. `tsconfig.node.json` → add `"scripts"` to `include`, or `pnpm typecheck` ignores the scripts and ESLint
   fails with "was not found by the project service"; and `"allowImportingTsExtensions": true` (allowed as
   the config has `noEmit`), because Node needs `./x.ts` in relative imports and tsc otherwise rejects them
   with TS5097.
2. `eslint.config.js` → add `scripts/**/*.ts` to the Node block (`files: ['*.{js,ts}', 'e2e/**/*.ts']`) for
   Node globals, and allow `console.log`/`console.info` for `scripts/**` only: the base rule permits just
   `warn` and `error`, and a CLI needs progress output. Add `scripts/**/*.test.ts` to the Vitest block
   (`files: ['src/**/*.test.{ts,tsx}']`) too.
3. `package.json` → `"sync:music": "node --env-file-if-exists=.env.local scripts/sync-music.ts"` (the
   entry CLAUDE.md plans; stages run in order and skip what is cached, a `--stage <name>` flag runs one),
   so Knip sees the entry and the user has one command. Node 24 runs `.ts` directly (type stripping is on by
   default; no flag needed), so only erasable syntax works: no `enum`, `namespace` or parameter properties,
   which `erasableSyntaxOnly` already enforces.
4. `vite.config.ts` → add `scripts/**/*.test.ts` to the `unit` project's `include` (today only
   `src/**/*.test.ts`), or the script tests never run. Pure logic (parsing, matching, slugging, validation)
   goes into functions with `*.test.ts` next to them; the network shell stays thin.
5. Zod schemas in `src/content/` are read by both Vite (bundler resolution, no `.ts` extensions) and Node
   (no bundler, `.ts` extensions required). Keep each schema file free of relative and `@/` imports: it
   imports only `zod`, so both resolve it.

## 2. Stage rules

- **YouTube playlist (stage 1)** uses the YouTube Data API v3 (`playlistItems.list`, then `videos.list`
  with `part=status` for `embeddable`). Its key is a secret: `YOUTUBE_API_KEY` without the `VITE_` prefix
  (never bundled), in `.env.local` locally and a repository secret in Actions, documented in `.env.example`
  without a value. Never read or print `.env.local` (CLAUDE.md); ask the user to put the key there.

- **Cache every stage** in `.cache/` (gitignored) and skip what is cached; `--force` (or deleting the file)
  refetches. A run that dies halfway resumes where it stopped.
- **MusicBrainz** (`https://musicbrainz.org/ws/2/…?fmt=json`): at most **1 request per second** (a request
  queue, not `Promise.all`), and a User-Agent that names the app and a contact, e.g.
  `RockWall/0.1.0 ( https://github.com/<owner>/rock-wall )`. Use the repository URL as the contact; never
  put the user's email into the User-Agent without asking. On `503` back off and retry later.
- **TheAudioDB** (`https://www.theaudiodb.com/api/v1/json/123/…`): the free key `123`, up to 30 requests per
  minute.
- **Wikipedia**: a source of facts only. Its text is CC BY-SA: never copy sentences into the copy; write
  your own from the facts, and keep the credit «данные: MusicBrainz, TheAudioDB, Википедия» in the footer.
- **Matching**: identify an artist by MBID once matched, never by name alone. Several candidates with the
  same name, a low search score or a genre that does not fit the playlist → put it on the review list
  (`.cache/review.json`) for the user; do not pick one.
- **Photos**: download only from the sources above, convert to WebP (main ~800px, polaroids ~300px) into
  `public/img/bands/<slug>/`; `public/img/override/<slug>/` wins when present. Image conversion needs a new
  dependency (e.g. `sharp`): propose it. Never scrape Pinterest or other sites.
- **Validation**: the build stage parses its output with the Zod schemas in `src/content/` before writing;
  invalid data fails the run with the band's slug and the field, it is never silently dropped.
- **Scheduled runs**: a GitHub Actions schedule runs stages 1–3 and 5 only, never stage 4 (Claude Code
  writes the copy), in its own workflow file, not `ci.yml` (which has `contents: read`). It opens a pull
  request with the new data instead of pushing to `main`, never overwrites copy the user approved, and
  leaves new bands without copy on the review list.

## 3. Writing the copy (stage 4)

Claude Code writes it, in batches of 20–30 bands:

- Russian, in the magazine's voice; the lead ≤ 180 characters (the Zod limit protects the layout).
- The 3 big stats and every dossier line come **only** from `.cache/artists/<slug>.json`. A fact that is
  not there does not exist: leave the field out rather than fill it from memory.
- Member roles: at most 5 members, roles from the collected instruments.
- A doubtful match, contradicting sources or too few facts for a spread → the review list, not a guess.
- After a batch, report what was written and what went to review.

## Must not

- Must not invent or "remember" a fact, year, stat, member or quote.
- Must not exceed the rate limits, run requests in parallel against MusicBrainz, or send an anonymous or
  personal-email User-Agent.
- Must not copy Wikipedia text, scrape Pinterest, or store YouTube cookies.
- Must not commit `.cache/`, or write `src/content/*.json` that fails its Zod schema.
- Must not add a dependency (`sharp`, a Wikipedia client) without the user agreeing.
