import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sprite Generator - 동영상 → 스프라이트 변환기',
  description: '동영상을 스프라이트 시트로 변환하고 배경을 제거합니다',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

