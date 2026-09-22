import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = ({ title, description, actionText, onAction, icon }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-slate-200 border-dashed animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm border border-slate-100">
        {icon || <FolderOpen size={32} />}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-base text-slate-500 mb-8 max-w-md leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="shadow-indigo-500/25 shadow-lg px-6">
          {actionText}
        </Button>
      )}
    </div>
  );
};
