import { PortraitImage } from "./PortraitImage";
import { SoundPlayer } from "./SoundPlayer";
import { ChatBubble } from "./ChatBubble";
import { C } from "../theme/colors";

export function QuestionMedia({
  question,
  isHost,
  revealed,
  blur,
  onRevealBlurStep,
  soundPlaying,
  onToggleSound,
}) {
  if (question.type === "portrait") {
    return (
      <div className="flex flex-col items-center gap-3">
        <PortraitImage blur={revealed ? 0 : blur} />
        {isHost && !revealed && (
          <button
            onClick={onRevealBlurStep}
            className="rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
            style={{ background: C.violet + "33", color: C.violet, border: `1px solid ${C.violet}66` }}
          >
            Stufe aufdecken ({Math.max(0, Math.ceil(blur / 5))} übrig)
          </button>
        )}
        <p className="text-xs" style={{ color: C.dim }}>
          {question.note}
        </p>
      </div>
    );
  }
  if (question.type === "sound") {
    return (
      <div className="flex flex-col items-center gap-3">
        <SoundPlayer playing={soundPlaying} onToggle={onToggleSound} canControl={isHost} />
        <p className="text-xs" style={{ color: C.dim }}>
          {question.note}
        </p>
      </div>
    );
  }
  if (question.type === "chat") {
    return <ChatBubble text={question.message} />;
  }
  return null;
}
