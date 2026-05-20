import React from 'react';

export default function Card({ children, className = '', accent = false, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {accent && (
        <div className="absolute -top-4 -left-6 w-48 h-32 rounded-full opacity-40 pointer-events-none bg-gradient-to-r from-neon to-pink blur-3xl" />
      )}
      {children}
    </div>
  );
}
