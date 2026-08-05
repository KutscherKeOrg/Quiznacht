import { useMemo, useState } from "react";
import { parseWhatsAppExport, getCandidates } from "../../lib/whatsappImport";
import { getOrCreateCategoryByName, createQuestion } from "../../lib/poolActions";
import { C } from "../../theme/colors";

const CHAT_CATEGORY_NAME = "Chatnachrichten";
const CHAT_CATEGORY_COLOR = C.mint;
const DEFAULT_PROMPT = "Wer hat diese Nachricht in eure Gruppe geschrieben?";
const MAX_DISPLAYED = 150;

export function WhatsAppImportForm({ onExit }) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null); // { messages, senders, candidates } | null
  const [parseError, setParseError] = useState("");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [savedIndices, setSavedIndices] = useState(new Set());
  const [formPrompt, setFormPrompt] = useState(DEFAULT_PROMPT);
  const [formMessage, setFormMessage] = useState("");
  const [selectedDecoys, setSelectedDecoys] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");

  const inputStyle = { background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text };

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ""));
    reader.onerror = () => setParseError("Datei konnte nicht gelesen werden.");
    reader.readAsText(file);
  }

  function handleAnalyze() {
    setParseError("");
    const { messages, senders } = parseWhatsAppExport(rawText);
    if (messages.length === 0) {
      setParseError(
        "Keine Nachrichten erkannt. Unterstützt werden die WhatsApp-Exportformate „14.03.24, 20:15 - Name: Text“ und „[14.03.24, 20:15:32] Name: Text“."
      );
      return;
    }
    const candidates = getCandidates(messages);
    setParsed({ messages, senders, candidates });
    setSavedIndices(new Set());
    setActiveIndex(null);
  }

  const filteredCandidates = useMemo(() => {
    if (!parsed) return [];
    const term = search.trim().toLowerCase();
    if (!term) return parsed.candidates;
    return parsed.candidates.filter(
      (m) => m.text.toLowerCase().includes(term) || m.sender.toLowerCase().includes(term)
    );
  }, [parsed, search]);

  const displayed = filteredCandidates.slice(0, MAX_DISPLAYED);

  function openCandidate(index) {
    const candidate = filteredCandidates[index];
    setActiveIndex(index);
    setFormPrompt(DEFAULT_PROMPT);
    setFormMessage(candidate.text);
    const others = parsed.senders.filter((s) => s !== candidate.sender);
    setSelectedDecoys(new Set(others.slice(0, 3)));
    setSaveError("");
  }

  function toggleDecoy(sender) {
    setSelectedDecoys((prev) => {
      const next = new Set(prev);
      if (next.has(sender)) next.delete(sender);
      else next.add(sender);
      return next;
    });
  }

  async function handleSaveCandidate() {
    const candidate = filteredCandidates[activeIndex];
    setSaveError("");
    if (!formPrompt.trim()) return setSaveError("Bitte eine Frage eingeben.");
    if (!formMessage.trim()) return setSaveError("Nachrichtentext darf nicht leer sein.");
    if (selectedDecoys.size === 0) return setSaveError("Mindestens eine falsche Antwortoption auswählen.");

    setBusy(true);
    try {
      const category = await getOrCreateCategoryByName(CHAT_CATEGORY_NAME, CHAT_CATEGORY_COLOR);
      const options = [candidate.sender, ...selectedDecoys].sort(() => Math.random() - 0.5);
      await createQuestion({
        category_id: category.id,
        type: "chat",
        prompt: formPrompt.trim(),
        options,
        correct_answer: candidate.sender,
        correct_value: null,
        unit: null,
        media_url: null,
        message: formMessage.trim(),
        note: null,
      });
      setSavedIndices((prev) => new Set(prev).add(activeIndex));
      setActiveIndex(null);
    } catch (err) {
      setSaveError("Konnte nicht gespeichert werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!parsed) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h2 className="font-bold text-lg mb-2" style={{ color: C.text }}>
          WhatsApp-Chat importieren
        </h2>
        <p className="text-sm mb-4" style={{ color: C.dim }}>
          Chat-Exportdatei (.txt) hochladen oder den Inhalt einfügen. Alles läuft nur in deinem Browser –
          die Datei wird nirgendwo hochgeladen oder gespeichert, außer den einzelnen Nachrichten, die du
          gezielt als Frage übernimmst.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label
            className="text-sm font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: C.panelSoft, color: C.violet, border: `1px solid ${C.line}` }}
          >
            Datei auswählen (.txt)
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          placeholder="…oder Chat-Export hier einfügen"
          className="w-full rounded-xl px-4 py-3 mb-4 font-mono text-xs focus:outline-none focus:ring-2 resize-y"
          style={inputStyle}
        />

        {parseError && (
          <p className="text-sm mb-4" style={{ color: C.pink }}>
            {parseError}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onExit}
            className="rounded-xl px-5 py-3 font-semibold focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            Abbrechen
          </button>
          <button
            disabled={!rawText.trim()}
            onClick={handleAnalyze}
            className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.gold, color: "#221D00" }}
          >
            Chat analysieren
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl p-6 mb-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <p className="text-sm" style={{ color: C.dim }}>
            <b style={{ color: C.text }}>{parsed.messages.length}</b> Nachrichten von{" "}
            <b style={{ color: C.text }}>{parsed.senders.length}</b> Personen erkannt (
            {parsed.senders.join(", ")}) ·{" "}
            <b style={{ color: C.mint }}>{parsed.candidates.length}</b> geeignete Kandidaten
          </p>
          <button
            onClick={onExit}
            className="text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
          >
            Fertig
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nachrichten durchsuchen…"
          className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-2">
        {displayed.length === 0 && (
          <p className="text-center text-sm" style={{ color: C.dim }}>
            Keine passenden Nachrichten gefunden.
          </p>
        )}
        {displayed.map((m, i) => {
          const isActive = activeIndex === i;
          const isSaved = savedIndices.has(i);
          return (
            <div key={i}>
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
                style={{ background: C.panel, border: `1px solid ${isActive ? C.violet : C.line}` }}
              >
                <span className="text-xs font-semibold shrink-0" style={{ color: C.mint }}>
                  {m.sender}
                </span>
                <span className="flex-1 min-w-[160px] text-sm truncate" style={{ color: C.text }}>
                  {m.text.replace(/\n/g, " ↵ ")}
                </span>
                {isSaved ? (
                  <span className="text-xs shrink-0" style={{ color: C.mint }}>
                    ✓ Übernommen
                  </span>
                ) : (
                  <button
                    onClick={() => (isActive ? setActiveIndex(null) : openCandidate(i))}
                    className="text-sm px-3 py-2 rounded-lg shrink-0 focus:outline-none focus:ring-2"
                    style={{ background: C.panelSoft, color: C.violet }}
                  >
                    {isActive ? "Schließen" : "Als Frage übernehmen"}
                  </button>
                )}
              </div>

              {isActive && (
                <div
                  className="rounded-xl px-4 py-4 mt-1 mb-1"
                  style={{ background: C.panelSoft, border: `1px solid ${C.violet}` }}
                >
                  <label className="block text-xs mb-2" style={{ color: C.dim }}>
                    Frage
                  </label>
                  <input
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />

                  <label className="block text-xs mb-2" style={{ color: C.dim }}>
                    Nachrichtentext (Chat-Bubble)
                  </label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 resize-none"
                    style={inputStyle}
                  />

                  <label className="block text-xs mb-2" style={{ color: C.dim }}>
                    Richtige Antwort
                  </label>
                  <div
                    className="rounded-xl px-4 py-3 mb-3 text-sm font-semibold"
                    style={{ background: C.mint + "22", color: C.mint, border: `1px solid ${C.mint}55` }}
                  >
                    {m.sender}
                  </div>

                  <label className="block text-xs mb-2" style={{ color: C.dim }}>
                    Falsche Antwortoptionen
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {parsed.senders
                      .filter((s) => s !== m.sender)
                      .map((s) => {
                        const checked = selectedDecoys.has(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleDecoy(s)}
                            className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                            style={{
                              background: checked ? C.violet + "33" : "transparent",
                              color: checked ? C.violet : C.dim,
                              border: `1px solid ${checked ? C.violet : C.line}`,
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                  </div>

                  {saveError && (
                    <p className="text-sm mb-3" style={{ color: C.pink }}>
                      {saveError}
                    </p>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setActiveIndex(null)}
                      className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                      style={{ background: "transparent", color: C.dim }}
                    >
                      Abbrechen
                    </button>
                    <button
                      disabled={busy}
                      onClick={handleSaveCandidate}
                      className="rounded-xl px-5 py-2 text-sm font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
                      style={{ background: C.gold, color: "#221D00" }}
                    >
                      Frage speichern
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredCandidates.length > MAX_DISPLAYED && (
          <p className="text-center text-xs mt-2" style={{ color: C.dim }}>
            Zeige die ersten {MAX_DISPLAYED} von {filteredCandidates.length} Treffern – über die Suche
            weiter eingrenzen.
          </p>
        )}
      </div>
    </div>
  );
}
