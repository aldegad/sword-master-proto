// Server Component - SEO를 위해 정적 콘텐츠는 서버에서 렌더링
import { ClientApp } from '@/components/ClientApp';
import { FeaturesSection, GuideSection, FaqSection } from '@/components/content';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 인터랙티브 도구 UI (Client Component) */}
      <ClientApp />

      {/* 정적 콘텐츠 섹션 (Server Component - SEO용) */}
      <FeaturesSection />
      <GuideSection />
      <FaqSection />

      {/* 푸터 */}
      <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} Sprite Generator | Made with ❤️ in Korea
        </p>
        <p className="mt-2 space-x-4">
          <a
            href="https://github.com/aldegad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:aldegad@gmail.com"
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </p>
      </footer>
    </div>
  );
}
