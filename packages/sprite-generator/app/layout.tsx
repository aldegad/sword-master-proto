import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://sprite-generator.web.app'; // 실제 도메인으로 변경하세요

export const metadata: Metadata = {
  // 기본 메타데이터
  title: {
    default: 'Sprite Generator | 무료 AI 스프라이트 시트 & 배경 제거 도구',
    template: '%s | Sprite Generator',
  },
  description:
    '🎮 게임 개발자를 위한 올인원 스프라이트 도구! 동영상→스프라이트 변환, AI 배경 제거, 픽셀 아트 생성을 브라우저에서 무료로. 설치 없이 바로 사용하세요.',
  
  // 키워드
  keywords: [
    // 한국어 키워드
    '스프라이트 시트', '스프라이트 생성기', '스프라이트 메이커',
    '배경 제거', 'AI 배경 제거', '누끼 따기', '투명 배경',
    '픽셀 아트', '픽셀 아트 변환', '도트 그래픽',
    '게임 개발', '게임 리소스', '2D 게임', '인디 게임',
    '동영상 프레임 추출', 'GIF 변환',
    // 영어 키워드
    'sprite sheet', 'sprite generator', 'sprite maker',
    'background remover', 'AI background removal', 'remove bg',
    'pixel art', 'pixel art converter', '8bit art',
    'game development', 'game assets', '2D game', 'indie game',
    'video to sprite', 'frame extractor',
    'phaser', 'unity', 'godot', 'rpg maker',
  ],

  // 작성자
  authors: [{ name: 'Sprite Generator Team' }],
  creator: 'Sprite Generator',
  publisher: 'Sprite Generator',

  // 로봇
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph (Facebook, LinkedIn 등)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: 'en_US',
    url: siteUrl,
    siteName: 'Sprite Generator',
    title: '🎮 Sprite Generator - 무료 AI 스프라이트 & 배경 제거 도구',
    description:
      '게임 개발자 필수 도구! 동영상을 스프라이트 시트로 변환하고, AI로 배경을 제거하고, 픽셀 아트를 생성하세요. 100% 무료, 설치 불필요!',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Sprite Generator - 스프라이트 시트 생성 및 AI 배경 제거',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '🎮 Sprite Generator - 무료 AI 스프라이트 & 배경 제거',
    description:
      '동영상→스프라이트, AI 배경 제거, 픽셀 아트 생성! 게임 개발자를 위한 올인원 무료 도구 ✨',
    images: [`${siteUrl}/og-image.png`],
    creator: '@sprite_gen',
  },

  // 추가 메타 태그
  category: 'technology',
  classification: 'Game Development Tools',
  
  // 앱 관련
  applicationName: 'Sprite Generator',
  
  // 기타
  formatDetection: {
    telephone: false,
  },
  
  // 대체 언어
  alternates: {
    canonical: siteUrl,
    languages: {
      'ko-KR': siteUrl,
      'en-US': `${siteUrl}/en`,
    },
  },
};

// JSON-LD 구조화 데이터
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Sprite Generator',
  description:
    '게임 개발자를 위한 올인원 스프라이트 도구. 동영상→스프라이트 변환, AI 배경 제거, 픽셀 아트 생성.',
  url: siteUrl,
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    '동영상을 스프라이트 시트로 변환',
    'AI 기반 배경 제거',
    '픽셀 아트 자동 변환',
    '다양한 출력 포맷 지원 (PNG, WebP, JSON)',
    'Phaser, Unity, Godot 호환 메타데이터',
  ],
  browserRequirements: 'Requires JavaScript. Requires WebGL.',
  softwareVersion: '2.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2628415146104368"
          crossOrigin="anonymous"
        />
        
        {/* Favicon 관련 (필요시 파일 추가) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* 테마 색상 */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
      </head>
      <body>{children}</body>
    </html>
  );
}

