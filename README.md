# Rock Wall

Сайт-визитка Никиты Щербакова: журнал о рок-группах, плеер в стиле iPod на YouTube и резюме.

Vite + React 19 + TypeScript + Tailwind CSS 4, статический SPA на Vercel.

## Запуск

```bash
nvm use 24        # Node 24 LTS, см. .nvmrc
pnpm install
pnpm dev          # http://localhost:5173
```

## Проверки

```bash
pnpm check                              # формат + lint + typecheck + тесты + сборка
pnpm exec playwright install chromium   # один раз
pnpm test:e2e                           # Playwright: desktop + mobile, проверка доступности
```

## Деплой

Vercel (бесплатный тариф): импортируй репозиторий, настройки уже лежат в `vercel.json`.

Архитектура, правила кода и план — в [CLAUDE.md](CLAUDE.md).
