import { test } from '@playwright/test';

test.describe('Game i18n Screenshot', () => {
  test('take screenshots in Korean and English', async ({ browser }) => {
    // 한국어 브라우저 컨텍스트 생성
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);

    // 랜딩 페이지 스크린샷 (한국어)
    await page.screenshot({ path: 'screenshots/game-landing-ko.png', fullPage: true });

    // 랜딩 페이지 언어 토글 (영어로 전환)
    await page.click('#lang-toggle');
    await page.waitForTimeout(500);

    // 랜딩 페이지 스크린샷 (영어)
    await page.screenshot({ path: 'screenshots/game-landing-en.png', fullPage: true });

    // 다시 한국어로 전환
    await page.click('#lang-toggle');
    await page.waitForTimeout(500);

    // 게임 페이지로 이동
    await page.goto('http://localhost:3000/game/');
    await page.waitForTimeout(3000); // 게임 로딩 대기

    // 게임 인트로 스크린샷 (BootScene)
    await page.screenshot({ path: 'screenshots/game-intro-ko.png', fullPage: true });

    // 실제 게임 시작 (canvas 클릭 - ► 시작 버튼)
    // BootScene에서 시작 버튼: (width/2, height*0.72) = (960, 777)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // 캔버스 크기 대비 상대 위치 계산
      const scaleX = box.width / 1920;
      const scaleY = box.height / 1080;
      const startBtnX = 960 * scaleX;
      const startBtnY = 777 * scaleY;

      await canvas.click({ position: { x: startBtnX, y: startBtnY }, force: true });
    }
    await page.waitForTimeout(4000); // GameScene 로딩 및 애니메이션 대기

    // 게임 플레이 화면 스크린샷 (한국어)
    await page.screenshot({ path: 'screenshots/game-play-ko.png', fullPage: true });

    // 영어로 전환 (🌐 한/EN 버튼 - TopUI 우측 상단)
    // TopUI.ts: (width - 38, 120) = (1882, 120)
    if (box) {
      const scaleX = box.width / 1920;
      const scaleY = box.height / 1080;
      const langBtnX = 1882 * scaleX;
      const langBtnY = 130 * scaleY; // 버튼 중앙

      await canvas.click({ position: { x: langBtnX, y: langBtnY }, force: true });
    }
    await page.waitForTimeout(2000);

    // 게임 플레이 화면 스크린샷 (영어)
    await page.screenshot({ path: 'screenshots/game-play-en.png', fullPage: true });

    await context.close();
  });
});
