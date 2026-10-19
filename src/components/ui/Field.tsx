import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const base = "w-full rounded-xl border-2 px-4 font-body text-base outline-none";

/** paper is the retro default everywhere; dark is the Spotify-style Mixtape tab. */
const TONES = {
  paper: "border-brown bg-card text-brown placeholder:text-muted focus:border-orange",
  dark: "border-mixtape-line bg-mixtape-card text-mixtape-ink placeholder:text-mixtape-muted focus:border-spotify",
} as const;
export type FieldTone = keyof typeof TONES;

export const Field = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { tone?: FieldTone }
>(function Field({ className = "", tone = "paper", ...rest }, ref) {
  return <input ref={ref} className={`${base} ${TONES[tone]} h-12 ${className}`} {...rest} />;
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: FieldTone }
>(function TextArea({ className = "", tone = "paper", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${base} ${TONES[tone]} min-h-32 py-3 leading-relaxed ${className}`}
      {...rest}
    />
  );
});
