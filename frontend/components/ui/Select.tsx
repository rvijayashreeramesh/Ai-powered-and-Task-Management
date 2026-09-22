import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={`appearance-none flex h-10 w-full rounded-xl border bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
              error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 hover:border-slate-300'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
