import { useState } from "react";
import { parseBulkInput, validateRow, CSV_TEMPLATE } from "../../lib/bulkImport";
import { bulkCreateQuestions } from "../../lib/poolActions";
import { QUESTION_TYPES } from "../../data/questionTypes";
import { C } from "../../theme/colors";

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiznacht-fragen-vorlage.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkImportForm({ categories, onDone, onCancel }) {
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState(null); // null = noch nicht als Vorschau geparst
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = { background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text };

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ""));
    reader.onerror = () => setError("Datei konnte nicht gelesen werden.");
    reader.readAsText(file);
  }

  function handlePreview() {
    setError("");
    try {
      const parsed = parseBulkInput(rawText);
      if (parsed.length === 0) {
        setError("Keine Zeilen erkannt – Format prüfen (CSV mit Kopfzeile oder JSON-Array).");
        return;
      }
      setRows(parsed.map((raw) => validateRow(raw, categories)));
    } catch (err) {
      setError("Konnte die Eingabe nicht lesen: " + err.message);
    }
  }

  const validRows = rows ? rows.filter((r) => r.errors.length === 0) : [];

  async function handleImport() {
    setBusy(true);
    setError("");
    try {
      await bulkCreateQuestions(validRows.map((r) => r.question));
      onDone();
    } catch (err) {
      setError("Import fehlgeschlagen: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!rows) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h2 className="font-bold text-lg mb-2" style={{ color: C.text }}>
          Fragen im Bulk importieren
        </h2>
        <p className="text-sm mb-4" style={{ color: C.dim }}>
          CSV- oder JSON-Datei hochladen, oder den Inhalt direkt unten einfügen. Mehrere Antwortoptionen
          in einer CSV-Zelle mit <code>|</code> trennen, z.B. <code>1984|1986|1989|1991</code>.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label
            className="text-sm font-semibold px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: C.panelSoft, color: C.violet, border: `1px solid ${C.line}` }}
          >
            Datei auswählen (.csv/.json)
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          <button
            onClick={downloadTemplate}
            className="text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
          >
            Beispiel-CSV herunterladen
          </button>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          placeholder="…oder CSV/JSON hier einfügen"
          className="w-full rounded-xl px-4 py-3 mb-4 font-mono text-xs focus:outline-none focus:ring-2 resize-y"
          style={inputStyle}
        />

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
            disabled={!rawText.trim()}
            onClick={handlePreview}
            className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.gold, color: "#221D00" }}
          >
            Vorschau anzeigen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <h2 className="font-bold text-lg mb-2" style={{ color: C.text }}>
        Vorschau
      </h2>
      <p className="text-sm mb-4" style={{ color: C.dim }}>
        <b style={{ color: validRows.length === rows.length ? C.mint : C.text }}>
          {validRows.length} von {rows.length}
        </b>{" "}
        Fragen sind gültig und werden importiert. Fehlerhafte Zeilen bitte in der Quelle korrigieren und
        erneut hochladen.
      </p>

      <div className="overflow-x-auto mb-4 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: C.dim, background: C.panelSoft }}>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Typ</th>
              <th className="text-left px-3 py-2">Kategorie</th>
              <th className="text-left px-3 py-2">Frage</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                <td className="px-3 py-2" style={{ color: C.dim }}>
                  {i + 1}
                </td>
                <td className="px-3 py-2" style={{ color: C.text }}>
                  {QUESTION_TYPES[r.question?.type]?.label ?? r.raw.typ ?? "—"}
                </td>
                <td className="px-3 py-2" style={{ color: C.text }}>
                  {r.raw.kategorie || "—"}
                </td>
                <td className="px-3 py-2" style={{ color: C.text, maxWidth: 320 }}>
                  {String(r.raw.frage ?? "").slice(0, 70) || "—"}
                </td>
                <td className="px-3 py-2">
                  {r.errors.length === 0 ? (
                    <span style={{ color: C.mint }}>✓ OK</span>
                  ) : (
                    <span style={{ color: C.pink }}>✗ {r.errors.join("; ")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: C.pink }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setRows(null)}
          className="rounded-xl px-5 py-3 font-semibold focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim }}
        >
          Zurück
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl px-5 py-3 font-semibold focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim }}
        >
          Abbrechen
        </button>
        <button
          disabled={busy || validRows.length === 0}
          onClick={handleImport}
          className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ background: C.gold, color: "#221D00" }}
        >
          {validRows.length} {validRows.length === 1 ? "Frage" : "Fragen"} importieren
        </button>
      </div>
    </div>
  );
}
