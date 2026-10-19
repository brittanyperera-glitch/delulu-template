import { constantTimeEqual } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { isDemo } from "@/lib/demo";
import { seedDemo } from "@/lib/repo/demo-seed";

function authorised(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && !!header && constantTimeEqual(header, `Bearer ${secret}`);
}

// 404, not 401, so the route does not advertise itself.
async function reset(request: Request) {
  if (!isDemo() || !authorised(request.headers.get("authorization")))
    return new Response("Not found", { status: 404 });
  await seedDemo(db(), new Date(), { reset: true });
  return Response.json({ ok: true });
}

// Vercel Cron calls with GET; POST stays for manual runs.
export const GET = reset;
export const POST = reset;
