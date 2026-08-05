import { PortraitImage } from "./PortraitImage";
import { SoundPlayer } from "./SoundPlayer";
import { ChatBubble } from "./ChatBubble";
import { C } from "../theme/colors";

/**
 * Rein darstellende Medienanzeige – nimmt keine Host-Steuerung entgegen,
 * damit sie für Host und Mitspieler exakt identisch aussieht. Steuerung
 * (Blur-Stufen aufdecken, Sound abspielen) sitzt im HostPanel.
 */
export function QuestionMedia({ question, revealed, blur, soundPlaying }) {
  if (question.type === "portrait") {
    return (
      <div className="flex flex-col items-center gap-3">
        <PortraitImage blur={revealed ? 0 : blur} mediaUrl={question.media_url} />
        <p className="text-xs" style={{ color: C.dim }}>
          {question.note}
        </p>
      </div>
    );
  }
  if (question.type === "sound") {
    return (
      <div className="flex flex-col items-center gap-3">
        <SoundPlayer playing={soundPlaying} mediaUrl={question.media_url} />
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
