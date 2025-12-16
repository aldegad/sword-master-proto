// 모드 타입
export type AppMode = 'video' | 'sprite' | 'bg-remove';

// 프레임 추출 옵션
export interface ExtractOptions {
  fps: number;
  startTime: number;
  endTime: number;
  scale: number;
}

// 추출된 프레임
export interface ExtractedFrame {
  index: number;
  timestamp: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

// 프레임 + 오프셋
export interface FrameWithOffset {
  frame: ExtractedFrame;
  offset: { x: number; y: number };
}

// 스프라이트 시트 옵션
export interface SpriteSheetOptions {
  columns?: number;
  padding?: number;
  backgroundColor?: string;
}

// 스프라이트 시트 결과
export interface SpriteSheetResult {
  canvas: HTMLCanvasElement;
  metadata: SpriteSheetMetadata;
}

// 스프라이트 시트 메타데이터
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

// 프레임 메타데이터
export interface FrameMetadata {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  duration: number;
}

// 스프라이트 임포트 옵션
export interface SpriteImportOptions {
  frameWidth: number;
  frameHeight: number;
  columns?: number;
  rows?: number;
  totalFrames?: number;
  startIndex?: number;
}

// 프레임 크기 제안
export interface FrameSizeSuggestion {
  width: number;
  height: number;
  columns: number;
  rows: number;
}

// 배경 제거 모델 크기
export type ModelSize = 'small' | 'medium' | 'large';

// 배경 제거 옵션
export interface BackgroundRemovalOptions {
  model?: ModelSize;
  device?: 'gpu' | 'cpu';
  outputFormat?: 'image/png' | 'image/webp';
  outputQuality?: number;
  foregroundThreshold?: number;
  edgeBlur?: number;
  trimTransparent?: boolean;
  useBackgroundColor?: boolean;
  backgroundColor?: string;
}

// 단일 이미지 배경 제거 결과
export interface SingleImageResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  resultWidth: number;
  resultHeight: number;
  processingTime: number;
}

// 진행률 상태
export interface ProgressState {
  isVisible: boolean;
  text: string;
  progress: number;
}

// 비디오 메타데이터
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

// 이미지 정보
export interface ImageInfo {
  width: number;
  height: number;
}

