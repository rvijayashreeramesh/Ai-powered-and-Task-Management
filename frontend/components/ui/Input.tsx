import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}
        <input
          ref={ref}
          className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
            error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
