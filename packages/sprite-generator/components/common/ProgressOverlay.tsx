'use client';

import { useAppStore } from '@/store/useAppStore';

export function ProgressOverlay() {
  const { isVisible, text, progress } = useAppStore((state) => state.progress);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-bg/90 flex items-center justify-center z-50">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin-slow mx-auto mb-4" />
        <p className="text-lg mb-4">{text}</p>
        <div className="w-72 h-2 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-primary rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

