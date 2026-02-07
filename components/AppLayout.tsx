"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <BottomNav />
      {/* Main content: left margin for sidebar (desktop), bottom padding for bottom nav (mobile) */}
      <main
        className="min-h-screen pb-20 md:ml-16 md:pb-0 xl:ml-56"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
