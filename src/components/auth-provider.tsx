"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  accessible_clients?: string[];
  status?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileFetchPending = useRef<string | null>(null);

  const fetchProfile = async (email: string) => {
    if (profileFetchPending.current === email) return;
    profileFetchPending.current = email;
    try {
      const { data } = await supabase.from('users').select('*').eq('email', email).single();
      
      if (data && data.status === 'invited') {
        await supabase.from('users').update({ status: 'active' }).eq('email', email);
        data.status = 'active';
      }

      setProfile(data || null);
    } catch (e) {
      console.error("Failed to load user profile:", e);
    } finally {
      profileFetchPending.current = null;
    }
  };

  const refreshProfile = async () => {
    if (user?.email) {
      await fetchProfile(user.email);
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/session');
        const json = await res.json();
        if (json.authenticated && json.user) {
          const u = json.user;
          const s = { user: u, access_token: 'mysql_token' };
          setSession(s);
          setUser(u);
          await fetchProfile(u.email);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
