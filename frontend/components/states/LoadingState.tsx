import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-indigo-50/50 rounded-2xl flex items-center justify-center mb-6">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
      <p className="text-slate-500 font-semibold text-lg animate-pulse">{text}</p>
    </div>
  );
};
