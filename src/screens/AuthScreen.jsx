import { useState } from "react";
import { signUp, signIn } from "../lib/authActions";
import { C } from "../theme/colors";

export function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          setError("Bitte einen Anzeigenamen angeben.");
          return;
        }
        const { session } = await signUp(email.trim(), password, displayName.trim());
        if (!session) {
          setInfo("Account erstellt! Falls eine Bestätigung nötig ist, prüf dein Postfach – sonst einfach einloggen.");
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = { background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text };
  const canSubmit = email.trim() && password && (mode === "login" || displayName.trim());

  return (
    <div className="max-w-sm mx-auto py-16">
      <div className="text-center mb-8">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            color: C.gold,
            letterSpacing: 1,
            textShadow: `0 0 24px ${C.gold}55`,
          }}
        >
          QUIZNACHT
        </span>
      </div>

      <div className="rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: `1px solid ${C.line}` }}>
          <button
            onClick={() => {
              setMode("login");
              setError("");
              setInfo("");
            }}
            className="flex-1 py-2 text-sm font-semibold focus:outline-none"
            style={{ background: mode === "login" ? C.violet : "transparent", color: mode === "login" ? "#fff" : C.dim }}
          >
            Einloggen
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError("");
              setInfo("");
            }}
            className="flex-1 py-2 text-sm font-semibold focus:outline-none"
            style={{ background: mode === "signup" ? C.violet : "transparent", color: mode === "signup" ? "#fff" : C.dim }}
          >
            Account erstellen
          </button>
        </div>

        {mode === "signup" && (
          <div className="mb-4">
            <label className="block text-xs mb-2" style={{ color: C.dim }}>
              Anzeigename
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="z.B. Momo"
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            E-Mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Passwort
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: C.pink }}>
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm mb-4" style={{ color: C.mint }}>
            {info}
          </p>
        )}

        <button
          disabled={busy || !canSubmit}
          onClick={handleSubmit}
          className="w-full rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ background: C.gold, color: "#221D00" }}
        >
          {mode === "signup" ? "Account erstellen" : "Einloggen"}
        </button>
      </div>
    </div>
  );
}
