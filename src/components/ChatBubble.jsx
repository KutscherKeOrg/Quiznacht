import { C } from "../theme/colors";

export function ChatBubble({ text }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 420 }}>
      <div
        className="rounded-2xl rounded-bl-sm px-5 py-4 text-left"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
      >
        <div className="text-xs mb-1 font-semibold" style={{ color: C.mint }}>
          ???
        </div>
        <div style={{ color: C.text, fontSize: 16, lineHeight: 1.5 }}>{text}</div>
        <div className="text-right text-xs mt-2" style={{ color: C.dim }}>
          19:47
        </div>
      </div>
    </div>
  );
}
