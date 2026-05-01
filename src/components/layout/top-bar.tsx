"use client";

import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openSearch = useUIStore((s) => s.openSearch);

  return (
    <header className="sticky top-0 z-20 lg:hidden bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
      <button
        onClick={toggleSidebar}
        className="btn-ghost p-1.5"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {title && (
        <h1 className="font-bold text-gray-900 dark:text-white">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={openSearch}
          className="btn-ghost p-1.5"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <div className="h-7 w-7 rounded-xl bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">H</span>
        </div>
      </div>
    </header>
  );
}
