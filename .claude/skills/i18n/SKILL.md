---
name: i18n
description: >-
  How every piece of UI text in the portfolio goes through i18next — the three locales
  `src/i18n/locales/{ru,en,uk}.json` with the same keys, `useTranslation()` and typed keys, plurals with all
  four `_one/_few/_many/_other` keys, interpolation, the page `<title>`, `html[lang]`, the language switcher
  and its storage key, what the type check catches and what it does not. Use when adding or changing any
  visible string, `aria-label`, `alt`, `title` or `placeholder`, a counter with a plural, a new language, or
  when a raw key such as `player.deck.brand` shows on screen.
when_to_use: >-
  Also for "i18n", "translation", "translate", "locale", "language", "plural", "aria-label text", "raw key on
  screen", "missing translation", "перевод", "локализация", "язык", "добавь текст", "множественное число".
---

# i18n

CLAUDE.md "Design rules": all UI text, aria-labels and the deck's English engravings included, lives in
`src/i18n/locales/{ru,en,uk}.json`. This is how.

## 1. How it is wired

- `src/i18n/languages.ts`: `languageNames` (the `Language` union `ru | en | uk`), `defaultLanguage` (`ru`),
  `languageStorageKey` (`language` in `localStorage`), `detectLanguage` (stored value → browser languages
  by base tag → default). `src/i18n/i18n.ts` initialises i18next synchronously (`initAsync: false`) with
  all three bundles, so the first render already has text; it keeps `html[lang]` in step on every
  `languageChanged`.
- `CustomTypeOptions.resources` is typed from `ru.json`: `t('nav.hoem')` is a type error, and
  `resources … satisfies Record<Language, { translation: typeof ru }>` makes a key missing from `en.json` or
  `uk.json` a type error too (`pnpm typecheck`).
- `useLanguage()` (`src/modules/common/hooks/`) reads the resolved language, follows a change made in
  another tab (the `storage` event) and exposes `changeLanguage`, which validates, stores and switches.
  `LanguageSwitcher` is a labelled native `<select>`; each `<option>` carries its own `lang`.
- The page title is React 19's hoisted `<title>` in `PageTitle` (`site.pageTitle`, `{{page}} — {{name}}`);
  `index.html` keeps a static Russian `<title>` for the first paint.
- `src/test/setup.ts` switches to the default language before each test, so tests query Russian names.

## 2. Adding or changing text

1. Pick the namespace by owner: `site`, `nav`, `language`, `theme`, `footer`, `pages.<page>`,
   `player.<part>`; a new module gets its own top-level key (`magazine`, `chart`). camelCase keys, nested
   by UI part, never a sentence as a key.
2. Add the key to **all three** files in the same edit, at the same path, in the same order. Write real
   Russian, English and Ukrainian copy; never paste the Russian into the others as a placeholder.
3. In a component: `const { t } = useTranslation();` then `t('pages.home.music')`. Outside React (a store,
   a util, Media Session metadata): return a key or a typed value and translate it in the component, or use
   `i18n.t` from `@/i18n` only where no component exists.
4. Dynamic keys stay typed: build them from a union, `t(\`player.status.${status}\`)`where`status`is a
literal union whose every member has a key. Never`t(someString)`.
5. Values go through interpolation (`{{name}}`), never string concatenation around `t()`: word order
   differs between languages. `escapeValue` is off because React escapes; never feed `t()` output into
   `dangerouslySetInnerHTML`.
6. The same text in a visible label and an `aria-label` is one key used twice, not two copies.

## 3. Plurals

Russian and Ukrainian use `one` / `few` / `many` / `other`, English `one` / `other`. The type parity
check compares every locale against `ru.json`, so **every locale keeps all four keys**; English repeats its
`other` form under `few` and `many`:

```json
"count_one": "{{count}} track",
"count_few": "{{count}} tracks",
"count_many": "{{count}} tracks",
"count_other": "{{count}} tracks"
```

Call it with the base key and `count`: `t('player.playlist.count', { count })`. Check the forms for 1, 2, 5,
11, 21 and 0 in Russian and Ukrainian (`21 трек`, `22 трека`, `25 треків`).

## 4. What the checks do not catch

- **Extra or stale keys.** A key left in `en.json`/`uk.json` after it was removed from `ru.json`, or a key
  no code uses any more, passes typecheck and Knip. When removing or renaming a key, Grep `src/` for it and
  delete it from all three files.
- **Untranslated copy.** English text pasted into `uk.json` type-checks. Read the three values side by side.
- **Literals in JSX.** Lint does not flag `<button aria-label="Play">`. Grep the changed files for quoted
  text in JSX, `aria-label=`, `alt=`, `title=` and `placeholder=` that does not come from `t()`. Not text:
  the brand names in `languageNames` (each in its own language), proper nouns from `src/content/*.json`
  (track titles, artists), and symbols drawn by the design (▶, ⏭) when the control's name comes from `t()`.
- **Length.** English and Ukrainian strings run longer than Russian: check the new text at 320 px in each
  language (the `qa` agent drives the switcher with `browser_select_option`).

## 5. A new language

Add it to `languageNames` (its name in itself), create `locales/<code>.json` with every key of `ru.json`,
register it in `resources` in `i18n.ts`, and make sure each plural has its CLDR forms (four keys stay
for parity). Detection, the switcher and `html[lang]` follow from `languageNames` by themselves.

## Must not

- Must not put user-visible text, an `aria-label`, `alt`, `title` or `placeholder` in code as a literal.
- Must not add a key to one or two locales, or leave a placeholder copy in another language.
- Must not drop any of the four plural keys from a locale, or build a plural with `count === 1 ? … : …`.
- Must not concatenate translated fragments, or call `t()` with an untyped string.
- Must not read or write the language anywhere but through `useLanguage()` / `languageStorageKey`.
- Must not add a second i18n library or a runtime-loaded translation backend without the user agreeing.
