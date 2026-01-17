'use client';

import { useCallback, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { SpriteImporter } from '@/lib/sprite-importer';
import { useTranslation } from '@/lib/i18n';

const spriteImporterRef = { current: null as SpriteImporter | null };

export function SpriteMode() {
  const { t } = useTranslation();
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
        alert(t('spriteMode.error.invalidFile'));
        return;
      }

      try {
        showProgress(t('common.processing'));

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
        alert(t('spriteMode.error.loadFailed') + ': ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setSpriteFile, setFrameSuggestions, setSpriteSettings, t]
  );

  const handleJsonFileSelect = useCallback(
    async (file: File) => {
      try {
        showProgress(t('common.processing'));

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
        alert(t('spriteResult.metadataLoaded'));
      } catch (error) {
        hideProgress();
        alert(t('spriteMode.error.jsonLoadFailed') + ': ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setSpriteMetadata, setSpriteSettings, t]
  );

  const handleSplitSprite = useCallback(async () => {
    if (!spriteImporterRef.current) return;

    try {
      showProgress(t('common.processing'), 0);

      let frames;

      if (loadedSpriteMetadata && loadedSpriteMetadata.frames.length > 0) {
        frames = spriteImporterRef.current.extractFramesFromMetadata(
          loadedSpriteMetadata,
          (progress, current, total) => {
            updateProgress(`${t('common.processing')} (${current}/${total})`, progress);
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
            updateProgress(`${t('common.processing')} (${current}/${total})`, progress);
          }
        );
      }

      if (frames.length === 0) {
        hideProgress();
        alert(t('spriteMode.error.noFrames'));
        return;
      }

      setExtractedFrames(frames);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert(t('spriteMode.error.splitFailed') + ': ' + (error as Error).message);
    }
  }, [
    loadedSpriteMetadata,
    spriteSettings,
    showProgress,
    updateProgress,
    hideProgress,
    setExtractedFrames,
    t,
  ]);

  return (
    <>
      {/* 업로드 영역 */}
      <Card title={t('spriteMode.uploadTitle')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadArea
            id="sprite-input"
            accept="image/*"
            icon="🖼️"
            title={t('spriteMode.uploadPlaceholder')}
            subtitle={t('spriteMode.uploadFormats')}
            hasFile={!!spriteFile}
            onFileSelect={handleSpriteFileSelect}
          />
          <UploadArea
            id="json-input"
            accept=".json"
            icon="📄"
            title={t('spriteMode.jsonTitle')}
            subtitle={t('spriteMode.jsonSubtitle')}
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
                {t('spriteMode.size')}: {spriteImageInfo.width} x {spriteImageInfo.height} px
              </p>
            )}
          </div>
        )}
      </Card>

      {/* 프레임 설정 */}
      {spriteImageInfo && (
        <Card title={t('spriteMode.settingsTitle')}>
          {frameSuggestions.length > 0 && (
            <div className="mb-4 p-4 bg-bg rounded-lg">
              <p className="text-sm text-slate-400 mb-2">💡 {t('spriteMode.suggestedFrames')}:</p>
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
                      ({s.columns} x {s.rows})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <Input
              label={t('spriteMode.frameWidth')}
              type="number"
              value={spriteSettings.frameWidth}
              onChange={(e) => setSpriteSettings({ frameWidth: parseInt(e.target.value) || 64 })}
              min={1}
            />
            <Input
              label={t('spriteMode.frameHeight')}
              type="number"
              value={spriteSettings.frameHeight}
              onChange={(e) => setSpriteSettings({ frameHeight: parseInt(e.target.value) || 64 })}
              min={1}
            />
            <Input
              label={t('spriteMode.columns')}
              type="number"
              value={spriteSettings.columns}
              onChange={(e) => setSpriteSettings({ columns: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label={t('spriteMode.rows')}
              type="number"
              value={spriteSettings.rows}
              onChange={(e) => setSpriteSettings({ rows: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label={t('spriteMode.totalFrames')}
              type="number"
              value={spriteSettings.totalFrames}
              onChange={(e) => setSpriteSettings({ totalFrames: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <Input
              label={t('spriteMode.startIndex')}
              type="number"
              value={spriteSettings.startIndex}
              onChange={(e) => setSpriteSettings({ startIndex: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <Button onClick={handleSplitSprite}>{t('spriteMode.parseButton')}</Button>
        </Card>
      )}
    </>
  );
}

