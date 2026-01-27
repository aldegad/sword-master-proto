'use client';

import { Film, Image, Sparkles, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/lib/i18n';
import type { AppMode } from '@/types';
import { clsx } from 'clsx';

const tabConfigs: { mode: AppMode; icon: React.ReactNode; labelKey: string }[] = [
  { mode: 'video', icon: <Film className="w-5 h-5" />, labelKey: 'tabs.video' },
  { mode: 'sprite', icon: <Image className="w-5 h-5" />, labelKey: 'tabs.sprite' },
  { mode: 'bg-remove', icon: <Sparkles className="w-5 h-5" />, labelKey: 'tabs.bgRemove' },
  { mode: 'expo-assets', icon: <Smartphone className="w-5 h-5" />, labelKey: 'tabs.expoAssets' },
];

export function ModeTabs() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const { t } = useTranslation();

  return (
    <section className="bg-bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
        {tabConfigs.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setMode(tab.mode)}
            className={clsx(
              'flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
              mode === tab.mode
                ? 'bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tab.icon}
            <span suppressHydrationWarning>{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
