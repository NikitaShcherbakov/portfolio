---
name: testing
description: >-
  How tests are written in Rock Wall — Vitest's two projects (the file extension picks node or jsdom),
  Testing Library queries by role and `userEvent.setup()`, what jsdom cannot do (no `matchMedia`,
  `IntersectionObserver`, `ResizeObserver`, `scrollIntoView`, Web Animations, layout, or `transitionend`) and
  how to test around it, faking the YouTube IFrame API, resetting Zustand stores, and Playwright e2e with axe,
  the mobile project, reduced motion and network stubs. Use when writing or fixing any `*.test.ts(x)` or
  `e2e/*.spec.ts`, or when a test fails with "document is not defined", "matchMedia is not a function",
  "scrollIntoView is not a function", or waits forever for an animation.
when_to_use: >-
  Also for "test", "unit test", "component test", "vitest", "testing library", "userEvent", "jsdom",
  "mock", "stub", "fake timers", "playwright", "e2e", "axe", "screenshot test", "flaky", "тест",
  "напиши тест".
---

# Testing

CLAUDE.md "Testing" sets what is tested where. This is how.

## 1. Which runner, which environment

`vite.config.ts` has two Vitest projects, chosen by the extension:

| File         | Project | Environment                                     |
| ------------ | ------- | ----------------------------------------------- |
| `*.test.ts`  | `unit`  | node: pure logic, no DOM                        |
| `*.test.tsx` | `dom`   | jsdom + `src/test/setup.ts` (jest-dom, cleanup) |

A test that renders anything is `.test.tsx`. Mocks, stubbed globals and env vars are restored after every
test (`restoreMocks`, `unstubGlobals`, `unstubEnvs`): each test sets up what it needs.

Run one file while iterating: `pnpm exec vitest run src/modules/player/stores/player-store.test.ts`.

## 2. Component tests

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PlayButton } from './play-button';

describe('PlayButton', () => {
  it('switches to pause after the first press', async () => {
    const user = userEvent.setup();
    render(<PlayButton />);

    await user.click(screen.getByRole('button', { name: 'Играть' }));

    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument();
  });
});
```

A component that renders a router `<Link>` (the sticker tabs) throws outside a router: wrap it in
`<MemoryRouter initialEntries={['/']}>`, or use `renderApp(path)` once it exists (CLAUDE.md "Testing").

- `userEvent.setup()` before `render`, then `await` every interaction. `fireEvent` only for events
  user-event cannot produce (`transitionEnd`, below).
- Query by role and accessible name, in Russian as the UI is; `findBy…` for what appears asynchronously.
  No test ids, class names or `container.querySelector`: `eslint-plugin-testing-library` (`flat/react`)
  flags node access.
- Assert what the user perceives (text, role, `aria-*` state, `toBeVisible`), not internal state.
- Tests are `it(...)` (`vitest/consistent-test-it`), no `.only` (`vitest/no-focused-tests`), hooks at the top
  of a `describe`.
- `@testing-library/user-event` sits in `knip.json` `ignoreDependencies` until the first test uses it; once
  it is used, that entry is obsolete: tell the user.

## 3. What jsdom cannot do

Verified on the installed jsdom 31: `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`,
`Element.prototype.scrollIntoView` and `Element.prototype.animate` are **undefined**, and
`getBoundingClientRect()` is always zeros. CSS is not applied, so transitions and animations never run and
`transitionend` / `animationend` never fire.

- **A global** (`matchMedia`, the observers): stub it in the test with `vi.stubGlobal('matchMedia', …)`;
  `unstubGlobals` removes it afterwards. A reduced-motion hook is tested with both answers.
- **A prototype method** (`scrollIntoView`): `vi.stubGlobal` cannot reach it. When the first component needs
  it, add a no-op to `src/test/setup.ts` in the same change, not per test.
- **Animation end** (a page flip that resets z-index on `transitionend`): fire it yourself,
  `fireEvent.transitionEnd(leaf)`, then assert the end state.
- **Geometry, 3D, real layout, visual results**: not a jsdom test at all. That is e2e (§5).
- **Timers** (progress polling, the garland): `vi.useFakeTimers()` and
  `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`, or user-event waits forever.

## 4. The YouTube player and stores

- Never load `https://www.youtube.com/iframe_api` in Vitest. Stub `window.YT` with a fake `Player` class
  that records calls (`loadVideoById`, `playVideo`, …) and exposes the `events` it received, then drive the
  component by calling `onReady`, `onStateChange({ data: 0 })` (ended) or `onError({ data: 150 })` directly.
  The **youtube-player** skill has the API facts.
- The "player is the same DOM node after navigation" test (CLAUDE.md): keep a reference to the player element,
  navigate with `user.click` on a tab, assert `toBe(sameElement)`. Needs `renderApp(path)` (memory router)
  in `src/test/` once routing lands.
- Zustand: reset in `beforeEach` with `useStore.setState(initialState, true)`; never rely on test order.

## 5. E2E (Playwright)

`playwright.config.ts`: `e2e/`, projects `desktop` (Desktop Chrome) and `mobile` (Pixel 7, touch), a
production build served on :4173, traces on first retry and screenshots on failure.

- Keep the axe check (`@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21aa`) in every page-level spec
  and collect `pageerror` as `smoke.spec.ts` does.
- Locate by role and name; rely on auto-waiting `expect(...)`. No `page.waitForTimeout`
  (`playwright/no-wait-for-timeout` is a warning, and warnings fail lint).
- Reduced motion: `await page.emulateMedia({ reducedMotion: 'reduce' })`, then assert that the page still
  switches.
- Touch: the `mobile` project has `hasTouch`; `locator.tap()` works there. Playwright has no swipe API: a
  flip by swipe is driven with `locator.dispatchEvent('pointerdown' | 'pointermove' | 'pointerup', { pointerType: 'touch', clientX, clientY, … })`
  if the flip uses Pointer Events.
- Network: CI must not depend on YouTube or Google Fonts being reachable. Stub third parties with
  `page.route('**/iframe_api', …)` for deterministic player tests; keep at most one opt-in check against
  the real service.
- Visual regression (`toHaveScreenshot`): baselines differ between Windows (local) and Linux (CI) font
  rendering. Ask the user before adding any; screenshots for comparison with a design go through the `qa`
  agent instead.

## Must not

- Must not put a rendering test in a `.test.ts` file, or a pure-logic test in jsdom without need.
- Must not query by test id, class or DOM structure, or assert internal state instead of what the user sees.
- Must not load the real YouTube API or hit the network in Vitest.
- Must not test geometry, 3D transforms or visual output in jsdom.
- Must not use `waitForTimeout`, `.only`, or a retry loop to hide a flaky test: find the race.
- Must not weaken or skip the axe assertion to get a green run.
- Must not say tests pass without running them in this session.
