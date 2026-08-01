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
