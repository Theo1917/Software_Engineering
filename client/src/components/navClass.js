export function navClass({ isActive }) {
  return `w-full text-left px-3 py-2 rounded-full text-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/80 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian ${
    isActive
      ? "bg-white text-obsidian shadow-[0_0_18px_rgba(255,255,255,0.28)]"
      : "text-text/75 hover:bg-white/5 hover:text-text hover:-translate-y-0.5"
  }`;
}