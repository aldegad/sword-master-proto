'use client';

import { useCallback, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { SpriteImporter } from '@/lib/sprite-importer';

const spriteImporterRef = { current: null as SpriteImporter | null };

export function SpriteMode() {
  const {
    spriteFile,
    spriteUrl,
    spriteImageInfo,
    setSpriteFile,
    spriteMetadataFile,
    loadedSpriteMetadata,
    setSpriteMetadata,
    frameSuggestions,
    setFrameSuggestions,
    spriteSettings,
    setSpriteSettings,
    setExtractedFrames,
    showProgress,
    updateProgress,
    hideProgress,
  } = useAppStore();

  const handleSpriteFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      try {
        showProgress('스프라이트 시트 로딩 중...');

        if (!spriteImporterRef.current) {
          spriteImporterRef.current = new SpriteImporter();
        }

        const result = await spriteImporterRef.current.loadImage(file);
        setSpriteFile(file, result.url, result.info);

        // 프레임 크기 추천
        const suggestions = spriteImporterRef.current.estimateFrameSize();
        setFrameSuggestions(suggestions);

        if (suggestions.length > 0) {
          const first = suggestions[0];
          setSpriteSettings({
            frameWidth: first.width,
            frameHeight: first.height,
            columns: first.columns,
            rows: first.rows,
          });
        }

        hideProgress();
      } catch (error) {
        hideProgress();
        alert('이미지 로드 실패: ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setSpriteFile, setFrameSuggestions, setSpriteSettings]
  );

  const handleJsonFileSelect = useCallback(
    async (file: File) => {
      try {
        showProgress('JSON 메타데이터 로딩 중...');

        if (!spriteImporterRef.current) {
          spriteImporterRef.current = new SpriteImporter();
        }

        const metadata = await spriteImporterRef.current.loadMetadata(file);
        setSpriteMetadata(file, metadata);

        if (metadata.meta) {
          setSpriteSettings({
            frameWidth: metadata.meta.frameWidth,
            frameHeight: metadata.meta.frameHeight,
            columns: metadata.meta.columns,
            rows: metadata.meta.rows,
            totalFrames: metadata.meta.totalFrames,
          });
        }

        hideProgress();
        alert('JSON 메타데이터가 로드되었습니다.');
      } catch (error) {
        hideProgress();
        alert('JSON 로드 실패: ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setSpriteMetadata, setSpriteSettings]
  );

  const handleSplitSprite = useCallback(async () => {
    if (!spriteImporterRef.current) return;

    try {
      showProgress('프레임 분할 중...', 0);

      let frames;

      if (loadedSpriteMetadata && loadedSpriteMetadata.frames.length > 0) {
        frames = spriteImporterRef.current.extractFramesFromMetadata(
          loadedSpriteMetadata,
          (progress, current, total) => {
            updateProgress(`프레임 분할 중... (${current}/${total})`, progress);
          }
        );
      } else {
        frames = spriteImporterRef.current.extractFramesManual(
          {
            frameWidth: spriteSettings.frameWidth,
            frameHeight: spriteSettings.frameHeight,
            columns: spriteSettings.columns || undefined,
            rows: spriteSettings.rows || undefined,
            totalFrames: spriteSettings.totalFrames || undefined,
            startIndex: spriteSettings.startIndex,
          },
          (progress, current, total) => {
            updateProgress(`프레임 분할 중... (${current}/${total})`, progress);
          }
        );
      }

      if (frames.length === 0) {
        hideProgress();
        alert('프레임을 분할할 수 없습니다. 설정을 확인해주세요.');
        return;
      }

      setExtractedFrames(frames);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert('프레임 분할 실패: ' + (error as Error).message);
    }
  }, [
    loadedSpriteMetadata,
    spriteSettings,
    showProgress,
    updateProgress,
    hideProgress,
    setExtractedFrames,
  ]);

  return (
    <>
      {/* 업로드 영역 */}
      <Card title="1. 스프라이트 시트 업로드">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadArea
            id="sprite-input"
            accept="image/*"
            icon="🖼️"
            title="스프라이트 시트 이미지 업로드"
            subtitle="지원 형식: PNG, JPG, WebP"
            hasFile={!!spriteFile}
            onFileSelect={handleSpriteFileSelect}
          />
          <UploadArea
            id="json-input"
            accept=".json"
            icon="📄"
            title="JSON 메타데이터 (선택사항)"
            subtitle="프레임 정보 자동 로드"
            hasFile={!!spriteMetadataFile}
            optional
            onFileSelect={handleJsonFileSelect}
          />
        </div>

        {spriteUrl && (
          <div className="mt-4 p-4 bg-bg rounded-lg text-center">
            <img
              src={spriteUrl}
              alt="Sprite Preview"
              className="max-w-full max-h-72 mx-auto rounded checkerboard"
            />
            {spriteImageInfo && (
              <p className="mt-2 text-sm text-slate-400">
                크기: {spriteImageInfo.width} x {spriteImageInfo.height} px
              </p>
            )}
          </div>
        )}
      </Card>

      {/* 프레임 설정 */}
      {spriteImageInfo && (
        <Card title="2. 프레임 분할 설정">
          {frameSuggestions.length > 0 && (
            <div className="mb-4 p-4 bg-bg rounded-lg">
              <p className="text-sm text-slate-400 mb-2">💡 추천 프레임 크기:</p>
              <div className="flex flex-wrap gap-2">
                {frameSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSpriteSettings({
                        frameWidth: s.width,
                        frameHeight: s.height,
                        columns: s.columns,
                        rows: s.rows,
                      })
                    }
                    className="px-3 py-1.5 text-xs border border-border rounded-md bg-bg-card hover:border-primary transition-colors"
                  >
                    <span className="font-semibold">
                      {s.width}x{s.height}
                    </span>
                    <span className="text-slate-400 ml-1">
                      ({s.columns}열 x {s.rows}행)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="프레임 너비 (px)"
              type="number"
              value={spriteSettings.frameWidth}
              onChange={(e) => setSpriteSettings({ frameWidth: parseInt(e.target.value) || 64 })}
              min={1}
            />
            <Input
              label="프레임 높이 (px)"
              type="number"
              value={spriteSettings.frameHeight}
              onChange={(e) => setSpriteSettings({ frameHeight: parseInt(e.target.value) || 64 })}
              min={1}
            />
            <Input
              label="열 수 (자동: 0)"
              type="number"
              value={spriteSettings.columns}
              onChange={(e) => setSpriteSettings({ columns: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label="행 수 (자동: 0)"
              type="number"
              value={spriteSettings.rows}
              onChange={(e) => setSpriteSettings({ rows: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label="총 프레임 수 (자동: 0)"
              type="number"
              value={spriteSettings.totalFrames}
              onChange={(e) => setSpriteSettings({ totalFrames: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label="시작 인덱스"
              type="number"
              value={spriteSettings.startIndex}
              onChange={(e) => setSpriteSettings({ startIndex: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <Button onClick={handleSplitSprite}>프레임 분할</Button>
        </Card>
      )}
    </>
  );
}

