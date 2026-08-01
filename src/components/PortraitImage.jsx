export function PortraitImage({ blur }) {
  return (
    <div className="rounded-2xl overflow-hidden mx-auto" style={{ width: 220, height: 260, background: "#1A1735" }}>
      <svg viewBox="0 0 220 260" style={{ filter: `blur(${blur}px)`, transition: "filter .6s" }}>
        <rect width="220" height="260" fill="#241F4A" />
        <circle cx="110" cy="70" r="120" fill="#2E2860" />
        {/* Kapuze */}
        <path d="M40 250 Q30 110 110 95 Q190 110 180 250 Z" fill="#4C3A8C" />
        <path d="M60 250 Q55 130 110 118 Q165 130 160 250 Z" fill="#372A6B" />
        {/* Gesicht */}
        <ellipse cx="110" cy="150" rx="34" ry="40" fill="#E8C39E" />
        {/* Bart */}
        <path d="M78 160 Q110 235 142 160 Q142 195 110 210 Q78 195 78 160 Z" fill="#D8D4E8" />
        {/* Augen */}
        <circle cx="97" cy="145" r="4" fill="#2B2450" />
        <circle cx="123" cy="145" r="4" fill="#2B2450" />
        {/* Augenbrauen */}
        <path d="M88 136 Q97 130 106 136" stroke="#B9B4D6" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M114 136 Q123 130 132 136" stroke="#B9B4D6" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Stab */}
        <rect x="178" y="60" width="8" height="190" rx="4" fill="#7A5A34" />
        <circle cx="182" cy="52" r="14" fill="#FFC53D" opacity="0.9" />
      </svg>
    </div>
  );
}
