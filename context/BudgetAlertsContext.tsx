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
const STORAGE_KEY = "budget_alerts_shown";

function getStoredShown(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function storeShown(shown: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...shown]));
  } catch {
    // ignore
  }
}

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
  budgetsPast50: BudgetAlert[];
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
    (budgetsWithSpentData: { id: string; category: string; budgetLimit: number; currentSpent: number }[]) => {
      const shown = getStoredShown();
      const displayAlerts: BudgetAlert[] = [];
      let changed = false;

      for (const b of budgetsWithSpentData) {
        const percentUsed = b.budgetLimit > 0
          ? (b.currentSpent / b.budgetLimit) * 100
          : 0;

        for (const threshold of ALERT_THRESHOLDS) {
          if (percentUsed < threshold) continue;
          const id = `${b.id}_${threshold}`;
          if (shown.has(id)) continue;

          shown.add(id);
          changed = true;
          displayAlerts.push({
            id,
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

      if (changed) storeShown(shown);

      setAlerts((prev) => {
        const byId = new Map(prev.map((a) => [a.id, a]));
        for (const a of displayAlerts) byId.set(a.id, a);
        return Array.from(byId.values()).sort(
          (a, b) => (b.threshold - a.threshold) || a.category.localeCompare(b.category)
        );
      });
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
    detectAndEmitAlerts(budgetsWithSpent);
  }, [budgetsWithSpent, detectAndEmitAlerts]);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    const shown = getStoredShown();
    shown.add(id);
    storeShown(shown);
  }, []);

  const visibleAlerts = useMemo(
    () => alerts.filter((a) => !dismissed.has(a.id)),
    [alerts, dismissed]
  );

  const budgetsPast50 = useMemo(() => {
    const byBudget = new Map<string, BudgetAlert>();
    for (const b of budgetsWithSpent) {
      const percentUsed = b.budgetLimit > 0 ? (b.currentSpent / b.budgetLimit) * 100 : 0;
      if (percentUsed >= 50) {
        const highest = [50, 90, 100].find((t) => percentUsed >= t) ?? 50;
        byBudget.set(b.id, {
          id: `${b.id}_${highest}`,
          budgetId: b.id,
          category: b.category,
          threshold: highest as 50 | 90 | 100,
          percentUsed,
          currentSpent: b.currentSpent,
          budgetLimit: b.budgetLimit,
          createdAt: Date.now(),
        });
      }
    }
    return Array.from(byBudget.values()).sort(
      (a, b) => b.percentUsed - a.percentUsed || a.category.localeCompare(b.category)
    );
  }, [budgetsWithSpent]);

  const unreadCount = visibleAlerts.length;

  const value: BudgetAlertsContextType = {
    alerts: visibleAlerts,
    budgetsPast50,
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
