const NOISE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>";

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 opacity-[0.15] mix-blend-multiply"
      style={{ backgroundImage: `url("${NOISE}")` }}
    />
  );
}
