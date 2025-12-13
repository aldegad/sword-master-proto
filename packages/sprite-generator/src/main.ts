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

    // 비활성화 목록 초기화
    disabledFrames.clear();
    disabledReverseFrames.clear();

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
    const div = document.createElement('div');
    div.className = 'frame-item';
    if (disabledFrames.has(index)) {
      div.classList.add('disabled');
    }
    div.innerHTML = `
      <img src="${frame.dataUrl}" alt="Frame ${index}" />
      <span class="frame-number">${index + 1}</span>
    `;
    
    // 클릭 시 토글
    div.addEventListener('click', () => {
      toggleFrame(index);
      div.classList.toggle('disabled');
      updateFrameCount();
      updatePreviewInfo();
    });
    
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
      const div = document.createElement('div');
      div.className = 'frame-item reverse-frame';
      if (disabledReverseFrames.has(reverseIndex)) {
        div.classList.add('disabled');
      }
      const displayNumber = totalOriginalFrames + reverseIndex + 1;
      div.innerHTML = `
        <img src="${frame.dataUrl}" alt="Reverse Frame ${reverseIndex}" />
        <span class="frame-number">${displayNumber}</span>
      `;
      
      // 클릭 시 토글
      div.addEventListener('click', () => {
        toggleReverseFrame(reverseIndex);
        div.classList.toggle('disabled');
        updateFrameCount();
        updatePreviewInfo();
      });
      
      framesContainer.appendChild(div);
    });
  }
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

function getEnabledFrames(): ExtractedFrame[] {
  return extractedFrames.filter((_, index) => !disabledFrames.has(index));
}

/**
 * 핑퐁(역방향) 프레임 포함하여 반환
 * 역방향 프레임의 disabled 상태도 개별 반영
 */
function getFramesWithPingPong(): ExtractedFrame[] {
  const enabledFrames = getEnabledFrames();
  if (!pingpongCheckbox.checked) {
    return enabledFrames;
  }
  
  // 역방향 프레임: 원본 전체를 역순으로 배열한 후, disabled된 것 제외
  const reversedAllFrames = [...extractedFrames].reverse();
  const enabledReverseFrames = reversedAllFrames.filter((_, index) => !disabledReverseFrames.has(index));
  
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
  const frames = getFramesWithPingPong();
  if (frames.length === 0) {
    const ctx = previewCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    return;
  }
  
  const frameIndex = currentFrameIndex % frames.length;
  const frame = frames[frameIndex];
  
  const ctx = previewCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(frame.canvas, 0, 0);
}

function updatePreviewInfo() {
  const enabledFrames = getEnabledFrames();
  const totalFrames = getFramesWithPingPong();
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
    const frames = getFramesWithPingPong();
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

    // 핑퐁 옵션 적용된 프레임으로 스프라이트 시트 생성
    const finalFrames = getFramesWithPingPong();
    const result = spriteGenerator!.generateSpriteSheet(finalFrames);

    // 결과 캔버스에 그리기
    const ctx = spriteCanvas.getContext('2d')!;
    spriteCanvas.width = result.canvas.width;
    spriteCanvas.height = result.canvas.height;
    ctx.drawImage(result.canvas, 0, 0);

    // 메타데이터 저장
    currentMetadata = result.metadata;

    // 정보 표시
    const pingpongInfo = pingpongCheckbox.checked 
      ? `<br>🔄 핑퐁 적용됨 (${enabledFrames.length}개 → ${finalFrames.length}개)`
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
