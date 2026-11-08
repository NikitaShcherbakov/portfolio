---
name: youtube-player
description: >-
  How the portfolio plays music through the official YouTube IFrame Player API without breaking its rules — one
  player created once and never unmounted, kept visible at 200×200 or more, moved between the «смотрим клип»
  block and the floating window by CSS only, first play from a user gesture, unplayable videos skipped. Covers
  loading the API script once, React StrictMode's double effects, the player states and error codes, progress
  polling, the Referer requirement and how to test it. Use when building or changing `YouTubePlayer`,
  `VideoFrame`, the player store, the iPod or chart controls that drive playback, or `SiteTemplate`.
when_to_use: >-
  Also for "youtube", "iframe api", "YT.Player", "player", "play", "pause", "next track", "autoplay",
  "error 150", "error 101", "embeddable", "floating video", "music stops on tab change", "плеер", "клип".
---

# YouTube player

CLAUDE.md "YouTube player constraints" are the rules; this is how to meet them.

## 1. One player, created once

- Load `https://www.youtube.com/iframe_api` once per page. The script calls the global
  `window.onYouTubeIframeAPIReady` when `window.YT.Player` is usable. Wrap that in a promise in the player
  module, so a second caller awaits the same promise instead of injecting a second `<script>`.
- `src/main.tsx` renders in `<StrictMode>`, which runs every effect twice in development
  (mount → cleanup → mount). A `new YT.Player(...)` inside a plain `useEffect` therefore creates two
  players. Either keep the instance outside React (a module-level owner the store talks to) and make the
  effect idempotent, or destroy it in the cleanup with `player.destroy()`. Never "fix" it by removing
  `StrictMode`.
- `new YT.Player(element, options)` **replaces** `element` with an `<iframe>`. Give it an inner `<div>` that
  React renders once and never re-renders children into; React must not own the iframe.
- The player lives in `SiteTemplate` (the layout route), so a tab change never unmounts it.

## 2. Visible, always

- At least 200×200 px at every breakpoint, Home block and floating window alike. Never hide the video with
  `display: none`, `visibility: hidden`, `opacity: 0`, a zero size, off-screen positioning or a cover on top:
  audio-only playback breaks YouTube's terms.
- Move between the Home block and the floating window with CSS (`position: fixed` and a class, or a CSS
  variable), not by re-parenting the node: moving an `<iframe>` in the DOM reloads it and stops the music.
- The iframe gets a `title` naming the clip (the **accessibility** skill).

## 3. Options and controls

```ts
new YT.Player(element, {
  width: '100%',
  height: '100%',
  playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
  events: { onReady, onStateChange, onError },
});
```

- `playsinline: 1` keeps iOS from forcing fullscreen; `origin` is recommended by the API when it is
  driven from a page.
- `cueVideoById(id)` loads without playing; `loadVideoById(id)` plays. Before the first ▶ press, only cue:
  browsers block sound without a user gesture, and the first `playVideo()` must run inside the click
  handler of the ▶ button.
- There is no progress event: poll `getCurrentTime()` / `getDuration()` on an interval only while the state
  is playing, and clear it on pause, end and unmount.

## 4. States and errors

| `onStateChange` `data` | Meaning   | Do                     |
| ---------------------- | --------- | ---------------------- |
| `-1`                   | unstarted |                        |
| `0`                    | ended     | next track             |
| `1`                    | playing   | start progress polling |
| `2`                    | paused    | stop polling           |
| `3`                    | buffering |                        |
| `5`                    | cued      |                        |

| `onError` `data` | Meaning                            | Do                                       |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| `2`              | invalid parameter (a bad video id) | a bug in the data: report it, next track |
| `5`              | HTML5 player error                 | next track                               |
| `100`            | video removed or private           | next track                               |
| `101`, `150`     | the owner does not allow embedding | next track                               |

- Skip tracks with `embeddable: false` before they reach the player (the content pipeline sets the flag).
- Guard "next track" against a playlist where every track fails: stop after one full cycle and show a
  message instead of looping.
- YouTube refuses embeds that arrive without an HTTP Referer. `vercel.json` sends
  `Referrer-Policy: strict-origin-when-cross-origin`, which keeps the origin: never change it to
  `no-referrer`.

## 5. Decisions to ask about, not take

- **Privacy host.** The API accepts `host: 'https://www.youtube-nocookie.com'`, which avoids YouTube
  cookies until play. CLAUDE.md says "no cookies"; whether to use it is the user's call.
- **Types.** The API has no bundled types. `@types/youtube` is a new dependency: propose it, or declare the
  few members used in the player module's `types/`.
- **CSP.** `vercel.json` has none. If one is added, it must allow `script-src https://www.youtube.com`,
  `frame-src https://www.youtube.com` (and the nocookie host if chosen), and `img-src https://i.ytimg.com`.

## 6. Testing

Vitest: a fake `window.YT` (the **testing** skill §4). E2E: assert that the iframe is present, visible and at
least 200×200 on every tab and on the `mobile` project, and that it is the same element after a tab change.
Audio itself cannot be verified headless: say so.

## Must not

- Must not create a second player, inject the API script twice, or remove `StrictMode` to hide a double
  effect.
- Must not unmount, re-parent or recreate the player on navigation.
- Must not hide the video or render it below 200×200 anywhere.
- Must not call `playVideo()` before the user pressed ▶ once.
- Must not use an unofficial YouTube or YouTube Music API, or store cookies.
- Must not loop forever over a playlist whose every track fails.
