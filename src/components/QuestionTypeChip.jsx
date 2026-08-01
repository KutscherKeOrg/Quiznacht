import { QUESTION_TYPES } from "../data/questionTypes";

export function QuestionTypeChip({ type }) {
  const meta = QUESTION_TYPES[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
      style={{ background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}55` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
