import { useState } from "react";
import { usePool } from "../hooks/usePool";
import { CategoriesTab } from "./manage/CategoriesTab";
import { QuestionsTab } from "./manage/QuestionsTab";
import { QuizzesTab } from "./manage/QuizzesTab";
import { C } from "../theme/colors";

const TABS = [
  ["questions", "Fragenpool"],
  ["categories", "Kategorien"],
  ["quizzes", "Quizze"],
];

export function ManageScreen() {
  const [tab, setTab] = useState("questions");
  const pool = usePool();

  return (
    <div className="py-6">
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
            style={{
              background: tab === key ? C.violet : C.panelSoft,
              color: tab === key ? "#fff" : C.dim,
              border: `1px solid ${C.line}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {pool.loading ? (
        <p className="text-center py-20" style={{ color: C.dim }}>
          Lade…
        </p>
      ) : (
        <>
          {tab === "categories" && <CategoriesTab pool={pool} />}
          {tab === "questions" && <QuestionsTab pool={pool} />}
          {tab === "quizzes" && <QuizzesTab pool={pool} />}
        </>
      )}
    </div>
  );
}
