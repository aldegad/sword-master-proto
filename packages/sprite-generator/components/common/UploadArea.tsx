'use client';

import { useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { Upload, Check } from 'lucide-react';

interface UploadAreaProps {
  id: string;
  accept: string;
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  hasFile?: boolean;
  optional?: boolean;
  onFileSelect: (file: File) => void;
}

export function UploadArea({
  id,
  accept,
  icon,
  title,
  subtitle,
  hasFile = false,
  optional = false,
  onFileSelect,
}: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={clsx(
        'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer',
        'group',
        hasFile
          ? 'border-success/50 bg-success/5'
          : isDragOver
          ? 'border-primary bg-primary/10 scale-[1.02]'
          : optional
          ? 'border-border/50 opacity-70 hover:opacity-100 hover:border-border'
          : 'border-border/50 hover:border-primary/50 hover:bg-white/[0.02]'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={id}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <label htmlFor={id} className="flex flex-col items-center gap-4 cursor-pointer">
        {/* 아이콘 */}
        <div
          className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
            hasFile
              ? 'bg-success/20'
              : isDragOver
              ? 'bg-primary/20 scale-110'
              : 'bg-white/5 group-hover:bg-primary/10'
          )}
        >
          {hasFile ? (
            <Check className="w-8 h-8 text-success" />
          ) : icon ? (
            <span className="text-3xl">{icon}</span>
          ) : (
            <Upload
              className={clsx(
                'w-8 h-8 transition-colors',
                isDragOver ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
              )}
            />
          )}
        </div>

        {/* 텍스트 */}
        <div>
          <p
            className={clsx(
              'font-medium text-lg transition-colors',
              hasFile ? 'text-success' : 'text-white'
            )}
          >
            {hasFile ? 'File loaded!' : title}
          </p>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
      </label>

      {/* 드래그 오버 효과 */}
      {isDragOver && (
        <div className="absolute inset-0 rounded-2xl bg-primary/5 pointer-events-none" />
      )}
    </div>
  );
}
