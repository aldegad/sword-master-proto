'use client';

import { useRef, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { VideoProcessor } from '@/lib/video-processor';

const videoProcessorRef = { current: null as VideoProcessor | null };

export function VideoMode() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
        alert('동영상 파일만 업로드할 수 있습니다.');
        return;
      }

      try {
        showProgress('동영상 로딩 중...');

        if (!videoProcessorRef.current) {
          videoProcessorRef.current = new VideoProcessor();
        }

        const result = await videoProcessorRef.current.loadVideo(file);
        setVideoFile(file, result.url, result.metadata);

        hideProgress();
      } catch (error) {
        hideProgress();
        alert('동영상 로드 실패: ' + (error as Error).message);
      }
    },
    [showProgress, hideProgress, setVideoFile]
  );

  const handleExtractFrames = useCallback(async () => {
    if (!videoProcessorRef.current) return;

    try {
      showProgress('프레임 추출 중...', 0);

      const frames = await videoProcessorRef.current.extractFrames(
        extractSettings,
        (progress, current, total) => {
          updateProgress(`프레임 추출 중... (${current}/${total})`, progress);
        }
      );

      setExtractedFrames(frames);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert('프레임 추출 실패: ' + (error as Error).message);
    }
  }, [extractSettings, showProgress, updateProgress, hideProgress, setExtractedFrames]);

  return (
    <>
      {/* 업로드 영역 */}
      <Card title="1. 동영상 업로드">
        <UploadArea
          id="video-input"
          accept="video/*"
          icon="📁"
          title="동영상 파일을 드래그하거나 클릭하여 선택"
          subtitle="지원 형식: MP4, WebM, MOV"
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
        <Card title="2. 프레임 추출 설정">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Input
              label="FPS (초당 프레임 수)"
              type="number"
              value={extractSettings.fps}
              onChange={(e) => setExtractSettings({ fps: parseInt(e.target.value) || 12 })}
              min={1}
              max={60}
            />
            <Input
              label="시작 시간 (초)"
              type="number"
              value={extractSettings.startTime}
              onChange={(e) => setExtractSettings({ startTime: parseFloat(e.target.value) || 0 })}
              min={0}
              max={videoMetadata.duration}
              step={0.1}
            />
            <Input
              label="종료 시간 (초)"
              type="number"
              value={extractSettings.endTime}
              onChange={(e) => setExtractSettings({ endTime: parseFloat(e.target.value) || 0 })}
              min={0}
              max={videoMetadata.duration}
              step={0.1}
            />
            <Input
              label="스케일 (%)"
              type="number"
              value={extractSettings.scale}
              onChange={(e) => setExtractSettings({ scale: parseInt(e.target.value) || 100 })}
              min={10}
              max={200}
            />
          </div>

          <Button onClick={handleExtractFrames}>프레임 추출</Button>
        </Card>
      )}
    </>
  );
}

