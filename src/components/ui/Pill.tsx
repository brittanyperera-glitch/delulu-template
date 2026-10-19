import type { ReactNode } from "react";

export type PillTone =
  | "cream"
  | "mustard"
  | "avocado"
  | "orange"
  | "brown"
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

const TONES: Record<PillTone, string> = {
  cream: "bg-cream text-brown",
  mustard: "bg-mustard text-brown",
  avocado: "bg-avocado text-cream",
  orange: "bg-orange text-cream",
  brown: "bg-brown text-cream",
  rust: "bg-rust text-cream",
  butter: "bg-butter text-brown",
  rose: "bg-rose text-brown",
  sky: "bg-sky text-brown",
  peach: "bg-peach text-brown",
  lilac: "bg-lilac text-brown",
  terracotta: "bg-terracotta text-cream",
  teal: "bg-teal text-cream",
  denim: "bg-denim text-cream",
  plum: "bg-plum text-cream",
  olive: "bg-olive text-cream",
  forest: "bg-forest text-cream",
  cocoa: "bg-cocoa text-cream",
  wine: "bg-wine text-cream",
};

export function Pill({
  tone,
  children,
  className = "",
  asIs = false,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
  /** Keep the casing as written. The reactions are lower case on purpose. */
  asIs?: boolean;
}) {
  return (
    <span
      className={`${asIs ? "label-asis" : "label uppercase"} inline-flex items-center rounded-full border-2 border-brown px-2.5 py-1 shadow-hard-sm whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
