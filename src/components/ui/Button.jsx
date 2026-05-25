import React from 'react';
import { Loader2 } from 'lucide-react';

const base = 'inline-flex items-center justify-center font-black uppercase tracking-wide transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1';

const variants = {
  primary: 'bg-emerald-300 text-surface-900',
  secondary: 'bg-white text-surface-900 hover:bg-surface-50',
  ghost: 'bg-transparent text-surface-900 border-dashed hover:bg-amber-100',
  danger: 'bg-rose-300 text-surface-900 hover:bg-rose-400',
  accent: 'bg-accent-400 text-surface-900 hover:bg-accent-500',
};

const sizes = {
  sm: 'text-xs h-9 px-4 gap-1.5 rounded-lg',
  md: 'text-sm h-11 px-5 gap-2 rounded-xl',
  lg: 'text-base h-12 px-6 gap-2.5 rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : 18} />
      ) : null}
      {children}
    </button>
  );
}
