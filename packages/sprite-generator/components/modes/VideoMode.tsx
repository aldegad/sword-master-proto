'use client';

import { useRef, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { VideoProcessor } from '@/lib/video-processor';
import { useTranslation } from '@/lib/i18n';

const videoProcessorRef = { current: null as VideoProcessor | null };

export function VideoMode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();

  const {
    videoFile,
    videoUrl,
    videoMetadata,
    setVideoFile,
    extractSettings,
    setExtractSettings,
    setExtractedFrames,
    showProgress,
    updateProgress,
    hideProgress,
  } = useAppStore();

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) {
        alert(t('videoMode.error.invalidFile'));
        return;
      }

      try {
        showProgress(t('videoMode.loading'));

        if (!videoProcessorRef.current) {
          videoProcessorRef.current = new VideoProcessor();
        }

        const result = await videoProcessorRef.current.loadVideo(file);
        setVideoFile(file, result.url, result.metadata);

        hideProgress();
      } catch (error) {
        hideProgress();
        alert(t('videoMode.error.loadFailed') + ': ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setVideoFile, t]
  );

  const handleExtractFrames = useCallback(async () => {
    if (!videoProcessorRef.current) return;

    try {
      showProgress(t('common.processing'), 0);

      const frames = await videoProcessorRef.current.extractFrames(
        extractSettings,
        (progress, current, total) => {
          updateProgress(`${t('common.processing')} (${current}/${total})`, progress);
        }
      );

      setExtractedFrames(frames);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert(t('videoMode.error.extractFailed') + ': ' + (error as Error).message);
    }
  }, [extractSettings, showProgress, updateProgress, hideProgress, setExtractedFrames, t]);

  return (
    <>
      {/* 업로드 영역 */}
      <Card title={t('videoMode.uploadTitle')}>
        <UploadArea
          id="video-input"
          accept="video/*"
          icon="📁"
          title={t('videoMode.uploadPlaceholder')}
          subtitle={t('videoMode.uploadFormats')}
          hasFile={!!videoFile}
          onFileSelect={handleFileSelect}
        />

        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-h-96 mt-4 rounded-lg bg-black"
          />
        )}
      </Card>

      {/* 추출 설정 */}
      {videoMetadata && (
        <Card title={t('videoMode.settingsTitle')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Input
              label={t('videoMode.fps')}
              type="number"
              value={extractSettings.fps}
              onChange={(e) => setExtractSettings({ fps: parseInt(e.target.value) || 12 })}
              min={1}
              max={60}
            />
            <Input
              label={t('videoMode.startTime')}
              type="number"
              value={extractSettings.startTime}
              onChange={(e) => setExtractSettings({ startTime: parseFloat(e.target.value) || 0 })}
              min={0}
              max={videoMetadata.duration}
              step={0.1}
            />
            <Input
              label={t('videoMode.endTime')}
              type="number"
              value={extractSettings.endTime}
              onChange={(e) => setExtractSettings({ endTime: parseFloat(e.target.value) || 0 })}
              min={0}
              max={videoMetadata.duration}
              step={0.1}
            />
            <Input
              label={t('videoMode.scale')}
              type="number"
              value={extractSettings.scale}
              onChange={(e) => setExtractSettings({ scale: parseInt(e.target.value) || 100 })}
              min={10}
              max={200}
            />
          </div>

          <Button onClick={handleExtractFrames}>{t('videoMode.extractButton')}</Button>
        </Card>
      )}
    </>
  );
}

