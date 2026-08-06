import { useState } from "react";
import { QUESTION_TYPES, PORTRAIT_DISPLAY_MODES } from "../../data/questionTypes";
import { uploadQuestionMedia } from "../../lib/poolActions";
import { C } from "../../theme/colors";

const EMPTY_OPTIONS = ["", ""];

function optionsFromQuestion(q) {
  if (q?.options && Array.isArray(q.options) && q.options.length > 0) return [...q.options];
  return [...EMPTY_OPTIONS];
}

export function QuestionForm({ categories, initialQuestion, onSave, onCancel, busy }) {
  const isEdit = Boolean(initialQuestion);
  const [categoryId, setCategoryId] = useState(initialQuestion?.category_id ?? categories[0]?.id ?? "");
  const [type, setType] = useState(initialQuestion?.type ?? "multiple_choice");
  const [answerMode, setAnswerMode] = useState(
    initialQuestion?.answer_mode ?? (initialQuestion?.type === "portrait" ? "open" : "choice")
  );
  const [portraitDisplayMode, setPortraitDisplayMode] = useState(initialQuestion?.portrait_display_mode ?? "blur");
  const [prompt, setPrompt] = useState(initialQuestion?.prompt ?? "");
  const [options, setOptions] = useState(optionsFromQuestion(initialQuestion));
  const [correctAnswer, setCorrectAnswer] = useState(initialQuestion?.correct_answer ?? "");
  const [correctValue, setCorrectValue] = useState(initialQuestion?.correct_value ?? "");
  const [unit, setUnit] = useState(initialQuestion?.unit ?? "");
  const [mediaUrl, setMediaUrl] = useState(initialQuestion?.media_url ?? "");
  const [message, setMessage] = useState(initialQuestion?.message ?? "");
  const [note, setNote] = useState(initialQuestion?.note ?? "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const isEstimate = type === "schaetzfrage";
  const isOpenAnswer = !isEstimate && answerMode === "open";
  const needsOptions = !isEstimate && answerMode === "choice";
  const isChat = type === "chat";
  const isMedia = type === "portrait" || type === "sound";
  const isPortrait = type === "portrait";

  function updateOption(i, value) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i) {
    if (options[i] === correctAnswer) setCorrectAnswer("");
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleFileSelected(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadQuestionMedia(file, type);
      setMediaUrl(url);
    } catch (err) {
      setError("Upload fehlgeschlagen: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    setError("");
    if (!categoryId) return setError("Bitte eine Kategorie wählen.");
    if (!prompt.trim()) return setError("Bitte eine Frage eingeben.");

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (needsOptions) {
      if (cleanOptions.length < 2) return setError("Mindestens 2 Antwortoptionen angeben.");
      if (!correctAnswer || !cleanOptions.includes(correctAnswer)) {
        return setError("Bitte die richtige Antwort markieren.");
      }
    }
    if (isOpenAnswer && !correctAnswer.trim()) return setError("Bitte die richtige Antwort eingeben.");
    if (isChat && !message.trim()) return setError("Bitte den Nachrichtentext eingeben.");
    if (isEstimate) {
      if (correctValue === "" || Number.isNaN(Number(correctValue))) return setError("Bitte eine gültige Zahl eingeben.");
      if (!unit.trim()) return setError("Bitte eine Einheit angeben (z.B. Seiten).");
    }

    onSave({
      category_id: categoryId,
      type,
      answer_mode: isEstimate ? "choice" : answerMode,
      portrait_display_mode: isPortrait ? portraitDisplayMode : "blur",
      prompt: prompt.trim(),
      options: needsOptions ? cleanOptions : null,
      correct_answer: needsOptions ? correctAnswer : isOpenAnswer ? correctAnswer.trim() : null,
      correct_value: isEstimate ? Number(correctValue) : null,
      unit: isEstimate ? unit.trim() : null,
      media_url: isMedia ? mediaUrl.trim() || null : null,
      message: isChat ? message.trim() : null,
      note: isMedia ? note.trim() || null : null,
    });
  }

  const inputStyle = { background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text };

  return (
    <div className="rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <h2 className="font-bold text-lg mb-4" style={{ color: C.text }}>
        {isEdit ? "Frage bearbeiten" : "Neue Frage"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Kategorie
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={inputStyle}
          >
            <option value="">– wählen –</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Fragetyp
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={inputStyle}
          >
            {Object.entries(QUESTION_TYPES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isEstimate && (
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Antwortmodus
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswerMode("choice")}
              className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
              style={{
                background: answerMode === "choice" ? C.violet : C.panelSoft,
                color: answerMode === "choice" ? "#fff" : C.dim,
                border: `1px solid ${C.line}`,
              }}
            >
              Auswahl (A–D)
            </button>
            <button
              type="button"
              onClick={() => setAnswerMode("open")}
              className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
              style={{
                background: answerMode === "open" ? C.violet : C.panelSoft,
                color: answerMode === "open" ? "#fff" : C.dim,
                border: `1px solid ${C.line}`,
              }}
            >
              Offene Eingabe
            </button>
          </div>
        </div>
      )}

      {isPortrait && (
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Anzeigemodus
          </label>
          <div className="flex gap-2">
            {Object.entries(PORTRAIT_DISPLAY_MODES).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPortraitDisplayMode(key)}
                className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                style={{
                  background: portraitDisplayMode === key ? C.violet : C.panelSoft,
                  color: portraitDisplayMode === key ? "#fff" : C.dim,
                  border: `1px solid ${C.line}`,
                }}
              >
                {meta.icon} {key === "blur" ? "Mit Verpixelung" : meta.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs mb-2" style={{ color: C.dim }}>
          Frage
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 resize-none"
          style={inputStyle}
        />
      </div>

      {isChat && (
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Nachrichtentext (Chat-Bubble)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="„wer kommt heute pünktlich?…“"
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 resize-none"
            style={inputStyle}
          />
        </div>
      )}

      {isEstimate && (
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-xs mb-2" style={{ color: C.dim }}>
              Richtige Zahl
            </label>
            <input
              type="number"
              value={correctValue}
              onChange={(e) => setCorrectValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-2" style={{ color: C.dim }}>
              Einheit
            </label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="z.B. Seiten"
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {isOpenAnswer && (
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Richtige Antwort (frei eingetippt, Groß-/Kleinschreibung egal)
          </label>
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="z.B. Alrik der Graue"
            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>
      )}

      {needsOptions && (
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Antwortoptionen (Punkt markiert die richtige Antwort)
          </label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(opt)}
                  title="Als richtige Antwort markieren"
                  className="w-6 h-6 rounded-full shrink-0 focus:outline-none focus:ring-2"
                  style={{
                    background: correctAnswer && opt === correctAnswer ? C.mint : "transparent",
                    border: `2px solid ${correctAnswer && opt === correctAnswer ? C.mint : C.line}`,
                  }}
                />
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl px-4 py-2 focus:outline-none focus:ring-2"
                  style={inputStyle}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-sm px-2 py-1 rounded-lg focus:outline-none focus:ring-2"
                    style={{ color: C.pink }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.violet }}
          >
            + Option hinzufügen
          </button>
        </div>
      )}

      {isMedia && (
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-xs mb-2" style={{ color: C.dim }}>
              {type === "portrait" ? "Bild" : "Audio"} (optional)
            </label>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="URL einfügen …"
              className="w-full rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
            <div className="flex items-center gap-3">
              <label
                className="text-sm font-semibold px-3 py-2 rounded-lg cursor-pointer focus-within:ring-2"
                style={{ background: C.panelSoft, color: C.violet, border: `1px solid ${C.line}` }}
              >
                {uploading ? "Lädt hoch…" : "…oder Datei hochladen"}
                <input
                  type="file"
                  accept={type === "portrait" ? "image/*" : "audio/*"}
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: C.pink }}
                >
                  Entfernen
                </button>
              )}
            </div>
            {mediaUrl && type === "portrait" && (
              <img src={mediaUrl} alt="" className="mt-3 rounded-lg w-24 h-24 object-cover" />
            )}
            {mediaUrl && type === "sound" && <audio src={mediaUrl} controls className="mt-3 w-full" />}
          </div>
          <div>
            <label className="block text-xs mb-2" style={{ color: C.dim }}>
              Hinweistext (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm mb-4" style={{ color: C.pink }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="rounded-xl px-5 py-3 font-semibold focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim }}
        >
          Abbrechen
        </button>
        <button
          disabled={busy || uploading}
          onClick={handleSubmit}
          className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ background: C.gold, color: "#221D00" }}
        >
          {isEdit ? "Speichern" : "Anlegen"}
        </button>
      </div>
    </div>
  );
}
