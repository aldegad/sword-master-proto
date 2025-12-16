'use client';

export function Header() {
  return (
    <header className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        🎬 Sprite Generator
      </h1>
      <p className="text-slate-400 text-lg">
        동영상을 스프라이트 시트로 변환하고 배경을 제거합니다
      </p>
    </header>
  );
}

