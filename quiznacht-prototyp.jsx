import { useState, useEffect, useRef } from "react";

/* ============================================================
   QUIZNACHT – Prototyp
   Host-Ansicht (Bühne + Regie) & Spieler-Ansicht (Browser-Tab)
   Simulierte Mitspieler zeigen, wie sich Echtzeit anfühlt.
   ============================================================ */

const C = {
  bg: "#16132B",
  panel: "#221D3F",
  panelSoft: "#2B2450",
  line: "#3A3268",
  text: "#EFEAFF",
  dim: "#9A91C4",
  gold: "#FFC53D",
  pink: "#FF5C8A",
  mint: "#4ADE80",
  sky: "#38BDF8",
  violet: "#A78BFA",
};

const CATEGORIES = {
  mc: { label: "Klassische Frage", color: C.sky },
  estimate: { label: "Schätzfrage", color: C.gold },
  portrait: { label: "Portrait erraten", color: C.violet },
  sound: { label: "Sound zuordnen", color: C.pink },
  chat: { label: "Wer hat's geschrieben?", color: C.mint },
};

const PLAYERS = ["Du", "Lena", "Ben", "Kiki", "Momo"];
const BOTS = PLAYERS.slice(1);

const QUESTIONS = [
  {
    type: "mc",
    prompt: "In welchem Jahr erschien das allererste The Legend of Zelda?",
    options: ["1984", "1986", "1989", "1991"],
    answer: "1986",
  },
  {
    type: "estimate",
    prompt: "Wie viele Seiten hat das D&D Player's Handbook (5e, 2014)?",
    answer: 320,
    unit: "Seiten",
  },
  {
    type: "portrait",
    prompt: "Welcher NPC aus eurer Kampagne ist das?",
    options: ["Alrik der Graue", "Wirtin Berla", "Fenwick Flink", "Ser Oduin"],
    answer: "Alrik der Graue",
    note: "Später: eigene Bilder hochladen, Host deckt stufenweise auf.",
  },
  {
    type: "sound",
    prompt: "Aus welchem Spiel stammt dieser Soundtrack-Ausschnitt?",
    options: ["Stardew Valley", "Hollow Knight", "Celeste", "Terraria"],
    answer: "Hollow Knight",
    note: "Später: eigene Audio-Uploads, Wiedergabe direkt in der App.",
  },
  {
    type: "chat",
    prompt: "Wer hat diese Nachricht in eure Gruppe geschrieben?",
    message: "\u201Ewer kommt heute p\u00FCnktlich? also 20:15. ich frag f\u00FCr einen freund (mich, ich bin sp\u00E4t dran)\u201C",
    options: BOTS,
    answer: "Momo",
  },
];

const ESTIMATE_POINTS = [100, 70, 50, 30, 10];

/* ---------- Hilfen ---------- */

function botAnswerFor(q, bot) {
  if (q.type === "estimate") {
    const noisy = Math.round(q.answer * (0.6 + Math.random() * 0.9));
    return Math.max(1, noisy);
  }
  const opts = q.options;
  const hitsIt = Math.random() < 0.55;
  if (hitsIt) return q.answer;
  const wrong = opts.filter((o) => o !== q.answer);
  return wrong[Math.floor(Math.random() * wrong.length)];
}

function pointsForQuestion(q, answers) {
  const pts = {};
  if (q.type === "estimate") {
    const ranked = PLAYERS.filter((p) => answers?.[p] !== undefined)
      .map((p) => ({ p, d: Math.abs(Number(answers[p]) - q.answer) }))
      .sort((a, b) => a.d - b.d);
    ranked.forEach((r, i) => {
      pts[r.p] = ESTIMATE_POINTS[i] ?? 0;
    });
  } else {
    PLAYERS.forEach((p) => {
      pts[p] = answers?.[p] === q.answer ? 100 : 0;
    });
  }
  return pts;
}

/* ---------- Kleine Bausteine ---------- */

function CategoryChip({ type }) {
  const cat = CATEGORIES[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
      style={{ background: cat.color + "22", color: cat.color, border: `1px solid ${cat.color}55` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
      {cat.label}
    </span>
  );
}

function ProgressDots({ current }) {
  return (
    <div className="flex items-center gap-2">
      {QUESTIONS.map((q, i) => (
        <span
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === current ? 22 : 8,
            height: 8,
            background: i < current ? C.dim : i === current ? CATEGORIES[q.type].color : C.line,
          }}
        />
      ))}
    </div>
  );
}

function Scoreboard({ scores, big }) {
  const max = Math.max(100, ...Object.values(scores));
  const ranked = [...PLAYERS].sort((a, b) => scores[b] - scores[a]);
  return (
    <div className="flex flex-col gap-3">
      {ranked.map((p, i) => (
        <div key={p} className="flex items-center gap-3">
          <span
            className="w-6 text-right font-bold"
            style={{ color: i === 0 ? C.gold : C.dim, fontSize: big ? 18 : 13 }}
          >
            {i + 1}.
          </span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span style={{ color: p === "Du" ? C.gold : C.text, fontWeight: 600, fontSize: big ? 17 : 14 }}>
                {p}
                {p === "Du" && <span style={{ color: C.dim, fontWeight: 400 }}> (du)</span>}
              </span>
              <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums", fontSize: big ? 16 : 13 }}>
                {scores[p]}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(scores[p] / max) * 100}%`,
                  background: i === 0 ? C.gold : C.violet,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Original gezeichnetes "Portrait" (Platzhalter für eigene Uploads) */
function PortraitImage({ blur }) {
  return (
    <div className="rounded-2xl overflow-hidden mx-auto" style={{ width: 220, height: 260, background: "#1A1735" }}>
      <svg viewBox="0 0 220 260" style={{ filter: `blur(${blur}px)`, transition: "filter .6s" }}>
        <rect width="220" height="260" fill="#241F4A" />
        <circle cx="110" cy="70" r="120" fill="#2E2860" />
        {/* Kapuze */}
        <path d="M40 250 Q30 110 110 95 Q190 110 180 250 Z" fill="#4C3A8C" />
        <path d="M60 250 Q55 130 110 118 Q165 130 160 250 Z" fill="#372A6B" />
        {/* Gesicht */}
        <ellipse cx="110" cy="150" rx="34" ry="40" fill="#E8C39E" />
        {/* Bart */}
        <path d="M78 160 Q110 235 142 160 Q142 195 110 210 Q78 195 78 160 Z" fill="#D8D4E8" />
        {/* Augen */}
        <circle cx="97" cy="145" r="4" fill="#2B2450" />
        <circle cx="123" cy="145" r="4" fill="#2B2450" />
        {/* Augenbrauen */}
        <path d="M88 136 Q97 130 106 136" stroke="#B9B4D6" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M114 136 Q123 130 132 136" stroke="#B9B4D6" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Stab */}
        <rect x="178" y="60" width="8" height="190" rx="4" fill="#7A5A34" />
        <circle cx="182" cy="52" r="14" fill="#FFC53D" opacity="0.9" />
      </svg>
    </div>
  );
}

function SoundPlayer({ playing, onToggle, canControl }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 mx-auto"
      style={{ background: C.panelSoft, border: `1px solid ${C.line}`, maxWidth: 380 }}
    >
      <button
        onClick={canControl ? onToggle : undefined}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 focus:outline-none focus:ring-2"
        style={{
          background: canControl ? C.pink : C.line,
          color: "#fff",
          cursor: canControl ? "pointer" : "default",
        }}
        aria-label={playing ? "Sound pausieren" : "Sound abspielen"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex items-end gap-1 h-10 flex-1" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{
              background: C.pink,
              opacity: playing ? 0.9 : 0.35,
              height: `${20 + Math.abs(Math.sin(i * 1.7)) * 80}%`,
              animation: playing ? `qz-bounce 0.9s ease-in-out ${i * 0.05}s infinite alternate` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ text }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 420 }}>
      <div
        className="rounded-2xl rounded-bl-sm px-5 py-4 text-left"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
      >
        <div className="text-xs mb-1 font-semibold" style={{ color: C.mint }}>
          ???
        </div>
        <div style={{ color: C.text, fontSize: 16, lineHeight: 1.5 }}>{text}</div>
        <div className="text-right text-xs mt-2" style={{ color: C.dim }}>
          19:47
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */

export default function App() {
  const [view, setView] = useState("host"); // 'host' | 'player'
  const [phase, setPhase] = useState("lobby"); // 'lobby' | 'question' | 'end'
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState({}); // {qIdx: {player: value}}
  const [blur, setBlur] = useState(14);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");
  const timers = useRef([]);

  const q = QUESTIONS[qIndex];
  const qAnswers = answers[qIndex] || {};
  const answeredCount = Object.keys(qAnswers).length;
  const youAnswered = qAnswers["Du"] !== undefined;

  /* Bots antworten mit Verzögerung */
  useEffect(() => {
    if (phase !== "question" || revealed) return;
    timers.current.forEach(clearTimeout);
    timers.current = BOTS.map((bot) =>
      setTimeout(() => {
        setAnswers((prev) => {
          const cur = prev[qIndex] || {};
          if (cur[bot] !== undefined) return prev;
          return { ...prev, [qIndex]: { ...cur, [bot]: botAnswerFor(QUESTIONS[qIndex], bot) } };
        });
      }, 1800 + Math.random() * 5000)
    );
    return () => timers.current.forEach(clearTimeout);
  }, [phase, qIndex, revealed]);

  /* Punktestand */
  const scores = {};
  PLAYERS.forEach((p) => (scores[p] = 0));
  QUESTIONS.forEach((question, i) => {
    const done = i < qIndex || (i === qIndex && revealed) || phase === "end";
    if (!done || !answers[i]) return;
    const pts = pointsForQuestion(question, answers[i]);
    PLAYERS.forEach((p) => (scores[p] += pts[p] || 0));
  });

  const lastPts = revealed || phase === "end" ? pointsForQuestion(q, qAnswers) : null;

  function submitAnswer(value) {
    if (revealed || qAnswers["Du"] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...(prev[qIndex] || {}), Du: value } }));
  }

  function nextQuestion() {
    if (qIndex + 1 >= QUESTIONS.length) {
      setPhase("end");
      return;
    }
    setQIndex(qIndex + 1);
    setRevealed(false);
    setBlur(14);
    setSoundPlaying(false);
    setEstimateInput("");
  }

  function restart() {
    setPhase("lobby");
    setQIndex(0);
    setRevealed(false);
    setAnswers({});
    setBlur(14);
    setSoundPlaying(false);
    setEstimateInput("");
  }

  /* ---------- Antwort-Widgets (Spieler) ---------- */

  function renderAnswerWidget() {
    if (q.type === "estimate") {
      return (
        <div className="flex flex-col items-center gap-3">
          {youAnswered ? (
            <LockedNote value={`${qAnswers["Du"]} ${q.unit}`} />
          ) : (
            <div className="flex gap-2 w-full" style={{ maxWidth: 340 }}>
              <input
                type="number"
                inputMode="numeric"
                value={estimateInput}
                onChange={(e) => setEstimateInput(e.target.value)}
                placeholder="Deine Schätzung…"
                className="flex-1 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
              />
              <button
                onClick={() => estimateInput !== "" && submitAnswer(Number(estimateInput))}
                className="rounded-xl px-5 font-bold focus:outline-none focus:ring-2"
                style={{ background: C.gold, color: "#221D00" }}
              >
                Einloggen
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 w-full mx-auto" style={{ maxWidth: 480 }}>
        {q.options.map((opt) => {
          const chosen = qAnswers["Du"] === opt;
          const isCorrect = revealed && opt === q.answer;
          const isWrongChoice = revealed && chosen && opt !== q.answer;
          return (
            <button
              key={opt}
              onClick={() => submitAnswer(opt)}
              disabled={youAnswered || revealed}
              className="rounded-xl px-4 py-4 font-semibold text-left transition-all focus:outline-none focus:ring-2"
              style={{
                background: isCorrect ? C.mint + "33" : isWrongChoice ? C.pink + "33" : chosen ? C.violet + "44" : C.panelSoft,
                border: `2px solid ${isCorrect ? C.mint : isWrongChoice ? C.pink : chosen ? C.violet : C.line}`,
                color: C.text,
                opacity: youAnswered && !chosen && !isCorrect ? 0.5 : 1,
                cursor: youAnswered || revealed ? "default" : "pointer",
              }}
            >
              {opt}
              {isCorrect && <span style={{ color: C.mint }}> ✓</span>}
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------- Fragen-Medien (beide Ansichten) ---------- */

  function renderMedia(isHost) {
    if (q.type === "portrait") {
      return (
        <div className="flex flex-col items-center gap-3">
          <PortraitImage blur={revealed ? 0 : blur} />
          {isHost && !revealed && (
            <button
              onClick={() => setBlur((b) => Math.max(0, b - 5))}
              className="rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
              style={{ background: C.violet + "33", color: C.violet, border: `1px solid ${C.violet}66` }}
            >
              Stufe aufdecken ({Math.max(0, Math.ceil(blur / 5))} übrig)
            </button>
          )}
          <p className="text-xs" style={{ color: C.dim }}>{q.note}</p>
        </div>
      );
    }
    if (q.type === "sound") {
      return (
        <div className="flex flex-col items-center gap-3">
          <SoundPlayer playing={soundPlaying} onToggle={() => setSoundPlaying((p) => !p)} canControl={isHost} />
          <p className="text-xs" style={{ color: C.dim }}>{q.note}</p>
        </div>
      );
    }
    if (q.type === "chat") {
      return <ChatBubble text={q.message} />;
    }
    return null;
  }

  /* ---------- Screens ---------- */

  const header = (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "'Bungee', system-ui",
            fontSize: 22,
            color: C.gold,
            letterSpacing: 1,
            textShadow: `0 0 24px ${C.gold}55`,
          }}
        >
          QUIZNACHT
        </span>
        <span className="text-xs rounded-md px-2 py-1" style={{ background: C.panelSoft, color: C.dim }}>
          Raum: KNEIPE-42
        </span>
      </div>
      <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        {[
          ["host", "Host-Ansicht"],
          ["player", "Spieler-Ansicht"],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 text-sm font-semibold focus:outline-none"
            style={{
              background: view === v ? C.violet : "transparent",
              color: view === v ? "#fff" : C.dim,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const demoHint = (
    <p className="text-xs mt-6 text-center" style={{ color: C.dim }}>
      Prototyp: Beide Ansichten wären später getrennte Browser-Tabs bei jedem zu Hause – hier per Schalter oben.
      Lena, Ben, Kiki &amp; Momo antworten simuliert.
    </p>
  );

  let content;

  if (phase === "lobby") {
    content = (
      <div className="text-center py-10">
        <div style={{ fontFamily: "'Bungee', system-ui", fontSize: 40, color: C.text, lineHeight: 1.1 }}>
          Freitags-<span style={{ color: C.gold }}>Quiz</span>
        </div>
        <p className="mt-3" style={{ color: C.dim }}>
          5 Fragen · 5 Kategorien · Discord-Call läuft nebenbei
        </p>
        <div className="flex justify-center gap-3 mt-8 flex-wrap">
          {PLAYERS.map((p, i) => (
            <div
              key={p}
              className="rounded-xl px-5 py-3 font-semibold"
              style={{
                background: C.panelSoft,
                border: `1px solid ${p === "Du" ? C.gold : C.line}`,
                color: p === "Du" ? C.gold : C.text,
                animation: `qz-pop .4s ease ${i * 0.12}s both`,
              }}
            >
              {p}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {Object.values(CATEGORIES).map((c) => (
            <span key={c.label} className="text-xs rounded-full px-3 py-1" style={{ background: c.color + "22", color: c.color }}>
              {c.label}
            </span>
          ))}
        </div>
        {view === "host" ? (
          <button
            onClick={() => setPhase("question")}
            className="mt-10 rounded-2xl px-10 py-4 text-lg font-bold focus:outline-none focus:ring-2"
            style={{ background: C.gold, color: "#221D00", boxShadow: `0 0 40px ${C.gold}44` }}
          >
            Quiz starten
          </button>
        ) : (
          <p className="mt-10 text-sm" style={{ color: C.dim }}>
            Warten auf den Host… (wechsle oben zur Host-Ansicht und starte)
          </p>
        )}
      </div>
    );
  } else if (phase === "end") {
    const ranked = [...PLAYERS].sort((a, b) => scores[b] - scores[a]);
    content = (
      <div className="text-center py-8">
        <div style={{ fontFamily: "'Bungee', system-ui", fontSize: 16, color: C.dim, letterSpacing: 2 }}>SIEGEREHRUNG</div>
        <div className="mt-2" style={{ fontFamily: "'Bungee', system-ui", fontSize: 42, color: C.gold, textShadow: `0 0 40px ${C.gold}66` }}>
          {ranked[0]} 🏆
        </div>
        <div className="mx-auto mt-8 text-left" style={{ maxWidth: 440 }}>
          <Scoreboard scores={scores} big />
        </div>
        <button
          onClick={restart}
          className="mt-10 rounded-2xl px-8 py-3 font-bold focus:outline-none focus:ring-2"
          style={{ background: C.violet, color: "#fff" }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  } else if (view === "host") {
    content = (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Bühne */}
        <div className="flex-1 rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CategoryChip type={q.type} />
            <ProgressDots current={qIndex} />
          </div>
          <h2 className="mt-5 mb-6 text-center" style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
            {q.prompt}
          </h2>
          {renderMedia(true)}

          {q.type !== "estimate" && q.type !== "portrait" && q.type !== "sound" && null}

          {revealed && (
            <div className="mt-6 text-center rounded-xl py-4" style={{ background: C.mint + "18", border: `1px solid ${C.mint}55` }}>
              <span style={{ color: C.dim }}>Richtige Antwort: </span>
              <span className="font-bold text-lg" style={{ color: C.mint }}>
                {q.type === "estimate" ? `${q.answer} ${q.unit}` : q.answer}
              </span>
            </div>
          )}

          {revealed && q.type === "estimate" && (
            <div className="mt-4 grid gap-2 mx-auto" style={{ maxWidth: 380 }}>
              {PLAYERS.filter((p) => qAnswers[p] !== undefined)
                .sort((a, b) => Math.abs(qAnswers[a] - q.answer) - Math.abs(qAnswers[b] - q.answer))
                .map((p) => (
                  <div key={p} className="flex justify-between text-sm rounded-lg px-3 py-2" style={{ background: C.panelSoft }}>
                    <span style={{ color: p === "Du" ? C.gold : C.text }}>{p}</span>
                    <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums" }}>
                      {qAnswers[p]} → +{lastPts[p]}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Regie */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-5" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="text-sm" style={{ color: C.dim }}>
              <span className="font-bold" style={{ color: answeredCount === PLAYERS.length ? C.mint : C.text }}>
                {answeredCount}/{PLAYERS.length}
              </span>{" "}
              haben geantwortet
              <span className="inline-flex gap-1 ml-2 align-middle">
                {PLAYERS.map((p) => (
                  <span
                    key={p}
                    title={p}
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: qAnswers[p] !== undefined ? C.mint : C.line }}
                  />
                ))}
              </span>
            </div>
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-xl px-6 py-3 font-bold focus:outline-none focus:ring-2"
                style={{ background: C.gold, color: "#221D00" }}
              >
                Auflösen
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="rounded-xl px-6 py-3 font-bold focus:outline-none focus:ring-2"
                style={{ background: C.violet, color: "#fff" }}
              >
                {qIndex + 1 >= QUESTIONS.length ? "Siegerehrung →" : "Nächste Frage →"}
              </button>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="lg:w-72 rounded-2xl p-5 self-start w-full" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-bold tracking-widest mb-4" style={{ color: C.dim }}>
            PUNKTESTAND
          </div>
          <Scoreboard scores={scores} />
        </div>
      </div>
    );
  } else {
    /* Spieler-Ansicht */
    const myPts = lastPts ? lastPts["Du"] || 0 : null;
    content = (
      <div className="mx-auto rounded-2xl p-6" style={{ maxWidth: 560, background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CategoryChip type={q.type} />
          <span className="text-xs" style={{ color: C.dim }}>
            Frage {qIndex + 1}/{QUESTIONS.length} · Du: <b style={{ color: C.gold }}>{scores["Du"]} Pkt.</b>
          </span>
        </div>
        <h2 className="mt-5 mb-6 text-center" style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
          {q.prompt}
        </h2>
        {renderMedia(false)}
        <div className="mt-6">{renderAnswerWidget()}</div>

        {youAnswered && !revealed && (
          <p className="mt-5 text-center text-sm" style={{ color: C.dim }}>
            Antwort eingeloggt – warten auf die Auflösung durch den Host…
          </p>
        )}
        {revealed && (
          <div
            className="mt-6 text-center rounded-xl py-4"
            style={{
              background: (myPts > 0 ? C.mint : C.pink) + "18",
              border: `1px solid ${(myPts > 0 ? C.mint : C.pink)}55`,
              animation: "qz-pop .35s ease both",
            }}
          >
            <span className="font-bold text-lg" style={{ color: myPts > 0 ? C.mint : C.pink }}>
              {myPts > 0 ? `+${myPts} Punkte!` : "Diesmal nichts …"}
            </span>
            {q.type === "estimate" && (
              <div className="text-sm mt-1" style={{ color: C.dim }}>
                Richtig: {q.answer} {q.unit} · Deine Schätzung: {qAnswers["Du"] ?? "—"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 md:px-8" style={{ background: C.bg, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes qz-pop { from { transform: scale(.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes qz-bounce { from { transform: scaleY(.4) } to { transform: scaleY(1) } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        {header}
        {content}
        {demoHint}
      </div>
    </div>
  );
}

function LockedNote({ value }) {
  return (
    <div
      className="rounded-xl px-5 py-3 font-bold"
      style={{ background: "#FFC53D22", border: "1px solid #FFC53D66", color: "#FFC53D" }}
    >
      Eingeloggt: {value}
    </div>
  );
}
