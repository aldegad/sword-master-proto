'use client';

import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { SpriteGenerator } from '@/lib/sprite-generator';

const spriteGeneratorRef = { current: null as SpriteGenerator | null };

export function SpriteResult() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { resultCanvas, resultMetadata, isPingpong } = useAppStore();

  useEffect(() => {
    if (!resultCanvas || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = resultCanvas.width;
    canvas.height = resultCanvas.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(resultCanvas, 0, 0);
  }, [resultCanvas]);

  const handleDownloadPng = () => {
    if (!resultCanvas) return;

    if (!spriteGeneratorRef.current) {
      spriteGeneratorRef.current = new SpriteGenerator();
    }

    spriteGeneratorRef.current.downloadCanvas(resultCanvas, 'spritesheet.png');
  };

  const handleDownloadJson = () => {
    if (!resultMetadata) return;

    if (!spriteGeneratorRef.current) {
      spriteGeneratorRef.current = new SpriteGenerator();
    }

    spriteGeneratorRef.current.downloadMetadata(resultMetadata, 'spritesheet.json');
  };

  if (!resultMetadata) return null;

  const enabledOriginalCount = resultMetadata.meta.totalFrames - (isPingpong ? resultMetadata.meta.totalFrames / 2 : 0);

  return (
    <Card title="4. 결과">
      {/* 캔버스 */}
      <div className="checkerboard rounded-lg p-4 overflow-auto max-h-[500px] mb-4">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>

      {/* 정보 */}
      <div className="bg-bg rounded-lg p-4 mb-4 font-mono text-sm">
        <strong>스프라이트 시트 정보:</strong>
        <br />
        크기: {resultMetadata.meta.size.width} x {resultMetadata.meta.size.height} px
        <br />
        프레임 크기: {resultMetadata.meta.frameWidth} x {resultMetadata.meta.frameHeight} px
        <br />
        배열: {resultMetadata.meta.columns} 열 x {resultMetadata.meta.rows} 행
        <br />
        총 프레임: {resultMetadata.meta.totalFrames}개
        {isPingpong && (
          <>
            <br />
            🔄 핑퐁 적용됨 ({enabledOriginalCount}개 → {resultMetadata.meta.totalFrames}개)
          </>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button onClick={handleDownloadPng} icon={<Download className="w-4 h-4" />}>
          PNG 다운로드
        </Button>
        <Button variant="secondary" onClick={handleDownloadJson}>
          JSON 메타데이터 다운로드
        </Button>
      </div>
    </Card>
  );
}

