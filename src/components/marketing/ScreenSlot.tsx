import { existsSync } from "node:fs";
import { join } from "node:path";

// Checked on the server at render time so a missing screenshot never ships a broken image.
export function ScreenSlot({ name, alt, label }: { name: string; alt: string; label?: string }) {
  const present = existsSync(join(process.cwd(), "public", "screens", `${name}.png`));
  if (present) {
    return (
      // biome-ignore lint/performance/noImgElement: static PNGs, no image optimiser needed
      <img
        src={`/screens/${name}.png`}
        alt={alt}
        loading="lazy"
        className="block w-full rounded-card border-2 border-brown bg-card"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (screenshot coming soon)`}
      className="flex aspect-[9/16] w-full items-center justify-center rounded-card border-2 border-dashed border-brown bg-dust"
    >
      <span className="label text-brown">{label ?? name}</span>
    </div>
  );
}
