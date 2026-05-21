import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian';

  const variants = {
    primary: 'bg-gradient-to-r from-neon to-emerald-500 text-obsidian shadow-rim hover:-translate-y-0.5 hover:brightness-105',
    secondary: 'bg-surface border border-white/10 text-text hover:-translate-y-0.5 hover:bg-surface/80',
    ghost: 'bg-transparent text-text/90 hover:bg-white/5',
    danger: 'bg-danger text-obsidian hover:-translate-y-0.5 hover:bg-danger/90',
  };


  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
