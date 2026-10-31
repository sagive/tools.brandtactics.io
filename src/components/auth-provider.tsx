"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
      
      // If the user was invited, mark them as active upon first successful login/session
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

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      if (u?.email) {
        fetchProfile(u.email);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    // Listen for changes on auth state
    // CRITICAL: onAuthStateChange must remain strictly synchronous and NOT execute DB queries directly inside,
    // otherwise Supabase internal auth locks deadlock on TOKEN_REFRESHED when the tab is idle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        const u = newSession?.user ?? null;
        setUser(u);
        setIsLoading(false);

        if (event === "SIGNED_OUT" || !u) {
          setProfile(null);
        } else if (event === "SIGNED_IN") {
          // Defer fetch outside the auth lock cycle
          if (u.email) {
            setTimeout(() => {
              fetchProfile(u.email!);
            }, 0);
          }
        }
        // TOKEN_REFRESHED: do NOT re-fetch profile, profile doesn't change on JWT refresh!
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user?.email) {
      profileFetchPending.current = null;
      await fetchProfile(user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
