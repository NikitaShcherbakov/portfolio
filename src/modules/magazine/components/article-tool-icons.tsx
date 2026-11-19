type StickerIconProps = {
  label: string;
};

export function LensIcon({ label }: StickerIconProps) {
  return (
    <svg className="j-ico" viewBox="0 0 80 80" aria-hidden="true">
      <path
        d="M54 54 L74 74"
        stroke="#5a3418"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle
        cx="34"
        cy="34"
        r="26"
        fill="#bfe6ff"
        stroke="#222"
        strokeWidth="5"
      />
      <path
        d="M20 26 Q24 16 34 15"
        stroke="#fff"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="34"
        y="38.5"
        textAnchor="middle"
        fontFamily="Oswald,Arial Narrow,sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#2a0d12"
      >
        {label}
      </text>
    </svg>
  );
}

export function BallIcon({ label }: StickerIconProps) {
  return (
    <svg className="j-ico" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="#111" />
      <path
        d="M18 26 A26 26 0 0 1 40 12"
        stroke="rgba(255,255,255,.35)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="40" cy="42" r="17" fill="#1d2f6b" />
      <polygon points="40,29 53,51 27,51" fill="#2d6bff" />
      <text
        x="40"
        y="47"
        textAnchor="middle"
        fontFamily="Oswald,Arial Narrow,sans-serif"
        fontWeight="700"
        fontSize="7.5"
        fill="#fff"
      >
        {label}
      </text>
    </svg>
  );
}
