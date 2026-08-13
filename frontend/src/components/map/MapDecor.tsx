import { genreHex } from "@/components/ui/GenreTag";

/**
 * Memphis/Bauhaus shapes behind the graph, drawn from the product genre
 * palette so the backdrop belongs to the same colour system as the nodes.
 * Purely decorative — aria-hidden, and never intercepts pointer events
 * destined for the canvas.
 */
export default function MapDecor() {
  const sciFi = genreHex("Science Fiction");
  const dystopian = genreHex("Dystopian");
  const fantasy = genreHex("Fantasy");
  const literary = genreHex("Literary");
  const romance = genreHex("Romance");
  const classic = genreHex("Classic");
  const thriller = genreHex("Thriller");

  return (
    <svg
      aria-hidden
      // Held back so the shapes read as backdrop, not as data.
      className="pointer-events-none absolute inset-0 h-full w-full z-0 opacity-70"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke={sciFi} strokeWidth="7">
        <circle cx="650" cy="155" r="15" />
        <circle cx="650" cy="155" r="30" />
        <circle cx="650" cy="155" r="45" />
      </g>

      <g transform="translate(155,485)" stroke={dystopian} strokeWidth="13">
        <line x1="-44" y1="0" x2="44" y2="0" />
        <line x1="0" y1="-44" x2="0" y2="44" />
        <line x1="-31" y1="-31" x2="31" y2="31" />
        <line x1="-31" y1="31" x2="31" y2="-31" />
      </g>

      <path d="M1295 80 L1355 196 L1235 196 Z" fill={fantasy} />
      <path
        d="M520 825 q22 -30 44 0 q22 30 44 0 q22 -30 44 0"
        fill="none"
        stroke={literary}
        strokeWidth="9"
        strokeLinecap="round"
      />

      <g fill={romance}>
        <rect x="812" y="120" width="17" height="52" />
        <rect x="795" y="137" width="51" height="17" />
      </g>

      <g fill={classic}>
        <circle cx="1110" cy="690" r="9" />
        <circle cx="1142" cy="710" r="9" />
        <circle cx="1174" cy="690" r="9" />
      </g>

      <path d="M250 150 A58 58 0 0 1 366 150 Z" fill={thriller} />
    </svg>
  );
}
