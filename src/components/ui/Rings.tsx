type Props = { size: number; band?: number; className?: string };

/** Concentric 70s bands: orange, mustard, avocado, brown, cream. The one recurring motif. */
export function Rings({ size, band = 34, className = "" }: Props) {
  const stops = ["#d9622b", "#e0a526", "#7a8b3a", "#4a2c17", "#f3e5c8"];
  const gradient = stops.map((c, i) => `${c} ${i * band}px ${(i + 1) * band}px`).join(", ");
  return (
    <div
      aria-hidden
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `repeating-radial-gradient(circle at 50% 50%, ${gradient})`,
      }}
    />
  );
}
