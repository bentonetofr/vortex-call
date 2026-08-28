import { IconHeadphones, IconMicrophone } from "@tabler/icons-react";

interface DeafenIconProps {
  size?: number;
  active?: boolean;
  className?: string;
}

// Headphones with a smaller microphone nested inside — Tabler doesn't ship
// a single icon for "deafen", so this composites two of theirs. When
// active, a diagonal bar (matching Tabler's own Icon*Off convention: a
// stroke from upper-left to lower-right) is drawn on top, crossing out
// both shapes together.
export function DeafenIcon({ size = 16, active, className }: DeafenIconProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <IconHeadphones size={size} />
      <IconMicrophone
        size={size * 0.5}
        className="absolute"
        style={{ left: "50%", top: "46%", transform: "translate(-50%, -50%)" }}
      />
      {active && (
        <span
          className="absolute bg-current"
          style={{
            left: "-15%",
            top: "50%",
            width: "130%",
            height: Math.max(1.5, size * 0.1),
            borderRadius: 999,
            transform: "translateY(-50%) rotate(45deg)",
          }}
        />
      )}
    </span>
  );
}
