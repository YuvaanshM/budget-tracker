"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchBudgets } from "@/lib/budgets";
import { getBudgetsWithSpent } from "@/lib/mockData";
import { useTransactions } from "@/context/TransactionsContext";

const ALERT_THRESHOLDS = [50, 90, 100] as const;

export type BudgetAlert = {
  id: string;
  budgetId: string;
  category: string;
  threshold: 50 | 90 | 100;
  percentUsed: number;
  currentSpent: number;
  budgetLimit: number;
  createdAt: number;
};

type BudgetAlertsContextType = {
  alerts: BudgetAlert[];
  dismissAlert: (id: string) => void;
  unreadCount: number;
};

const BudgetAlertsContext = createContext<BudgetAlertsContextType | null>(null);

function getThresholdMessage(threshold: 50 | 90 | 100): string {
  if (threshold === 50) return "Half of your budget used";
  if (threshold === 90) return "Almost at your limit";
  return "Budget limit reached";
}

export function BudgetAlertsProvider({ children }: { children: React.ReactNode }) {
  const { transactions } = useTransactions();
  const [budgets, setBudgets] = useState<Awaited<ReturnType<typeof fetchBudgets>>>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const yearMonth = new Date().toISOString().slice(0, 7);

  const budgetsWithSpent = useMemo(
    () => getBudgetsWithSpent(transactions, budgets, yearMonth),
    [transactions, budgets, yearMonth]
  );

  const detectAndEmitAlerts = useCallback(
    (budgetsWithSpentData: { id: string; category: string; budgetLimit: number; currentSpent: number; alertsEnabled?: boolean }[]) => {
      const displayAlerts: BudgetAlert[] = [];

      for (const b of budgetsWithSpentData) {
        if (!(b.alertsEnabled ?? false)) continue;
        const percentUsed = b.budgetLimit > 0
          ? (b.currentSpent / b.budgetLimit) * 100
          : 0;

        for (const threshold of ALERT_THRESHOLDS) {
          if (percentUsed < threshold) continue;

          displayAlerts.push({
            id: `${b.id}_${threshold}`,
            budgetId: b.id,
            category: b.category,
            threshold,
            percentUsed,
            currentSpent: b.currentSpent,
            budgetLimit: b.budgetLimit,
            createdAt: Date.now(),
          });
        }
      }

      displayAlerts.sort((a, b) => (b.threshold - a.threshold) || a.category.localeCompare(b.category));
      setAlerts(displayAlerts);
    },
    []
  );

  useEffect(() => {
    async function loadBudgets() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const data = await fetchBudgets(user.id);
        setBudgets(data);
      } catch {
        setBudgets([]);
      }
    }
    loadBudgets();
  }, []);

  useEffect(() => {
    if (budgetsWithSpent.length === 0) return;
    const withAlertsEnabled = budgetsWithSpent.map((b) => ({
      ...b,
      alertsEnabled: b.alertsEnabled ?? false,
    }));
    detectAndEmitAlerts(withAlertsEnabled);
  }, [budgetsWithSpent, detectAndEmitAlerts]);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const visibleAlerts = useMemo(
    () => alerts.filter((a) => !dismissed.has(a.id)),
    [alerts, dismissed]
  );

  const unreadCount = visibleAlerts.length;

  const value: BudgetAlertsContextType = {
    alerts: visibleAlerts,
    dismissAlert,
    unreadCount,
  };

  return (
    <BudgetAlertsContext.Provider value={value}>
      {children}
    </BudgetAlertsContext.Provider>
  );
}

export function useBudgetAlerts() {
  const ctx = useContext(BudgetAlertsContext);
  if (!ctx) {
    throw new Error("useBudgetAlerts must be used within BudgetAlertsProvider");
  }
  return ctx;
}

export { getThresholdMessage };
