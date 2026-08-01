import { CATEGORIES } from "../data/categories";
import { C } from "../theme/colors";

export function ProgressDots({ questions, current }) {
  return (
    <div className="flex items-center gap-2">
      {questions.map((q, i) => (
        <span
          key={q.id}
          className="rounded-full transition-all"
          style={{
            width: i === current ? 22 : 8,
            height: 8,
            background: i < current ? C.dim : i === current ? CATEGORIES[q.type].color : C.line,
          }}
        />
      ))}
    </div>
  );
}
