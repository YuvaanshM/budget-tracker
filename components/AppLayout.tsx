"use client";

import { ExpenseModalProvider } from "@/context/ExpenseModalContext";
import { AddExpenseModal } from "./AddExpenseModal";
import { BottomNav } from "./BottomNav";
import { FABMobile } from "./FAB";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExpenseModalProvider>
      <div className="min-h-screen bg-zinc-950">
        <Sidebar />
        <BottomNav />
        <FABMobile />
        {/* Main content: left margin for sidebar (desktop), bottom padding for bottom nav (mobile) */}
        <main
          className="min-h-screen pb-24 md:ml-16 md:pb-0 xl:ml-56"
          id="main-content"
        >
          <Header />
          {children}
        </main>
      </div>
      <AddExpenseModal />
    </ExpenseModalProvider>
  );
}
