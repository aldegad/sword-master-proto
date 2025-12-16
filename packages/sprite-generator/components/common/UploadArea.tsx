'use client';

import { useCallback } from 'react';
import { clsx } from 'clsx';
import { Upload } from 'lucide-react';

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
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'bg-primary/10');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
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
        'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
        hasFile
          ? 'border-green-500 bg-green-500/10'
          : optional
          ? 'border-border opacity-80 hover:opacity-100'
          : 'border-border hover:border-primary hover:bg-primary/10'
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
      <label htmlFor={id} className="flex flex-col items-center gap-3 cursor-pointer">
        <span className="text-4xl">
          {icon || <Upload className="w-10 h-10 text-slate-400" />}
        </span>
        <span className="font-medium">{title}</span>
        <span className="text-sm text-slate-400">{subtitle}</span>
      </label>
    </div>
  );
}

