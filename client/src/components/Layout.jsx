import React from 'react';
import Header from './Header';
import { ToastProvider } from './ToastProvider';

export default function Layout({ children }) {
  return (
    <div className="page-shell min-h-screen bg-obsidian text-text lg:pl-0">
      {/* Skip link for keyboard users */}
      <a href="#main" className="sr-only focus:not-sr-only">Skip to main content</a>
      <Header />
      <ToastProvider>
        <main id="main" role="main" className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </ToastProvider>
    </div>
  );
}
