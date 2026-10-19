import { STRINGS } from "@/lib/content/strings";
import type { JarSize } from "@/lib/db/schema";
import { JAR_SIZES } from "@/lib/repo/jar";

/**
 * A jar with the slips settled in the bottom of it. Drawn as a solid object rather than an
 * outline: an empty outlined rectangle reads as a loading placeholder, not as a jar.
 */
export function JarGlass({ counts }: { counts: Record<JarSize, number> }) {
  const total = JAR_SIZES.reduce((n, s) => n + counts[s], 0);
  const shown = Math.min(total, 14);
  // Settle the slips into the bottom third, filling upward, so the jar looks packed rather
  // than sprinkled. Deterministic from the index so they never jump between renders.
  const perRow = 4;
  const slips = Array.from({ length: shown }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // Centre a partial row, or the last slip floats alone against one wall.
    const inRow = Math.min(perRow, shown - row * perRow);
    const indent = ((perRow - inRow) * 27) / 2;
    return {
      x: 30 + indent + col * 27 + ((i * 13) % 5),
      y: 150 - row * 26,
      rot: ((i * 37) % 40) - 20,
    };
  });

  return (
    <svg
      width="168"
      height="196"
      viewBox="0 0 168 196"
      role="img"
      aria-label={STRINGS.jar.count(total)}
      className="self-center"
    >
      <title>{STRINGS.jar.count(total)}</title>
      <rect
        x="54"
        y="4"
        width="60"
        height="18"
        rx="7"
        fill="#e0a526"
        stroke="#402310"
        strokeWidth="3"
      />
      <path
        d="M34 26h100c5 0 9 4 9 9v142c0 6-4 10-10 10H35c-6 0-10-4-10-10V35c0-5 4-9 9-9z"
        fill="#ebddc5"
        stroke="#402310"
        strokeWidth="3"
      />
      {/* A highlight down the left, so it reads as glass rather than a box. */}
      <path d="M40 44v120" stroke="#f9f4ed" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      {slips.map((s) => (
        <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
          <rect width="26" height="20" rx="2" fill="#f9f4ed" stroke="#402310" strokeWidth="2" />
          <path d="M0 10h26" stroke="#402310" strokeWidth="1.5" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}
