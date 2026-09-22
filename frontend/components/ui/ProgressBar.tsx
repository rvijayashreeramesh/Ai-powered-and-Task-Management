import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '', size = 'md', showLabel = false }) => {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-slate-700">Progress</span>
          <span className="text-xs font-medium text-slate-500">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
