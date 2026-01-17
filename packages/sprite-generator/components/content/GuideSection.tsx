'use client';

export function GuideSection() {
  return (
    <section className="mt-16 space-y-8">
      <h2 className="text-2xl font-bold text-white text-center">
        스프라이트 시트 제작 가이드
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 비디오 → 스프라이트 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎬</span>
            </div>
            <h3 className="text-lg font-semibold text-white">비디오에서 스프라이트 추출</h3>
          </div>
          <ol className="space-y-3 text-gray-300 text-sm">
            <li className="flex gap-2">
              <span className="text-indigo-400 font-bold">1.</span>
              <span>"Video → Sprite" 탭을 선택합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-bold">2.</span>
              <span>MP4, WebM, MOV 등의 동영상 파일을 업로드합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-bold">3.</span>
              <span>FPS와 시작/종료 시간을 설정하여 원하는 구간만 추출합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-bold">4.</span>
              <span>"프레임 추출" 버튼을 클릭하면 각 프레임이 이미지로 변환됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-bold">5.</span>
              <span>열/행 수와 여백을 조정한 후 스프라이트 시트를 생성합니다.</span>
            </li>
          </ol>
        </div>

        {/* 스프라이트 분리 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🖼️</span>
            </div>
            <h3 className="text-lg font-semibold text-white">스프라이트 시트 분리</h3>
          </div>
          <ol className="space-y-3 text-gray-300 text-sm">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">1.</span>
              <span>"Sprite Import" 탭을 선택합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">2.</span>
              <span>기존 스프라이트 시트 이미지를 업로드합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">3.</span>
              <span>프레임 너비/높이를 입력하거나 자동 감지를 사용합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">4.</span>
              <span>개별 프레임으로 분리된 이미지를 확인하고 편집합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">5.</span>
              <span>새로운 레이아웃으로 스프라이트 시트를 재생성합니다.</span>
            </li>
          </ol>
        </div>

        {/* AI 배경 제거 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-white">AI 배경 제거</h3>
          </div>
          <ol className="space-y-3 text-gray-300 text-sm">
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">1.</span>
              <span>"BG Remove" 탭을 선택합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">2.</span>
              <span>배경을 제거할 이미지들을 업로드합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">3.</span>
              <span>AI 모델이 자동으로 배경을 감지하고 제거합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">4.</span>
              <span>픽셀 아트의 경우 "픽셀 아트 모드"를 활성화하세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 font-bold">5.</span>
              <span>투명 배경 PNG로 다운로드합니다.</span>
            </li>
          </ol>
        </div>

        {/* 팁 & 베스트 프랙티스 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-white">팁 & 베스트 프랙티스</h3>
          </div>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex gap-2">
              <span className="text-yellow-400">•</span>
              <span><strong>최적의 FPS:</strong> 게임 애니메이션은 보통 8-15 FPS가 적합합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400">•</span>
              <span><strong>2의 거듭제곱:</strong> 스프라이트 크기를 32, 64, 128 등으로 설정하면 게임 엔진에서 최적화됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400">•</span>
              <span><strong>여백 설정:</strong> 렌더링 시 블리딩 방지를 위해 1-2px 여백을 추가하세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400">•</span>
              <span><strong>JSON 메타데이터:</strong> Phaser, Unity 등 게임 엔진 호환 JSON을 함께 다운로드하세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-400">•</span>
              <span><strong>AI 배경 제거:</strong> 처음 로딩 시 AI 모델 다운로드로 시간이 걸릴 수 있습니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
