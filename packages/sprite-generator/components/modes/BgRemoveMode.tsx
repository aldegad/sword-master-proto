'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Download, RefreshCw, ImagePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Button } from '@/components/common/Button';
import { Select, RangeInput } from '@/components/common/Input';
import { PixelArtSettings } from '@/components/shared/PixelArtSettings';
import { ResultAd } from '@/components/common/AdBanner';
import { useAppStore } from '@/store/useAppStore';
import { BackgroundRemover } from '@/lib/background-remover';
import { useTranslation } from '@/lib/i18n';
import type { ModelSize } from '@/types';

const backgroundRemoverRef = { current: null as BackgroundRemover | null };

export function BgRemoveMode() {
  const { t } = useTranslation();

  const MODEL_OPTIONS: { value: ModelSize; name: string; desc: string; speed: string }[] = [
    { value: 'small', name: t('bgRemoveMode.models.small.name'), desc: t('bgRemoveMode.models.small.desc'), speed: t('bgRemoveMode.models.small.speed') },
    { value: 'medium', name: t('bgRemoveMode.models.medium.name'), desc: t('bgRemoveMode.models.medium.desc'), speed: t('bgRemoveMode.models.medium.speed') },
    { value: 'large', name: t('bgRemoveMode.models.large.name'), desc: t('bgRemoveMode.models.large.desc'), speed: t('bgRemoveMode.models.large.speed') },
  ];
  const [resultView, setResultView] = useState<'result' | 'compare' | 'split'>('result');
  const [compareValue, setCompareValue] = useState(50);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);

  const {
    bgRemoveFile,
    bgRemoveUrl,
    bgRemoveImageInfo,
    setBgRemoveFile,
    bgRemoveOptions,
    setBgRemoveOptions,
    bgRemoveResult,
    setBgRemoveResult,
    showProgress,
    hideProgress,
  } = useAppStore();

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert(t('bgRemoveMode.error.invalidFile'));
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        setBgRemoveFile(file, url, { width: img.width, height: img.height });
      };
      
      img.src = url;
    },
    [setBgRemoveFile]
  );

  const handleRunBgRemove = useCallback(async () => {
    if (!bgRemoveFile) {
      alert(t('bgRemoveMode.error.noImage'));
      return;
    }

    try {
      const modelName = MODEL_OPTIONS.find(m => m.value === (bgRemoveOptions.model || 'medium'))?.name || 'Medium';
      showProgress(`${t('bgRemoveMode.processing')} (${modelName})`);

      if (!backgroundRemoverRef.current) {
        backgroundRemoverRef.current = new BackgroundRemover();
      }

      const result = await backgroundRemoverRef.current.removeBackgroundFromImage(
        bgRemoveFile,
        bgRemoveOptions
      );

      setBgRemoveResult(result);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert(t('bgRemoveMode.error.failed') + ': ' + (error as Error).message);
      console.error(error);
    }
  }, [bgRemoveFile, bgRemoveOptions, showProgress, hideProgress, setBgRemoveResult, t, MODEL_OPTIONS]);

  const handleDownload = useCallback(() => {
    if (!bgRemoveResult || !backgroundRemoverRef.current) return;

    const format = bgRemoveOptions.outputFormat || 'image/png';
    const ext = format === 'image/webp' ? 'webp' : 'png';
    const filename = bgRemoveFile
      ? bgRemoveFile.name.replace(/\.[^/.]+$/, '') + '_nobg.' + ext
      : 'result.' + ext;

    backgroundRemoverRef.current.downloadResult(
      bgRemoveResult.canvas,
      filename,
      format,
      bgRemoveOptions.outputQuality || 1
    );
  }, [bgRemoveResult, bgRemoveFile, bgRemoveOptions]);

  const handleReset = useCallback(() => {
    setBgRemoveFile(null, null, null);
    setBgRemoveResult(null);
  }, [setBgRemoveFile, setBgRemoveResult]);

  // 결과 캔버스 그리기
  useEffect(() => {
    if (!bgRemoveResult || !resultCanvasRef.current) return;
    if (resultView !== 'result') return; // 결과 뷰일 때만 그리기

    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = bgRemoveResult.canvas.width;
    canvas.height = bgRemoveResult.canvas.height;

    // 체크보드 패턴 (픽셀 아트 모드면 블록 크기 사용)
    const gridSize = bgRemoveOptions.isManualPixelArt 
      ? (bgRemoveOptions.pixelBlockSize || 1) 
      : 10;
    drawCheckerboard(ctx, canvas.width, canvas.height, gridSize);
    ctx.drawImage(bgRemoveResult.canvas, 0, 0);
    
    // 픽셀 아트 모드면 격자선 그리기
    if (bgRemoveOptions.isManualPixelArt && gridSize > 1) {
      drawGrid(ctx, canvas.width, canvas.height, gridSize);
    }
  }, [bgRemoveResult, bgRemoveOptions.isManualPixelArt, bgRemoveOptions.pixelBlockSize, resultView]);

  // 비교 뷰 그리기
  useEffect(() => {
    if (!bgRemoveResult || !compareCanvasRef.current || !originalImgRef.current) return;
    if (resultView !== 'compare') return;

    const canvas = compareCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = originalImgRef.current;

    canvas.width = Math.max(img.naturalWidth, bgRemoveResult.canvas.width);
    canvas.height = Math.max(img.naturalHeight, bgRemoveResult.canvas.height);

    const splitX = Math.floor(canvas.width * (compareValue / 100));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard(ctx, canvas.width, canvas.height);

    // 결과 이미지
    ctx.drawImage(bgRemoveResult.canvas, 0, 0);

    // 원본 이미지 (왼쪽만)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, canvas.height);
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 분할선
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, canvas.height);
    ctx.stroke();
  }, [bgRemoveResult, resultView, compareValue]);

  return (
    <>
      {/* 업로드 */}
      <Card title={t('bgRemoveMode.uploadTitle')}>
        <UploadArea
          id="bg-remove-input"
          accept="image/*"
          icon="🖼️"
          title={t('bgRemoveMode.uploadPlaceholder')}
          subtitle={t('bgRemoveMode.uploadFormats')}
          hasFile={!!bgRemoveFile}
          onFileSelect={handleFileSelect}
        />

        {bgRemoveUrl && (
          <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex-1 max-w-sm">
              <h4 className="text-center text-sm text-slate-400 mb-2">{t('bgRemoveMode.originalImage')}</h4>
              <div className="checkerboard rounded-lg p-2">
                <img
                  ref={originalImgRef}
                  src={bgRemoveUrl}
                  alt="Original"
                  className="max-w-full max-h-60 mx-auto rounded"
                />
              </div>
            </div>
            <div className="text-2xl text-primary">→</div>
            <div className="flex-1 max-w-sm">
              <h4 className="text-center text-sm text-slate-400 mb-2">{t('bgRemoveMode.resultPreview')}</h4>
              <div className="checkerboard rounded-lg p-2 min-h-[150px] flex items-center justify-center">
                {bgRemoveResult ? (
                  <img
                    src={bgRemoveResult.dataUrl}
                    alt="Result"
                    className="max-w-full max-h-60 mx-auto rounded"
                  />
                ) : (
                  <span className="text-sm text-slate-500">{t('bgRemoveMode.resultPlaceholder')}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {bgRemoveImageInfo && (
          <p className="text-center text-sm text-slate-400 mt-4">
            {t('bgRemoveMode.size')}: {bgRemoveImageInfo.width} x {bgRemoveImageInfo.height} px
          </p>
        )}
      </Card>

      {/* 옵션 */}
      {bgRemoveFile && !bgRemoveResult && (
        <Card title={t('bgRemoveMode.optionsTitle')} badge="AI">
          {/* 모델 선택 */}
          <div className="bg-bg rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-1">{t('bgRemoveMode.modelTitle')}</h3>
            <p className="text-xs text-slate-400 mb-3">
              {t('bgRemoveMode.modelDescription')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {MODEL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={clsx(
                    'cursor-pointer p-3 rounded-lg border-2 text-center transition-all',
                    bgRemoveOptions.model === opt.value
                      ? 'border-primary bg-primary/15'
                      : 'border-border hover:border-primary'
                  )}
                >
                  <input
                    type="radio"
                    name="model"
                    value={opt.value}
                    checked={bgRemoveOptions.model === opt.value}
                    onChange={() => setBgRemoveOptions({ model: opt.value })}
                    className="hidden"
                  />
                  <div className="font-bold">{opt.name}</div>
                  <div className="text-xs text-slate-400">{opt.desc}</div>
                  <div className="text-xs text-slate-500 mt-1">{opt.speed}</div>
                </label>
              ))}
            </div>
          </div>

          {/* 출력 설정 */}
          <div className="bg-bg rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">{t('bgRemoveMode.outputTitle')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('bgRemoveMode.outputFormat')}
                options={[
                  { value: 'image/png', label: t('bgRemoveMode.formatPng') },
                  { value: 'image/webp', label: t('bgRemoveMode.formatWebp') },
                ]}
                value={bgRemoveOptions.outputFormat}
                onChange={(e) =>
                  setBgRemoveOptions({ outputFormat: e.target.value as 'image/png' | 'image/webp' })
                }
              />
              <RangeInput
                label={t('bgRemoveMode.outputQuality')}
                min={0.5}
                max={1}
                step={0.05}
                value={bgRemoveOptions.outputQuality}
                displayValue={`${Math.round((bgRemoveOptions.outputQuality || 0.95) * 100)}%`}
                onChange={(e) => setBgRemoveOptions({ outputQuality: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* 🎮 픽셀 아트 설정 - 메인 섹션 (공통 컴포넌트) */}
          <div className="bg-bg rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">🎮</span>
              <h3 className="text-sm font-semibold">{t('bgRemoveMode.pixelArtTitle')}</h3>
            </div>

            <PixelArtSettings
              options={bgRemoveOptions}
              onChange={(newOptions) => setBgRemoveOptions(newOptions)}
            />
          </div>

          {/* 고급 설정 */}
          <div className="bg-bg rounded-xl p-4 mb-6">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold"
            >
              <span>{t('bgRemoveMode.advancedTitle')}</span>
              <span className={clsx('transition-transform', isAdvancedOpen && 'rotate-180')}>
                ▼
              </span>
            </button>

            {isAdvancedOpen && (
              <div className="mt-4 space-y-4">
                <Select
                  label={t('bgRemoveMode.device')}
                  options={[
                    { value: 'gpu', label: t('bgRemoveMode.deviceGpu') },
                    { value: 'cpu', label: t('bgRemoveMode.deviceCpu') },
                  ]}
                  value={bgRemoveOptions.device}
                  onChange={(e) =>
                    setBgRemoveOptions({ device: e.target.value as 'gpu' | 'cpu' })
                  }
                />

                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm text-slate-400 mb-3">🎨 {t('bgRemoveMode.postProcessing')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <RangeInput
                      label={t('bgRemoveMode.foregroundThreshold')}
                      min={0}
                      max={1}
                      step={0.01}
                      value={bgRemoveOptions.foregroundThreshold}
                      displayValue={(bgRemoveOptions.foregroundThreshold || 0.5).toFixed(2)}
                      hint={t('bgRemoveMode.foregroundThresholdHint')}
                      onChange={(e) =>
                        setBgRemoveOptions({ foregroundThreshold: parseFloat(e.target.value) })
                      }
                    />
                    <RangeInput
                      label={t('bgRemoveMode.edgeBlur')}
                      min={0}
                      max={10}
                      step={0.5}
                      value={bgRemoveOptions.edgeBlur}
                      displayValue={`${bgRemoveOptions.edgeBlur || 0}px`}
                      hint={t('bgRemoveMode.edgeBlurHint')}
                      onChange={(e) =>
                        setBgRemoveOptions({ edgeBlur: parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bgRemoveOptions.trimTransparent}
                        onChange={(e) =>
                          setBgRemoveOptions({ trimTransparent: e.target.checked })
                        }
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm">{t('bgRemoveMode.trimTransparent')}</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgRemoveOptions.backgroundColor}
                        onChange={(e) =>
                          setBgRemoveOptions({ backgroundColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border border-border cursor-pointer"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bgRemoveOptions.useBackgroundColor}
                          onChange={(e) =>
                            setBgRemoveOptions({ useBackgroundColor: e.target.checked })
                          }
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">{t('bgRemoveMode.backgroundColor')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button size="lg" onClick={handleRunBgRemove} icon={<Sparkles className="w-5 h-5" />}>
            {t('bgRemoveMode.runButton')}
          </Button>
        </Card>
      )}

      {/* 결과 */}
      {bgRemoveResult && (
        <Card title={t('bgRemoveMode.resultTitle')}>
          <div className="bg-bg rounded-xl overflow-hidden">
            {/* 탭 */}
            <div className="flex border-b border-border">
              {(['result', 'compare', 'split'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setResultView(view)}
                  className={clsx(
                    'flex-1 py-3 text-sm transition-colors',
                    resultView === view
                      ? 'bg-primary/15 text-white border-b-2 border-primary'
                      : 'text-slate-400 hover:bg-primary/10'
                  )}
                >
                  {view === 'result' && t('bgRemoveMode.resultTabs.result')}
                  {view === 'compare' && t('bgRemoveMode.resultTabs.compare')}
                  {view === 'split' && t('bgRemoveMode.resultTabs.split')}
                </button>
              ))}
            </div>

            {/* 뷰 */}
            <div className="p-4">
              {resultView === 'result' && (
                <div className="checkerboard rounded-lg p-4">
                  <canvas ref={resultCanvasRef} className="max-w-full h-auto mx-auto rounded" />
                </div>
              )}

              {resultView === 'compare' && (
                <div className="relative">
                  <div className="checkerboard rounded-lg p-4">
                    <canvas
                      ref={compareCanvasRef}
                      className="max-w-full h-auto mx-auto rounded"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compareValue}
                    onChange={(e) => setCompareValue(parseInt(e.target.value))}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 max-w-sm"
                  />
                </div>
              )}

              {resultView === 'split' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {t('bgRemoveMode.original')}
                    </span>
                    <img
                      src={bgRemoveUrl!}
                      alt="Original"
                      className="w-full h-auto rounded checkerboard"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {t('bgRemoveMode.result')}
                    </span>
                    <img
                      src={bgRemoveResult.dataUrl}
                      alt="Result"
                      className="w-full h-auto rounded checkerboard"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 처리 정보 */}
          <div className="bg-bg rounded-lg p-4 my-4 font-mono text-sm">
            <strong>{t('bgRemoveMode.processingInfoTitle')}:</strong>
            <br />
            {t('bgRemoveMode.model')}: {MODEL_OPTIONS.find((m) => m.value === bgRemoveOptions.model)?.name} |
            {t('bgRemoveMode.time')}: {(bgRemoveResult.processingTime / 1000).toFixed(2)}s |
            {t('bgRemoveMode.size')}: {bgRemoveResult.resultWidth}x{bgRemoveResult.resultHeight}
            {bgRemoveOptions.trimTransparent && ` (${t('bgRemoveMode.trimApplied')})`}
          </div>

          {/* 결과 광고 */}
          <ResultAd />

          {/* 버튼 */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
              {t('bgRemoveMode.downloadPng')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setBgRemoveResult(null)}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {t('bgRemoveMode.retry')}
            </Button>
            <Button variant="secondary" onClick={handleReset} icon={<ImagePlus className="w-4 h-4" />}>
              {t('bgRemoveMode.newImage')}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number = 10
) {
  const colors = ['#1e293b', '#0f172a'];
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = colors[((x / size + y / size) % 2 === 0 ? 0 : 1)];
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  
  // 수직선
  for (let x = 0; x <= width; x += size) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  
  // 수평선
  for (let y = 0; y <= height; y += size) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
}

