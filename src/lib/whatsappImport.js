/* ============================================================
   WhatsApp-Chat-Export (.txt) parsen – rein clientseitig, es wird
   nichts von der Datei hochgeladen. Unterstützt die zwei gängigen
   Export-Formate:
     Android: "14.03.24, 20:15 - Ben: Nachricht"
     iOS:     "[14.03.24, 20:15:32] Ben: Nachricht"
   ============================================================ */

const ANDROID_PREFIX = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\s*-\s*(.*)$/;
const IOS_PREFIX = /^\[(\d{1,2}[./]\d{1,2}[./]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\]\s*(.*)$/;

// Phrasen, die typisch für Gruppen-/Systembenachrichtigungen sind, damit ein
// versehentlich als "Sender" erkannter Satz ("Ben hat die Gruppe verlassen")
// nicht als echte Nachricht durchrutscht.
const SYSTEM_SENDER_HINTS = [
  " hat ",
  " ist ",
  " wurde ",
  " has ",
  " was ",
  " added",
  " removed",
  " left",
  " joined",
  " changed",
];

const EXCLUDE_TEXT_PATTERNS = [
  /^bild weggelassen$/i,
  /^video weggelassen$/i,
  /^audio weggelassen$/i,
  /^gif weggelassen$/i,
  /^sticker weggelassen$/i,
  /^dokument weggelassen$/i,
  /^kontaktkarte weggelassen$/i,
  /^<medien ausgeschlossen>$/i,
  /^image omitted$/i,
  /^video omitted$/i,
  /^audio omitted$/i,
  /^gif omitted$/i,
  /^sticker omitted$/i,
  /^document omitted$/i,
  /^contact card omitted$/i,
  /^media omitted$/i,
  /^diese nachricht wurde gelöscht$/i,
  /^du hast diese nachricht gelöscht$/i,
  /^this message was deleted$/i,
  /^you deleted this message$/i,
  /^verpasster sprachanruf$/i,
  /^verpasster videoanruf$/i,
  /^missed voice call$/i,
  /^missed video call$/i,
];

function stripInvisible(line) {
  // WhatsApp setzt oft unsichtbare Steuerzeichen vor Zeilen (z.B. bei
  // weggelassenen Medien) – die stören sonst den Zeilenanfang-Regex.
  return line.replace(/[‎‏]/g, "").replace(/ /g, " ");
}

function matchPrefix(line) {
  let m = ANDROID_PREFIX.exec(line);
  if (m) return { date: m[1], time: m[2], rest: m[3] };
  m = IOS_PREFIX.exec(line);
  if (m) return { date: m[1], time: m[2], rest: m[3] };
  return null;
}

function isSystemSender(sender) {
  const lower = " " + sender.toLowerCase() + " ";
  return SYSTEM_SENDER_HINTS.some((hint) => lower.includes(hint));
}

/**
 * @returns {{ messages: {sender: string, text: string, date: string, time: string}[], senders: string[] }}
 */
export function parseWhatsAppExport(text) {
  const rawLines = text.split(/\r\n|\r|\n/);
  const messages = [];
  let current = null;

  for (const rawLine of rawLines) {
    const line = stripInvisible(rawLine);
    if (line.trim() === "") continue;

    const prefixMatch = matchPrefix(line);
    if (prefixMatch) {
      const { rest } = prefixMatch;
      const sepIdx = rest.indexOf(": ");
      if (sepIdx === -1 || sepIdx > 60) {
        // Zeitstempel ohne "Name: Nachricht"-Struktur -> Gruppen-/Systemzeile.
        current = null;
        continue;
      }
      const sender = rest.slice(0, sepIdx).trim();
      const messageText = rest.slice(sepIdx + 2).trim();
      if (!sender || isSystemSender(sender)) {
        current = null;
        continue;
      }
      current = { sender, text: messageText, date: prefixMatch.date, time: prefixMatch.time };
      messages.push(current);
    } else if (current) {
      // Fortsetzungszeile einer mehrzeiligen Nachricht.
      current.text = current.text ? current.text + "\n" + line.trim() : line.trim();
    }
    // sonst: Zeile vor der ersten erkannten Nachricht (z.B. der
    // Verschlüsselungshinweis am Dateianfang) -> ignorieren.
  }

  const senders = Array.from(new Set(messages.map((m) => m.sender)));
  return { messages, senders };
}

export function isLikelyMediaOrSystemMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return EXCLUDE_TEXT_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Filtert Medien-/Systemnachrichten heraus und sortiert nach Länge
 * (längere, aussagekräftigere Nachrichten zuerst) – gute Kandidaten für
 * "Wer hat's geschrieben?"-Fragen.
 */
export function getCandidates(messages, { minLength = 10, maxLength = 300 } = {}) {
  return messages
    .filter((m) => !isLikelyMediaOrSystemMessage(m.text))
    .filter((m) => m.text.length >= minLength && m.text.length <= maxLength)
    .sort((a, b) => b.text.length - a.text.length);
}
