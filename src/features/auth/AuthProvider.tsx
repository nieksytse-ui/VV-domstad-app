import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export type PlayerProfile = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "aanvoerder" | "player";
  shirt_number: number | null;
  position: string | null;
  photo_url: string | null;
  onboarded: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCaptain: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as PlayerProfile | null);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);

      // Redirect naar reset-pagina bij wachtwoord recovery
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/reset-wachtwoord";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        isCaptain: profile?.role === "aanvoerder" || profile?.role === "admin",
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
