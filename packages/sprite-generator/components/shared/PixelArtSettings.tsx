'use client';

import { clsx } from 'clsx';
import { RangeInput } from '@/components/common/Input';
import type { BackgroundRemovalOptions } from '@/types';

interface PixelArtSettingsProps {
  options: BackgroundRemovalOptions;
  onChange: (options: BackgroundRemovalOptions) => void;
  /** 컴팩트 모드 (FramePreview용) */
  compact?: boolean;
}

const BLOCK_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16];

export function PixelArtSettings({ options, onChange, compact = false }: PixelArtSettingsProps) {
  const updateOption = <K extends keyof BackgroundRemovalOptions>(
    key: K,
    value: BackgroundRemovalOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* 메인 토글 */}
      <label 
        className={clsx(
          "flex items-center gap-3 cursor-pointer rounded-lg border transition-colors",
          compact 
            ? "p-3 bg-surface border-border hover:border-primary" 
            : "p-3 bg-surface border-2 border-primary/50 hover:border-primary"
        )}
      >
        <input
          type="checkbox"
          checked={options.isManualPixelArt ?? true}
          onChange={(e) => {
            updateOption('isManualPixelArt', e.target.checked);
            if (!e.target.checked) {
              updateOption('autoDetectPixelArt', false);
            }
          }}
          className="w-5 h-5 accent-primary"
        />
        <div>
          <span className="text-sm font-medium">🎮 {compact ? '픽셀 아트 모드' : '이 이미지는 픽셀 아트입니다'}</span>
          <p className="text-xs text-slate-500">격자 기반 정리로 깔끔한 결과물</p>
        </div>
      </label>

      {/* 픽셀 아트 세부 설정 */}
      {options.isManualPixelArt && (
        <div className="p-3 bg-primary/10 rounded-lg space-y-4">
          {/* 블록 크기 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              픽셀 블록 크기
              {!compact && (
                <span className="text-xs text-slate-400 ml-2">
                  (결과물 미리보기에 격자로 표시됨)
                </span>
              )}
            </label>
            <div className="flex gap-2 flex-wrap">
              {BLOCK_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateOption('pixelBlockSize', size)}
                  className={clsx(
                    'px-3 py-1.5 rounded text-sm font-mono transition-colors',
                    options.pixelBlockSize === size
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border hover:border-primary'
                  )}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              💡 업스케일 안 된 원본이면 1x1, 2배 확대면 2x2
            </p>
          </div>

          {/* 격자 기반 정리 옵션 */}
          <div className="pt-3 border-t border-border/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.pixelArtCleanup ?? true}
                onChange={(e) => updateOption('pixelArtCleanup', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">격자 기반 투명도 정리 + 색상 통일</span>
            </label>

            {options.pixelArtCleanup && (
              <div className="mt-3">
                <RangeInput
                  label="유지 임계값"
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  value={options.pixelTransparencyThreshold ?? 0.4}
                  displayValue={`${Math.round((options.pixelTransparencyThreshold ?? 0.4) * 100)}%`}
                  hint="블록의 불투명 픽셀이 이 비율 미만이면 투명 처리"
                  onChange={(e) => updateOption('pixelTransparencyThreshold', parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

