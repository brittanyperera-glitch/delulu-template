import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { FILTERS } from "@/lib/filters";

export function FilterRow({ current }: { current: string }) {
  const items = [
    { slug: "", label: STRINGS.filters.all },
    ...FILTERS.map((f) => ({ slug: f.slug, label: STRINGS.filters.titles[f.stamp] })),
    { slug: "skins", label: STRINGS.filters.bySkin },
  ];
  return (
    <div className="flex flex-row gap-2 overflow-x-auto pb-1">
      {items.map((it) => (
        <Link key={it.slug} href={it.slug ? `/wall/${it.slug}` : "/"} className="shrink-0">
          <Pill tone={current === it.slug ? "brown" : "cream"}>{it.label}</Pill>
        </Link>
      ))}
    </div>
  );
}
