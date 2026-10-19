"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SETUP } from "@/app/setup/copy";
import { parseSetup, slugsFor } from "@/app/setup/parse";
import { GATE_COOKIE, secret, verify } from "@/lib/auth";
import { db, isNeonUrl } from "@/lib/db/client";
import { SetupRefused, setUpGroup } from "@/lib/repo/seasons";
import { getPlayerOrNull } from "@/lib/session";

export type SetupState = { error?: string };

export async function setupAction(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const gated = (await verify((await cookies()).get(GATE_COOKIE)?.value, secret())) === "gate";
  if (!gated && (await getPlayerOrNull()) === null) redirect("/gate");

  // Today is read here, not carried in the form, so a screen left open overnight is judged
  // against the real date.
  const parsed = parseSetup(formData, new Date());
  if (!parsed.ok) return { error: parsed.error };
  const { members, dayOne, timezone } = parsed.value;
  const slugs = slugsFor(members.map((m) => m.name));

  let refused = false;
  try {
    // Neon's HTTP driver has no transactions; setUpGroup compensates instead.
    await setUpGroup(
      db(),
      { members: members.map((m, i) => ({ ...m, slug: slugs[i] })), dayOne, timezone },
      !isNeonUrl(process.env.DATABASE_URL ?? ""),
    );
  } catch (e) {
    if (!(e instanceof SetupRefused)) return { error: SETUP.failed };
    refused = true;
  }
  if (refused) redirect("/");
  revalidatePath("/");
  // The gate cookie is still valid, so the new group goes straight to picking who they are.
  redirect("/name");
}
