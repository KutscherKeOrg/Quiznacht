import { useEffect, useRef, useState } from "react";
import { C } from "../theme/colors";

const VOLUME_STORAGE_KEY = "quiznacht_volume";

function readStoredVolume() {
  const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
  const parsed = raw !== null ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 100;
}

/**
 * Abspielen/Pausieren wird ausschließlich über den `playing`-Prop
 * (Realtime-Raumstatus) gesteuert, damit Host und Mitspieler denselben
 * Anblick haben. Die Lautstärke ist dagegen eine rein lokale Einstellung
 * je Person – wirkt sich nur auf die eigene Wiedergabe aus, nicht auf
 * andere, und bleibt über localStorage über Fragen/Sitzungen hinweg erhalten.
 */
export function SoundPlayer({ playing, mediaUrl }) {
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(readStoredVolume);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, mediaUrl]);

  function handleVolumeChange(e) {
    const next = Number(e.target.value);
    setVolume(next);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(next));
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 mx-auto"
      style={{ background: C.panelSoft, border: `1px solid ${C.line}`, maxWidth: 380 }}
    >
      <div className="flex items-center gap-4">
        {mediaUrl && <audio ref={audioRef} src={mediaUrl} loop />}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: C.pink, color: "#fff" }}
          aria-hidden="true"
        >
          {playing ? "❚❚" : "▶"}
        </div>
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
      <div className="flex items-center gap-3">
        <span className="text-xs shrink-0" aria-hidden="true">
          🔉
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1"
          style={{ accentColor: C.pink }}
          aria-label="Lautstärke"
        />
        <span
          className="text-xs w-9 text-right shrink-0"
          style={{ color: C.dim, fontVariantNumeric: "tabular-nums" }}
        >
          {volume}%
        </span>
      </div>
    </div>
  );
}
