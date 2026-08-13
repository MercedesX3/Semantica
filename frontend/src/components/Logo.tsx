export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <polygon
        points="16,2 20.2,11.8 30,16 20.2,20.2 16,30 11.8,20.2 2,16 11.8,11.8"
        fill="var(--brand)"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 32,
  withWordmark = false,
  className = "",
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  if (!withWordmark) return <LogoMark size={size} className={className} />;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-sans font-bold tracking-tight" style={{ fontSize: size * 0.66 }}>
        Semantica
      </span>
    </span>
  );
}
