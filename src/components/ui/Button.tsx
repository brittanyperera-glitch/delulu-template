import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind: "primary" | "ghost";
  /** paper is the retro default everywhere; dark is the Spotify-style Mixtape tab. */
  tone?: "paper" | "dark";
};

const LOOKS = {
  paper: {
    primary:
      "bg-brown text-cream border-[3px] border-brown shadow-hard-sm disabled:bg-muted disabled:border-muted disabled:shadow-none",
    ghost: "bg-transparent text-brown border-2 border-dashed border-brown",
  },
  // Neutral on purpose: green is reserved for the one meaningful act on this surface, promoting a
  // track onto the record. A green Send button next to it would dilute that.
  dark: {
    primary: "bg-mixtape-line text-mixtape-ink border-2 border-mixtape-line disabled:opacity-40",
    ghost: "bg-transparent text-mixtape-ink border-2 border-dashed border-mixtape-line",
  },
} as const;

export function Button({ kind, tone = "paper", className = "", ...rest }: Props) {
  return (
    <button
      className={`label h-12 rounded-full px-5 inline-flex items-center justify-center gap-2 ${LOOKS[tone][kind]} ${className}`}
      {...rest}
    />
  );
}
