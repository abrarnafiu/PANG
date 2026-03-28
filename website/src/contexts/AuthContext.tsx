import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const TOKEN_KEY = "token";

export interface User {
  id: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function userFromSupabaseUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): User | null {
  if (!u) return null;
  const username = (u.user_metadata?.username as string) ?? u.email?.split("@")[0] ?? "";
  return {
    id: u.id,
    email: u.email ?? "",
    username: username || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const updateSession = useCallback((session: { access_token: string; user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null) => {
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
      setToken(session.access_token);
      setUser(userFromSupabaseUser(session.user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    updateSession(null);
  }, [updateSession]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateSession(session);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSession(session);
    });

    return () => subscription.unsubscribe();
  }, [updateSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) updateSession(data.session);
  }, [updateSession]);

  const register = useCallback(async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: username ? { data: { username } } : undefined,
    });
    if (error) throw error;
    if (data.session) updateSession(data.session);
  }, [updateSession]);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
