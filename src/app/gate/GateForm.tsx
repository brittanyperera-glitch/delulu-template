"use client";
import { useEffect, useRef } from "react";
import { enterCode } from "@/actions/auth";
import { Field } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";

export function GateForm({ attempt }: { attempt: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (attempt && ref.current) {
      ref.current.value = "";
      ref.current.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 240 },
      );
    }
  }, [attempt]);
  return (
    <form action={enterCode} className="w-full max-w-xs">
      <Field
        ref={ref}
        name="code"
        type="password"
        placeholder={STRINGS.gate.placeholder}
        autoFocus
        autoComplete="off"
        aria-label={STRINGS.gate.placeholder}
      />
      {/* A form with no submit button has no default button, so a phone keyboard's
          Go key and the Enter key do nothing. Present but unseen. */}
      <button type="submit" className="sr-only">
        {STRINGS.gate.enter}
      </button>
    </form>
  );
}
