import type { ReactNode } from "react";

/**
 * Deliberately a superset of `Paper` in the schema, so a skin's stored paper can be handed
 * straight to a Card with no mapping table between them. `card` is the default for a scrap
 * whose skin has chosen no paper.
 *
 * The dark tones carry their own text colour: a paper you can pick is a paper someone will
 * pick, and brown ink on rust is unreadable.
 */
export type CardTone =
  | "card"
  | "cream"
  | "mustard"
  | "avocado"
  | "orange"
  | "rust"
  | "butter"
  | "rose"
  | "sky"
  | "peach"
  | "lilac"
  | "terracotta"
  | "teal"
  | "denim"
  | "plum"
  | "olive"
  | "forest"
  | "cocoa"
  | "wine";

// Light papers keep the brown ink; dark ones flip to cream so the text stays readable.
const TONES: Record<CardTone, string> = {
  card: "bg-card",
  cream: "bg-cream",
  mustard: "bg-mustard",
  avocado: "bg-avocado text-cream",
  orange: "bg-orange text-cream",
  rust: "bg-rust text-cream",
  butter: "bg-butter",
  rose: "bg-rose",
  sky: "bg-sky",
  peach: "bg-peach",
  lilac: "bg-lilac",
  terracotta: "bg-terracotta text-cream",
  teal: "bg-teal text-cream",
  denim: "bg-denim text-cream",
  plum: "bg-plum text-cream",
  olive: "bg-olive text-cream",
  forest: "bg-forest text-cream",
  cocoa: "bg-cocoa text-cream",
  wine: "bg-wine text-cream",
};

export function Card({
  tone = "card",
  tilt = 0,
  children,
  className = "",
}: {
  tone?: CardTone;
  tilt?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border-[3px] border-brown shadow-hard overflow-hidden break-words ${TONES[tone]} ${className}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      {children}
    </div>
  );
}
