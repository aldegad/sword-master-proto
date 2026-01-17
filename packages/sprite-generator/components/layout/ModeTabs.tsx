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
    <section className="bg-bg-card rounded-2xl p-6 border border-border">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {tabConfigs.map((tab) => (
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
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

