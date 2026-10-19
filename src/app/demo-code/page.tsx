import Link from "next/link";
import { notFound } from "next/navigation";
import { isDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Exposes the gate code, so it must 404 unless this is a demo deployment.
export default async function DemoCodePage() {
  if (!isDemo()) notFound();
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="label">Demo code</p>
      <p className="font-display text-3xl tracking-wide text-brown break-all">
        {process.env.GROUP_CODE ?? ""}
      </p>
      <Link href="/gate" className="label underline underline-offset-4">
        Go to the gate
      </Link>
    </main>
  );
}
