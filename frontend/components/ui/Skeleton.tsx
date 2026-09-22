import React from 'react';

export const Skeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-slate-200/60 rounded-xl ${className}`} />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 w-full flex flex-col gap-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center mt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};
