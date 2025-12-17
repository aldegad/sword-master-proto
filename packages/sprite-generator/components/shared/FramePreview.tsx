'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PixelArtSettings } from '@/components/shared/PixelArtSettings';
import { useAppStore } from '@/store/useAppStore';
import { BackgroundRemover } from '@/lib/background-remover';
import { SpriteGenerator } from '@/lib/sprite-generator';
import type { FrameWithOffset, BackgroundRemovalOptions } from '@/types';

const backgroundRemoverRef = { current: null as BackgroundRemover | null };
const spriteGeneratorRef = { current: null as SpriteGenerator | null };

export function FramePreview() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  
  // 배경 제거 설정 패널 상태
  const [isBgRemovePanelOpen, setIsBgRemovePanelOpen] = useState(false);
  const [bgRemoveOptions, setBgRemoveOptions] = useState<BackgroundRemovalOptions>({
    isManualPixelArt: true,
    pixelBlockSize: 1,
    pixelArtCleanup: true,
    pixelTransparencyThreshold: 0.4,
  });

  const {
    extractedFrames,
    setExtractedFrames,
    disabledFrames,
    toggleFrame,
    disabledReverseFrames,
    toggleReverseFrame,
    selectAllFrames,
    deselectAllFrames,
    frameOffsets,
    reverseFrameOffsets,
    adjustFrameOffset,
    isPingpong,
    setIsPingpong,
    previewFps,
    setPreviewFps,
    setResult,
    showProgress,
    updateProgress,
    hideProgress,
  } = useAppStore();

  // 활성화된 프레임 + 오프셋 가져오기
  const getFramesWithPingPongAndOffsets = useCallback((): FrameWithOffset[] => {
    const enabledFrames = extractedFrames
      .map((frame, index) => ({
        frame,
        offset: frameOffsets.get(index) || { x: 0, y: 0 },
        index,
      }))
      .filter(({ index }) => !disabledFrames.has(index))
      .map(({ frame, offset }) => ({ frame, offset }));

    if (!isPingpong) return enabledFrames;

    const reversedAll = [...extractedFrames].reverse();
    const enabledReverse = reversedAll
      .map((frame, index) => ({
        frame,
        offset: reverseFrameOffsets.get(index) || { x: 0, y: 0 },
        index,
      }))
      .filter(({ index }) => !disabledReverseFrames.has(index))
      .map(({ frame, offset }) => ({ frame, offset }));

    return [...enabledFrames, ...enabledReverse];
  }, [
    extractedFrames,
    frameOffsets,
    reverseFrameOffsets,
    disabledFrames,
    disabledReverseFrames,
    isPingpong,
  ]);

  // 미리보기 캔버스 초기화
  useEffect(() => {
    if (extractedFrames.length === 0 || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const firstFrame = extractedFrames[0];
    canvas.width = firstFrame.canvas.width;
    canvas.height = firstFrame.canvas.height;

    setCurrentFrameIndex(0);
    drawPreviewFrame(0);
  }, [extractedFrames]);

  // 프레임 그리기
  const drawPreviewFrame = useCallback(
    (index: number) => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      const frames = getFramesWithPingPongAndOffsets();
      if (frames.length === 0) {
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const frameIndex = index % frames.length;
      const { frame, offset } = frames[frameIndex];

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame.canvas, offset.x, offset.y);
    },
    [getFramesWithPingPongAndOffsets]
  );

  // 애니메이션 루프
  const animate = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const frameInterval = 1000 / previewFps;

    if (now - lastFrameTimeRef.current >= frameInterval) {
      const frames = getFramesWithPingPongAndOffsets();
      const nextIndex = (currentFrameIndex + 1) % frames.length;
      setCurrentFrameIndex(nextIndex);
      drawPreviewFrame(nextIndex);
      lastFrameTimeRef.current = now;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, previewFps, currentFrameIndex, getFramesWithPingPongAndOffsets, drawPreviewFrame]);

  useEffect(() => {
    if (isPlaying) {
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // 배경 제거
  const handleRemoveBackground = useCallback(async () => {
    if (extractedFrames.length === 0) return;

    try {
      showProgress('배경 제거 초기화 중...');

      if (!backgroundRemoverRef.current) {
        backgroundRemoverRef.current = new BackgroundRemover();
      }

      await backgroundRemoverRef.current.initialize();

      showProgress('배경 제거 중...', 0);

      const newFrames = await backgroundRemoverRef.current.removeBackgroundFromFrames(
        extractedFrames,
        (progress, current, total) => {
          updateProgress(`배경 제거 중... (${current}/${total})`, progress);
        },
        bgRemoveOptions // 픽셀 아트 옵션 전달
      );

      setExtractedFrames(newFrames);
      drawPreviewFrame(currentFrameIndex);
      setIsBgRemovePanelOpen(false); // 패널 닫기
      hideProgress();
    } catch (error) {
      hideProgress();
      alert('배경 제거 실패: ' + (error as Error).message);
    }
  }, [
    extractedFrames,
    currentFrameIndex,
    showProgress,
    updateProgress,
    hideProgress,
    setExtractedFrames,
    drawPreviewFrame,
    bgRemoveOptions,
  ]);

  // 스프라이트 시트 생성
  const handleGenerateSprite = useCallback(() => {
    const enabledFrames = getFramesWithPingPongAndOffsets();

    if (enabledFrames.length === 0) {
      alert('활성화된 프레임이 없습니다.');
      return;
    }

    try {
      showProgress('스프라이트 시트 생성 중...');

      if (!spriteGeneratorRef.current) {
        spriteGeneratorRef.current = new SpriteGenerator();
      }

      const result = spriteGeneratorRef.current.generateSpriteSheetWithOffsets(enabledFrames);
      setResult(result.canvas, result.metadata);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert('스프라이트 생성 실패: ' + (error as Error).message);
    }
  }, [getFramesWithPingPongAndOffsets, showProgress, hideProgress, setResult]);

  // 프레임 카운트 계산
  const totalFrames = isPingpong ? extractedFrames.length * 2 : extractedFrames.length;
  const enabledCount =
    extractedFrames.length -
    disabledFrames.size +
    (isPingpong ? extractedFrames.length - disabledReverseFrames.size : 0);
  const frames = getFramesWithPingPongAndOffsets();

  return (
    <Card title={`3. 추출된 프레임 (${enabledCount}/${totalFrames}개 활성화)`}>
      <p className="text-sm text-slate-400 mb-4">
        💡 프레임을 클릭하면 비활성화됩니다. 비활성화된 프레임은 최종 스프라이트에서 제외됩니다.
      </p>

      {/* 애니메이션 미리보기 */}
      <div className="bg-bg rounded-xl p-4 mb-4">
        <div className="flex flex-col items-center gap-4">
          <div className="checkerboard rounded-lg p-4 min-w-[200px] min-h-[200px] flex items-center justify-center">
            <canvas ref={previewCanvasRef} className="max-w-[300px] max-h-[300px]" />
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (!isPlaying) setCurrentFrameIndex(0);
              }}
              icon={isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isPlaying ? '정지' : '재생'}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">FPS:</span>
              <Input
                type="number"
                value={previewFps}
                onChange={(e) => setPreviewFps(parseInt(e.target.value) || 12)}
                min={1}
                max={60}
                className="w-16 !py-1.5 text-sm"
              />
            </div>

            <span className="text-sm text-slate-400">
              프레임: {frames.length > 0 ? (currentFrameIndex % frames.length) + 1 : 0}/
              {frames.length}
              {isPingpong && ' (핑퐁)'}
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isPingpong}
              onChange={(e) => {
                setIsPingpong(e.target.checked);
                setCurrentFrameIndex(0);
                drawPreviewFrame(0);
              }}
              className="w-4 h-4 accent-primary"
            />
            <span>🔄 역방향 재생 붙이기 (핑퐁)</span>
          </label>
        </div>
      </div>

      {/* 프레임 목록 */}
      <div className="max-h-96 overflow-y-auto p-2 mb-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {extractedFrames.map((frame, index) => (
            <FrameItem
              key={`frame-${index}`}
              frame={frame}
              index={index}
              isDisabled={disabledFrames.has(index)}
              offset={frameOffsets.get(index) || { x: 0, y: 0 }}
              onToggle={() => toggleFrame(index)}
              onAdjustOffset={(dir) => adjustFrameOffset(index, dir, false)}
            />
          ))}

          {isPingpong && extractedFrames.length > 0 && (
            <>
              <div className="col-span-full flex items-center justify-center py-2 border-t-2 border-dashed border-border">
                <span className="text-sm text-slate-400 bg-bg-card px-3">🔄 역방향 프레임</span>
              </div>
              {[...extractedFrames].reverse().map((frame, index) => (
                <FrameItem
                  key={`reverse-${index}`}
                  frame={frame}
                  index={index}
                  displayIndex={extractedFrames.length + index + 1}
                  isDisabled={disabledReverseFrames.has(index)}
                  isReverse
                  offset={reverseFrameOffsets.get(index) || { x: 0, y: 0 }}
                  onToggle={() => toggleReverseFrame(index)}
                  onAdjustOffset={(dir) => adjustFrameOffset(index, dir, true)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={selectAllFrames}>
          전체 선택
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAllFrames}>
          전체 해제
        </Button>
        <Button 
          variant={isBgRemovePanelOpen ? "primary" : "secondary"} 
          onClick={() => setIsBgRemovePanelOpen(!isBgRemovePanelOpen)}
        >
          {isBgRemovePanelOpen ? '배경 제거 설정 닫기' : '배경 제거 (AI)'}
        </Button>
        <Button onClick={handleGenerateSprite}>스프라이트 시트 생성</Button>
      </div>

      {/* 배경 제거 설정 패널 */}
      {isBgRemovePanelOpen && (
        <div className="mt-4 bg-bg rounded-xl p-4 border-2 border-primary/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold">AI 배경 제거 설정</h3>
            </div>
            <button 
              onClick={() => setIsBgRemovePanelOpen(false)}
              className="p-1 hover:bg-surface rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 🎮 픽셀 아트 설정 (공통 컴포넌트) */}
          <PixelArtSettings
            options={bgRemoveOptions}
            onChange={setBgRemoveOptions}
            compact
          />

          {/* 실행 버튼 */}
          <div className="mt-4 pt-4 border-t border-border">
            <Button 
              size="lg" 
              onClick={handleRemoveBackground} 
              icon={<Sparkles className="w-5 h-5" />}
              className="w-full"
            >
              배경 제거 실행 ({extractedFrames.length}개 프레임)
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

interface FrameItemProps {
  frame: { dataUrl: string };
  index: number;
  displayIndex?: number;
  isDisabled: boolean;
  isReverse?: boolean;
  offset: { x: number; y: number };
  onToggle: () => void;
  onAdjustOffset: (dir: 'up' | 'down' | 'left' | 'right') => void;
}

function FrameItem({
  frame,
  index,
  displayIndex,
  isDisabled,
  isReverse,
  offset,
  onToggle,
  onAdjustOffset,
}: FrameItemProps) {
  return (
    <div
      className={clsx(
        'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group',
        isDisabled ? 'border-red-500 opacity-50' : isReverse ? 'border-amber-500' : 'border-green-500',
        'hover:scale-105'
      )}
    >
      <div className="overflow-hidden" onClick={onToggle}>
        <img
          src={frame.dataUrl}
          alt={`Frame ${index}`}
          className="w-full h-auto"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
      </div>

      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl text-red-500 drop-shadow-lg">✕</span>
        </div>
      )}

      <span
        className={clsx(
          'absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded',
          isReverse ? 'bg-amber-500/80' : 'bg-black/70'
        )}
      >
        {displayIndex ?? index + 1}
      </span>

      {/* 오프셋 컨트롤 */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdjustOffset('up');
          }}
          className="w-4 h-4 bg-black/70 hover:bg-primary text-white text-xs rounded flex items-center justify-center"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <div className="flex gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdjustOffset('left');
            }}
            className="w-4 h-4 bg-black/70 hover:bg-primary text-white text-xs rounded flex items-center justify-center"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-[8px] bg-black/70 px-1 rounded text-white">
            {offset.x},{offset.y}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdjustOffset('right');
            }}
            className="w-4 h-4 bg-black/70 hover:bg-primary text-white text-xs rounded flex items-center justify-center"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdjustOffset('down');
          }}
          className="w-4 h-4 bg-black/70 hover:bg-primary text-white text-xs rounded flex items-center justify-center"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

