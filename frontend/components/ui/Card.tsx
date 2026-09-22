import React from 'react';

export const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string, onClick?: () => void }) => {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-200' : ''} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-5 py-4 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);
