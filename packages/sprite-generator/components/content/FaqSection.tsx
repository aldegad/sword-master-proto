// Server Component - SEO를 위해 정적 렌더링
// <details>/<summary>로 JavaScript 없이 아코디언 구현

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: '스프라이트 시트란 무엇인가요?',
    answer: '스프라이트 시트는 여러 개의 이미지 프레임을 하나의 큰 이미지에 배치한 것입니다. 게임 개발에서 캐릭터 애니메이션, 아이콘, UI 요소 등을 효율적으로 관리하기 위해 사용됩니다. 하나의 파일로 여러 이미지를 로드할 수 있어 네트워크 요청을 줄이고 성능을 향상시킵니다.',
  },
  {
    question: '어떤 비디오 형식을 지원하나요?',
    answer: 'MP4, WebM, MOV, AVI 등 브라우저에서 재생 가능한 대부분의 비디오 형식을 지원합니다. 가장 호환성이 좋은 형식은 MP4 (H.264 코덱)입니다. 비디오 파일 크기에는 제한이 없지만, 매우 큰 파일은 처리 시간이 오래 걸릴 수 있습니다.',
  },
  {
    question: 'AI 배경 제거는 어떻게 작동하나요?',
    answer: 'Hugging Face의 RMBG-1.4 모델을 사용하여 이미지에서 배경을 자동으로 감지하고 제거합니다. 모든 처리는 브라우저에서 로컬로 수행되어 개인정보가 보호됩니다. 처음 사용 시 AI 모델(약 170MB)을 다운로드해야 하며, 이후에는 캐시되어 빠르게 처리됩니다.',
  },
  {
    question: '픽셀 아트 모드는 무엇인가요?',
    answer: '픽셀 아트 모드는 저해상도 픽셀 아트 이미지에 최적화된 배경 제거 옵션입니다. 일반 모드에서는 안티앨리어싱으로 인해 픽셀 가장자리가 흐려질 수 있지만, 픽셀 아트 모드는 선명한 픽셀 경계를 유지합니다.',
  },
  {
    question: '생성된 스프라이트 시트를 게임 엔진에서 사용하려면?',
    answer: '스프라이트 시트와 함께 JSON 메타데이터를 다운로드하세요. Phaser의 경우 this.load.atlas()로 로드하고, Unity는 Sprite Editor에서 Slice 기능을 사용합니다. 메타데이터에는 각 프레임의 위치, 크기, 이름 정보가 포함되어 있습니다.',
  },
  {
    question: '서버에 이미지가 업로드되나요?',
    answer: '아니요, 모든 처리는 브라우저에서 로컬로 수행됩니다. 이미지나 비디오 파일이 서버로 전송되지 않으며, 개인정보가 완벽하게 보호됩니다. 인터넷 연결은 AI 모델 초기 다운로드에만 필요합니다.',
  },
  {
    question: '무료로 사용할 수 있나요?',
    answer: '네, Sprite Generator는 완전히 무료로 사용할 수 있습니다. 생성된 스프라이트 시트에 대한 사용 제한이 없으며, 상업적 프로젝트에도 자유롭게 사용하실 수 있습니다.',
  },
  {
    question: '지원하는 출력 형식은 무엇인가요?',
    answer: '스프라이트 시트는 PNG 형식으로 출력되며, 투명 배경을 지원합니다. 메타데이터는 JSON 형식으로 제공되어 Phaser, PixiJS, Unity 등 다양한 게임 엔진과 호환됩니다.',
  },
];

export function FaqSection() {
  return (
    <section className="mt-16 space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">
        자주 묻는 질문 (FAQ)
      </h2>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqData.map((item, index) => (
          <details
            key={index}
            className="group bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
          >
            <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-800/80 transition-colors list-none [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-white">{item.question}</span>
              <svg
                className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
