import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hält den Supabase-Auth-Login-Status und das dazugehörige Profil
 * (Anzeigename) synchron. `session` ist `undefined` solange der initiale
 * Check noch läuft, `null` wenn niemand eingeloggt ist.
 */
export function useAuth() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data);
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const user = session?.user ?? null;

  return {
    user,
    profile,
    loading: session === undefined || (Boolean(user) && profileLoading && !profile),
  };
}
