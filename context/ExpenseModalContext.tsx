"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type ExpenseFormData = {
  id?: string;
  amount: string;
  category: string;
  subcategory: string;
  description: string;
  date: string;
  isIncome: boolean;
};

type ExpenseModalContextType = {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData: ExpenseFormData | null;
  openAddModal: () => void;
  openEditModal: (data: ExpenseFormData) => void;
  closeModal: () => void;
};

const ExpenseModalContext = createContext<ExpenseModalContextType | null>(null);

export function ExpenseModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [initialData, setInitialData] = useState<ExpenseFormData | null>(null);

  const openAddModal = useCallback(() => {
    setMode("add");
    setInitialData(null);
    setIsOpen(true);
  }, []);

  const openEditModal = useCallback((data: ExpenseFormData) => {
    setMode("edit");
    setInitialData(data);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setInitialData(null);
  }, []);

  return (
    <ExpenseModalContext.Provider
      value={{
        isOpen,
        mode,
        initialData,
        openAddModal,
        openEditModal,
        closeModal,
      }}
    >
      {children}
    </ExpenseModalContext.Provider>
  );
}

export function useExpenseModal() {
  const ctx = useContext(ExpenseModalContext);
  if (!ctx) {
    throw new Error("useExpenseModal must be used within ExpenseModalProvider");
  }
  return ctx;
}
