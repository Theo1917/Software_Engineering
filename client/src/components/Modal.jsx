import React from 'react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl p-6">
        <div className="card">
          {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
