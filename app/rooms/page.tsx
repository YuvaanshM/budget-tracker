"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { RoomsProvider, useRooms } from "@/context/RoomsContext";
import { createRoom, joinRoomByInviteCode } from "@/lib/rooms";

function RoomsPageContent() {
  const { rooms, loading, error, refetchRooms } = useRooms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreateError("Please sign in to create a room");
      return;
    }
    if (!createName.trim()) {
      setCreateError("Room name is required");
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    const { room, error: err } = await createRoom(user.id, createName.trim());
    setCreateSubmitting(false);
    if (err) {
      setCreateError(err.message);
      return;
    }
    if (room) {
      setCreateName("");
      setIsCreateOpen(false);
      await refetchRooms();
      window.location.href = `/rooms/${room.id}`;
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJoinError("Please sign in to join a room");
      return;
    }
    if (!joinCode.trim()) {
      setJoinError("Invite code is required");
      return;
    }
    setJoinSubmitting(true);
    setJoinError(null);
    const { room, error: err } = await joinRoomByInviteCode(joinCode.trim(), user.id);
    setJoinSubmitting(false);
    if (err) {
      setJoinError(err.message);
      return;
    }
    if (room) {
      setJoinCode("");
      setIsJoinOpen(false);
      await refetchRooms();
      window.location.href = `/rooms/${room.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Shared Rooms</h1>
            <p className="mt-1 text-sm text-gray-500">
              Collaborate on budgets with roommates or friends. Split expenses in real time.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl bg-[#2E8B57] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#247a4a]"
            >
              Create Room
            </button>
          </div>
        </header>

        {loading ? (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Loading rooms…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">No rooms yet. Create or join one to get started.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsJoinOpen(true)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Join Room
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a]"
              >
                Create Room
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">Code: {room.inviteCode}</p>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {isCreateOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !createSubmitting && setIsCreateOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <h2 className="text-lg font-semibold text-gray-900">Create Room</h2>
            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4">
              <div>
                <label htmlFor="room-name" className="block text-sm font-medium text-gray-700">
                  Room name
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Apartment 4B"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                  autoFocus
                />
              </div>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-lg bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
                >
                  {createSubmitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Join Room Modal */}
      {isJoinOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !joinSubmitting && setIsJoinOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <h2 className="text-lg font-semibold text-gray-900">Join Room</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the invite code shared by your roommate or friend.
            </p>
            <form onSubmit={handleJoinRoom} className="mt-4 space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                  Invite code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
                  autoFocus
                />
              </div>
              {joinError && <p className="text-sm text-red-500">{joinError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  disabled={joinSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinSubmitting}
                  className="rounded-lg bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
                >
                  {joinSubmitting ? "Joining…" : "Join"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <RoomsProvider>
      <RoomsPageContent />
    </RoomsProvider>
  );
}
