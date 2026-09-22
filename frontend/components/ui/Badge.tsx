import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'brand';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-100 text-slate-700 border-slate-200",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      error: "bg-red-50 text-red-700 border-red-200",
      brand: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
