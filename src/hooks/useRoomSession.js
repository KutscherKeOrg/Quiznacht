import { useCallback, useState } from "react";

const STORAGE_KEY = "quiznacht_session";

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Hält fest, in welchem Raum man ist und in welcher Rolle (Host oder
 * Spieler), damit ein Reload nicht aus dem laufenden Spiel wirft.
 */
export function useRoomSession() {
  const [session, setSessionState] = useState(readStoredSession);

  const setSession = useCallback((next) => {
    setSessionState(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return [session, setSession];
}
