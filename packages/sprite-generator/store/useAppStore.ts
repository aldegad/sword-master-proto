'use client';

import { create } from 'zustand';
import type {
  AppMode,
  ExtractedFrame,
  SpriteSheetMetadata,
  BackgroundRemovalOptions,
  SingleImageResult,
  ProgressState,
  VideoMetadata,
  FrameSizeSuggestion,
} from '@/types';

interface AppState {
  // 현재 모드
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // 진행률
  progress: ProgressState;
  showProgress: (text: string, progress?: number) => void;
  updateProgress: (text: string, progress: number) => void;
  hideProgress: () => void;

  // ===== 비디오 모드 =====
  videoFile: File | null;
  videoUrl: string | null;
  videoMetadata: VideoMetadata | null;
  setVideoFile: (file: File | null, url: string | null, metadata: VideoMetadata | null) => void;

  // 프레임 추출 설정
  extractSettings: {
    fps: number;
    startTime: number;
    endTime: number;
    scale: number;
  };
  setExtractSettings: (settings: Partial<AppState['extractSettings']>) => void;

  // ===== 스프라이트 모드 =====
  spriteFile: File | null;
  spriteUrl: string | null;
  spriteImageInfo: { width: number; height: number } | null;
  setSpriteFile: (file: File | null, url: string | null, info: { width: number; height: number } | null) => void;
  
  spriteMetadataFile: File | null;
  loadedSpriteMetadata: SpriteSheetMetadata | null;
  setSpriteMetadata: (file: File | null, metadata: SpriteSheetMetadata | null) => void;

  frameSuggestions: FrameSizeSuggestion[];
  setFrameSuggestions: (suggestions: FrameSizeSuggestion[]) => void;

  spriteSettings: {
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    totalFrames: number;
    startIndex: number;
  };
  setSpriteSettings: (settings: Partial<AppState['spriteSettings']>) => void;

  // ===== 배경 제거 모드 =====
  bgRemoveFile: File | null;
  bgRemoveUrl: string | null;
  bgRemoveImageInfo: { width: number; height: number } | null;
  setBgRemoveFile: (file: File | null, url: string | null, info: { width: number; height: number } | null) => void;

  bgRemoveOptions: BackgroundRemovalOptions;
  setBgRemoveOptions: (options: Partial<BackgroundRemovalOptions>) => void;

  bgRemoveResult: SingleImageResult | null;
  setBgRemoveResult: (result: SingleImageResult | null) => void;

  // ===== 공통 프레임 관리 =====
  extractedFrames: ExtractedFrame[];
  setExtractedFrames: (frames: ExtractedFrame[]) => void;

  disabledFrames: Set<number>;
  toggleFrame: (index: number) => void;
  selectAllFrames: () => void;
  deselectAllFrames: () => void;

  disabledReverseFrames: Set<number>;
  toggleReverseFrame: (index: number) => void;

  frameOffsets: Map<number, { x: number; y: number }>;
  reverseFrameOffsets: Map<number, { x: number; y: number }>;
  adjustFrameOffset: (index: number, direction: 'up' | 'down' | 'left' | 'right', isReverse: boolean) => void;

  // 핑퐁 옵션
  isPingpong: boolean;
  setIsPingpong: (value: boolean) => void;

  // 미리보기 FPS
  previewFps: number;
  setPreviewFps: (fps: number) => void;

  // ===== 결과 =====
  resultCanvas: HTMLCanvasElement | null;
  resultMetadata: SpriteSheetMetadata | null;
  setResult: (canvas: HTMLCanvasElement | null, metadata: SpriteSheetMetadata | null) => void;

  // 리셋
  resetAll: () => void;
  resetVideoMode: () => void;
  resetSpriteMode: () => void;
  resetBgRemoveMode: () => void;
}

const initialState = {
  mode: 'video' as AppMode,
  progress: { isVisible: false, text: '', progress: 0 },
  
  videoFile: null,
  videoUrl: null,
  videoMetadata: null,
  extractSettings: { fps: 12, startTime: 0, endTime: 0, scale: 100 },

  spriteFile: null,
  spriteUrl: null,
  spriteImageInfo: null,
  spriteMetadataFile: null,
  loadedSpriteMetadata: null,
  frameSuggestions: [],
  spriteSettings: { frameWidth: 64, frameHeight: 64, columns: 0, rows: 0, totalFrames: 0, startIndex: 0 },

  bgRemoveFile: null,
  bgRemoveUrl: null,
  bgRemoveImageInfo: null,
  bgRemoveOptions: {
    model: 'medium' as const,
    device: 'gpu' as const,
    outputFormat: 'image/png' as const,
    outputQuality: 0.95,
    foregroundThreshold: 0.5,
    edgeBlur: 0,
    trimTransparent: false,
    useBackgroundColor: false,
    backgroundColor: '#ffffff',
    // 픽셀 아트 옵션
    isManualPixelArt: true, // 기본 체크
    autoDetectPixelArt: false,
    pixelArtCleanup: true,
    pixelBlockSize: 1,
    pixelTransparencyThreshold: 0.4, // 40% 미만 불투명하면 투명 처리
  },
  bgRemoveResult: null,

  extractedFrames: [],
  disabledFrames: new Set<number>(),
  disabledReverseFrames: new Set<number>(),
  frameOffsets: new Map<number, { x: number; y: number }>(),
  reverseFrameOffsets: new Map<number, { x: number; y: number }>(),
  isPingpong: false,
  previewFps: 12,

  resultCanvas: null,
  resultMetadata: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  showProgress: (text, progress = 0) => set({ 
    progress: { isVisible: true, text, progress } 
  }),
  updateProgress: (text, progress) => set({ 
    progress: { isVisible: true, text, progress } 
  }),
  hideProgress: () => set({ 
    progress: { isVisible: false, text: '', progress: 0 } 
  }),

  setVideoFile: (file, url, metadata) => set({ 
    videoFile: file, 
    videoUrl: url, 
    videoMetadata: metadata,
    extractSettings: metadata 
      ? { ...get().extractSettings, endTime: metadata.duration }
      : get().extractSettings,
  }),

  setExtractSettings: (settings) => set({ 
    extractSettings: { ...get().extractSettings, ...settings } 
  }),

  setSpriteFile: (file, url, info) => set({ 
    spriteFile: file, 
    spriteUrl: url, 
    spriteImageInfo: info 
  }),

  setSpriteMetadata: (file, metadata) => set({ 
    spriteMetadataFile: file, 
    loadedSpriteMetadata: metadata 
  }),

  setFrameSuggestions: (suggestions) => set({ frameSuggestions: suggestions }),

  setSpriteSettings: (settings) => set({ 
    spriteSettings: { ...get().spriteSettings, ...settings } 
  }),

  setBgRemoveFile: (file, url, info) => set({ 
    bgRemoveFile: file, 
    bgRemoveUrl: url, 
    bgRemoveImageInfo: info,
    bgRemoveResult: null,
  }),

  setBgRemoveOptions: (options) => set({ 
    bgRemoveOptions: { ...get().bgRemoveOptions, ...options } 
  }),

  setBgRemoveResult: (result) => set({ bgRemoveResult: result }),

  setExtractedFrames: (frames) => set({ 
    extractedFrames: frames,
    disabledFrames: new Set(),
    disabledReverseFrames: new Set(),
    frameOffsets: new Map(),
    reverseFrameOffsets: new Map(),
  }),

  toggleFrame: (index) => {
    const newSet = new Set(get().disabledFrames);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    set({ disabledFrames: newSet });
  },

  selectAllFrames: () => set({ 
    disabledFrames: new Set(), 
    disabledReverseFrames: new Set() 
  }),

  deselectAllFrames: () => {
    const frames = get().extractedFrames;
    const disabledFrames = new Set(frames.map((_, i) => i));
    const disabledReverseFrames = new Set(frames.map((_, i) => i));
    set({ disabledFrames, disabledReverseFrames });
  },

  toggleReverseFrame: (index) => {
    const newSet = new Set(get().disabledReverseFrames);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    set({ disabledReverseFrames: newSet });
  },

  adjustFrameOffset: (index, direction, isReverse) => {
    const offsetsMap = isReverse 
      ? new Map(get().reverseFrameOffsets) 
      : new Map(get().frameOffsets);
    
    const current = offsetsMap.get(index) || { x: 0, y: 0 };
    const step = 1;

    switch (direction) {
      case 'up': current.y -= step; break;
      case 'down': current.y += step; break;
      case 'left': current.x -= step; break;
      case 'right': current.x += step; break;
    }

    offsetsMap.set(index, current);

    if (isReverse) {
      set({ reverseFrameOffsets: offsetsMap });
    } else {
      set({ frameOffsets: offsetsMap });
    }
  },

  setIsPingpong: (value) => set({ isPingpong: value }),
  setPreviewFps: (fps) => set({ previewFps: fps }),

  setResult: (canvas, metadata) => set({ 
    resultCanvas: canvas, 
    resultMetadata: metadata 
  }),

  resetAll: () => set(initialState),

  resetVideoMode: () => set({
    videoFile: null,
    videoUrl: null,
    videoMetadata: null,
    extractSettings: initialState.extractSettings,
    extractedFrames: [],
    disabledFrames: new Set(),
    disabledReverseFrames: new Set(),
    frameOffsets: new Map(),
    reverseFrameOffsets: new Map(),
    resultCanvas: null,
    resultMetadata: null,
  }),

  resetSpriteMode: () => set({
    spriteFile: null,
    spriteUrl: null,
    spriteImageInfo: null,
    spriteMetadataFile: null,
    loadedSpriteMetadata: null,
    frameSuggestions: [],
    spriteSettings: initialState.spriteSettings,
    extractedFrames: [],
    disabledFrames: new Set(),
    disabledReverseFrames: new Set(),
    frameOffsets: new Map(),
    reverseFrameOffsets: new Map(),
    resultCanvas: null,
    resultMetadata: null,
  }),

  resetBgRemoveMode: () => set({
    bgRemoveFile: null,
    bgRemoveUrl: null,
    bgRemoveImageInfo: null,
    bgRemoveResult: null,
  }),
}));

