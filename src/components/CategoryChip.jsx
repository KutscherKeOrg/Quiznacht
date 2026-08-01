import { CATEGORIES } from "../data/categories";

export function CategoryChip({ type }) {
  const cat = CATEGORIES[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
      style={{ background: cat.color + "22", color: cat.color, border: `1px solid ${cat.color}55` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
      {cat.label}
    </span>
  );
}
