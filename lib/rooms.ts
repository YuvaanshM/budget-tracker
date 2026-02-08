/**
 * Rooms, room members, and shared expenses for collaborative budgets.
 */

import { supabase } from "./supabaseClient";

export type Room = {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt: string;
};

export type RoomMember = {
  roomId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  username?: string | null;
};

export type SharedExpense = {
  id: string;
  roomId: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  paidBy: string;
  splitType: "full" | "equal" | "custom";
  createdAt: string;
};

export type ExpenseSplit = {
  sharedExpenseId: string;
  userId: string;
  amount: number;
};

// --- Rooms ---
export async function fetchRoomsForUser(userId: string): Promise<Room[]> {
  const { data: memberRows } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId);
  const roomIds = (memberRows ?? []).map((r) => r.room_id);

  const { data: ownedRows } = await supabase
    .from("rooms")
    .select("id")
    .eq("created_by", userId);
  const ownedIds = (ownedRows ?? []).map((r) => r.id);

  const allIds = [...new Set([...roomIds, ...ownedIds])];
  if (allIds.length === 0) return [];

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, created_by, invite_code, created_at")
    .in("id", allIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    createdBy: r.created_by,
    inviteCode: r.invite_code,
    createdAt: r.created_at ?? "",
  }));
}

export async function createRoom(
  userId: string,
  name: string
): Promise<{ room: Room | null; error: Error | null }> {
  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .insert({ name, created_by: userId })
    .select("id, name, created_by, invite_code, created_at")
    .single();

  if (roomError || !roomData) {
    return { room: null, error: roomError ?? new Error("Failed to create room") };
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: roomData.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("rooms").delete().eq("id", roomData.id);
    return { room: null, error: memberError };
  }

  const room: Room = {
    id: roomData.id,
    name: roomData.name,
    createdBy: roomData.created_by,
    inviteCode: roomData.invite_code,
    createdAt: roomData.created_at ?? "",
  };
  return { room, error: null };
}

export async function fetchRoomById(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, created_by, invite_code, created_at")
    .eq("id", roomId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    createdBy: data.created_by,
    inviteCode: data.invite_code,
    createdAt: data.created_at ?? "",
  };
}

export async function updateRoom(
  roomId: string,
  updates: { name?: string }
): Promise<{ error: Error | null }> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (Object.keys(body).length === 0) return { error: null };

  const { error } = await supabase.from("rooms").update(body).eq("id", roomId);
  return { error: error ?? null };
}

export async function deleteRoom(roomId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  return { error: error ?? null };
}

// --- Room members ---
export async function fetchRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data, error } = await supabase
    .from("room_members")
    .select("room_id, user_id, role, joined_at")
    .eq("room_id", roomId);

  if (error) throw error;
  return (data ?? []).map((r) => ({
    roomId: r.room_id,
    userId: r.user_id,
    role: r.role as "owner" | "member",
    joinedAt: r.joined_at ?? "",
    username: null as string | null | undefined,
  }));
}

export async function addRoomMember(
  roomId: string,
  userId: string,
  role: "owner" | "member" = "member"
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("room_members").insert({
    room_id: roomId,
    user_id: userId,
    role,
  });
  return { error: error ?? null };
}

export async function removeRoomMember(roomId: string, userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
  return { error: error ?? null };
}

export async function findUserByUsername(username: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();
  return data ? { id: data.id } : null;
}

export async function joinRoomByInviteCode(
  inviteCode: string,
  _userId: string
): Promise<{ room: Room | null; error: Error | null }> {
  // RPC bypasses RLS - handles room lookup + room_members insert server-side
  const { data: rows, error } = await supabase.rpc("join_room_by_invite_code", {
    p_invite_code: inviteCode.trim(),
  });

  if (error) {
    return { room: null, error };
  }
  const roomData = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!roomData) {
    return { room: null, error: new Error("Room not found. Check the invite code.") };
  }

  const room: Room = {
    id: roomData.id,
    name: roomData.name,
    createdBy: roomData.created_by,
    inviteCode: roomData.invite_code ?? "",
    createdAt: roomData.created_at ?? "",
  };
  return { room, error: null };
}

// --- Shared expenses ---
export async function fetchSharedExpenses(roomId: string): Promise<SharedExpense[]> {
  const { data, error } = await supabase
    .from("shared_expenses")
    .select("*")
    .eq("room_id", roomId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    roomId: r.room_id,
    amount: Number(r.amount),
    category: r.category ?? "Other",
    description: r.description ?? null,
    date: r.date ?? new Date().toISOString().slice(0, 10),
    paidBy: r.paid_by,
    splitType: r.split_type as "full" | "equal" | "custom",
    createdAt: r.created_at ?? "",
  }));
}

export async function fetchExpenseSplits(sharedExpenseId: string): Promise<ExpenseSplit[]> {
  const { data, error } = await supabase
    .from("expense_splits")
    .select("shared_expense_id, user_id, amount")
    .eq("shared_expense_id", sharedExpenseId);

  if (error) throw error;
  return (data ?? []).map((r) => ({
    sharedExpenseId: r.shared_expense_id,
    userId: r.user_id,
    amount: Number(r.amount),
  }));
}

export type InsertSharedExpense = {
  roomId: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  paidBy: string;
  splitType: "full" | "equal" | "custom";
  splits?: { userId: string; amount: number }[];
};

function toDateOnly(s: string): string {
  const trimmed = s?.trim() ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const t = Date.parse(trimmed);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function insertSharedExpense(
  row: InsertSharedExpense
): Promise<{ id: string | null; error: Error | null }> {
  const date = toDateOnly(row.date);
  const { data, error } = await supabase
    .from("shared_expenses")
    .insert({
      room_id: row.roomId,
      amount: Math.abs(row.amount),
      category: row.category ?? "Other",
      description: row.description ?? null,
      date,
      paid_by: row.paidBy,
      split_type: row.splitType,
    })
    .select("id")
    .single();

  if (error || !data) return { id: null, error: error ?? new Error("Failed to add expense") };

  if (row.splitType === "custom" && row.splits && row.splits.length > 0) {
    const splits = row.splits.map((s) => ({
      shared_expense_id: data.id,
      user_id: s.userId,
      amount: Math.abs(s.amount),
    }));
    const { error: splitError } = await supabase.from("expense_splits").insert(splits);
    if (splitError) {
      await supabase.from("shared_expenses").delete().eq("id", data.id);
      return { id: null, error: splitError };
    }
  }

  return { id: data.id, error: null };
}

export async function deleteSharedExpense(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("shared_expenses").delete().eq("id", id);
  return { error: error ?? null };
}

// --- Room budgets (category '' = general) ---
export type RoomBudget = {
  id: string;
  roomId: string;
  category: string;
  budgetLimit: number;
};

export async function fetchRoomBudgets(roomId: string): Promise<RoomBudget[]> {
  const { data, error } = await supabase
    .from("room_budgets")
    .select("id, room_id, category, budget_limit")
    .eq("room_id", roomId);

  if (error || !data) return [];
  return (data ?? []).map((r) => ({
    id: r.id,
    roomId: r.room_id,
    category: r.category ?? "",
    budgetLimit: Number(r.budget_limit),
  }));
}

export async function upsertRoomBudget(
  roomId: string,
  budgetLimit: number,
  category: string = ""
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("room_budgets")
    .upsert(
      {
        room_id: roomId,
        category: category ?? "",
        budget_limit: Math.abs(budgetLimit),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id,category" }
    );
  return { error: error ?? null };
}

// --- Settlements (settle up / paid) ---
export type Settlement = {
  id: string;
  roomId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdAt: string;
};

export async function fetchSettlements(roomId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from("settlements")
    .select("id, room_id, from_user_id, to_user_id, amount, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id,
    roomId: r.room_id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    amount: Number(r.amount),
    createdAt: r.created_at ?? "",
  }));
}

export async function insertSettlement(
  roomId: string,
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("settlements").insert({
    room_id: roomId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount: Math.abs(amount),
  });
  return { error: error ?? null };
}

/** Fetch display names via RPC (bypasses RLS - users can only read own row) */
export async function fetchMemberDisplayNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase.rpc("get_member_display_names", {
    p_user_ids: userIds,
  });
  if (error || !Array.isArray(data)) return {};
  const map: Record<string, string> = {};
  for (const r of data as { user_id: string; display_name: string }[]) {
    map[r.user_id] = r.display_name?.trim() || "Member";
  }
  return map;
}

export async function fetchExpenseSplitsForRoom(roomId: string): Promise<ExpenseSplit[]> {
  const { data: expenseIds } = await supabase
    .from("shared_expenses")
    .select("id")
    .eq("room_id", roomId);
  const ids = (expenseIds ?? []).map((e) => e.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("expense_splits")
    .select("shared_expense_id, user_id, amount")
    .in("shared_expense_id", ids);
  if (error) return [];
  return (data ?? []).map((r) => ({
    sharedExpenseId: r.shared_expense_id,
    userId: r.user_id,
    amount: Number(r.amount),
  }));
}

/** Compute total amount owed per user across all room expenses (for "who owes how much" chart). */
export function computeOwedPerUser(
  expenses: SharedExpense[],
  members: RoomMember[],
  splits: ExpenseSplit[],
  displayNames: Record<string, string>,
  currentUserId: string
): { userId: string; amount: number; displayName: string }[] {
  const owed = new Map<string, number>();
  for (const m of members) {
    owed.set(m.userId, 0);
  }
  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splits) {
    const list = splitsByExpense.get(s.sharedExpenseId) ?? [];
    list.push(s);
    splitsByExpense.set(s.sharedExpenseId, list);
  }
  for (const exp of expenses) {
    const memberCount = members.length;
    if (exp.splitType === "full") {
      owed.set(exp.paidBy, (owed.get(exp.paidBy) ?? 0) + exp.amount);
    } else if (exp.splitType === "equal" && memberCount > 0) {
      const perPerson = exp.amount / memberCount;
      for (const m of members) {
        owed.set(m.userId, (owed.get(m.userId) ?? 0) + perPerson);
      }
    } else if (exp.splitType === "custom") {
      const customSplits = splitsByExpense.get(exp.id) ?? [];
      for (const s of customSplits) {
        owed.set(s.userId, (owed.get(s.userId) ?? 0) + s.amount);
      }
    }
  }
  return Array.from(owed.entries()).map(([userId, amount]) => ({
    userId,
    amount,
    displayName: userId === currentUserId ? "You" : (displayNames[userId] ?? "Member"),
  }));
}

/** Who the current user owes (breakdown by creditor), minus settlements. */
export function computeOwedToEach(
  expenses: SharedExpense[],
  members: RoomMember[],
  splits: ExpenseSplit[],
  settlements: Settlement[],
  displayNames: Record<string, string>,
  currentUserId: string
): { toUserId: string; amount: number; displayName: string }[] {
  const owedTo = new Map<string, number>();
  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splits) {
    const list = splitsByExpense.get(s.sharedExpenseId) ?? [];
    list.push(s);
    splitsByExpense.set(s.sharedExpenseId, list);
  }
  for (const exp of expenses) {
    const memberCount = members.length;
    const paidBy = exp.paidBy;
    if (paidBy === currentUserId) continue; // don't owe yourself
    let myShare = 0;
    if (exp.splitType === "full") {
      myShare = 0;
    } else if (exp.splitType === "equal" && memberCount > 0) {
      myShare = exp.amount / memberCount;
    } else if (exp.splitType === "custom") {
      const customSplits = splitsByExpense.get(exp.id) ?? [];
      myShare = customSplits.find((s) => s.userId === currentUserId)?.amount ?? 0;
    }
    if (myShare > 0) {
      owedTo.set(paidBy, (owedTo.get(paidBy) ?? 0) + myShare);
    }
  }
  // Subtract settlements: when current user paid someone
  for (const s of settlements) {
    if (s.fromUserId === currentUserId && s.toUserId !== currentUserId) {
      owedTo.set(s.toUserId, Math.max(0, (owedTo.get(s.toUserId) ?? 0) - s.amount));
    }
  }
  return Array.from(owedTo.entries())
    .filter(([, amount]) => amount > 0)
    .map(([toUserId, amount]) => ({
      toUserId,
      amount,
      displayName: toUserId === currentUserId ? "You" : (displayNames[toUserId] ?? "Member"),
    }));
}
