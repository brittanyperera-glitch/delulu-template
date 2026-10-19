"use client";
import { Pill } from "@/components/ui/Pill";
import type { Member, MemberId } from "@/lib/members";

/** One pill per member, wrapping so eight names never overflow a narrow sheet. */
export function MemberPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Member[];
  value: MemberId;
  onChange: (id: MemberId) => void;
  label: string;
}) {
  return (
    <div className="flex flex-row flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((m) => (
        <button
          key={m.slug}
          type="button"
          onClick={() => onChange(m.slug)}
          aria-pressed={value === m.slug}
        >
          <Pill tone={value === m.slug ? "brown" : "cream"}>{m.name}</Pill>
        </button>
      ))}
    </div>
  );
}
