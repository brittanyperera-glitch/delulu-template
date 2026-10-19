import { redirect } from "next/navigation";
import { pickName } from "@/actions/auth";
import { Swatch } from "@/app/setup/Swatch";
import { db } from "@/lib/db/client";
import { memberList } from "@/lib/members";
import { isSetUp } from "@/lib/repo/seasons";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NamePage() {
  if (!(await isSetUp(db()))) redirect("/setup");
  const members = memberList(await getMembers());
  return (
    <main className="min-h-dvh flex flex-col justify-center">
      <form action={pickName} className="flex flex-col">
        {members.map((m) => (
          <button
            key={m.slug}
            type="submit"
            name="who"
            value={m.slug}
            className="flex items-center gap-4 font-display text-4xl text-brown py-8 border-t-[3px] border-brown last:border-b-[3px] text-left px-8 active:bg-mustard"
          >
            <Swatch colour={m.colour} className="size-8" />
            <span className="min-w-0 break-words">{m.name}</span>
          </button>
        ))}
      </form>
    </main>
  );
}
