"use client";

import {
  createContext,
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, LogOut } from "lucide-react";
import { cloudMode, supabase } from "@/lib/supabase";

const SessionContext = createContext<{
  session: Session | null;
  loading: boolean;
}>({ session: null, loading: cloudMode });

export function useWorkspaceIdentity() {
  return useContext(SessionContext).session?.user.id ?? "local";
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
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
      .catch(() => {
        if (alive) setLoading(false);
      });
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
  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function AccountControl() {
  const { session } = useContext(SessionContext);
  const [error, setError] = useState("");
  if (!session)
    return <span className="topbar-note">From the first thought.</span>;
  return (
    <div className="account-control">
      <span>{session.user.email}</span>
      <button
        className="icon-button"
        aria-label="Sign out"
        onClick={async () => {
          try {
            const result = await supabase?.auth.signOut();
            if (result?.error) setError("Sign out didn’t finish. Try again.");
          } catch {
            setError("Sign out didn’t finish. Try again.");
          }
        }}
      >
        <LogOut size={17} aria-hidden="true" />
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useContext(SessionContext);
  if (!cloudMode) return children;
  if (!supabase)
    return (
      <div className="page">
        <div className="notice error" role="alert">
          <h1>Workspace connection needed.</h1>
          <p>
            The hosted workspace needs its Supabase connection settings before
            sign-in is available.
          </p>
        </div>
      </div>
    );
  if (loading)
    return (
      <div className="page loading" role="status">
        Opening your workspace…
      </div>
    );
  return session ? <div key={session.user.id}>{children}</div> : <AuthScreen />;
}

function AuthScreen() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = register
        ? await supabase!.auth.signUp({ email, password })
        : await supabase!.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (register && !result.data.session)
        setMessage(
          "Check your email to confirm your account, then sign in here.",
        );
    } catch (error) {
      setError((error as Error).message);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page auth-page">
      <p className="eyebrow">YOUR CREATIVE SPACE</p>
      <h1>A place for your next story.</h1>
      <p className="lede">
        Sign in to keep your projects and material together.
      </p>
      <form className="writing-panel auth-panel" onSubmit={submit}>
        <div className="auth-modes">
          <button
            type="button"
            aria-pressed={!register}
            onClick={() => {
              setRegister(false);
              setError("");
              setMessage("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={register}
            onClick={() => {
              setRegister(true);
              setError("");
              setMessage("");
            }}
          >
            Create account
          </button>
        </div>
        {error && (
          <div
            className="notice error"
            role="alert"
            tabIndex={-1}
            ref={errorRef}
          >
            {error}
          </div>
        )}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
        />
        <label className="field-label brief-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : 1}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Connecting…" : register ? "Create account" : "Sign in"}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
