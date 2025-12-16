'use client';

import { Header } from '@/components/layout/Header';
import { ModeTabs } from '@/components/layout/ModeTabs';
import { ProgressOverlay } from '@/components/common/ProgressOverlay';
import { VideoMode } from '@/components/modes/VideoMode';
import { SpriteMode } from '@/components/modes/SpriteMode';
import { BgRemoveMode } from '@/components/modes/BgRemoveMode';
import { FramePreview } from '@/components/shared/FramePreview';
import { SpriteResult } from '@/components/shared/SpriteResult';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const mode = useAppStore((state) => state.mode);
  const extractedFrames = useAppStore((state) => state.extractedFrames);
  const resultCanvas = useAppStore((state) => state.resultCanvas);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Header />
      
      <main className="space-y-6">
        <ModeTabs />

        {mode === 'video' && <VideoMode />}
        {mode === 'sprite' && <SpriteMode />}
        {mode === 'bg-remove' && <BgRemoveMode />}

        {/* 프레임 미리보기 (비디오/스프라이트 모드 공통) */}
        {mode !== 'bg-remove' && extractedFrames.length > 0 && (
          <FramePreview />
        )}

        {/* 스프라이트 결과 (비디오/스프라이트 모드 공통) */}
        {mode !== 'bg-remove' && resultCanvas && (
          <SpriteResult />
        )}
      </main>

      <ProgressOverlay />
    </div>
  );
}

