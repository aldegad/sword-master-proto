// Server Component - SEO를 위해 정적 렌더링

export function FeaturesSection() {
  return (
    <section className="mt-16 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          게임 개발자를 위한 올인원 스프라이트 도구
        </h2>
        <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
          동영상에서 스프라이트 추출, 스프라이트 시트 편집, AI 배경 제거까지
          모든 작업을 브라우저에서 무료로 처리하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 비디오 → 스프라이트 */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Video → Sprite</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            동영상 파일에서 프레임을 추출하여 스프라이트 시트를 생성합니다.
            FPS 조절, 구간 선택, 프레임 편집 기능을 제공합니다.
            캐릭터 모션 캡처 영상을 게임용 애니메이션으로 변환하세요.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> MP4, WebM, MOV 지원
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> 커스텀 FPS 설정
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span> 구간 선택 추출
            </li>
          </ul>
        </div>

        {/* 스프라이트 임포트 */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sprite Import</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            기존 스프라이트 시트를 개별 프레임으로 분리하고 재구성합니다.
            프레임 크기 자동 감지, 수동 조정 기능을 제공합니다.
            다른 형식의 스프라이트를 Phaser 호환 형식으로 변환하세요.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> 프레임 자동 감지
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> 레이아웃 재구성
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> JSON 메타데이터 생성
            </li>
          </ul>
        </div>

        {/* AI 배경 제거 */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Background Removal</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            AI가 자동으로 배경을 감지하고 제거합니다.
            복잡한 배경도 정확하게 분리하며, 픽셀 아트 전용 모드를 제공합니다.
            모든 처리는 브라우저에서 로컬로 수행됩니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> RMBG-1.4 AI 모델
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 픽셀 아트 모드
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 100% 로컬 처리
            </li>
          </ul>
        </div>
      </div>

      {/* 게임 엔진 호환성 */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white text-center mb-6">
          게임 엔진 호환
        </h3>
        <div className="flex flex-wrap justify-center gap-8 text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
              <span className="text-blue-400 font-bold text-xs">P3</span>
            </div>
            <span>Phaser 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
              <span className="text-red-400 font-bold text-xs">Px</span>
            </div>
            <span>PixiJS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-500/20 rounded flex items-center justify-center">
              <span className="text-gray-300 font-bold text-xs">U</span>
            </div>
            <span>Unity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600/20 rounded flex items-center justify-center">
              <span className="text-blue-300 font-bold text-xs">G</span>
            </div>
            <span>Godot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center">
              <span className="text-orange-400 font-bold text-xs">C</span>
            </div>
            <span>Cocos</span>
          </div>
        </div>
      </div>
    </section>
  );
}
