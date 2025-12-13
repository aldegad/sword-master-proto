import { VideoProcessor, type ExtractedFrame } from './lib/video-processor';
import { SpriteGenerator, type SpriteSheetMetadata } from './lib/sprite-generator';
import { BackgroundRemover } from './lib/background-remover';

// DOM Elements
const videoInput = document.getElementById('video-input') as HTMLInputElement;
const uploadArea = document.getElementById('upload-area') as HTMLDivElement;
const videoPreview = document.getElementById('video-preview') as HTMLVideoElement;

const stepExtract = document.getElementById('step-extract') as HTMLElement;
const fpsInput = document.getElementById('fps') as HTMLInputElement;
const startTimeInput = document.getElementById('start-time') as HTMLInputElement;
const endTimeInput = document.getElementById('end-time') as HTMLInputElement;
const scaleInput = document.getElementById('scale') as HTMLInputElement;
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;

const stepPreview = document.getElementById('step-preview') as HTMLElement;
const frameCount = document.getElementById('frame-count') as HTMLSpanElement;
const framesContainer = document.getElementById('frames-container') as HTMLDivElement;
const removeBgBtn = document.getElementById('remove-bg-btn') as HTMLButtonElement;
const generateSpriteBtn = document.getElementById('generate-sprite-btn') as HTMLButtonElement;

// 애니메이션 미리보기 요소
const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const previewFpsInput = document.getElementById('preview-fps') as HTMLInputElement;
const previewInfo = document.getElementById('preview-info') as HTMLSpanElement;
const selectAllBtn = document.getElementById('select-all-btn') as HTMLButtonElement;
const deselectAllBtn = document.getElementById('deselect-all-btn') as HTMLButtonElement;
const pingpongCheckbox = document.getElementById('pingpong-checkbox') as HTMLInputElement;

const stepResult = document.getElementById('step-result') as HTMLElement;
const spriteCanvas = document.getElementById('sprite-canvas') as HTMLCanvasElement;
const spriteInfo = document.getElementById('sprite-info') as HTMLDivElement;
const downloadPngBtn = document.getElementById('download-png-btn') as HTMLButtonElement;
const downloadJsonBtn = document.getElementById('download-json-btn') as HTMLButtonElement;

const progressOverlay = document.getElementById('progress-overlay') as HTMLDivElement;
const progressText = document.getElementById('progress-text') as HTMLParagraphElement;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement;

// State
let videoProcessor: VideoProcessor | null = null;
let spriteGenerator: SpriteGenerator | null = null;
let backgroundRemover: BackgroundRemover | null = null;
let extractedFrames: ExtractedFrame[] = [];
let disabledFrames: Set<number> = new Set(); // 비활성화된 프레임 인덱스
let disabledReverseFrames: Set<number> = new Set(); // 비활성화된 역방향 프레임 인덱스
let frameOffsets: Map<number, { x: number; y: number }> = new Map(); // 프레임별 오프셋
let reverseFrameOffsets: Map<number, { x: number; y: number }> = new Map(); // 역방향 프레임별 오프셋
let currentMetadata: SpriteSheetMetadata | null = null;

// 애니메이션 미리보기 상태
let isPlaying = false;
let animationFrameId: number | null = null;
let currentFrameIndex = 0;
let lastFrameTime = 0;

// Initialize
function init() {
  videoProcessor = new VideoProcessor();
  spriteGenerator = new SpriteGenerator();
  backgroundRemover = new BackgroundRemover();

  setupEventListeners();
}

function setupEventListeners() {
  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleVideoFile(files[0]);
    }
  });

  // 파일 선택
  videoInput.addEventListener('change', () => {
    const file = videoInput.files?.[0];
    if (file) {
      handleVideoFile(file);
    }
  });

  // 프레임 추출
  extractBtn.addEventListener('click', handleExtractFrames);

  // 배경 제거
  removeBgBtn.addEventListener('click', handleRemoveBackground);

  // 스프라이트 생성
  generateSpriteBtn.addEventListener('click', handleGenerateSprite);

  // 다운로드
  downloadPngBtn.addEventListener('click', handleDownloadPng);
  downloadJsonBtn.addEventListener('click', handleDownloadJson);

  // 애니메이션 미리보기 컨트롤
  playBtn.addEventListener('click', startAnimation);
  stopBtn.addEventListener('click', stopAnimation);
  previewFpsInput.addEventListener('change', () => {
    // FPS 변경 시 재시작
    if (isPlaying) {
      stopAnimation();
      startAnimation();
    }
  });

  // 전체 선택/해제
  selectAllBtn.addEventListener('click', () => {
    disabledFrames.clear();
    disabledReverseFrames.clear();
    renderFramesPreviews();
    updatePreviewInfo();
  });
  deselectAllBtn.addEventListener('click', () => {
    extractedFrames.forEach((_, index) => {
      disabledFrames.add(index);
      disabledReverseFrames.add(index);
    });
    renderFramesPreviews();
    updatePreviewInfo();
  });

  // 핑퐁 옵션 변경 시 미리보기 업데이트 및 프레임 목록 다시 렌더링
  pingpongCheckbox.addEventListener('change', () => {
    currentFrameIndex = 0;
    renderFramesPreviews();
    updatePreviewInfo();
    drawPreviewFrame();
  });
}

async function handleVideoFile(file: File) {
  if (!file.type.startsWith('video/')) {
    alert('동영상 파일만 업로드할 수 있습니다.');
    return;
  }

  try {
    showProgress('동영상 로딩 중...');

    const video = await videoProcessor!.loadVideo(file);
    const metadata = videoProcessor!.getMetadata();

    // 미리보기 설정
    videoPreview.src = video.src;
    videoPreview.hidden = false;

    // 설정 기본값
    endTimeInput.value = metadata.duration.toFixed(1);
    endTimeInput.max = metadata.duration.toString();
    startTimeInput.max = metadata.duration.toString();

    // 다음 단계 표시
    stepExtract.hidden = false;

    hideProgress();
  } catch (error) {
    hideProgress();
    alert('동영상 로드 실패: ' + (error as Error).message);
  }
}

async function handleExtractFrames() {
  const fps = parseInt(fpsInput.value) || 12;
  const startTime = parseFloat(startTimeInput.value) || 0;
  const endTime = parseFloat(endTimeInput.value) || 0;
  const scale = parseInt(scaleInput.value) || 100;

  try {
    showProgress('프레임 추출 중...', 0);

    extractedFrames = await videoProcessor!.extractFrames(
      { fps, startTime, endTime, scale },
      (progress, current, total) => {
        updateProgress(`프레임 추출 중... (${current}/${total})`, progress);
      }
    );

    // 비활성화 목록 및 오프셋 초기화
    disabledFrames.clear();
    disabledReverseFrames.clear();
    frameOffsets.clear();
    reverseFrameOffsets.clear();

    // 프레임 미리보기 렌더링
    renderFramesPreviews();
    initPreviewCanvas();

    stepPreview.hidden = false;
    hideProgress();
  } catch (error) {
    hideProgress();
    alert('프레임 추출 실패: ' + (error as Error).message);
  }
}

function renderFramesPreviews() {
  framesContainer.innerHTML = '';
  
  const isPingpong = pingpongCheckbox.checked;
  const totalOriginalFrames = extractedFrames.length;
  const enabledOriginalCount = totalOriginalFrames - disabledFrames.size;
  const enabledReverseCount = isPingpong ? totalOriginalFrames - disabledReverseFrames.size : 0;
  const totalEnabled = enabledOriginalCount + enabledReverseCount;
  const totalFrames = isPingpong ? totalOriginalFrames * 2 : totalOriginalFrames;
  
  frameCount.textContent = `(${totalEnabled}/${totalFrames}개 활성화)`;

  // 원본 프레임 렌더링
  extractedFrames.forEach((frame, index) => {
    const div = createFrameElement(frame, index, false);
    framesContainer.appendChild(div);
  });

  // 핑퐁일 때 역방향 프레임도 표시
  if (isPingpong && extractedFrames.length > 0) {
    // 구분선 추가
    const separator = document.createElement('div');
    separator.className = 'frames-separator';
    separator.innerHTML = '<span>🔄 역방향 프레임</span>';
    framesContainer.appendChild(separator);

    // 역방향 프레임 (완전 역순)
    const reversedFrames = [...extractedFrames].reverse();
    reversedFrames.forEach((frame, reverseIndex) => {
      const div = createFrameElement(frame, reverseIndex, true, totalOriginalFrames + reverseIndex + 1);
      framesContainer.appendChild(div);
    });
  }
}

function createFrameElement(frame: ExtractedFrame, index: number, isReverse: boolean, displayNumber?: number): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'frame-item' + (isReverse ? ' reverse-frame' : '');
  
  const disabledSet = isReverse ? disabledReverseFrames : disabledFrames;
  const offsetsMap = isReverse ? reverseFrameOffsets : frameOffsets;
  
  if (disabledSet.has(index)) {
    div.classList.add('disabled');
  }
  
  const offset = offsetsMap.get(index) || { x: 0, y: 0 };
  const frameNum = displayNumber ?? (index + 1);
  
  div.innerHTML = `
    <div class="frame-image-wrapper">
      <img src="${frame.dataUrl}" alt="Frame ${index}" style="transform: translate(${offset.x}px, ${offset.y}px)" />
    </div>
    <span class="frame-number">${frameNum}</span>
    <div class="frame-offset-controls">
      <button class="offset-btn up" data-dir="up" title="위로">▲</button>
      <div class="offset-lr">
        <button class="offset-btn left" data-dir="left" title="왼쪽">◀</button>
        <span class="offset-value">${offset.x},${offset.y}</span>
        <button class="offset-btn right" data-dir="right" title="오른쪽">▶</button>
      </div>
      <button class="offset-btn down" data-dir="down" title="아래로">▼</button>
    </div>
  `;
  
  // 이미지 클릭 시 토글
  const imgWrapper = div.querySelector('.frame-image-wrapper') as HTMLElement;
  imgWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isReverse) {
      toggleReverseFrame(index);
    } else {
      toggleFrame(index);
    }
    div.classList.toggle('disabled');
    updateFrameCount();
    updatePreviewInfo();
  });
  
  // 방향 버튼 이벤트
  const offsetBtns = div.querySelectorAll('.offset-btn');
  offsetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dir = (btn as HTMLElement).dataset.dir;
      adjustFrameOffset(index, dir as 'up' | 'down' | 'left' | 'right', isReverse);
      
      // UI 업데이트
      const newOffset = offsetsMap.get(index) || { x: 0, y: 0 };
      const img = div.querySelector('img') as HTMLImageElement;
      img.style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`;
      const valueSpan = div.querySelector('.offset-value') as HTMLSpanElement;
      valueSpan.textContent = `${newOffset.x},${newOffset.y}`;
      
      // 미리보기 업데이트
      drawPreviewFrame();
    });
  });
  
  return div;
}

function adjustFrameOffset(index: number, direction: 'up' | 'down' | 'left' | 'right', isReverse: boolean) {
  const offsetsMap = isReverse ? reverseFrameOffsets : frameOffsets;
  const current = offsetsMap.get(index) || { x: 0, y: 0 };
  const step = 1; // 1픽셀 단위로 이동
  
  switch (direction) {
    case 'up':
      current.y -= step;
      break;
    case 'down':
      current.y += step;
      break;
    case 'left':
      current.x -= step;
      break;
    case 'right':
      current.x += step;
      break;
  }
  
  offsetsMap.set(index, current);
}

function updateFrameCount() {
  const isPingpong = pingpongCheckbox.checked;
  const totalOriginalFrames = extractedFrames.length;
  const enabledOriginalCount = totalOriginalFrames - disabledFrames.size;
  const enabledReverseCount = isPingpong ? totalOriginalFrames - disabledReverseFrames.size : 0;
  const totalEnabled = enabledOriginalCount + enabledReverseCount;
  const totalFrames = isPingpong ? totalOriginalFrames * 2 : totalOriginalFrames;
  
  frameCount.textContent = `(${totalEnabled}/${totalFrames}개 활성화)`;
}

function toggleFrame(index: number) {
  if (disabledFrames.has(index)) {
    disabledFrames.delete(index);
  } else {
    disabledFrames.add(index);
  }
}

function toggleReverseFrame(index: number) {
  if (disabledReverseFrames.has(index)) {
    disabledReverseFrames.delete(index);
  } else {
    disabledReverseFrames.add(index);
  }
}

interface FrameWithOffset {
  frame: ExtractedFrame;
  offset: { x: number; y: number };
}

function getEnabledFrames(): ExtractedFrame[] {
  return extractedFrames.filter((_, index) => !disabledFrames.has(index));
}

function getEnabledFramesWithOffsets(): FrameWithOffset[] {
  return extractedFrames
    .map((frame, index) => ({
      frame,
      offset: frameOffsets.get(index) || { x: 0, y: 0 },
      index
    }))
    .filter((_, index) => !disabledFrames.has(index))
    .map(({ frame, offset }) => ({ frame, offset }));
}

function getFramesWithPingPongAndOffsets(): FrameWithOffset[] {
  const enabledFrames = getEnabledFramesWithOffsets();
  if (!pingpongCheckbox.checked) {
    return enabledFrames;
  }
  
  // 역방향 프레임: 원본 전체를 역순으로 배열한 후, disabled된 것 제외
  const reversedAllFrames = [...extractedFrames].reverse();
  const enabledReverseFrames = reversedAllFrames
    .map((frame, index) => ({
      frame,
      offset: reverseFrameOffsets.get(index) || { x: 0, y: 0 },
      index
    }))
    .filter(({ index }) => !disabledReverseFrames.has(index))
    .map(({ frame, offset }) => ({ frame, offset }));
  
  return [...enabledFrames, ...enabledReverseFrames];
}

// ========== 애니메이션 미리보기 ==========

function initPreviewCanvas() {
  if (extractedFrames.length === 0) return;
  
  const firstFrame = extractedFrames[0];
  previewCanvas.width = firstFrame.canvas.width;
  previewCanvas.height = firstFrame.canvas.height;
  
  // 첫 프레임 표시
  currentFrameIndex = 0;
  drawPreviewFrame();
  updatePreviewInfo();
}

function drawPreviewFrame() {
  const framesWithOffsets = getFramesWithPingPongAndOffsets();
  if (framesWithOffsets.length === 0) {
    const ctx = previewCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    return;
  }
  
  const frameIndex = currentFrameIndex % framesWithOffsets.length;
  const { frame, offset } = framesWithOffsets[frameIndex];
  
  const ctx = previewCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(frame.canvas, offset.x, offset.y);
}

function updatePreviewInfo() {
  const enabledFrames = getEnabledFrames();
  const totalFrames = getFramesWithPingPongAndOffsets();
  if (enabledFrames.length === 0) {
    previewInfo.textContent = '활성화된 프레임 없음';
    return;
  }
  const frameIndex = currentFrameIndex % totalFrames.length;
  const pingpongText = pingpongCheckbox.checked ? ' (핑퐁)' : '';
  previewInfo.textContent = `프레임: ${frameIndex + 1}/${totalFrames.length}${pingpongText}`;
}

function startAnimation() {
  const enabledFrames = getEnabledFrames();
  if (enabledFrames.length === 0) {
    alert('활성화된 프레임이 없습니다.');
    return;
  }
  
  if (isPlaying) return;
  
  isPlaying = true;
  playBtn.classList.add('active');
  lastFrameTime = performance.now();
  currentFrameIndex = 0;
  
  animate();
}

function animate() {
  if (!isPlaying) return;
  
  const fps = parseInt(previewFpsInput.value) || 12;
  const frameInterval = 1000 / fps;
  const now = performance.now();
  
  if (now - lastFrameTime >= frameInterval) {
    const frames = getFramesWithPingPongAndOffsets();
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    drawPreviewFrame();
    updatePreviewInfo();
    lastFrameTime = now;
  }
  
  animationFrameId = requestAnimationFrame(animate);
}

function stopAnimation() {
  isPlaying = false;
  playBtn.classList.remove('active');
  
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// ========== 배경 제거 ==========

async function handleRemoveBackground() {
  if (extractedFrames.length === 0) return;

  try {
    showProgress('배경 제거 초기화 중...');
    await backgroundRemover!.initialize();

    showProgress('배경 제거 중...', 0);

    extractedFrames = await backgroundRemover!.removeBackgroundFromFrames(
      extractedFrames,
      (progress, current, total) => {
        updateProgress(`배경 제거 중... (${current}/${total})`, progress);
      }
    );

    // 미리보기 업데이트
    renderFramesPreviews();
    drawPreviewFrame();

    hideProgress();
  } catch (error) {
    hideProgress();
    alert('배경 제거 실패: ' + (error as Error).message);
  }
}

// ========== 스프라이트 시트 생성 ==========

function handleGenerateSprite() {
  const enabledFrames = getEnabledFrames();
  
  if (enabledFrames.length === 0) {
    alert('활성화된 프레임이 없습니다. 최소 1개 이상의 프레임을 활성화해주세요.');
    return;
  }

  try {
    showProgress('스프라이트 시트 생성 중...');

    // 핑퐁 옵션 및 오프셋 적용된 프레임으로 스프라이트 시트 생성
    const finalFramesWithOffsets = getFramesWithPingPongAndOffsets();
    const result = spriteGenerator!.generateSpriteSheetWithOffsets(finalFramesWithOffsets);

    // 결과 캔버스에 그리기
    const ctx = spriteCanvas.getContext('2d')!;
    spriteCanvas.width = result.canvas.width;
    spriteCanvas.height = result.canvas.height;
    ctx.drawImage(result.canvas, 0, 0);

    // 메타데이터 저장
    currentMetadata = result.metadata;

    // 정보 표시
    const pingpongInfo = pingpongCheckbox.checked 
      ? `<br>🔄 핑퐁 적용됨 (${enabledFrames.length}개 → ${finalFramesWithOffsets.length}개)`
      : '';
    spriteInfo.innerHTML = `
      <strong>스프라이트 시트 정보:</strong><br>
      크기: ${result.metadata.meta.size.width} x ${result.metadata.meta.size.height} px<br>
      프레임 크기: ${result.metadata.meta.frameWidth} x ${result.metadata.meta.frameHeight} px<br>
      배열: ${result.metadata.meta.columns} 열 x ${result.metadata.meta.rows} 행<br>
      총 프레임: ${result.metadata.meta.totalFrames}개${pingpongInfo}
    `;

    stepResult.hidden = false;
    hideProgress();

    // 결과로 스크롤
    stepResult.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    hideProgress();
    alert('스프라이트 생성 실패: ' + (error as Error).message);
  }
}

function handleDownloadPng() {
  spriteGenerator!.downloadCanvas(spriteCanvas, 'spritesheet.png');
}

function handleDownloadJson() {
  if (currentMetadata) {
    spriteGenerator!.downloadMetadata(currentMetadata, 'spritesheet.json');
  }
}

function showProgress(text: string, progress?: number) {
  progressText.textContent = text;
  progressOverlay.hidden = false;
  if (progress !== undefined) {
    progressFill.style.width = `${progress}%`;
  } else {
    progressFill.style.width = '0%';
  }
}

function updateProgress(text: string, progress: number) {
  progressText.textContent = text;
  progressFill.style.width = `${progress}%`;
}

function hideProgress() {
  progressOverlay.hidden = true;
  progressFill.style.width = '0%';
}

// Start
init();
