import React from 'react';
import NavBar from './NavBar';

export default function Layout({ children }) {
  return (
    <div className="page-shell min-h-screen bg-obsidian text-text">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
