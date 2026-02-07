"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchIncomeForUser } from "@/lib/income";
import { fetchExpensesForUser, type Transaction } from "@/lib/transactions";

type TransactionsContextType = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [expenses, income] = await Promise.all([
        fetchExpensesForUser(userId),
        fetchIncomeForUser(userId),
      ]);
      const combined: Transaction[] = [...expenses, ...income].sort(
        (a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)
      );
      setTransactions(combined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refetch();
    });
    return () => subscription.unsubscribe();
  }, [refetch]);

  return (
    <TransactionsContext.Provider
      value={{ transactions, loading, error, refetch }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within TransactionsProvider");
  }
  return ctx;
}
