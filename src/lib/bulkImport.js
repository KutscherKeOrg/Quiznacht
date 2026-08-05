import { QUESTION_TYPES } from "../data/questionTypes";

/* ============================================================
   Feld-Aliase: die Kopfzeile einer CSV (oder die Keys eines JSON-
   Objekts) werden auf diese kanonischen, deutschen Feldnamen
   abgebildet. Groß-/Kleinschreibung und Leerzeichen sind egal.
   ============================================================ */

const FIELD_ALIASES = {
  typ: ["typ", "type", "fragetyp"],
  kategorie: ["kategorie", "category"],
  frage: ["frage", "prompt", "question"],
  antwortoptionen: ["antwortoptionen", "optionen", "options"],
  richtige_antwort: ["richtige_antwort", "richtigeantwort", "correct_answer", "antwort"],
  zahl: ["zahl", "richtige_zahl", "correct_value", "wert"],
  einheit: ["einheit", "unit"],
  medien_url: ["medien_url", "media_url", "bild_url", "audio_url", "url"],
  nachricht: ["nachricht", "message", "chattext"],
  hinweis: ["hinweis", "note", "hint"],
};

function normalizeKey(key) {
  return String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function resolveField(name) {
  const norm = normalizeKey(name);
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(norm)) return canonical;
  }
  return null;
}

function resolveType(raw) {
  const norm = String(raw ?? "").trim().toLowerCase();
  if (!norm) return null;
  const byKey = Object.keys(QUESTION_TYPES).find((k) => k.toLowerCase() === norm);
  if (byKey) return byKey;
  const byLabel = Object.entries(QUESTION_TYPES).find(([, meta]) => meta.label.toLowerCase() === norm);
  return byLabel ? byLabel[0] : null;
}

/* ============================================================
   CSV parsen (RFC4180-artig: Anführungszeichen, Kommas/Zeilenumbrüche
   innerhalb von Feldern, "" als escapetes Anführungszeichen).
   ============================================================ */

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  function pushField() {
    row.push(field);
    field = "";
  }
  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (i < len) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      pushField();
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function parseCSVInput(text) {
  const table = parseCSV(text);
  if (table.length === 0) return [];
  const headers = table[0].map(resolveField);
  return table
    .slice(1)
    .map((cells) => {
      const row = {};
      headers.forEach((canonical, i) => {
        if (canonical) row[canonical] = cells[i] ?? "";
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => String(v).trim() !== ""));
}

function parseJSONInput(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error("Ungültiges JSON: " + err.message);
  }
  const list = Array.isArray(data) ? data : [data];
  return list.map((obj) => {
    const row = {};
    for (const [key, value] of Object.entries(obj ?? {})) {
      const canonical = resolveField(key);
      if (canonical) row[canonical] = value;
    }
    return row;
  });
}

/**
 * Erkennt automatisch CSV vs. JSON (anhand des ersten sichtbaren Zeichens)
 * und liefert eine Liste roher Zeilen-Objekte mit kanonischen Feldnamen.
 */
export function parseBulkInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseJSONInput(trimmed);
  }
  return parseCSVInput(trimmed);
}

/* ============================================================
   Validierung – spiegelt die Regeln aus QuestionForm.jsx.
   ============================================================ */

function splitOptions(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value ?? "")
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * @returns {{ raw: object, question: object|null, errors: string[] }}
 */
export function validateRow(raw, categories) {
  const errors = [];

  const typ = resolveType(raw.typ);
  if (!typ) errors.push(`Ungültiger Fragetyp "${raw.typ ?? ""}"`);

  const categoryName = String(raw.kategorie ?? "").trim();
  const category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!categoryName) errors.push("Kategorie fehlt");
  else if (!category) errors.push(`Kategorie "${categoryName}" nicht gefunden`);

  const prompt = String(raw.frage ?? "").trim();
  if (!prompt) errors.push("Frage fehlt");

  const needsOptions = typ === "multiple_choice" || typ === "chat" || typ === "sound";
  const isPortraitOpen = typ === "portrait";
  const isEstimate = typ === "schaetzfrage";
  const isChat = typ === "chat";
  const isMedia = typ === "portrait" || typ === "sound";

  let options = null;
  let correctAnswer = null;
  let correctValue = null;
  let unit = null;

  if (needsOptions) {
    options = splitOptions(raw.antwortoptionen);
    if (options.length < 2) errors.push("Mindestens 2 Antwortoptionen nötig (mit | getrennt)");
    correctAnswer = String(raw.richtige_antwort ?? "").trim();
    if (!correctAnswer) errors.push("Richtige Antwort fehlt");
    else if (options.length >= 2 && !options.includes(correctAnswer)) {
      errors.push("Richtige Antwort ist nicht in den Antwortoptionen enthalten");
    }
  }

  if (isPortraitOpen) {
    correctAnswer = String(raw.richtige_antwort ?? "").trim();
    if (!correctAnswer) errors.push("Richtige Antwort fehlt");
  }

  if (isEstimate) {
    const rawNum = String(raw.zahl ?? "").trim().replace(",", ".");
    const num = Number(rawNum);
    if (rawNum === "" || Number.isNaN(num)) {
      errors.push("Ungültige Zahl");
    } else {
      correctValue = num;
    }
    unit = String(raw.einheit ?? "").trim();
    if (!unit) errors.push("Einheit fehlt");
  }

  if (isChat && !String(raw.nachricht ?? "").trim()) {
    errors.push("Nachrichtentext fehlt (für 'Wer hat's geschrieben?')");
  }

  const question =
    errors.length === 0
      ? {
          category_id: category.id,
          type: typ,
          answer_mode: isPortraitOpen ? "open" : "choice",
          prompt,
          options: needsOptions ? options : null,
          correct_answer: needsOptions || isPortraitOpen ? correctAnswer : null,
          correct_value: isEstimate ? correctValue : null,
          unit: isEstimate ? unit : null,
          media_url: isMedia ? String(raw.medien_url ?? "").trim() || null : null,
          message: isChat ? String(raw.nachricht ?? "").trim() : null,
          note: isMedia ? String(raw.hinweis ?? "").trim() || null : null,
        }
      : null;

  return { raw, question, errors };
}

/* ============================================================
   Beispiel-CSV-Vorlage
   ============================================================ */

export const CSV_TEMPLATE = `typ,kategorie,frage,antwortoptionen,richtige_antwort,zahl,einheit,medien_url,nachricht,hinweis
multiple_choice,Games,"In welchem Jahr erschien Minecraft?",2009|2010|2011|2012,2011,,,,,
schaetzfrage,DnD,"Wie viele Seiten hat das Monster Manual (5e)?",,,320,Seiten,,,
portrait,DnD,"Wer ist dieser geheimnisvolle Magier?",,Elandra Sturmweberin,,,,,"Bild später über den Editor hochladen"
sound,Musik,"Aus welchem Film stammt dieser Soundtrack?",Der Herr der Ringe|Star Wars|Harry Potter|Avatar,Star Wars,,,,,"Audio später über den Editor hochladen"
chat,Chatnachrichten,"Wer hat das geschrieben?",Lena|Ben|Kiki|Momo,Ben,,,,"bin gleich da, 5 minuten (die berühmten ben-minuten)",
`;
