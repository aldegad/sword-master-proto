import type { ExtractedFrame } from './video-processor';
import type { SpriteSheetMetadata } from './sprite-generator';

export interface SpriteImportOptions {
  frameWidth: number;
  frameHeight: number;
  columns?: number;
  rows?: number;
  totalFrames?: number;
  startIndex?: number;
}

/**
 * 스프라이트 시트를 개별 프레임으로 분할하는 클래스
 */
export class SpriteImporter {
  private image: HTMLImageElement | null = null;

  /**
   * 이미지 파일 로드
   */
  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        this.image = img;
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = url;
    });
  }

  /**
   * JSON 메타데이터 파일 로드
   */
  async loadMetadata(file: File): Promise<SpriteSheetMetadata> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const metadata = JSON.parse(reader.result as string) as SpriteSheetMetadata;
          resolve(metadata);
        } catch (error) {
          reject(new Error('JSON 파일을 파싱할 수 없습니다.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * 이미지 메타데이터 가져오기
   */
  getImageInfo() {
    if (!this.image) {
      throw new Error('이미지가 로드되지 않았습니다.');
    }

    return {
      width: this.image.width,
      height: this.image.height,
    };
  }

  /**
   * 스프라이트 시트를 프레임으로 분할 (수동 설정)
   */
  extractFramesManual(
    options: SpriteImportOptions,
    onProgress?: (progress: number, current: number, total: number) => void
  ): ExtractedFrame[] {
    if (!this.image) {
      throw new Error('이미지가 로드되지 않았습니다.');
    }

    const { frameWidth, frameHeight, startIndex = 0 } = options;

    // 열과 행 계산
    const columns = options.columns || Math.floor(this.image.width / frameWidth);
    const rows = options.rows || Math.floor(this.image.height / frameHeight);
    const maxFrames = columns * rows;
    const totalFrames = options.totalFrames
      ? Math.min(options.totalFrames, maxFrames - startIndex)
      : maxFrames - startIndex;

    const frames: ExtractedFrame[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const frameIndex = startIndex + i;
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);

      const x = col * frameWidth;
      const y = row * frameHeight;

      // 이미지 범위를 벗어나면 중단
      if (x + frameWidth > this.image.width || y + frameHeight > this.image.height) {
        break;
      }

      // 프레임 캔버스 생성
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frameWidth;
      frameCanvas.height = frameHeight;
      const ctx = frameCanvas.getContext('2d')!;

      // 해당 영역을 캔버스에 그리기
      ctx.drawImage(
        this.image,
        x, y, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      );

      frames.push({
        index: i,
        timestamp: i / 12, // 기본 12fps 기준
        canvas: frameCanvas,
        dataUrl: frameCanvas.toDataURL('image/png'),
      });

      if (onProgress) {
        onProgress((i + 1) / totalFrames * 100, i + 1, totalFrames);
      }
    }

    return frames;
  }

  /**
   * 스프라이트 시트를 프레임으로 분할 (JSON 메타데이터 사용)
   */
  extractFramesFromMetadata(
    metadata: SpriteSheetMetadata,
    onProgress?: (progress: number, current: number, total: number) => void
  ): ExtractedFrame[] {
    if (!this.image) {
      throw new Error('이미지가 로드되지 않았습니다.');
    }

    const frames: ExtractedFrame[] = [];
    const totalFrames = metadata.frames.length;

    metadata.frames.forEach((frameMeta, i) => {
      const { x, y, w, h } = frameMeta.frame;

      // 프레임 캔버스 생성
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = w;
      frameCanvas.height = h;
      const ctx = frameCanvas.getContext('2d')!;

      // 해당 영역을 캔버스에 그리기
      ctx.drawImage(
        this.image!,
        x, y, w, h,
        0, 0, w, h
      );

      frames.push({
        index: i,
        timestamp: i / 12,
        canvas: frameCanvas,
        dataUrl: frameCanvas.toDataURL('image/png'),
      });

      if (onProgress) {
        onProgress((i + 1) / totalFrames * 100, i + 1, totalFrames);
      }
    });

    return frames;
  }

  /**
   * 프레임 크기 자동 추정 (정사각형에 가깝게)
   */
  estimateFrameSize(): { width: number; height: number; columns: number; rows: number }[] {
    if (!this.image) {
      throw new Error('이미지가 로드되지 않았습니다.');
    }

    const suggestions: { width: number; height: number; columns: number; rows: number }[] = [];
    const { width, height } = this.image;

    // 가능한 열/행 조합 찾기
    for (let cols = 1; cols <= 20; cols++) {
      if (width % cols !== 0) continue;
      const frameWidth = width / cols;

      for (let rows = 1; rows <= 20; rows++) {
        if (height % rows !== 0) continue;
        const frameHeight = height / rows;

        // 프레임이 너무 작거나 크지 않은 경우만
        if (frameWidth >= 16 && frameWidth <= 512 && frameHeight >= 16 && frameHeight <= 512) {
          suggestions.push({
            width: frameWidth,
            height: frameHeight,
            columns: cols,
            rows: rows,
          });
        }
      }
    }

    // 정사각형에 가까운 순서로 정렬
    suggestions.sort((a, b) => {
      const ratioA = Math.abs(1 - a.width / a.height);
      const ratioB = Math.abs(1 - b.width / b.height);
      return ratioA - ratioB;
    });

    return suggestions.slice(0, 10); // 상위 10개만 반환
  }

  /**
   * 리소스 정리
   */
  dispose() {
    if (this.image && this.image.src) {
      URL.revokeObjectURL(this.image.src);
      this.image = null;
    }
  }
}
