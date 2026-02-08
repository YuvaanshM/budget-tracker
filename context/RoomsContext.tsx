"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchExpenseSplitsForRoom,
  fetchRoomById,
  fetchRoomBudgets,
  fetchRoomMembers,
  fetchRoomsForUser,
  fetchSharedExpenses,
  fetchSettlements,
  type ExpenseSplit,
  type Room,
  type RoomBudget,
  type RoomMember,
  type Settlement,
  type SharedExpense,
} from "@/lib/rooms";

type RoomsContextType = {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refetchRooms: () => Promise<void>;
};

type ActiveRoomContextType = {
  room: Room | null;
  members: RoomMember[];
  expenses: SharedExpense[];
  roomBudgets: RoomBudget[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const RoomsContext = createContext<RoomsContextType | null>(null);
const ActiveRoomContext = createContext<ActiveRoomContextType | null>(null);

export function RoomsProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchRooms = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setRooms([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoomsForUser(userId);
      setRooms(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchRooms();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refetchRooms();
    });
    return () => subscription.unsubscribe();
  }, [refetchRooms]);

  return (
    <RoomsContext.Provider value={{ rooms, loading, error, refetchRooms }}>
      {children}
    </RoomsContext.Provider>
  );
}

export function useRooms() {
  const ctx = useContext(RoomsContext);
  if (!ctx) {
    throw new Error("useRooms must be used within RoomsProvider");
  }
  return ctx;
}

export function ActiveRoomProvider({
  roomId,
  children,
}: {
  roomId: string | null;
  children: React.ReactNode;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [roomBudgets, setRoomBudgets] = useState<RoomBudget[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!roomId) {
      setRoom(null);
      setMembers([]);
      setExpenses([]);
      setRoomBudgets([]);
      setSplits([]);
      setSettlements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [roomData, membersData, expensesData, budgetsData, splitsData, settlementsData] =
        await Promise.all([
          fetchRoomById(roomId),
          fetchRoomMembers(roomId),
          fetchSharedExpenses(roomId),
          fetchRoomBudgets(roomId),
          fetchExpenseSplitsForRoom(roomId),
          fetchSettlements(roomId),
        ]);
      setRoom(roomData ?? null);
      setMembers(membersData);
      setExpenses(expensesData);
      setRoomBudgets(budgetsData);
      setSplits(splitsData);
      setSettlements(settlementsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
      setRoom(null);
      setMembers([]);
      setExpenses([]);
      setRoomBudgets([]);
      setSplits([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime subscription for shared_expenses
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_expenses",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlements",
          filter: `room_id=eq.${roomId}`,
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_budgets",
          filter: `room_id=eq.${roomId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, refetch]);

  const value: ActiveRoomContextType = {
    room,
    members,
    expenses,
    roomBudgets,
    splits,
    settlements,
    loading,
    error,
    refetch,
  };

  return (
    <ActiveRoomContext.Provider value={value}>{children}</ActiveRoomContext.Provider>
  );
}

export function useActiveRoom() {
  const ctx = useContext(ActiveRoomContext);
  if (!ctx) {
    throw new Error("useActiveRoom must be used within ActiveRoomProvider");
  }
  return ctx;
}
