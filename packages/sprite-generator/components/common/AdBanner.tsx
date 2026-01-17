'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  layout?: string;
  className?: string;
}

export function AdBanner({ 
  slot = '', 
  format = 'auto', 
  layout,
  className = '' 
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver로 광고 컨테이너가 화면에 보일 때만 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 광고 로드
  useEffect(() => {
    if (!isVisible) return;
    if (typeof window === 'undefined') return;
    if (isLoaded.current) return;
    
    // 컨테이너 width 체크 (0이면 로드하지 않음)
    const container = containerRef.current;
    if (!container || container.offsetWidth === 0) return;

    // 약간의 딜레이 후 광고 로드 (레이아웃이 안정화된 후)
    const timer = setTimeout(() => {
      try {
        if (adRef.current && adRef.current.innerHTML === '') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (error) {
        // 로컬 환경에서는 에러가 정상이므로 무시
        if (process.env.NODE_ENV === 'development') {
          console.log('AdSense: 로컬 환경에서는 광고가 표시되지 않습니다.');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className={`ad-container overflow-hidden ${className}`}
      style={{ minWidth: '280px' }} // 최소 너비 보장
    >
      {isVisible && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-2628415146104368"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layout && { 'data-ad-layout': layout })}
        />
      )}
      {!isVisible && (
        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
          광고 로딩 중...
        </div>
      )}
    </div>
  );
}

// 상단 배너 광고
export function TopBannerAd() {
  return (
    <AdBanner 
      format="horizontal"
      className="w-full min-h-[90px] bg-zinc-800/30 rounded-lg mb-4 flex items-center justify-center"
    />
  );
}

// 콘텐츠 중간 광고
export function InContentAd() {
  return (
    <AdBanner 
      format="fluid"
      layout="in-article"
      className="w-full min-h-[250px] bg-zinc-800/30 rounded-lg my-6 flex items-center justify-center"
    />
  );
}

// 사이드바 광고 (세로형)
export function SidebarAd() {
  return (
    <AdBanner 
      format="vertical"
      className="w-full min-h-[600px] bg-zinc-800/30 rounded-lg flex items-center justify-center"
    />
  );
}

// 하단 배너 광고
export function BottomBannerAd() {
  return (
    <AdBanner 
      format="horizontal"
      className="w-full min-h-[90px] bg-zinc-800/30 rounded-lg mt-8 flex items-center justify-center"
    />
  );
}

// 결과 사이 광고 (작은 사이즈)
export function ResultAd() {
  return (
    <AdBanner 
      format="rectangle"
      className="w-full max-w-[336px] min-h-[280px] bg-zinc-800/30 rounded-lg mx-auto my-4 flex items-center justify-center"
    />
  );
}

