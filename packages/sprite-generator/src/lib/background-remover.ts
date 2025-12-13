import type { ExtractedFrame } from './video-processor';

/**
 * AI 기반 배경 제거 클래스
 * @imgly/background-removal 라이브러리 사용
 */
export class BackgroundRemover {
  private removeBackground: typeof import('@imgly/background-removal').removeBackground | null = null;
  private isInitialized = false;

  /**
   * 라이브러리 초기화 (지연 로딩)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const module = await import('@imgly/background-removal');
      this.removeBackground = module.removeBackground;
      this.isInitialized = true;
    } catch (error) {
      console.error('배경 제거 라이브러리 로드 실패:', error);
      throw new Error('배경 제거 기능을 초기화할 수 없습니다.');
    }
  }

  /**
   * 단일 프레임의 배경 제거
   */
  async removeBackgroundFromFrame(frame: ExtractedFrame): Promise<ExtractedFrame> {
    if (!this.removeBackground) {
      throw new Error('먼저 initialize()를 호출해주세요.');
    }

    // Canvas를 Blob으로 변환
    const blob = await this.canvasToBlob(frame.canvas);

    // 배경 제거 실행
    const resultBlob = await this.removeBackground(blob, {
      output: {
        format: 'image/png',
        quality: 1,
      },
    });

    // 결과를 Canvas로 변환
    const resultCanvas = await this.blobToCanvas(resultBlob);

    return {
      ...frame,
      canvas: resultCanvas,
      dataUrl: resultCanvas.toDataURL('image/png'),
    };
  }

  /**
   * 모든 프레임의 배경 제거
   */
  async removeBackgroundFromFrames(
    frames: ExtractedFrame[],
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<ExtractedFrame[]> {
    await this.initialize();

    const results: ExtractedFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const processedFrame = await this.removeBackgroundFromFrame(frames[i]);
      results.push(processedFrame);

      if (onProgress) {
        onProgress(((i + 1) / frames.length) * 100, i + 1, frames.length);
      }
    }

    return results;
  }

  /**
   * Canvas를 Blob으로 변환
   */
  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Blob 변환 실패'));
        }
      }, 'image/png');
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
}
