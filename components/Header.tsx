"use client";

import { FABDesktop } from "./FAB";

/**
 * Desktop header with Universal Add FAB (top-right).
 * Hidden on mobile; FABMobile is shown as floating button instead.
 */
export function Header() {
  return (
    <header className="hidden md:flex sticky top-0 z-10 h-14 items-center justify-end border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-md">
      <FABDesktop />
    </header>
  );
}
