import { expect, test } from '@playwright/test';

test.describe('Next.js Pages Screenshot', () => {
  test('take screenshots for landing, game and rulebook', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'screenshots/game-landing-ko.png', fullPage: true });

    await page.click('#lang-toggle');
    await expect(page.getByText('Play Game')).toBeVisible();
    await page.screenshot({ path: 'screenshots/game-landing-en.png', fullPage: true });

    await page.getByRole('link', { name: /Game|게임/ }).first().click();
    await expect(page.locator('.phaser-host canvas')).toHaveCount(1, { timeout: 20000 });

    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/game-play-ko.png', fullPage: true });

    await page.getByRole('link', { name: /Rulebook|룰북/ }).first().click();
    await expect(page.getByRole('heading', { name: '룰북' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/game-intro-ko.png', fullPage: true });
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await context.close();
  });
});
