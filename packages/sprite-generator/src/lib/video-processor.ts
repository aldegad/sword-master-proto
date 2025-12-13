export interface ExtractOptions {
  fps: number;
  startTime: number;
  endTime: number;
  scale: number;
}

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

/**
 * 동영상에서 프레임을 추출하는 클래스
 */
export class VideoProcessor {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 동영상 파일 로드
   */
  async loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      // 기존 src 정리
      if (this.video.src) {
        URL.revokeObjectURL(this.video.src);
      }

      const url = URL.createObjectURL(file);

      const onLoadedMetadata = () => {
        this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.video.removeEventListener('error', onError);
        resolve(this.video);
      };

      const onError = () => {
        this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.video.removeEventListener('error', onError);
        URL.revokeObjectURL(url);
        reject(new Error('동영상을 로드할 수 없습니다.'));
      };

      this.video.addEventListener('loadedmetadata', onLoadedMetadata);
      this.video.addEventListener('error', onError);

      this.video.src = url;
      this.video.load(); // 명시적으로 load 호출
    });
  }

  /**
   * 동영상 메타데이터 가져오기
   */
  getMetadata() {
    return {
      duration: this.video.duration,
      width: this.video.videoWidth,
      height: this.video.videoHeight,
    };
  }

  /**
   * 프레임 추출
   */
  async extractFrames(
    options: ExtractOptions,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<ExtractedFrame[]> {
    const { fps, startTime, endTime, scale } = options;
    const duration = endTime > startTime ? endTime - startTime : this.video.duration - startTime;
    const totalFrames = Math.floor(duration * fps);
    const frameInterval = 1 / fps;

    // 캔버스 크기 설정
    const scaledWidth = Math.floor(this.video.videoWidth * (scale / 100));
    const scaledHeight = Math.floor(this.video.videoHeight * (scale / 100));
    this.canvas.width = scaledWidth;
    this.canvas.height = scaledHeight;

    const frames: ExtractedFrame[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const timestamp = startTime + i * frameInterval;

      // 해당 시간으로 이동
      await this.seekTo(timestamp);

      // 프레임 캡처
      this.ctx.drawImage(this.video, 0, 0, scaledWidth, scaledHeight);

      // 새 캔버스에 복사 (독립적인 프레임 유지)
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = scaledWidth;
      frameCanvas.height = scaledHeight;
      const frameCtx = frameCanvas.getContext('2d')!;
      frameCtx.drawImage(this.canvas, 0, 0);

      frames.push({
        index: i,
        timestamp,
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
   * 특정 시간으로 이동
   */
  private seekTo(time: number): Promise<void> {
    return new Promise((resolve) => {
      // 이미 해당 시간에 있으면 바로 resolve
      if (Math.abs(this.video.currentTime - time) < 0.01) {
        resolve();
        return;
      }

      const onSeeked = () => {
        this.video.removeEventListener('seeked', onSeeked);
        resolve();
      };

      this.video.addEventListener('seeked', onSeeked);
      this.video.currentTime = time;

      // 타임아웃 추가 (3초 후 강제 resolve)
      setTimeout(() => {
        this.video.removeEventListener('seeked', onSeeked);
        resolve();
      }, 3000);
    });
  }

  /**
   * 리소스 정리
   */
  dispose() {
    if (this.video.src) {
      URL.revokeObjectURL(this.video.src);
      this.video.src = '';
    }
  }
}
