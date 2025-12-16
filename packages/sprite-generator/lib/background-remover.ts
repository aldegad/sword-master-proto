import type {
  ExtractedFrame,
  ModelSize,
  BackgroundRemovalOptions,
  SingleImageResult,
} from '@/types';

/**
 * 모델 크기를 라이브러리 모델 이름으로 변환
 */
function modelSizeToLibraryModel(size: ModelSize): 'isnet' | 'isnet_fp16' | 'isnet_quint8' {
  const modelMap: Record<ModelSize, 'isnet' | 'isnet_fp16' | 'isnet_quint8'> = {
    small: 'isnet_quint8',
    medium: 'isnet_fp16',
    large: 'isnet',
  };
  return modelMap[size];
}

/**
 * AI 기반 배경 제거 클래스
 * @imgly/background-removal 라이브러리 사용
 */
export class BackgroundRemover {
  private removeBackground: typeof import('@imgly/background-removal').removeBackground | null = null;
  private isInitialized = false;
  private currentModel: string | null = null;

  /**
   * 라이브러리 초기화 (지연 로딩)
   */
  async initialize(model: string = 'medium'): Promise<void> {
    if (this.isInitialized && this.currentModel === model) return;

    try {
      const module = await import('@imgly/background-removal');
      this.removeBackground = module.removeBackground;
      this.isInitialized = true;
      this.currentModel = model;
    } catch (error) {
      console.error('배경 제거 라이브러리 로드 실패:', error);
      throw new Error('배경 제거 기능을 초기화할 수 없습니다.');
    }
  }

  /**
   * 단일 이미지에서 배경 제거
   */
  async removeBackgroundFromImage(
    imageSource: Blob | File | HTMLCanvasElement | string,
    options: BackgroundRemovalOptions = {}
  ): Promise<SingleImageResult> {
    const startTime = performance.now();

    const {
      model = 'medium',
      device = 'gpu',
      outputFormat = 'image/png',
      outputQuality = 0.95,
      foregroundThreshold = 0.5,
      edgeBlur = 0,
      trimTransparent = false,
      useBackgroundColor = false,
      backgroundColor = '#ffffff',
    } = options;

    await this.initialize(model);

    if (!this.removeBackground) {
      throw new Error('배경 제거 라이브러리가 초기화되지 않았습니다.');
    }

    // 입력 소스를 Blob으로 변환
    let inputBlob: Blob;
    let originalWidth: number;
    let originalHeight: number;

    if (imageSource instanceof Blob || imageSource instanceof File) {
      inputBlob = imageSource;
      const dimensions = await this.getImageDimensions(imageSource);
      originalWidth = dimensions.width;
      originalHeight = dimensions.height;
    } else if (imageSource instanceof HTMLCanvasElement) {
      inputBlob = await this.canvasToBlob(imageSource);
      originalWidth = imageSource.width;
      originalHeight = imageSource.height;
    } else if (typeof imageSource === 'string') {
      const response = await fetch(imageSource);
      inputBlob = await response.blob();
      const dimensions = await this.getImageDimensions(inputBlob);
      originalWidth = dimensions.width;
      originalHeight = dimensions.height;
    } else {
      throw new Error('지원하지 않는 이미지 소스 형식입니다.');
    }

    // 배경 제거 옵션 구성
    const removalConfig: Parameters<typeof this.removeBackground>[1] = {
      model: modelSizeToLibraryModel(model),
      device: device,
      output: {
        format: outputFormat,
        quality: outputQuality,
      },
    };

    // 배경 제거 실행
    const resultBlob = await this.removeBackground(inputBlob, removalConfig);

    // 결과를 Canvas로 변환
    let resultCanvas = await this.blobToCanvas(resultBlob);

    // 후처리 적용
    resultCanvas = await this.applyPostProcessing(resultCanvas, {
      foregroundThreshold,
      edgeBlur,
      trimTransparent,
      useBackgroundColor,
      backgroundColor,
    });

    const processingTime = performance.now() - startTime;

    return {
      canvas: resultCanvas,
      dataUrl: resultCanvas.toDataURL(outputFormat, outputQuality),
      originalWidth,
      originalHeight,
      resultWidth: resultCanvas.width,
      resultHeight: resultCanvas.height,
      processingTime,
    };
  }

  /**
   * 단일 프레임의 배경 제거
   */
  async removeBackgroundFromFrame(
    frame: ExtractedFrame,
    options: BackgroundRemovalOptions = {}
  ): Promise<ExtractedFrame> {
    const result = await this.removeBackgroundFromImage(frame.canvas, options);

    return {
      ...frame,
      canvas: result.canvas,
      dataUrl: result.dataUrl,
    };
  }

  /**
   * 모든 프레임의 배경 제거
   */
  async removeBackgroundFromFrames(
    frames: ExtractedFrame[],
    onProgress?: (progress: number, current: number, total: number) => void,
    options: BackgroundRemovalOptions = {}
  ): Promise<ExtractedFrame[]> {
    await this.initialize(options.model || 'medium');

    const results: ExtractedFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const processedFrame = await this.removeBackgroundFromFrame(frames[i], options);
      results.push(processedFrame);

      if (onProgress) {
        onProgress(((i + 1) / frames.length) * 100, i + 1, frames.length);
      }
    }

    return results;
  }

  /**
   * 후처리 적용
   */
  private async applyPostProcessing(
    canvas: HTMLCanvasElement,
    options: {
      foregroundThreshold: number;
      edgeBlur: number;
      trimTransparent: boolean;
      useBackgroundColor: boolean;
      backgroundColor: string;
    }
  ): Promise<HTMLCanvasElement> {
    const ctx = canvas.getContext('2d')!;
    let resultCanvas = canvas;

    // 전경 임계값 적용 (알파 채널 조정)
    if (options.foregroundThreshold !== 0.5) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = Math.floor(options.foregroundThreshold * 255);

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < threshold) {
          data[i] = 0;
        } else if (data[i] > 255 - threshold) {
          data[i] = 255;
        } else {
          data[i] = Math.round(((data[i] - threshold) / (255 - 2 * threshold)) * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // 경계선 블러 적용
    if (options.edgeBlur > 0) {
      resultCanvas = await this.applyEdgeBlur(resultCanvas, options.edgeBlur);
    }

    // 배경색 적용
    if (options.useBackgroundColor) {
      resultCanvas = this.applyBackgroundColor(resultCanvas, options.backgroundColor);
    }

    // 투명 영역 자르기
    if (options.trimTransparent) {
      resultCanvas = this.trimTransparentPixels(resultCanvas);
    }

    return resultCanvas;
  }

  /**
   * 경계선 블러 적용
   */
  private async applyEdgeBlur(canvas: HTMLCanvasElement, blurRadius: number): Promise<HTMLCanvasElement> {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const ctx = resultCanvas.getContext('2d')!;

    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

    return resultCanvas;
  }

  /**
   * 배경색 적용
   */
  private applyBackgroundColor(canvas: HTMLCanvasElement, color: string): HTMLCanvasElement {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const ctx = resultCanvas.getContext('2d')!;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);

    return resultCanvas;
  }

  /**
   * 투명 픽셀 자르기
   */
  private trimTransparentPixels(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (minX >= maxX || minY >= maxY) {
      return canvas;
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultCtx = resultCanvas.getContext('2d')!;

    resultCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

    return resultCanvas;
  }

  /**
   * 이미지 크기 가져오기
   */
  private getImageDimensions(source: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(source);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지 크기를 가져올 수 없습니다.'));
      };

      img.src = url;
    });
  }

  /**
   * Canvas를 Blob으로 변환
   */
  private canvasToBlob(canvas: HTMLCanvasElement, format: string = 'image/png'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Blob 변환 실패'));
        }
      }, format);
    });
  }

  /**
   * Blob을 Canvas로 변환
   */
  private blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지 로드 실패'));
      };

      img.src = url;
    });
  }

  /**
   * 결과 캔버스 다운로드
   */
  downloadResult(
    canvas: HTMLCanvasElement,
    filename: string = 'result.png',
    format: string = 'image/png',
    quality: number = 1
  ): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(format, quality);
    link.click();
  }
}

