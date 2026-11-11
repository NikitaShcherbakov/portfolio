---
name: content-pipeline
description: >-
  How the portfolio's music and band data get onto the site — free mp3 tracks dropped into `music/`,
  `pnpm sync:music` reading their tags, matching each track in MusicBrainz to the album it was originally
  released on, taking that album's cover from Cover Art Archive as a URL, uploading audio to Cloudflare R2
  through the S3 API and writing `src/content/tracks.json`; the MusicBrainz rate limit and User-Agent,
  per-stage caching in `.cache/`, matching without guessing, the R2 secrets, Zod validation, and the
  one-time setup the first script needs so lint, typecheck and Knip accept it. Later also band facts and
  copy for the magazine. Use when creating or changing anything in `scripts/`, `src/content/`, `music/`,
  `.cache/` or the R2 bucket, or when writing band leads, stats or dossiers.
when_to_use: >-
  Also for "sync music", "upload tracks", "r2", "cloudflare", "bucket", "s3", "id3", "tags", "musicbrainz",
  "cover art archive", "album cover", "theaudiodb", "wikipedia", "band facts", "lead", "stats", "dossier",
  "tracks.json", "bands.json", "add a track", "контент", "музыка", "добавить трек", "обложка", "группы".
---

# Music pipeline

CLAUDE.md "Music pipeline" is the plan; this is how to build and run it. Do not raise licensing or
attribution: the user decided it, and it is not part of the pipeline.

Two user requirements shape every stage:

- **No manual steps** beyond dropping mp3 files into `music/` and running `pnpm sync:music`. Every choice
  is made by a fixed, deterministic rule and written to the run report; never stop for a review, never ask
  the user to pick a match, supply an image or fix data by hand.
- **Images only through APIs, as URLs.** Never download, convert, upload to R2 or commit an image.

## 1. Layout and tooling

- `scripts/sync-music.ts` is the entry; stages live in `scripts/sync-music/`: `files.ts` (tags, duration,
  hash, ids), `musicbrainz.ts` (artist and original album), `covers.ts`, `r2.ts` (upload and delete),
  `report.ts`, `http.ts` (retries on 429/5xx), `json-file.ts`, `normalize.ts`, `config.ts` (paths,
  User-Agent, `audioBaseUrl` = the deployed Worker URL).
- Wired in: `tsconfig.node.json` includes `scripts` (`allowImportingTsExtensions`, so relative imports
  carry `.ts` as Node needs); ESLint Node block with `console.info` allowed for `scripts/**`;
  `pnpm sync:music` = `node --env-file-if-exists=.env.local scripts/sync-music.ts`, `--force` drops the
  cache. Node runs `.ts` by type stripping: erasable syntax only.
- `src/content/schemas.ts` is imported by both Vite and Node, so it imports only `zod/mini`: no relative
  or `@/` imports in it.
- Dev dependencies: `music-metadata` (tags, duration), `@aws-sdk/client-s3` (R2 speaks S3), `wrangler`
  (the Worker).
- When tests resume: add `scripts/**/*.test.ts` to the Vitest `unit` project and the Vitest ESLint block;
  the pure parts (normalizing, slugging, picking the original release group, building a track) are the
  ones to cover.

## 2. Stages

- **Files (1)**: `music/**/*.mp3`. Read title, artist, album and year from the tags; duration from the
  decoded file, not the tag. When the tags lack title or artist, parse `Artist - Title` from the file name;
  only when that fails too, fail the run with the path. Track id: kebab-case slug of `artist-title`
  (`track-<hash8>` when the name has no Latin letters or digits); a collision gets a numeric suffix and a
  report line.
- **Artist and original album (2)**: MusicBrainz (`https://musicbrainz.org/ws/2/…?fmt=json`), at most
  **1 request per second** (sequential, never `Promise.all`), User-Agent
  `Portfolio/0.1.0 ( https://github.com/NikitaShcherbakov/portfolio )`; never the user's email. Every
  response is cached in `.cache/musicbrainz/` by URL. Steps:
  1. recording search by title and artist → the artist MBID most often credited on results whose artist
     matches (normalized: case, accents, `the`, `&`/`and`);
  2. the artist's release groups (`type=album|ep|single`, all pages), without `Compilation`, `Live`,
     `Soundtrack`, `Remix`, `DJ-mix`, `Mixtape/Street`, `Demo`, `Interview`, `Spokenword`,
     `Audiobook`; albums by `first-release-date`, then singles and EPs;
  3. for each in that order, the earliest official release's tracklist: the first one that has the song
     (normalized title without `(Remastered …)`-like suffixes, recording length within ±5 s or unknown) is
     the original album.
     Do not pick the album from recording search results: the search index lists only a few releases per
     recording, so the original album is often missing there. The artist name shown is the MusicBrainz
     artist's, not the credit on that release (an earlier band name stays out). No match → tag data,
     flagged in the report; a track that ends up without album or year fails the run with its path.
- **Album cover (3)**, always of that exact release group, never a band photo or another album's cover:
  1. Cover Art Archive `release-group/<mbid>/front-250` and `…/front-500` answer with a redirect: store
     the `Location` (`archive.org/download/…_thumb250.jpg` / `_thumb500.jpg`), not the CAA URL. The browser
     then skips one hop, which neither side lets it cache. Read the redirect only: the JSON index lives on
     archive.org and fails with 500 at times;
  2. else the same for the earliest official release in the group whose `cover-art-archive.front` is true
     (`coverartarchive.org/release/<mbid>/front-500` / `front-250`);
  3. else TheAudioDB `album-mb.php?i=<release group mbid>` → `strAlbumThumb` + `/medium` / `/small`
     (one request per 2 s);
  4. else no URL (the UI placeholder), flagged in the report.
     Cached in `.cache/covers/<release group>.json`. Only the URL is stored.
- **Upload (4)**: keys `audio/<id>.<hash8>.mp3` (the Worker accepts only that shape), uploaded with
  `Cache-Control: public, max-age=31536000, immutable` and `audio/mpeg`. List the bucket, upload only
  missing keys, delete keys no track references and list them. Endpoint
  `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`. Secrets come from `.env.local`
  (never read or print it: the user fills it in); a missing variable fails the run with its name.
- **Build (5)**: `src/content/tracks.json` (`id`, `title`, `artist`, `album`, `year`, `durationSec`,
  `audioUrl` = `audioBaseUrl` + key, `coverUrl`/`coverThumbUrl` when found), sorted by artist, year,
  title, parsed with the Zod schema before writing.
- **Report** (printed and written to `.cache/report.json`, informational only): tracks without a
  MusicBrainz match, tracks without a cover, uploaded and deleted keys, the album chosen for each track.

## 3. Later, with the magazine

- Band facts are looked up by the artist MBID from stage 2, never by name, so there is no candidate to
  choose: MusicBrainz artist (origin, years, members with instruments, albums, label) + TheAudioDB
  `artist-mb.php?i=<mbid>` (`https://www.theaudiodb.com/api/v1/json/123/…`, up to 30 requests per minute;
  genre, band photo URLs: main ~800px, polaroids ~300px, the closest size the API offers) + Wikipedia for
  facts → `.cache/artists/<slug>.json`. Photos stay URLs.
- Section: chosen automatically from the genre tags by a fixed mapping; a default section when none fits.
- Copy: Claude Code writes it in Russian, in its own words, in batches of 20–30 bands: lead ≤ 180
  characters, the 3 big stats and every dossier line **only** from `.cache/artists/<slug>.json`, at most 5
  members with roles from the collected instruments. A missing fact is left out, never filled from memory;
  a band with too few facts gets a shorter spread. Report what was written.

## Must not

- Must not invent or "remember" a fact, year, stat, member or quote.
- Must not exceed the rate limits, run requests in parallel against MusicBrainz, or send an anonymous or
  personal-email User-Agent.
- Must not use a band photo, or another album's cover, as a track's cover.
- Must not commit audio or `.cache/`, create `public/music/` or `public/img/`, or download, convert,
  upload or commit any image.
- Must not stop the run for a manual review or ask the user to choose a match or supply an image.
- Must not put R2 credentials into a `VITE_` variable, `tracks.json` or a log line.
- Must not write `src/content/*.json` that fails its Zod schema.
- Must not delete bucket objects without listing them in the run output.
- Must not scrape Pinterest or add a dependency without the user agreeing.
