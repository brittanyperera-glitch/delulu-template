import type { ReactNode } from "react";

const LOOKS = {
  primary: "bg-brown text-cream border-[3px] border-brown shadow-hard-sm hover:text-cream",
  ghost: "bg-transparent text-brown border-2 border-dashed border-brown",
} as const;

// Anchor twin of ui/Button, which renders a <button> and cannot navigate.
export function LinkButton({
  href,
  kind,
  children,
}: {
  href: string;
  kind: keyof typeof LOOKS;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`label h-12 rounded-full px-6 inline-flex items-center justify-center no-underline ${LOOKS[kind]}`}
    >
      {children}
    </a>
  );
}
