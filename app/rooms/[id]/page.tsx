"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  ActiveRoomProvider,
  useActiveRoom,
} from "@/context/RoomsContext";
import {
  addRoomMember,
  findUserByUsername,
  removeRoomMember,
} from "@/lib/rooms";
import { AddRoomExpenseModal } from "@/components/AddRoomExpenseModal";

const CATEGORY_ICONS: Record<string, string> = {
  Groceries: "🛒",
  Restaurants: "🍽️",
  Transport: "🚗",
  Entertainment: "🎬",
  Utilities: "💡",
  Shopping: "🛍️",
  Healthcare: "⚕️",
  Other: "📦",
};

function RoomDetailContent() {
  const params = useParams();
  const roomId = params?.id as string;
  const { room, members, expenses, loading, error, refetch } = useActiveRoom();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u || !roomId) return;
    if (!inviteUsername.trim()) {
      setInviteError("Enter a username");
      return;
    }
    setInviteSubmitting(true);
    setInviteError(null);
    const found = await findUserByUsername(inviteUsername.trim());
    if (!found) {
      setInviteError("User not found. They need to set a username in Settings.");
      setInviteSubmitting(false);
      return;
    }
    const { error: err } = await addRoomMember(roomId, found.id, "member");
    setInviteSubmitting(false);
    if (err) {
      setInviteError(err.message);
      return;
    }
    setInviteUsername("");
    setShowInvite(false);
    await refetch();
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-500">Loading room…</p>
        </div>
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-red-500">{error ?? "Room not found"}</p>
          <Link href="/rooms" className="mt-4 inline-block text-[#2E8B57] hover:underline">
            Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/rooms"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Back to rooms"
          >
            ←
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-500">
              Code: {room.inviteCode} · {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="rounded-xl bg-[#2E8B57] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#247a4a]"
          >
            Add Expense
          </button>
        </div>

        {/* Invite */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Invite by username</span>
            {!showInvite ? (
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="text-sm text-[#2E8B57] hover:underline"
              >
                Invite
              </button>
            ) : (
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Username"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                />
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="rounded-lg bg-[#2E8B57] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
                >
                  {inviteSubmitting ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteError(null);
                  }}
                  className="rounded-lg px-2 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
          {inviteError && (
            <p className="mt-2 text-sm text-red-500">{inviteError}</p>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Total shared expenses</h2>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrency(totalSpent)}
          </p>
        </div>

        {/* Expenses list */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No expenses yet. Add one to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {CATEGORY_ICONS[exp.category] ?? "📦"}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {exp.description || exp.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        {exp.date} · Split {exp.splitType}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(exp.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isAddExpenseOpen && (
        <AddRoomExpenseModal
          roomId={roomId}
          members={members}
          onClose={() => setIsAddExpenseOpen(false)}
          onSaved={() => {
            setIsAddExpenseOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = (params?.id as string) ?? null;

  return (
    <ActiveRoomProvider roomId={roomId}>
      <RoomDetailContent />
    </ActiveRoomProvider>
  );
}
