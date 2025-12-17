import type {
  ExtractedFrame,
  ModelSize,
  BackgroundRemovalOptions,
  SingleImageResult,
} from '@/types';

/**
 * 픽셀 아트 분석 결과
 */
interface PixelArtAnalysis {
  isPixelArt: boolean;
  confidence: number; // 0-1, 픽셀 아트일 확률
  blockSize: number;  // 감지된 논리적 픽셀 크기
  uniformityScore: number; // 색상 균일성 점수
}

/**
 * AI 기반 배경 제거 클래스
 * @huggingface/transformers 라이브러리 사용
 * 픽셀 아트 전용 처리 지원
 */
export class BackgroundRemover {
  private pipeline: any = null;
  private isInitialized = false;
  private currentModel: string | null = null;

  /**
   * 라이브러리 초기화 (지연 로딩)
   */
  async initialize(model: string = 'medium'): Promise<void> {
    if (this.isInitialized && this.currentModel === model) return;

    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      
      // WASM 파일 로드 설정
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      
      // 배경 제거용 이미지 세분화 파이프라인 생성
      this.pipeline = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        device: 'webgpu',
      });
      
      this.isInitialized = true;
      this.currentModel = model;
    } catch (error) {
      console.error('배경 제거 라이브러리 로드 실패:', error);
      throw new Error('배경 제거 기능을 초기화할 수 없습니다.');
    }
  }

  /**
   * 픽셀 아트 감지
   * 여러 특성을 분석하여 픽셀 아트인지 판별
   */
  analyzePixelArt(canvas: HTMLCanvasElement): PixelArtAnalysis {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const totalPixels = width * height;

    // 1. 색상 분석 - 픽셀 아트는 색상이 "클러스터링" 됨
    const colorAnalysis = this.analyzeColorClustering(data);
    
    // 2. 계단형 대각선 패턴 분석 (픽셀 아트의 핵심 특성)
    const stairStepScore = this.analyzeStairStepPattern(data, width, height);
    
    // 3. 색상 전환 날카로움 분석 (안티앨리어싱 없음)
    const sharpnessScore = this.analyzeColorSharpness(data, width, height);

    // 4. 픽셀 블록 크기 감지 (업스케일된 경우)
    const blockSize = this.detectBlockSize(data, width, height);
    
    // 5. 이미지 크기 대비 색상 수 비율
    const colorDensity = colorAnalysis.uniqueColors / totalPixels;
    const colorDensityScore = colorDensity < 0.01 ? 1 : colorDensity < 0.05 ? 0.7 : colorDensity < 0.1 ? 0.5 : 0.2;

    // 종합 점수 계산 - 가중치 조정
    const confidence = (
      colorAnalysis.clusterScore * 0.2 +   // 색상 클러스터링
      stairStepScore * 0.35 +               // 계단형 패턴 (가장 중요)
      sharpnessScore * 0.25 +               // 색상 전환 날카로움
      colorDensityScore * 0.2               // 색상 밀도
    );

    const isPixelArt = confidence > 0.45; // 임계값 낮춤

    console.log('픽셀 아트 분석 상세:', {
      uniqueColors: colorAnalysis.uniqueColors,
      clusterScore: colorAnalysis.clusterScore.toFixed(3),
      stairStepScore: stairStepScore.toFixed(3),
      sharpnessScore: sharpnessScore.toFixed(3),
      colorDensityScore: colorDensityScore.toFixed(3),
      blockSize,
      confidence: confidence.toFixed(3),
      isPixelArt,
    });

    return {
      isPixelArt,
      confidence,
      blockSize: isPixelArt ? blockSize : 1,
      uniformityScore: stairStepScore,
    };
  }

  /**
   * 색상 클러스터링 분석
   * 픽셀 아트는 색상이 뚜렷한 그룹으로 나뉨
   */
  private analyzeColorClustering(data: Uint8ClampedArray): { uniqueColors: number; clusterScore: number } {
    const colorCounts = new Map<string, number>();
    
    // 색상 카운트 (약간의 양자화 적용)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) {
        // 색상을 8단계로 양자화하여 유사색 그룹화
        const r = Math.floor(data[i] / 8) * 8;
        const g = Math.floor(data[i + 1] / 8) * 8;
        const b = Math.floor(data[i + 2] / 8) * 8;
        const color = `${r},${g},${b}`;
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    }

    const uniqueColors = colorCounts.size;
    
    // 색상 분포 분석 - 픽셀 아트는 몇몇 색상이 많이 사용됨
    const counts = Array.from(colorCounts.values()).sort((a, b) => b - a);
    const totalPixels = counts.reduce((sum, c) => sum + c, 0);
    
    // 상위 20개 색상이 전체의 몇 %를 차지하는지
    const top20Sum = counts.slice(0, 20).reduce((sum, c) => sum + c, 0);
    const concentrationRatio = totalPixels > 0 ? top20Sum / totalPixels : 0;
    
    // 색상 수가 적고 집중도가 높으면 픽셀 아트
    let clusterScore = 0;
    if (uniqueColors < 100) clusterScore = 0.9;
    else if (uniqueColors < 200) clusterScore = 0.7;
    else if (uniqueColors < 500) clusterScore = 0.5;
    else clusterScore = 0.3;
    
    // 집중도로 보정
    clusterScore = clusterScore * 0.5 + concentrationRatio * 0.5;

    return { uniqueColors, clusterScore };
  }

  /**
   * 계단형 대각선 패턴 분석
   * 픽셀 아트의 가장 특징적인 패턴
   */
  private analyzeStairStepPattern(data: Uint8ClampedArray, width: number, height: number): number {
    let stairStepCount = 0;
    let diagonalEdgeCount = 0;
    
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 200));

    for (let y = 1; y < height - 1; y += sampleStep) {
      for (let x = 1; x < width - 1; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const currentColor = this.getColorKey(data, idx);
        
        // 주변 8방향 색상 체크
        const topIdx = ((y - 1) * width + x) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topLeftIdx = ((y - 1) * width + (x - 1)) * 4;
        const topRightIdx = ((y - 1) * width + (x + 1)) * 4;
        const bottomLeftIdx = ((y + 1) * width + (x - 1)) * 4;
        const bottomRightIdx = ((y + 1) * width + (x + 1)) * 4;

        const top = this.getColorKey(data, topIdx);
        const bottom = this.getColorKey(data, bottomIdx);
        const left = this.getColorKey(data, leftIdx);
        const right = this.getColorKey(data, rightIdx);
        const topLeft = this.getColorKey(data, topLeftIdx);
        const topRight = this.getColorKey(data, topRightIdx);
        const bottomLeft = this.getColorKey(data, bottomLeftIdx);
        const bottomRight = this.getColorKey(data, bottomRightIdx);

        // 대각선 경계 감지
        const isDiagonalEdge = (
          (currentColor !== topLeft && currentColor === top && currentColor === left) ||
          (currentColor !== topRight && currentColor === top && currentColor === right) ||
          (currentColor !== bottomLeft && currentColor === bottom && currentColor === left) ||
          (currentColor !== bottomRight && currentColor === bottom && currentColor === right)
        );

        if (isDiagonalEdge) {
          diagonalEdgeCount++;
          
          // 계단형 패턴 확인 (L자형 코너)
          const isStairStep = (
            (top === left && top !== currentColor) ||
            (top === right && top !== currentColor) ||
            (bottom === left && bottom !== currentColor) ||
            (bottom === right && bottom !== currentColor)
          );
          
          if (isStairStep) stairStepCount++;
        }
      }
    }

    // 대각선 엣지 중 계단형 패턴 비율
    if (diagonalEdgeCount < 10) return 0.5; // 샘플 부족
    
    const stairStepRatio = stairStepCount / diagonalEdgeCount;
    return Math.min(1, stairStepRatio * 1.5); // 0.67 이상이면 1.0
  }

  /**
   * 색상 키 생성 (유사색 그룹화)
   */
  private getColorKey(data: Uint8ClampedArray, idx: number): string {
    // 약간의 양자화로 노이즈 제거
    const r = Math.floor(data[idx] / 4) * 4;
    const g = Math.floor(data[idx + 1] / 4) * 4;
    const b = Math.floor(data[idx + 2] / 4) * 4;
    return `${r},${g},${b}`;
  }

  /**
   * 색상 전환 날카로움 분석
   * 픽셀 아트는 색상 경계가 날카로움 (안티앨리어싱 없음)
   */
  private analyzeColorSharpness(data: Uint8ClampedArray, width: number, height: number): number {
    let sharpTransitions = 0;
    let softTransitions = 0;
    
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 150));

    for (let y = 0; y < height - 1; y += sampleStep) {
      for (let x = 0; x < width - 1; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;

        // 수평 색상 차이
        const hDiff = Math.abs(data[idx] - data[rightIdx]) +
                      Math.abs(data[idx + 1] - data[rightIdx + 1]) +
                      Math.abs(data[idx + 2] - data[rightIdx + 2]);

        // 수직 색상 차이
        const vDiff = Math.abs(data[idx] - data[bottomIdx]) +
                      Math.abs(data[idx + 1] - data[bottomIdx + 1]) +
                      Math.abs(data[idx + 2] - data[bottomIdx + 2]);

        // 급격한 변화 (픽셀 아트) vs 부드러운 변화 (일반 이미지)
        const maxDiff = Math.max(hDiff, vDiff);
        
        if (maxDiff > 100) {
          sharpTransitions++; // 급격한 변화
        } else if (maxDiff > 20 && maxDiff <= 100) {
          softTransitions++; // 부드러운 변화 (그라데이션)
        }
        // maxDiff <= 20은 변화 없음으로 간주
      }
    }

    const total = sharpTransitions + softTransitions;
    if (total < 50) return 0.5; // 샘플 부족
    
    // 급격한 변화 비율이 높으면 픽셀 아트
    return sharpTransitions / total;
  }

  /**
   * 픽셀 블록 크기 감지
   * 연속된 동일 색상 픽셀의 패턴을 분석
   */
  private detectBlockSize(data: Uint8ClampedArray, width: number, height: number): number {
    const candidates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
    let bestSize = 1;
    let bestScore = 0;

    for (const size of candidates) {
      if (width % size !== 0 || height % size !== 0) continue;
      
      let matchCount = 0;
      let totalBlocks = 0;

      // 샘플링으로 검사 (성능 최적화)
      const sampleStep = Math.max(1, Math.floor(width / 50));
      
      for (let y = 0; y < height - size; y += size * sampleStep) {
        for (let x = 0; x < width - size; x += size * sampleStep) {
          totalBlocks++;
          
          // 블록 내 첫 픽셀 색상
          const baseIdx = (y * width + x) * 4;
          const baseR = data[baseIdx];
          const baseG = data[baseIdx + 1];
          const baseB = data[baseIdx + 2];
          const baseA = data[baseIdx + 3];

          // 블록 내 모든 픽셀이 동일한지 확인
          let isUniform = true;
          for (let dy = 0; dy < size && isUniform; dy++) {
            for (let dx = 0; dx < size && isUniform; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              if (Math.abs(data[idx] - baseR) > 2 ||
                  Math.abs(data[idx + 1] - baseG) > 2 ||
                  Math.abs(data[idx + 2] - baseB) > 2 ||
                  Math.abs(data[idx + 3] - baseA) > 2) {
                isUniform = false;
              }
            }
          }

          if (isUniform) matchCount++;
        }
      }

      const score = totalBlocks > 0 ? matchCount / totalBlocks : 0;
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestSize = size;
      }
    }

    return bestSize;
  }

  /**
   * 색상 균일성 점수 계산 (블록 기반 정리용)
   */
  private calculateUniformityScore(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    blockSize: number
  ): number {
    if (blockSize <= 1) return 0.8; // 1:1 픽셀 아트도 높은 점수

    let uniformBlocks = 0;
    let totalBlocks = 0;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        totalBlocks++;
        
        const baseIdx = (y * width + x) * 4;
        const baseR = data[baseIdx];
        const baseG = data[baseIdx + 1];
        const baseB = data[baseIdx + 2];

        let isUniform = true;
        for (let dy = 0; dy < blockSize && dy + y < height && isUniform; dy++) {
          for (let dx = 0; dx < blockSize && dx + x < width && isUniform; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            if (Math.abs(data[idx] - baseR) > 3 ||
                Math.abs(data[idx + 1] - baseG) > 3 ||
                Math.abs(data[idx + 2] - baseB) > 3) {
              isUniform = false;
            }
          }
        }

        if (isUniform) uniformBlocks++;
      }
    }

    return totalBlocks > 0 ? uniformBlocks / totalBlocks : 0;
  }


  /**
   * 픽셀 아트용 격자 기반 정리
   * 지정된 블록 크기를 기준으로 투명도 임계값 적용
   * 
   * 로직: 
   * 1. 블록 내 "불투명 픽셀 비율"이 threshold 미만이면 블록을 투명하게
   * 2. 임계값 이상이면 블록 내 가장 많은 색상(대표색)으로 전체 블록을 채움
   * 
   * 예: threshold=0.5 → 블록의 50% 미만이 불투명하면 투명 처리, 이상이면 대표색으로 통일
   */
  applyPixelArtCleanup(
    canvas: HTMLCanvasElement,
    blockSize: number,
    transparencyThreshold: number = 0.5 // 50% 미만 불투명하면 전체 투명
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    let debugStats = { keptBlocks: 0, clearedBlocks: 0, totalBlocks: 0, unifiedColors: 0 };

    // 각 블록별로 처리
    for (let blockY = 0; blockY < height; blockY += blockSize) {
      for (let blockX = 0; blockX < width; blockX += blockSize) {
        let opaquePixels = 0;      // alpha >= 200 (거의 불투명)
        let semiOpaquePixels = 0;  // 100 <= alpha < 200
        let totalPixels = 0;
        
        // 블록 내 색상 카운트 (대표색 찾기용)
        const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();

        // 블록 내 불투명 픽셀 카운트 및 색상 수집
        for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
            const idx = ((blockY + dy) * width + (blockX + dx)) * 4;
            const alpha = data[idx + 3];
            totalPixels++;

            if (alpha >= 200) {
              opaquePixels++;
              // 불투명 픽셀의 색상 카운트
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const key = `${r},${g},${b}`;
              const existing = colorCounts.get(key);
              if (existing) {
                existing.count++;
              } else {
                colorCounts.set(key, { count: 1, r, g, b });
              }
            } else if (alpha >= 100) {
              semiOpaquePixels++;
              // 반투명 픽셀도 색상 카운트에 포함 (가중치 0.5)
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const key = `${r},${g},${b}`;
              const existing = colorCounts.get(key);
              if (existing) {
                existing.count += 0.5;
              } else {
                colorCounts.set(key, { count: 0.5, r, g, b });
              }
            }
            // alpha < 100은 투명으로 간주
          }
        }

        // 불투명 비율 계산 (반투명은 0.5 가중치)
        const opacityRatio = (opaquePixels + semiOpaquePixels * 0.5) / totalPixels;
        
        debugStats.totalBlocks++;

        // 불투명 비율이 임계값 미만이면 블록 전체를 투명하게
        if (opacityRatio < transparencyThreshold) {
          debugStats.clearedBlocks++;
          for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
              const idx = ((blockY + dy) * width + (blockX + dx)) * 4;
              data[idx + 3] = 0; // 완전 투명
            }
          }
        } else {
          // 임계값 이상이면 블록 내 가장 많은 색상(대표색)으로 전체 블록을 채움
          debugStats.keptBlocks++;
          
          // 가장 많은 색상 찾기
          let dominantColor = { r: 0, g: 0, b: 0 };
          let maxCount = 0;
          colorCounts.forEach((color) => {
            if (color.count > maxCount) {
              maxCount = color.count;
              dominantColor = { r: color.r, g: color.g, b: color.b };
            }
          });
          
          // 블록 전체를 대표색으로 채우기
          if (maxCount > 0) {
            debugStats.unifiedColors++;
            for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
              for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
                const idx = ((blockY + dy) * width + (blockX + dx)) * 4;
                data[idx] = dominantColor.r;
                data[idx + 1] = dominantColor.g;
                data[idx + 2] = dominantColor.b;
                data[idx + 3] = 255; // 완전 불투명
              }
            }
          }
        }
      }
    }

    console.log('픽셀 아트 정리 결과:', debugStats);

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * 픽셀 아트용 색상 균일화
   * 블록 내 가장 많은 색상으로 통일
   */
  uniformizePixelArtColors(canvas: HTMLCanvasElement, blockSize: number): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    for (let blockY = 0; blockY < height; blockY += blockSize) {
      for (let blockX = 0; blockX < width; blockX += blockSize) {
        const colorCounts = new Map<string, { count: number; r: number; g: number; b: number; a: number }>();

        // 블록 내 색상 카운트
        for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
            const idx = ((blockY + dy) * width + (blockX + dx)) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a > 0) {
              const key = `${r},${g},${b}`;
              const existing = colorCounts.get(key);
              if (existing) {
                existing.count++;
              } else {
                colorCounts.set(key, { count: 1, r, g, b, a });
              }
            }
          }
        }

        // 가장 많은 색상 찾기
        let dominantColor = { r: 0, g: 0, b: 0, a: 0 };
        let maxCount = 0;
        colorCounts.forEach((color) => {
          if (color.count > maxCount) {
            maxCount = color.count;
            dominantColor = color;
          }
        });

        // 블록 전체에 적용
        if (maxCount > 0) {
          for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
              const idx = ((blockY + dy) * width + (blockX + dx)) * 4;
              if (data[idx + 3] > 0) {
                data[idx] = dominantColor.r;
                data[idx + 1] = dominantColor.g;
                data[idx + 2] = dominantColor.b;
                data[idx + 3] = dominantColor.a;
              }
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * 단일 이미지에서 배경 제거 (픽셀 아트 수동/자동 지정 지원)
   */
  async removeBackgroundFromImage(
    imageSource: Blob | File | HTMLCanvasElement | string,
    options: BackgroundRemovalOptions = {}
  ): Promise<SingleImageResult & { pixelArtInfo?: PixelArtAnalysis }> {
    const startTime = performance.now();

    const {
      model = 'medium',
      outputFormat = 'image/png',
      outputQuality = 0.95,
      foregroundThreshold = 0.5,
      edgeBlur = 0,
      trimTransparent = false,
      useBackgroundColor = false,
      backgroundColor = '#ffffff',
      // 픽셀 아트 옵션
      isManualPixelArt = false,       // 사용자가 수동으로 픽셀 아트 지정
      autoDetectPixelArt = false,     // 자동 감지 (기본 끔)
      pixelArtCleanup = true,
      pixelBlockSize = 1,             // 기본 1x1
      pixelTransparencyThreshold = 0.1,
    } = options as BackgroundRemovalOptions & {
      isManualPixelArt?: boolean;
      autoDetectPixelArt?: boolean;
      pixelArtCleanup?: boolean;
      pixelBlockSize?: number;
      pixelTransparencyThreshold?: number;
    };

    await this.initialize(model);

    if (!this.pipeline) {
      throw new Error('배경 제거 라이브러리가 초기화되지 않았습니다.');
    }

    // 입력 소스를 Canvas로 변환
    let inputCanvas: HTMLCanvasElement;
    let inputDataUrl: string;
    let originalWidth: number;
    let originalHeight: number;

    if (imageSource instanceof Blob || imageSource instanceof File) {
      inputDataUrl = await this.blobToDataUrl(imageSource);
      const dimensions = await this.getImageDimensions(imageSource);
      originalWidth = dimensions.width;
      originalHeight = dimensions.height;
      inputCanvas = await this.dataUrlToCanvas(inputDataUrl);
    } else if (imageSource instanceof HTMLCanvasElement) {
      inputCanvas = imageSource;
      inputDataUrl = imageSource.toDataURL('image/png');
      originalWidth = imageSource.width;
      originalHeight = imageSource.height;
    } else if (typeof imageSource === 'string') {
      inputDataUrl = imageSource;
      const img = await this.loadImage(imageSource);
      originalWidth = img.width;
      originalHeight = img.height;
      inputCanvas = await this.dataUrlToCanvas(inputDataUrl);
    } else {
      throw new Error('지원하지 않는 이미지 소스 형식입니다.');
    }

    // 픽셀 아트 여부 결정 (수동 지정 우선)
    let isPixelArt = isManualPixelArt;
    let pixelArtInfo: PixelArtAnalysis | undefined;
    
    if (!isManualPixelArt && autoDetectPixelArt) {
      // 자동 감지 (수동 지정 안 했을 때만)
      pixelArtInfo = this.analyzePixelArt(inputCanvas);
      isPixelArt = pixelArtInfo.isPixelArt;
      console.log('픽셀 아트 자동 분석 결과:', pixelArtInfo);
    } else if (isManualPixelArt) {
      // 수동 지정 시 가짜 분석 결과 생성
      pixelArtInfo = {
        isPixelArt: true,
        confidence: 1,
        blockSize: pixelBlockSize,
        uniformityScore: 1,
      };
      console.log('픽셀 아트 수동 지정:', { blockSize: pixelBlockSize });
    }

    // 배경 제거 실행
    const result = await this.pipeline(inputDataUrl);
    const maskData = result[0];
    
    // 마스크 적용
    let resultCanvas = await this.applyMaskToImage(inputDataUrl, maskData, originalWidth, originalHeight);

    // 픽셀 아트인 경우 격자 기반 정리
    if (pixelArtCleanup && isPixelArt) {
      const blockSize = pixelBlockSize || pixelArtInfo?.blockSize || 1;
      console.log(`픽셀 아트 정리 적용 (블록 크기: ${blockSize}px, 임계값: ${pixelTransparencyThreshold * 100}%)`);
      
      resultCanvas = this.applyPixelArtCleanup(resultCanvas, blockSize, pixelTransparencyThreshold);
      
      // 선택적: 색상 균일화
      // resultCanvas = this.uniformizePixelArtColors(resultCanvas, blockSize);
    }

    // 일반 후처리 적용 (픽셀 아트가 아닌 경우에만 블러 적용)
    resultCanvas = await this.applyPostProcessing(resultCanvas, {
      foregroundThreshold,
      edgeBlur: isPixelArt ? 0 : edgeBlur, // 픽셀 아트면 블러 비활성화
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
      pixelArtInfo,
    };
  }

  /**
   * Data URL을 Canvas로 변환
   */
  private async dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  /**
   * 마스크를 원본 이미지에 적용
   */
  private async applyMaskToImage(
    imageUrl: string,
    maskData: any,
    width: number,
    height: number
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const img = await this.loadImage(imageUrl);
    ctx.drawImage(img, 0, 0, width, height);

    if (maskData && maskData.mask) {
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d')!;
      
      if (maskData.mask.toCanvas) {
        const maskImg = await maskData.mask.toCanvas();
        maskCanvas.width = maskImg.width;
        maskCanvas.height = maskImg.height;
        maskCtx.drawImage(maskImg, 0, 0);
      } else {
        maskCanvas.width = width;
        maskCanvas.height = height;
        if (typeof maskData.mask === 'string') {
          const maskImg = await this.loadImage(maskData.mask);
          maskCtx.drawImage(maskImg, 0, 0, width, height);
        }
      }

      const imageData = ctx.getImageData(0, 0, width, height);
      const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      
      const scaleX = maskCanvas.width / width;
      const scaleY = maskCanvas.height / height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const mx = Math.floor(x * scaleX);
          const my = Math.floor(y * scaleY);
          const mi = (my * maskCanvas.width + mx) * 4;
          
          const maskValue = maskImageData.data[mi];
          imageData.data[i + 3] = maskValue;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    return canvas;
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

    if (options.edgeBlur > 0) {
      resultCanvas = await this.applyEdgeBlur(resultCanvas, options.edgeBlur);
    }

    if (options.useBackgroundColor) {
      resultCanvas = this.applyBackgroundColor(resultCanvas, options.backgroundColor);
    }

    if (options.trimTransparent) {
      resultCanvas = this.trimTransparentPixels(resultCanvas);
    }

    return resultCanvas;
  }

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

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = src;
    });
  }

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

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Data URL 변환 실패'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(blob);
    });
  }

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
