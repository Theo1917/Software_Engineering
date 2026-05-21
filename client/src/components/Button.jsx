import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian';

  const variants = {
    primary: 'bg-white text-obsidian shadow-rim hover:-translate-y-0.5 hover:bg-white/90',
    secondary: 'bg-surface border border-white/10 text-text hover:-translate-y-0.5 hover:bg-white/5',
    ghost: 'bg-transparent text-text/90 hover:bg-white/5',
    danger: 'bg-white/15 text-text hover:-translate-y-0.5 hover:bg-white/20',
  };


  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
