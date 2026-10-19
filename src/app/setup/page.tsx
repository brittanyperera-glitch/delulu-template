import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { PAPERS } from "@/lib/db/schema";
import { isSetUp } from "@/lib/repo/seasons";
import { SETUP } from "./copy";
import { DEFAULT_COLOURS } from "./parse";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

/** Intl omits "UTC", which is the right answer for a lot of people. */
function zones(): string[] {
  const all = Intl.supportedValuesOf("timeZone");
  return all.includes("UTC") ? all : ["UTC", ...all];
}

export default async function SetupPage() {
  // The proxy has already required the gate. Once the group is set up this page is closed.
  if (await isSetUp(db())) redirect("/");
  // Defaults first so a fresh form hands out distinct colours, then the rest of the papers.
  const papers = [...DEFAULT_COLOURS, ...PAPERS.filter((p) => !DEFAULT_COLOURS.includes(p))];
  return (
    <main className="flex min-h-dvh flex-col items-center gap-8 px-6 py-12">
      <h1 className="font-display text-3xl tracking-wide text-brown">{SETUP.title}</h1>
      <SetupForm papers={papers} zones={zones()} />
    </main>
  );
}
