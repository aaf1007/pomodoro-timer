"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

interface AuthedUser {
  id: string;
  email: string | null;
}

export default function AuthButton() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
      } else {
        setUser(null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string; email?: string | null } } | null) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? null });
        } else {
          setUser(null);
        }
      },
    );

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  function resetForm() {
    setEmail("");
    setPassword("");
    setError(null);
    setInfo(null);
  }

  function closePanel() {
    setOpen(false);
    resetForm();
    setMode("signin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        closePanel();
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) {
          setError(err.message);
          return;
        }
        setInfo("Check your email to confirm your account.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const btnClass =
    "px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-sm transition-colors cursor-pointer";

  if (user) {
    return (
      <div className="flex items-center gap-2 text-white">
        <span className="text-sm text-white/80 max-w-[14rem] truncate">
          {user.email ?? "signed in"}
        </span>
        <button onClick={handleSignOut} className={btnClass}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className={btnClass}>
        Sign in
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Authentication"
          className="absolute right-0 mt-2 w-72 p-4 rounded-xl bg-black/60 backdrop-blur-md text-white shadow-lg border border-white/10 z-50"
        >
          <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfo(null);
              }}
              className={`px-2 py-1 rounded ${
                mode === "signin" ? "bg-white/20" : "opacity-60 hover:opacity-100"
              } cursor-pointer`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
              className={`px-2 py-1 rounded ${
                mode === "signup" ? "bg-white/20" : "opacity-60 hover:opacity-100"
              } cursor-pointer`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close"
              className="ml-auto text-white/60 hover:text-white cursor-pointer"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/70">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-white outline-none focus:border-white/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/70">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-white outline-none focus:border-white/60"
              />
            </label>
            {error && (
              <p role="alert" className="text-xs text-red-300">
                {error}
              </p>
            )}
            {info && <p className="text-xs text-white/80">{info}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-60"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
