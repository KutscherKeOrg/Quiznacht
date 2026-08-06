import { PortraitImage } from "./PortraitImage";
import { SoundPlayer } from "./SoundPlayer";
import { ChatBubble } from "./ChatBubble";
import { C } from "../theme/colors";

/**
 * Rein darstellende Medienanzeige – nimmt keine Host-Steuerung entgegen,
 * damit sie für Host und Mitspieler exakt identisch aussieht. Die
 * Blur-Stufen-Steuerung für Portraits sitzt im HostPanel; Sound-Play/
 * Pause/Stop/Lautstärke sind lokale Kontrollen direkt im SoundPlayer.
 */
export function QuestionMedia({ question, revealed, blur }) {
  if (question.type === "portrait") {
    const effectiveBlur = question.portrait_display_mode === "sharp" ? 0 : revealed ? 0 : blur;
    return (
      <div className="flex flex-col items-center gap-3">
        <PortraitImage blur={effectiveBlur} mediaUrl={question.media_url} />
        <p className="text-xs" style={{ color: C.dim }}>
          {question.note}
        </p>
      </div>
    );
  }
  if (question.type === "sound") {
    return (
      <div className="flex flex-col items-center gap-3">
        <SoundPlayer mediaUrl={question.media_url} />
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
