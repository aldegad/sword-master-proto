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

export default function Home() {
  const mode = useAppStore((state) => state.mode);
  const extractedFrames = useAppStore((state) => state.extractedFrames);
  const resultCanvas = useAppStore((state) => state.resultCanvas);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      {/* 푸터 */}
      <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} Soo Hong Kim. All rights reserved.
        </p>
        <p className="mt-2 space-x-4">
          <a
            href="https://github.com/aldegad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:aldegad@gmail.com"
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </p>
      </footer>
    </div>
  );
}

