import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('tabs open every page and each page passes axe in both themes', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });

  for (const [themeButton, theme] of [
    ['Светлая тема', 'light'],
    ['Тёмная тема', 'dark'],
  ] as const) {
    await page.getByRole('button', { name: themeButton }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    for (const [tab, path] of [
      ['Резюме', '/cv'],
      ['Игры', '/games'],
      ['Главная', '/'],
    ] as const) {
      await nav.getByRole('link', { name: tab }).click();
      await expect(page).toHaveURL(path);
      await expect(nav.getByRole('link', { name: tab })).toHaveAttribute(
        'aria-current',
        'page'
      );

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(violations).toEqual([]);
    }
  }

  expect(pageErrors).toEqual([]);
});

test('direct links to tabs and unknown paths work', async ({ page }) => {
  await page.goto('/games');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Игры' })
  ).toBeVisible();

  await page.goto('/nope');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Страница не найдена' })
  ).toBeVisible();
});

test('language and theme survive a reload', async ({ page }) => {
  await page.goto('/cv');

  await page.getByRole('combobox', { name: 'Язык' }).selectOption('uk');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page).toHaveTitle('Резюме — Микита Щербаков');

  await page.getByRole('button', { name: 'Темна тема' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('button', { name: 'Темна тема' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('link', { name: 'Ігри', exact: true })
  ).toBeVisible();
});

test('the system theme is the default and is followed live', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('button', { name: 'Как в системе' })
  ).toHaveAttribute('aria-pressed', 'true');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Тёмная тема' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a theme chosen in one tab applies to the other open tabs', async ({
  context,
}) => {
  const firstTab = await context.newPage();
  const secondTab = await context.newPage();
  await firstTab.emulateMedia({ colorScheme: 'light' });
  await secondTab.emulateMedia({ colorScheme: 'light' });
  await firstTab.goto('/');
  await secondTab.goto('/cv');

  await firstTab.getByRole('button', { name: 'Тёмная тема' }).click();

  await expect(secondTab.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    secondTab.getByRole('button', { name: 'Тёмная тема' })
  ).toHaveAttribute('aria-pressed', 'true');
});
