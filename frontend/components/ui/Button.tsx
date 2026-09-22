import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 active:scale-[0.98] hover:-translate-y-[1px]";
    
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 border border-transparent",
      secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 border border-transparent focus:ring-red-500",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
      ai: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-600/20 border border-transparent hover:shadow-violet-600/40 relative overflow-hidden group"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
