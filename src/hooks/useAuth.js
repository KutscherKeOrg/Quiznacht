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
    const user = session?.user;
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);

    async function loadOrCreateProfile() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      if (data) {
        setProfile(data);
        setProfileLoading(false);
        return;
      }
      // Kein Profil gefunden (z.B. weil der Auto-Anlege-Trigger bei der
      // Registrierung nicht griff) -> selbst eins anlegen, statt den
      // Account dauerhaft am Login-Screen hängen zu lassen.
      const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Spieler:in";
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: fallbackName })
        .select()
        .maybeSingle();

      if (cancelled) return;

      if (!insertError) {
        setProfile(created ?? null);
        setProfileLoading(false);
        return;
      }

      // Zwischen dem select oben und dem insert hier hat z.B. der Trigger
      // doch noch zugeschlagen (id-Konflikt) -> die jetzt existierende
      // Zeile einfach nachladen statt einen Fehler anzuzeigen.
      const { data: retried } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!cancelled) {
        setProfile(retried ?? null);
        setProfileLoading(false);
      }
    }

    loadOrCreateProfile();
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
