import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export const ErrorState = ({ message, onRetry }: { message: string, onRetry?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-red-50/50 rounded-3xl border border-red-100 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
      <p className="text-red-600/80 font-medium text-center mb-8 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="bg-white hover:bg-slate-50">
          <RefreshCw size={18} className="mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};
