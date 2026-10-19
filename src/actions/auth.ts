"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  constantTimeEqual,
  GATE_COOKIE,
  groupPasscode,
  hmac,
  PLAYER_COOKIE,
  secret,
  sign,
  verify,
} from "@/lib/auth";
import { db } from "@/lib/db/client";
import { isMember } from "@/lib/members";
import { isSetUp } from "@/lib/repo/seasons";
import { getMembers } from "@/lib/session";

// Filling the setup form with up to 8 members takes longer than the gate-to-name hop did.
const GATE_MAX_AGE = 60 * 60;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function enterCode(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const expected = groupPasscode();
  const s = secret();
  // Compare digests so both sides always have the same length.
  const ok = constantTimeEqual(await hmac(s, code), await hmac(s, expected));
  if (!ok) redirect(`/gate?x=${Date.now()}`);
  (await cookies()).set(GATE_COOKIE, await sign("gate", s), {
    ...cookieBase,
    maxAge: GATE_MAX_AGE,
  });
  // Nobody can pick a name until first-run setup has created the members.
  redirect((await isSetUp(db())) ? "/name" : "/setup");
}

export async function pickName(formData: FormData) {
  const who = formData.get("who");
  if (!isMember(await getMembers(), who)) redirect("/name");
  const jar = await cookies();
  const gate = await verify(jar.get(GATE_COOKIE)?.value, secret());
  if (gate !== "gate") redirect("/gate");
  jar.set(PLAYER_COOKIE, await sign(who, secret()), { ...cookieBase, maxAge: 60 * 60 * 24 * 400 });
  jar.delete(GATE_COOKIE);
  redirect("/");
}

export async function switchPlayer() {
  const jar = await cookies();
  // Keep the gate cookie so switching does not mean retyping the code.
  jar.set(GATE_COOKIE, await sign("gate", secret()), { ...cookieBase, maxAge: GATE_MAX_AGE });
  jar.delete(PLAYER_COOKIE);
  redirect("/name");
}
