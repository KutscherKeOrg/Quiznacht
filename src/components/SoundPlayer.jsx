import { useEffect, useRef } from "react";
import { C } from "../theme/colors";

export function SoundPlayer({ playing, onToggle, canControl, mediaUrl }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing]);

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 mx-auto"
      style={{ background: C.panelSoft, border: `1px solid ${C.line}`, maxWidth: 380 }}
    >
      {mediaUrl && <audio ref={audioRef} src={mediaUrl} loop />}
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
