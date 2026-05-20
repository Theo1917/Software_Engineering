import React from 'react';
import NavBar from './NavBar';

export default function Layout({ children }) {
  return (
    <div className="page-shell min-h-screen bg-obsidian text-text">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
