"use client";

/**
 * Handles redirects after email verification, magic links, and OAuth.
 * Supabase sends tokens in the URL; this page exchanges them for a session.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    async function handleCallback() {
      const hashParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.hash.slice(1) : ""
      );
      const tokenHash =
        searchParams.get("token_hash") ?? hashParams.get("token_hash");
      const type =
        searchParams.get("type") ?? hashParams.get("type") ?? "email";

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as
            | "email"
            | "signup"
            | "magiclink"
            | "recovery"
            | "invite"
            | "email_change",
        });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("success");
        setMessage("Sign in complete. Redirecting…");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("success");
        setMessage("Sign in complete. Redirecting…");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setStatus("error");
      setMessage("No valid authentication data found. Please try again.");
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center">
        {status === "loading" && (
          <div className="animate-pulse text-zinc-400">{message}</div>
        )}
        {status === "success" && (
          <p className="text-emerald-400">{message}</p>
        )}
        {status === "error" && (
          <div>
            <p className="text-red-400 mb-4">{message}</p>
            <a
              href="/login"
              className="text-zinc-300 hover:text-white underline"
            >
              Back to login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="text-zinc-400 animate-pulse">
            Completing sign in…
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
