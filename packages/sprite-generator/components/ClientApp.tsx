'use client';

import { Header } from '@/components/layout/Header';
import { ModeTabs } from '@/components/layout/ModeTabs';
import { ProgressOverlay } from '@/components/common/ProgressOverlay';
import { VideoMode } from '@/components/modes/VideoMode';
import { SpriteMode } from '@/components/modes/SpriteMode';
import { BgRemoveMode } from '@/components/modes/BgRemoveMode';
import { ExpoAssetsMode } from '@/components/modes/ExpoAssetsMode';
import { FramePreview } from '@/components/shared/FramePreview';
import { SpriteResult } from '@/components/shared/SpriteResult';
import { TopBannerAd, InContentAd, SidebarAd, BottomBannerAd } from '@/components/common/AdBanner';
import { useAppStore } from '@/store/useAppStore';

// 인터랙티브 도구 UI - Client Component
export function ClientApp() {
  const mode = useAppStore((state) => state.mode);
  const extractedFrames = useAppStore((state) => state.extractedFrames);
  const resultCanvas = useAppStore((state) => state.resultCanvas);

  return (
    <>
      <Header />

      {/* 상단 배너 광고 */}
      <TopBannerAd />

      <div className="flex gap-6">
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 min-w-0 space-y-6">
          <ModeTabs />

          {mode === 'video' && <VideoMode />}
          {mode === 'sprite' && <SpriteMode />}
          {mode === 'bg-remove' && <BgRemoveMode />}
          {mode === 'expo-assets' && <ExpoAssetsMode />}

          {/* 콘텐츠 중간 광고 */}
          <InContentAd />

          {/* 프레임 미리보기 (비디오/스프라이트 모드 공통) */}
          {mode !== 'bg-remove' && extractedFrames.length > 0 && (
            <FramePreview />
          )}

          {/* 스프라이트 결과 (비디오/스프라이트 모드 공통) */}
          {mode !== 'bg-remove' && resultCanvas && (
            <SpriteResult />
          )}
        </main>

        {/* 사이드바 광고 (데스크톱에서만 표시) */}
        <aside className="hidden xl:block w-[300px] flex-shrink-0">
          <div className="sticky top-8">
            <SidebarAd />
          </div>
        </aside>
      </div>

      {/* 하단 배너 광고 */}
      <BottomBannerAd />

      <ProgressOverlay />
    </>
  );
}
