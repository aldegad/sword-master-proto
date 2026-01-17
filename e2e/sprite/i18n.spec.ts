import { test, expect } from '@playwright/test';

test.describe('Sprite Generator i18n', () => {
  test.beforeEach(async ({ page }) => {
    // 언어 설정 초기화를 위해 localStorage 클리어
    await page.goto('http://localhost:3001');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display Korean text when browser language is Korean', async ({
    page,
    context,
  }) => {
    // 한국어 브라우저 설정
    await context.grantPermissions([]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: function () {
          return 'ko-KR';
        },
      });
    });

    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3001');

    // 한국어 텍스트 확인
    await expect(page.locator('h1')).toContainText('Sprite Generator');
    await expect(page.getByText('동영상에서 생성')).toBeVisible();
  });

  test('should display English text when browser language is English', async ({
    page,
    context,
  }) => {
    // 영어 브라우저 설정
    await context.grantPermissions([]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: function () {
          return 'en-US';
        },
      });
    });

    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3001');

    // 영어 텍스트 확인
    await expect(page.locator('h1')).toContainText('Sprite Generator');
    await expect(page.getByText('Video to Sprite')).toBeVisible();
  });

  test('should toggle language when clicking language button', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // 언어 토글 버튼 찾기
    const langButton = page.getByText('🌐 한/EN');
    await expect(langButton).toBeVisible();

    // 현재 언어 확인 및 토글
    const initialText = await page.locator('text=동영상에서 생성').isVisible();

    await langButton.click();
    await page.waitForTimeout(500); // 언어 변경 대기

    // 언어가 변경되었는지 확인
    if (initialText) {
      // 한국어 → 영어
      await expect(page.getByText('Video to Sprite')).toBeVisible();
    } else {
      // 영어 → 한국어
      await expect(page.getByText('동영상에서 생성')).toBeVisible();
    }
  });

  test('should persist language setting after page reload', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // 언어 토글 버튼 클릭
    const langButton = page.getByText('🌐 한/EN');
    await langButton.click();
    await page.waitForTimeout(500);

    // 현재 언어 저장
    const afterToggle = await page.locator('text=Video to Sprite').isVisible();

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 언어 설정이 유지되는지 확인
    if (afterToggle) {
      await expect(page.getByText('Video to Sprite')).toBeVisible();
    } else {
      await expect(page.getByText('동영상에서 생성')).toBeVisible();
    }
  });

  test('should display Korean developer info in footer', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // 푸터에 한국인 개발자 정보 표시 확인
    await expect(page.getByText('김수홍')).toBeVisible();
    await expect(page.getByText('Made in Korea')).toBeVisible();
  });

  test('should display all mode tabs correctly', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // 4개의 탭이 있는지 확인 (한국어 또는 영어)
    const tabs = page.locator('button[class*="rounded"]').filter({ hasText: /Sprite|Expo|배경|동영상|Video|Edit|Remove/ });
    await expect(tabs).toHaveCount(4);
  });
});
