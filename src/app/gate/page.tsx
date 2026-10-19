import { SITE } from "@/config/site";
import { GateForm } from "./GateForm";

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ x?: string }>;
}) {
  const { x } = await searchParams;
  // x changes on every wrong attempt so the shake effect re-runs, not only the first time.
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-10 px-6">
      <h1 className="font-display text-3xl tracking-wide text-brown">{SITE.name}</h1>
      <GateForm attempt={x ?? ""} />
    </main>
  );
}
