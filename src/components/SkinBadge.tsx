import type { Skin } from "@/lib/db/schema";

const FILLS = [
  "bg-mustard text-brown",
  "bg-avocado text-cream",
  "bg-orange text-cream",
  "bg-cream text-brown",
];

export function skinFill(skin: Pick<Skin, "id">): string {
  return FILLS[skin.id % FILLS.length];
}

export function SkinBadge({
  skin,
  lit,
  size = 58,
  onClick,
}: {
  skin: Skin;
  lit: boolean;
  size?: number;
  onClick?: () => void;
}) {
  const initial = skin.name.trim().charAt(0).toUpperCase();
  const Tag: React.ElementType = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={skin.name}
      aria-pressed={onClick ? lit : undefined}
      className={`font-display rounded-full border-[3px] border-brown shadow-hard-sm inline-flex items-center justify-center shrink-0 ${
        lit
          ? `${skinFill(skin)} ring-[3px] ring-orange ring-offset-2 ring-offset-cream`
          : "bg-cream text-brown opacity-70"
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initial}
    </Tag>
  );
}
