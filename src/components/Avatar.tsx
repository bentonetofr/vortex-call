interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
  speaking?: boolean;
}

export function Avatar({ name, color, size = 32, online, speaking }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full text-white transition-shadow"
        style={{
          backgroundColor: color,
          fontSize: Math.max(11, size * 0.35),
          boxShadow: speaking ? "0 0 0 3px #ec4899" : "0 0 0 0 transparent",
        }}
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className="absolute right-0 bottom-0 rounded-full border-2 border-vc-sidebar"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            backgroundColor: online ? "var(--color-vc-online)" : "var(--color-vc-text-faint)",
          }}
        />
      )}
    </div>
  );
}
