import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95';

  const variants = {
    primary: 'bg-neon text-obsidian shadow-rim hover:brightness-105',
    secondary: 'bg-surface border border-white/10 text-text hover:bg-surface/80',
    ghost: 'bg-transparent text-text/90 hover:bg-white/2',
    danger: 'bg-danger text-obsidian hover:bg-danger/90',
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
