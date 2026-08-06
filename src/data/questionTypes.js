import { C } from "../theme/colors";

// Anzeige-Metadaten für die 5 festen Fragetypen (nicht zu verwechseln mit den
// frei angelegten "Kategorien" wie DnD/Anime aus dem Fragenpool-Editor).
export const QUESTION_TYPES = {
  multiple_choice: { label: "Klassische Frage", color: C.sky },
  schaetzfrage: { label: "Schätzfrage", color: C.gold },
  portrait: { label: "Portrait erraten", color: C.violet },
  sound: { label: "Sound zuordnen", color: C.pink },
  chat: { label: "Wer hat's geschrieben?", color: C.mint },
};

// Anzeigemodus bei Portrait-Fragen: 'blur' (Standard) deckt das Bild beim
// Spielen stufenweise auf, 'sharp' zeigt es sofort unverpixelt.
export const PORTRAIT_DISPLAY_MODES = {
  blur: { label: "Verpixelt", icon: "🔒" },
  sharp: { label: "Direkt scharf", icon: "👁" },
};

// Die vier festen Aufdeck-Stufen im Moderator-Panel für 'blur'-Portraits.
export const BLUR_STAGES = [
  { value: 14, label: "Stark verpixelt" },
  { value: 9, label: "Mittel verpixelt" },
  { value: 4, label: "Leicht verpixelt" },
  { value: 0, label: "Scharf" },
];
