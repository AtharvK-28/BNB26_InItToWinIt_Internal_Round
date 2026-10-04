"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { LoaderCircle } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { cloudMode, supabase } from "@/lib/video/supabase";
import { cn } from "@/lib/utils";

/*
 * Supabase session for the video pipeline (cloud mode). In local mode the pipeline
 * runs as an anonymous loopback workspace and no sign-in is shown.
 */

const SessionContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: cloudMode });

export function useSession() {
  return useContext(SessionContext);
}

export function useWorkspaceIdentity() {
  return useContext(SessionContext).session?.user.id ?? "local";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(cloudMode);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      if (alive) {
        setSession(value);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>;
}

export async function signOut() {
  const result = await supabase?.auth.signOut();
  if (result?.error) throw result.error;
}

/** Shows children when the pipeline is usable; otherwise the sign-in card. */
export function SessionGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  if (!cloudMode) return <>{children}</>;
  if (!supabase)
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line p-8 text-center">
        <h2 className="text-xl font-semibold">Workspace connection needed</h2>
        <p className="mt-2 text-ink-2">Cloud mode needs the Supabase URL and publishable key in apps/web/.env.local before sign-in is available.</p>
      </div>
    );
  if (loading)
    return (
      <div className="flex justify-center py-24 text-ink-2" role="status">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  return session ? <div key={session.user.id}>{children}</div> : <AuthCard />;
}

/** Airbnb-style "Log in or sign up" card. */
export function AuthCard() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("maya@creatorai.example");
  const [password, setPassword] = useState("CreatorAi2026");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = register ? await supabase!.auth.signUp({ email, password }) : await supabase!.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (register && !result.data.session) setMessage("Check your email to confirm your account, then log in here.");
    } catch (err) {
      setError((err as Error).message);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[568px] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex h-16 items-center justify-center border-b border-line-soft font-semibold">Log in or sign up</div>
      <form onSubmit={submit} className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <LogoMark size={36} />
          <h2 className="text-[22px] font-semibold">Welcome to CreatorAI</h2>
        </div>
        <p className="mb-5 text-sm text-ink-2">Your projects, footage and cuts are private to your account.</p>
        {error && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl bg-arches-soft p-3 text-sm text-arches">
            {error}
          </div>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-xl bg-babu-soft p-3 text-sm text-babu">
            {message}
          </p>
        )}
        <div className="overflow-hidden rounded-lg border border-[#b0b0b0]">
          <label className="block border-b border-[#b0b0b0] px-3 py-2 focus-within:ring-2 focus-within:ring-ink focus-within:ring-inset">
            <span className="block text-xs text-ink-2">Email</span>
            <input type="email" required autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className="w-full bg-transparent text-[15px] outline-none" />
          </label>
          <label className="block px-3 py-2 focus-within:ring-2 focus-within:ring-ink focus-within:ring-inset">
            <span className="block text-xs text-ink-2">Password</span>
            <input
              type="password"
              required
              minLength={register ? 8 : 1}
              autoComplete={register ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </label>
        </div>
        <button disabled={busy} className="btn-rausch mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-semibold">
          {busy && <LoaderCircle className="size-4 animate-spin" />}
          {register ? "Create account" : "Continue"}
        </button>
        <p className="mt-5 text-center text-sm text-ink-2">
          {register ? "Already have an account?" : "New to CreatorAI?"}{" "}
          <button
            type="button"
            onClick={() => {
              setRegister((r) => !r);
              setError("");
              setMessage("");
            }}
            className={cn("font-semibold text-ink underline underline-offset-2")}
          >
            {register ? "Log in" : "Create an account"}
          </button>
        </p>
      </form>
    </div>
  );
}
