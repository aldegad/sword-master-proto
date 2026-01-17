'use client';

import { useCallback, useState, useRef } from 'react';
import { Download, RefreshCw, ImagePlus, Check, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/common/Card';
import { UploadArea } from '@/components/common/UploadArea';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/lib/i18n';
import type { ExpoAssetConfig, ExpoAssetResult } from '@/types';

export function ExpoAssetsMode() {
  const { t } = useTranslation();

  // Expo 앱 에셋 설정
  const EXPO_ASSETS: ExpoAssetConfig[] = [
    { name: 'icon.png', width: 1024, height: 1024, description: t('expoAssetsMode.assets.icon') },
    { name: 'splash.png', width: 1242, height: 2436, description: t('expoAssetsMode.assets.splash') },
    { name: 'adaptive-icon.png', width: 1024, height: 1024, description: t('expoAssetsMode.assets.adaptiveIcon') },
    { name: 'favicon.png', width: 48, height: 48, description: t('expoAssetsMode.assets.favicon') },
    { name: 'notification-icon.png', width: 96, height: 96, description: t('expoAssetsMode.assets.notification') },
  ];
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(
    new Set(EXPO_ASSETS.map((a) => a.name))
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    expoSvgFile,
    expoSvgUrl,
    expoSvgInfo,
    setExpoSvgFile,
    expoAssetResults,
    setExpoAssetResults,
    showProgress,
    updateProgress,
    hideProgress,
    resetExpoAssetsMode,
  } = useAppStore();

  const handleFileSelect = useCallback(
    async (file: File) => {
      // SVG 또는 이미지 파일 허용
      const isValidType = file.type === 'image/svg+xml' || file.type.startsWith('image/');
      if (!isValidType) {
        alert(t('expoAssetsMode.error.invalidFile'));
        return;
      }

      const url = URL.createObjectURL(file);

      if (file.type === 'image/svg+xml') {
        // SVG 파일의 경우 텍스트로 읽어서 viewBox에서 크기 추출
        const text = await file.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        let width = 100;
        let height = 100;

        if (svgElement) {
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/[\s,]+/);
            if (parts.length >= 4) {
              width = parseFloat(parts[2]) || 100;
              height = parseFloat(parts[3]) || 100;
            }
          } else {
            width = parseFloat(svgElement.getAttribute('width') || '100');
            height = parseFloat(svgElement.getAttribute('height') || '100');
          }
        }

        setExpoSvgFile(file, url, { width, height });
      } else {
        // 일반 이미지 파일
        const img = new Image();
        img.onload = () => {
          setExpoSvgFile(file, url, { width: img.width, height: img.height });
        };
        img.src = url;
      }
    },
    [setExpoSvgFile]
  );

  const toggleAsset = (name: string) => {
    const newSet = new Set(selectedAssets);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setSelectedAssets(newSet);
  };

  const selectAll = () => {
    setSelectedAssets(new Set(EXPO_ASSETS.map((a) => a.name)));
  };

  const deselectAll = () => {
    setSelectedAssets(new Set());
  };

  const generateAssets = useCallback(async () => {
    if (!expoSvgFile || !expoSvgUrl) {
      alert(t('expoAssetsMode.error.noFile'));
      return;
    }

    if (selectedAssets.size === 0) {
      alert(t('expoAssetsMode.error.noAssets'));
      return;
    }

    setIsGenerating(true);
    showProgress(t('expoAssetsMode.generating'));

    try {
      const results: ExpoAssetResult[] = [];
      const assetsToGenerate = EXPO_ASSETS.filter((a) => selectedAssets.has(a.name));

      // 원본 이미지 로드
      const sourceImg = new Image();
      sourceImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        sourceImg.onload = () => resolve();
        sourceImg.onerror = () => reject(new Error(t('expoAssetsMode.error.loadFailed')));
        sourceImg.src = expoSvgUrl;
      });

      for (let i = 0; i < assetsToGenerate.length; i++) {
        const asset = assetsToGenerate[i];
        updateProgress(`${t('expoAssetsMode.generatingAsset', { name: asset.name, current: i + 1, total: assetsToGenerate.length })}`, ((i + 1) / assetsToGenerate.length) * 100);

        const canvas = document.createElement('canvas');
        canvas.width = asset.width;
        canvas.height = asset.height;
        const ctx = canvas.getContext('2d')!;

        // 배경색 (투명)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 이미지 비율 계산하여 중앙 배치
        const sourceRatio = sourceImg.width / sourceImg.height;
        const targetRatio = asset.width / asset.height;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (asset.name === 'splash.png') {
          // 스플래시는 중앙에 적절한 크기로 배치 (화면의 40% 정도)
          const maxSize = Math.min(asset.width, asset.height) * 0.4;
          if (sourceRatio > 1) {
            drawWidth = maxSize;
            drawHeight = maxSize / sourceRatio;
          } else {
            drawHeight = maxSize;
            drawWidth = maxSize * sourceRatio;
          }
          offsetX = (asset.width - drawWidth) / 2;
          offsetY = (asset.height - drawHeight) / 2;
        } else {
          // 아이콘은 꽉 채우기 (비율 유지)
          if (sourceRatio > targetRatio) {
            drawWidth = asset.width;
            drawHeight = asset.width / sourceRatio;
          } else {
            drawHeight = asset.height;
            drawWidth = asset.height * sourceRatio;
          }
          offsetX = (asset.width - drawWidth) / 2;
          offsetY = (asset.height - drawHeight) / 2;
        }

        ctx.drawImage(sourceImg, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL('image/png');
        results.push({
          name: asset.name,
          dataUrl,
          width: asset.width,
          height: asset.height,
        });
      }

      setExpoAssetResults(results);
      hideProgress();
    } catch (error) {
      hideProgress();
      alert(t('expoAssetsMode.error.generateFailed') + ': ' + (error as Error).message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [expoSvgFile, expoSvgUrl, selectedAssets, showProgress, updateProgress, hideProgress, setExpoAssetResults, t, EXPO_ASSETS]);

  const downloadAsZip = useCallback(async () => {
    if (expoAssetResults.length === 0) return;

    showProgress(t('expoAssetsMode.creatingZip'));

    try {
      // JSZip 동적 로드
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // assets 폴더 생성
      const assetsFolder = zip.folder('assets');

      for (const result of expoAssetResults) {
        // data URL에서 base64 데이터 추출
        const base64Data = result.dataUrl.split(',')[1];
        assetsFolder!.file(result.name, base64Data, { base64: true });
      }

      // README.txt 추가
      const readme = `Expo App Assets
================

Generated by Sprite Generator

Files:
${expoAssetResults.map((r) => `- ${r.name} (${r.width}x${r.height})`).join('\n')}

Usage:
1. Copy the assets folder to your Expo project root
2. Update app.json or app.config.js:

{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "notification": {
      "icon": "./assets/notification-icon.png"
    }
  }
}
`;
      zip.file('README.txt', readme);

      // ZIP 생성 및 다운로드
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'expo-assets.zip';
      link.click();
      URL.revokeObjectURL(url);

      hideProgress();
    } catch (error) {
      hideProgress();
      alert(t('expoAssetsMode.error.zipFailed') + ': ' + (error as Error).message);
      console.error(error);
    }
  }, [expoAssetResults, showProgress, hideProgress, t]);

  const downloadSingle = (result: ExpoAssetResult) => {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = result.name;
    link.click();
  };

  const handleReset = () => {
    resetExpoAssetsMode();
  };

  return (
    <>
      {/* 업로드 */}
      <Card title={t('expoAssetsMode.uploadTitle')}>
        <UploadArea
          id="expo-svg-input"
          accept="image/svg+xml,image/*"
          icon="📱"
          title={t('expoAssetsMode.uploadPlaceholder')}
          subtitle={t('expoAssetsMode.uploadFormats')}
          hasFile={!!expoSvgFile}
          onFileSelect={handleFileSelect}
        />

        {expoSvgUrl && (
          <div className="mt-6 flex flex-col items-center">
            <h4 className="text-sm text-slate-400 mb-2">{t('expoAssetsMode.originalImage')}</h4>
            <div className="checkerboard rounded-lg p-4 inline-block">
              <img
                src={expoSvgUrl}
                alt="Source"
                className="max-w-[200px] max-h-[200px] mx-auto"
              />
            </div>
            {expoSvgInfo && (
              <p className="text-sm text-slate-400 mt-2">
                {t('expoAssetsMode.size')}: {expoSvgInfo.width} x {expoSvgInfo.height}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* 에셋 선택 */}
      {expoSvgFile && expoAssetResults.length === 0 && (
        <Card title={t('expoAssetsMode.settingsTitle')}>
          <div className="mb-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={selectAll}>
              {t('expoAssetsMode.selectAll')}
            </Button>
            <Button size="sm" variant="secondary" onClick={deselectAll}>
              {t('expoAssetsMode.deselectAll')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPO_ASSETS.map((asset) => (
              <label
                key={asset.name}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedAssets.has(asset.name)
                    ? 'border-primary bg-primary/15'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedAssets.has(asset.name)}
                  onChange={() => toggleAsset(asset.name)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{asset.name}</div>
                  <div className="text-xs text-slate-400">{asset.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <Button
              size="lg"
              onClick={generateAssets}
              disabled={isGenerating || selectedAssets.size === 0}
              icon={<Package className="w-5 h-5" />}
            >
              {isGenerating ? t('expoAssetsMode.generatingBtn') : t('expoAssetsMode.generateButton', { count: selectedAssets.size })}
            </Button>
          </div>
        </Card>
      )}

      {/* 결과 */}
      {expoAssetResults.length > 0 && (
        <Card title={t('expoAssetsMode.resultTitle')}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {expoAssetResults.map((result) => (
              <div
                key={result.name}
                className="bg-bg rounded-xl p-3 text-center group relative"
              >
                <div className="checkerboard rounded-lg p-2 mb-2 aspect-square flex items-center justify-center">
                  <img
                    src={result.dataUrl}
                    alt={result.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="text-xs font-medium truncate" title={result.name}>
                  {result.name}
                </div>
                <div className="text-xs text-slate-500">
                  {result.width}x{result.height}
                </div>
                <button
                  onClick={() => downloadSingle(result)}
                  className="absolute top-2 right-2 p-1.5 bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('expoAssetsMode.downloadSingle')}
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadAsZip} icon={<Download className="w-4 h-4" />}>
              {t('expoAssetsMode.downloadAll')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setExpoAssetResults([])}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {t('expoAssetsMode.retry')}
            </Button>
            <Button variant="secondary" onClick={handleReset} icon={<ImagePlus className="w-4 h-4" />}>
              {t('expoAssetsMode.newImage')}
            </Button>
          </div>

          {/* app.json 예시 */}
          <div className="mt-6 bg-bg rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              {t('expoAssetsMode.configExample')}
            </h4>
            <pre className="text-xs text-slate-400 overflow-x-auto">
{`{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}`}
            </pre>
          </div>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}

