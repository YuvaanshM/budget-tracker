"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchRoomsForUser,
  fetchRoomById,
  fetchRoomMembers,
  fetchSharedExpenses,
  type Room,
  type RoomMember,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!roomId) {
      setRoom(null);
      setMembers([]);
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [roomData, membersData, expensesData] = await Promise.all([
        fetchRoomById(roomId),
        fetchRoomMembers(roomId),
        fetchSharedExpenses(roomId),
      ]);
      setRoom(roomData ?? null);
      setMembers(membersData);
      setExpenses(expensesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
      setRoom(null);
      setMembers([]);
      setExpenses([]);
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
        () => {
          refetch();
        }
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
