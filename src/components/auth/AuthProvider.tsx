"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { replaceAttachedSources } from "@/src/db/indexeddb";
import { clearSessionSnapshot } from "@/src/session/persistence";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setState({ user: null, session: null, loading: false });
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      if (data.session?.user?.id) {
        lastUserIdRef.current = data.session.user.id;
      }
      setState({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) {
          return;
        }
        if (session?.user?.id) {
          lastUserIdRef.current = session.user.id;
        } else if (lastUserIdRef.current) {
          const consoleId = `console-${lastUserIdRef.current}`;
          void replaceAttachedSources([], consoleId);
          void clearSessionSnapshot(consoleId);
          lastUserIdRef.current = null;
        }
        setState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        });
      }
    );

    return () => {
      active = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
