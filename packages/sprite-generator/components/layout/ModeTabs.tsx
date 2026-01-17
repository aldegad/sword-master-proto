'use client';

import { Film, Image, Sparkles, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AppMode } from '@/types';
import { clsx } from 'clsx';

const tabs: { mode: AppMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'video', icon: <Film className="w-5 h-5" />, label: '동영상에서 생성' },
  { mode: 'sprite', icon: <Image className="w-5 h-5" />, label: '스프라이트 편집' },
  { mode: 'bg-remove', icon: <Sparkles className="w-5 h-5" />, label: '배경 제거' },
  { mode: 'expo-assets', icon: <Smartphone className="w-5 h-5" />, label: 'Expo 앱 아이콘' },
];

export function ModeTabs() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);

  return (
    <section className="bg-bg-card rounded-2xl p-6 border border-border">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setMode(tab.mode)}
            className={clsx(
              'flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 font-semibold transition-all',
              mode === tab.mode
                ? 'border-primary bg-primary/15 text-white'
                : 'border-border text-slate-400 hover:border-primary hover:text-white'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

