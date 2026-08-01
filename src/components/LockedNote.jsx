export function LockedNote({ value }) {
  return (
    <div
      className="rounded-xl px-5 py-3 font-bold"
      style={{ background: "#FFC53D22", border: "1px solid #FFC53D66", color: "#FFC53D" }}
    >
      Eingeloggt: {value}
    </div>
  );
}
