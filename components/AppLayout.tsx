"use client";

import { usePathname } from "next/navigation";
import { ExpenseModalProvider } from "@/context/ExpenseModalContext";
import { TransactionsProvider } from "@/context/TransactionsContext";
import { AddExpenseModal } from "./AddExpenseModal";
import { BottomNav } from "./BottomNav";
import { FABMobile } from "./FAB";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const AUTHENTICATED_PATHS = ["/dashboard", "/history", "/budgets", "/settings", "/help"];

function isAuthenticatedPath(pathname: string) {
  return AUTHENTICATED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoggedIn = isAuthenticatedPath(pathname ?? "");

  return (
    <TransactionsProvider>
      <ExpenseModalProvider>
        <div className="min-h-screen bg-zinc-950">
        {isLoggedIn && (
          <>
            <Sidebar />
            <BottomNav />
            <FABMobile />
          </>
        )}
        {/* Main: margin/padding only when sidebar and nav are shown */}
        <main
          className={`min-h-screen ${isLoggedIn ? "pb-24 md:ml-16 md:pb-0 xl:ml-56" : ""}`}
          id="main-content"
        >
          {isLoggedIn && <Header />}
          {children}
        </main>
      </div>
      <AddExpenseModal />
    </ExpenseModalProvider>
    </TransactionsProvider>
  );
}
