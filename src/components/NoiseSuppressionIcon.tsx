interface NoiseSuppressionIconProps {
  size?: number;
}

// Three vertical bars, the middle one taller — no matching icon in Tabler's
// set, so this is a small hand-drawn one matching their stroke style
// (24x24 viewBox, round linecaps, currentColor).
export function NoiseSuppressionIcon({ size = 16 }: NoiseSuppressionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 9v6" />
      <path d="M12 5v14" />
      <path d="M17 9v6" />
    </svg>
  );
}
