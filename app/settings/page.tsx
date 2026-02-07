"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export default function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      const url =
        user?.user_metadata?.avatar_url ??
        (user?.user_metadata?.avatar as string | undefined);
      if (url) setAvatarUrl(url);
    }
    loadUser();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Please use PNG, JPG, GIF, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("Image must be 2MB or smaller.");
      return;
    }
    setAvatarLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAvatarError("You must be signed in to upload an avatar.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setAvatarError(uploadError.message || "Upload failed.");
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) {
        setAvatarError(updateError.message || "Could not save avatar.");
        return;
      }
      setAvatarUrl(publicUrl);
    } catch {
      setAvatarError("Something went wrong. Please try again.");
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your profile, preferences, and data
          </p>
        </header>

        {/* Profile Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Profile</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Update your profile picture and email
          </p>
          <div className="mt-6 space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Your avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-zinc-500">?</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-hidden
                />
                <button
                  type="button"
                  disabled={avatarLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {avatarLoading ? "Uploading…" : "Upload Avatar"}
                </button>
                <p className="mt-1 text-xs text-zinc-500">
                  PNG, JPG, GIF or WebP, up to 2MB
                </p>
                {avatarError && (
                  <p className="mt-1 text-xs text-red-400">{avatarError}</p>
                )}
              </div>
            </div>
            {/* Email (display account email) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                placeholder="Not signed in"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 read-only:cursor-default read-only:opacity-90"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Email for this account (read-only)
              </p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Preferences</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Customize how the app works for you
          </p>
          <div className="mt-6 space-y-4">
            {/* Default Currency - Placeholder */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-zinc-400">
                Default Currency
              </label>
              <select
                id="currency"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            {/* AI Auto-Categorization Toggle - Placeholder */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-100">AI Auto-Categorization</p>
                <p className="text-sm text-zinc-500">
                  Automatically categorize transactions
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="false"
                className="relative h-6 w-11 shrink-0 rounded-full border border-white/10 bg-zinc-700 transition-colors"
              >
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-zinc-400 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Data Section (Danger Zone) */}
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Data</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Export or delete your data
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-50"
            >
              Export to CSV
            </button>
            <button
              type="button"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            >
              Wipe All Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
