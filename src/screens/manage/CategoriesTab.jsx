import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "../../lib/poolActions";
import { C } from "../../theme/colors";

export function CategoriesTab({ pool }) {
  const { categories, refresh } = pool;
  const [name, setName] = useState("");
  const [color, setColor] = useState("#A78BFA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createCategory(name.trim(), color);
      setName("");
      setColor("#A78BFA");
      await refresh();
    } catch (err) {
      setError(err.code === "23505" ? "Diese Kategorie gibt es schon." : "Konnte nicht angelegt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  }

  async function saveEdit(id) {
    if (!editName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await updateCategory(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.code === "23505" ? "Diese Kategorie gibt es schon." : "Konnte nicht gespeichert werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Kategorie wirklich löschen? Zugehörige Fragen bleiben erhalten, verlieren aber die Kategorie.")) return;
    setBusy(true);
    setError("");
    try {
      await deleteCategory(id);
      await refresh();
    } catch (err) {
      setError("Konnte nicht gelöscht werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-6 mb-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h2 className="font-bold text-lg mb-4" style={{ color: C.text }}>
          Neue Kategorie
        </h2>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Anime"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-[160px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
          />
          <button
            disabled={busy || !name.trim()}
            onClick={handleCreate}
            className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.gold, color: "#221D00" }}
          >
            Anlegen
          </button>
        </div>
        {error && (
          <p className="text-sm mt-3" style={{ color: C.pink }}>
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {categories.length === 0 && (
          <p className="text-center text-sm" style={{ color: C.dim }}>
            Noch keine Kategorien angelegt.
          </p>
        )}
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            {editingId === cat.id ? (
              <>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                  className="flex-1 min-w-[120px] rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
                />
                <button
                  disabled={busy}
                  onClick={() => saveEdit(cat.id)}
                  className="text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ background: C.mint + "33", color: C.mint }}
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ color: C.dim }}
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="flex-1 font-semibold" style={{ color: C.text }}>
                  {cat.name}
                </span>
                <button
                  onClick={() => startEdit(cat)}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ background: C.panelSoft, color: C.dim }}
                >
                  Umbenennen
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleDelete(cat.id)}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ background: C.pink + "22", color: C.pink }}
                >
                  Löschen
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
