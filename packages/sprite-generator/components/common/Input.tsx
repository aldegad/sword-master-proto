'use client';

import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-400">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'bg-bg border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors',
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-400">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'bg-bg border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RangeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  displayValue?: string;
}

export function RangeInput({ label, hint, displayValue, className, id, ...props }: RangeInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm text-slate-400">
            {label}
          </label>
          {displayValue && <span className="text-sm text-slate-300">{displayValue}</span>}
        </div>
      )}
      <input type="range" id={id} className={clsx('w-full', className)} {...props} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

