import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function ProgressBar({ current, target, label, formatValue, className = '' }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;
  
  const formatFn = formatValue || ((val: number) => val.toString());

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium ink-700">{label}</span>
        <span className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'ink-900'}`}>
          {formatFn(current)} / {formatFn(target)}
        </span>
      </div>
      <div className="w-full track-glass rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bar-gradient'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isComplete && (
        <div className="flex items-center text-sm text-green-400">
          <span>✓ Complete</span>
        </div>
      )}
    </div>
  );
}