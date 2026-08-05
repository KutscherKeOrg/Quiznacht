import { useEffect, useRef, useState } from "react";
import { C } from "../theme/colors";

/**
 * Prozedural erzeugter Spannungs-Loop (tiefe, leicht verstimmte Drone +
 * tickende Uhr) im Stil einer Quizshow-Bedenkzeit-Musik – komplett über
 * die Web Audio API synthetisiert, damit keine lizenzierte Audiodatei
 * nötig ist. Startet automatisch, sobald `active` true wird (das passiert
 * nur als Folge eines Nutzer-Klicks wie "Quiz starten", was die
 * Autoplay-Sperren der Browser erfüllt); ein Mute-Button bleibt jederzeit
 * verfügbar.
 */
export function BackgroundMusic({ active }) {
  const ctxRef = useRef(null);
  const tickTimerRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (active && !muted) {
      start();
    } else {
      stop();
    }
  }, [active, muted]);

  useEffect(() => () => stop(), []);

  function start() {
    if (ctxRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctx.resume().catch(() => {});
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.1;
    master.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 55.6;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.6;
    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(master);
    osc1.start();
    osc2.start();

    function tick() {
      const now = ctx.currentTime;
      const clickOsc = ctx.createOscillator();
      clickOsc.type = "square";
      clickOsc.frequency.value = 1000;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.18, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      clickOsc.connect(clickGain);
      clickGain.connect(master);
      clickOsc.start(now);
      clickOsc.stop(now + 0.05);
    }
    tick();
    tickTimerRef.current = setInterval(tick, 1000);
  }

  function stop() {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }

  if (!active) return null;

  return (
    <button
      onClick={() => setMuted((m) => !m)}
      className="fixed bottom-4 right-4 z-40 rounded-full w-11 h-11 flex items-center justify-center text-lg focus:outline-none focus:ring-2"
      style={{ background: C.panel, border: `1px solid ${C.line}`, color: muted ? C.dim : C.gold }}
      title={muted ? "Musik stummgeschaltet" : "Musik läuft – stummschalten"}
      aria-label={muted ? "Musik einschalten" : "Musik stummschalten"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
