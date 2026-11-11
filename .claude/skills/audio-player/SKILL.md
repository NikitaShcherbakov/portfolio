---
name: audio-player
description: >-
  How the portfolio plays its free tracks through one HTML `<audio>` element served from
  Cloudflare R2 — created once outside React's render and never unmounted, first play from a user gesture,
  time and buffering from media events, failed tracks skipped, the Worker that serves the private bucket
  only to the site's origins with range requests.
  Covers React StrictMode's double effects, the media events to listen to, the `play()` promise, preloading
  the next track, Media Session and how to test it. Use when building or changing `AudioPlayer`, the player
  store, the deck, the iPod or chart controls that drive playback, or `SiteTemplate`.
when_to_use: >-
  Also for "audio", "<audio>", "HTMLAudioElement", "player", "play", "pause", "next track", "autoplay",
  "seek", "buffering", "media session", "music stops on tab change", "плеер", "музыка", "трек".
---

# Audio player

CLAUDE.md "Audio player constraints" are the rules; this is how to meet them. Playing the tracks
from R2 is final: do not propose YouTube, streaming services or previews.

## 1. One element, created once

- The one `HTMLAudioElement` lives outside React's render: `src/modules/player/utils/audio-element.ts`
  creates it lazily with `document.createElement('audio')` on first use, appends it (hidden) to `body`
  once, and exposes `loadAudio`/`playAudio`/… that the store calls. React never renders or unmounts it, so
  a tab change cannot re-create it. `AudioPlayer` (mounted once by `SiteTemplate`, through
  `use-audio-player.ts`) only subscribes to its events.
- `src/main.tsx` renders in `<StrictMode>`, which runs effects twice in development: subscribe in an
  idempotent effect that removes its listeners in the cleanup, never create a second element. Never "fix"
  it by removing `StrictMode`.
- `crossOrigin = 'anonymous'` is set before the first `src`, and `preload = 'metadata'`.

## 2. Playing

- The first `play()` runs inside the ▶ click handler. It returns a promise: `await` it and handle
  `NotAllowedError` (autoplay blocked) by showing the paused state, not by retrying in a loop.
- Changing track: set `src`, then `play()` only if the player was playing. Seeking: set `currentTime`.
- Drive the store from events, not timers: `timeupdate` (time), `loadedmetadata` / `durationchange`
  (duration), `play` / `pause`, `waiting` / `playing` (buffering), `ended` (next track), `error`.
- Volume is `element.volume` (0–1); keep the deck's volume in the store and apply it on change.
- Preload the next track's start (`fetch` with a `Range: bytes=0-…` header, or a second `Audio` with
  `preload="auto"` that is never played) so the switch has no gap.
- `navigator.mediaSession`: metadata (title, artist, album, cover) and the play/pause/next/previous
  handlers, so lock-screen and hardware keys work.

## 3. Errors

- `error` event → report it with the track id and `element.error.code`, then next track.
- Every track failing: stop after one full cycle and show a message instead of looping.

## 4. The bucket

- The R2 bucket is private. The `portfolio-audio` Worker (`worker/src/index.ts`) serves
  `/audio/<id>.<hash8>.mp3` only when the request's `Origin` is in `ALLOWED_ORIGINS`
  (`worker/wrangler.jsonc`), answers range requests with `206` and `Content-Range`, and sets
  `Access-Control-Allow-Origin` to that origin. Without `crossOrigin = 'anonymous'` the element sends no
  `Origin` and every track fails with `403`.
- A new origin the site runs on (a custom domain, a Vercel preview, another local port) must be added to
  `ALLOWED_ORIGINS`, then `pnpm worker:types` and `pnpm worker:deploy` (only when the user asks for the deploy).
- Object keys contain a content hash, so `Cache-Control: public, max-age=31536000, immutable` is safe.

## 5. Testing

Vitest (jsdom): `HTMLMediaElement.prototype.play` / `pause` / `load` are not implemented; stub them
(`vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()`) and fire events with
`fireEvent(audio, new Event('timeupdate'))` after setting `currentTime` via `Object.defineProperty`.
E2E: serve a tiny fixture mp3 through `page.route` for the audio Worker host (`*.workers.dev`); assert the element is the same node after
a tab change and that the deck reacts to the events. Audio itself cannot be verified headless: say so.

## Must not

- Must not create a second audio element, or remove `StrictMode` to hide a double effect.
- Must not unmount or recreate the element on navigation.
- Must not call `play()` before the user pressed ▶ once, or ignore its rejected promise.
- Must not drive time from a timer once the element exists.
- Must not loop forever over a playlist whose every track fails.
- Must not commit audio files or put R2 credentials in a `VITE_` variable.
