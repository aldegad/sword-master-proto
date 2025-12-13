import type { ExtractedFrame } from './video-processor';

export interface SpriteSheetOptions {
  columns?: number;
  padding?: number;
  backgroundColor?: string;
}

export interface SpriteSheetResult {
  canvas: HTMLCanvasElement;
  metadata: SpriteSheetMetadata;
}

export interface SpriteSheetMetadata {
  frames: FrameMetadata[];
  meta: {
    image: string;
    size: { width: number; height: number };
    scale: number;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    totalFrames: number;
  };
}

export interface FrameMetadata {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  duration: number;
}

/**
 * 프레임들을 스프라이트 시트로 합성하는 클래스
 */
export class SpriteGenerator {
  /**
   * 스프라이트 시트 생성
   */
  generateSpriteSheet(
    frames: ExtractedFrame[],
    options: SpriteSheetOptions = {}
  ): SpriteSheetResult {
    if (frames.length === 0) {
      throw new Error('프레임이 없습니다.');
    }

    const {
      columns = this.calculateOptimalColumns(frames.length),
      padding = 0,
      backgroundColor = 'transparent',
    } = options;

    const frameWidth = frames[0].canvas.width;
    const frameHeight = frames[0].canvas.height;
    const rows = Math.ceil(frames.length / columns);

    // 스프라이트 시트 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = columns * (frameWidth + padding) + padding;
    canvas.height = rows * (frameHeight + padding) + padding;

    const ctx = canvas.getContext('2d')!;

    // 배경 설정
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 프레임 메타데이터 배열
    const frameMetadata: FrameMetadata[] = [];

    // 프레임 그리기
    frames.forEach((frame, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (frameWidth + padding);
      const y = padding + row * (frameHeight + padding);

      ctx.drawImage(frame.canvas, x, y);

      frameMetadata.push({
        filename: `frame_${String(index).padStart(4, '0')}.png`,
        frame: { x, y, w: frameWidth, h: frameHeight },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
        sourceSize: { w: frameWidth, h: frameHeight },
        duration: 100, // 기본 100ms
      });
    });

    const metadata: SpriteSheetMetadata = {
      frames: frameMetadata,
      meta: {
        image: 'spritesheet.png',
        size: { width: canvas.width, height: canvas.height },
        scale: 1,
        frameWidth,
        frameHeight,
        columns,
        rows,
        totalFrames: frames.length,
      },
    };

    return { canvas, metadata };
  }

  /**
   * 최적의 열 수 계산
   */
  private calculateOptimalColumns(frameCount: number): number {
    // 정사각형에 가까운 배열을 위한 열 수 계산
    const sqrt = Math.sqrt(frameCount);
    return Math.ceil(sqrt);
  }

  /**
   * 캔버스를 PNG Blob으로 변환
   */
  async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Blob 생성에 실패했습니다.'));
        }
      }, 'image/png');
    });
  }

  /**
   * 다운로드 링크 생성 및 클릭
   */
  downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * JSON 메타데이터 다운로드
   */
  downloadMetadata(metadata: SpriteSheetMetadata, filename: string) {
    const json = JSON.stringify(metadata, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
