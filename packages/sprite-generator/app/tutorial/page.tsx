// Server Component - SEO를 위해 정적 렌더링
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '스프라이트 시트 제작 튜토리얼',
  description:
    '게임 개발을 위한 스프라이트 시트 제작 가이드. 동영상에서 프레임 추출, AI 배경 제거, Phaser/Unity/Godot 연동 방법까지 상세히 알아보세요.',
  keywords: [
    '스프라이트 시트 만들기',
    '스프라이트 튜토리얼',
    '게임 애니메이션 제작',
    'Phaser 스프라이트',
    'Unity 스프라이트 시트',
    'Godot 애니메이션',
    '배경 제거 방법',
  ],
  openGraph: {
    title: '스프라이트 시트 제작 튜토리얼 | Sprite Generator',
    description:
      '게임 개발자를 위한 완벽 가이드. 동영상→스프라이트, AI 배경 제거, 게임 엔진 연동까지!',
  },
};

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-white hover:text-indigo-400 transition-colors"
          >
            Sprite Generator
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            도구 사용하기
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            스프라이트 시트 제작 완벽 가이드
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            게임 개발에 필요한 스프라이트 시트를 쉽고 빠르게 제작하는 방법을
            단계별로 알아보세요.
          </p>
        </div>

        {/* 목차 */}
        <nav className="bg-gray-800/50 rounded-xl p-6 mb-12 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">목차</h2>
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#what-is-sprite" className="hover:text-indigo-400">
                1. 스프라이트 시트란?
              </a>
            </li>
            <li>
              <a href="#video-to-sprite" className="hover:text-indigo-400">
                2. 동영상에서 스프라이트 추출하기
              </a>
            </li>
            <li>
              <a href="#sprite-import" className="hover:text-indigo-400">
                3. 기존 스프라이트 시트 편집하기
              </a>
            </li>
            <li>
              <a href="#bg-remove" className="hover:text-indigo-400">
                4. AI로 배경 제거하기
              </a>
            </li>
            <li>
              <a href="#game-engines" className="hover:text-indigo-400">
                5. 게임 엔진에서 사용하기
              </a>
            </li>
            <li>
              <a href="#best-practices" className="hover:text-indigo-400">
                6. 팁 & 베스트 프랙티스
              </a>
            </li>
          </ul>
        </nav>

        {/* 섹션 1: 스프라이트 시트란? */}
        <section id="what-is-sprite" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">
              1
            </span>
            스프라이트 시트란?
          </h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">스프라이트 시트(Sprite Sheet)</strong>는
              여러 개의 이미지 프레임을 하나의 큰 이미지 파일에 격자 형태로
              배치한 것입니다. 게임 개발에서 캐릭터 애니메이션, UI 요소, 아이콘
              등을 효율적으로 관리하기 위해 사용됩니다.
            </p>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                스프라이트 시트의 장점
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>
                    <strong className="text-white">성능 향상:</strong> 여러 개의
                    작은 이미지 대신 하나의 큰 이미지를 로드하여 HTTP 요청 횟수를
                    줄입니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>
                    <strong className="text-white">메모리 효율:</strong> GPU가
                    텍스처를 더 효율적으로 처리할 수 있습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>
                    <strong className="text-white">관리 용이:</strong> 관련된
                    애니메이션 프레임을 하나의 파일로 관리할 수 있습니다.
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed">
              일반적으로 스프라이트 시트는 PNG 이미지와 함께 각 프레임의 위치
              정보를 담은 JSON 메타데이터 파일로 구성됩니다. 게임 엔진은 이
              메타데이터를 읽어 올바른 위치의 프레임을 화면에 표시합니다.
            </p>
          </div>
        </section>

        {/* 섹션 2: 동영상에서 스프라이트 추출 */}
        <section id="video-to-sprite" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">
              2
            </span>
            동영상에서 스프라이트 추출하기
          </h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-6">
              캐릭터 모션 캡처 영상이나 애니메이션 동영상을 스프라이트 시트로
              변환하는 방법입니다. 이 기능을 사용하면 실사 영상이나 3D 렌더링
              결과물을 2D 게임에 활용할 수 있습니다.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 text-sm font-bold">
                    1
                  </span>
                  <h3 className="text-white font-medium">동영상 업로드</h3>
                </div>
                <p className="text-gray-400 text-sm ml-10">
                  MP4, WebM, MOV 등의 동영상 파일을 업로드합니다. 가장 호환성이
                  좋은 형식은 MP4(H.264)입니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 text-sm font-bold">
                    2
                  </span>
                  <h3 className="text-white font-medium">FPS 및 구간 설정</h3>
                </div>
                <p className="text-gray-400 text-sm ml-10">
                  추출할 FPS를 설정합니다. 게임 애니메이션은 보통 8~15 FPS가
                  적합합니다. 시작/종료 시간으로 원하는 구간만 선택할 수
                  있습니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 text-sm font-bold">
                    3
                  </span>
                  <h3 className="text-white font-medium">프레임 추출</h3>
                </div>
                <p className="text-gray-400 text-sm ml-10">
                  &quot;프레임 추출&quot; 버튼을 클릭하면 설정에 따라 프레임이
                  이미지로 변환됩니다. 추출된 프레임을 미리보기에서 확인하고
                  불필요한 프레임을 삭제할 수 있습니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 text-sm font-bold">
                    4
                  </span>
                  <h3 className="text-white font-medium">스프라이트 시트 생성</h3>
                </div>
                <p className="text-gray-400 text-sm ml-10">
                  열/행 수와 여백을 설정한 후 스프라이트 시트를 생성합니다. PNG
                  이미지와 JSON 메타데이터를 함께 다운로드하세요.
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-200 text-sm">
                <strong>팁:</strong> 동영상의 배경이 단색(그린 스크린 등)이면 AI
                배경 제거 기능을 함께 사용하여 투명 배경 스프라이트를 만들 수
                있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 섹션 3: 스프라이트 시트 편집 */}
        <section id="sprite-import" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-sm">
              3
            </span>
            기존 스프라이트 시트 편집하기
          </h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-6">
              이미 가지고 있는 스프라이트 시트를 개별 프레임으로 분리하고, 새로운
              레이아웃으로 재구성할 수 있습니다. 다른 형식의 스프라이트를 Phaser
              호환 형식으로 변환할 때 유용합니다.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">자동 감지</h3>
                <p className="text-gray-400 text-sm">
                  스프라이트 시트의 프레임 크기를 자동으로 감지합니다. 일정한
                  간격의 스프라이트에 잘 작동합니다.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">수동 설정</h3>
                <p className="text-gray-400 text-sm">
                  프레임 너비/높이를 직접 입력하여 정확하게 분리할 수 있습니다.
                  불규칙한 스프라이트에 유용합니다.
                </p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">
              분리된 프레임은 개별적으로 편집하거나 삭제할 수 있습니다. 원하는
              순서로 재배치한 후 새로운 스프라이트 시트로 내보내세요.
            </p>
          </div>
        </section>

        {/* 섹션 4: AI 배경 제거 */}
        <section id="bg-remove" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-sm">
              4
            </span>
            AI로 배경 제거하기
          </h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-6">
              Hugging Face의 RMBG-1.4 AI 모델을 사용하여 이미지에서 배경을
              자동으로 제거합니다. 모든 처리는 브라우저에서 로컬로 수행되어
              개인정보가 보호됩니다.
            </p>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                배경 제거 모드
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-1">일반 모드</h4>
                  <p className="text-gray-400 text-sm">
                    사진, 일러스트 등 일반적인 이미지에 적합합니다. 부드러운
                    가장자리 처리로 자연스러운 결과물을 제공합니다.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">픽셀 아트 모드</h4>
                  <p className="text-gray-400 text-sm">
                    저해상도 픽셀 아트에 최적화되어 있습니다. 안티앨리어싱 없이
                    선명한 픽셀 경계를 유지합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                <strong>참고:</strong> 처음 사용 시 AI 모델(약 170MB)을
                다운로드합니다. 이후에는 브라우저에 캐시되어 빠르게 처리됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 섹션 5: 게임 엔진 연동 */}
        <section id="game-engines" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-sm">
              5
            </span>
            게임 엔진에서 사용하기
          </h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-6">
              생성된 스프라이트 시트와 JSON 메타데이터를 각 게임 엔진에서
              사용하는 방법입니다.
            </p>

            {/* Phaser */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">P3</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Phaser 3</h3>
              </div>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                <code>{`// 로드
this.load.atlas(
  'character',
  'character.png',
  'character.json'
);

// 애니메이션 생성
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNames('character', {
    prefix: 'frame_',
    start: 0,
    end: 7
  }),
  frameRate: 10,
  repeat: -1
});

// 재생
sprite.play('walk');`}</code>
              </pre>
            </div>

            {/* Unity */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-gray-300 font-bold text-sm">U</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Unity</h3>
              </div>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li>1. PNG 파일을 Assets 폴더에 드래그</li>
                <li>
                  2. Inspector에서 Sprite Mode를 &quot;Multiple&quot;로 변경
                </li>
                <li>3. Sprite Editor 열기 → Slice → Grid By Cell Size</li>
                <li>4. 프레임 크기 입력 후 Slice 클릭</li>
                <li>5. Apply 후 Animation Controller에서 사용</li>
              </ol>
            </div>

            {/* Godot */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-300 font-bold text-sm">G</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Godot 4</h3>
              </div>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li>1. PNG를 프로젝트에 추가</li>
                <li>2. AnimatedSprite2D 노드 생성</li>
                <li>3. SpriteFrames 리소스 생성</li>
                <li>
                  4. &quot;Add frames from sprite sheet&quot; 클릭 → 프레임
                  크기 설정
                </li>
                <li>5. 사용할 프레임 선택 후 추가</li>
              </ol>
            </div>
          </div>
        </section>

        {/* 섹션 6: 팁 & 베스트 프랙티스 */}
        <section id="best-practices" className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center text-sm">
              6
            </span>
            팁 & 베스트 프랙티스
          </h2>

          <div className="prose prose-invert max-w-none">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">
                  2의 거듭제곱 크기
                </h3>
                <p className="text-gray-400 text-sm">
                  스프라이트 시트 크기를 512×512, 1024×1024 등 2의 거듭제곱으로
                  설정하면 GPU 최적화에 유리합니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">여백(Padding)</h3>
                <p className="text-gray-400 text-sm">
                  프레임 사이에 1~2px 여백을 두면 렌더링 시 인접 프레임이
                  블리딩되는 현상을 방지할 수 있습니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">적절한 FPS</h3>
                <p className="text-gray-400 text-sm">
                  걷기: 8~10 FPS, 달리기: 12~15 FPS, 공격: 15~20 FPS가 일반적으로
                  자연스럽습니다.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                <h3 className="text-white font-medium mb-2">파일 크기</h3>
                <p className="text-gray-400 text-sm">
                  웹 게임의 경우 개별 스프라이트 시트를 2048×2048 이하로
                  유지하는 것이 좋습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-8 border border-indigo-500/30">
          <h2 className="text-2xl font-bold text-white mb-3">
            지금 바로 시작하세요!
          </h2>
          <p className="text-gray-300 mb-6">
            무료로 스프라이트 시트를 만들고, AI로 배경을 제거해보세요.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Sprite Generator 사용하기
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} Sprite Generator | Made with love in
            Korea
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/aldegad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span className="mx-2">•</span>
            <a
              href="mailto:aldegad@gmail.com"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
