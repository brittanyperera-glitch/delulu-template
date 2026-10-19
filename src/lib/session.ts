import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { PLAYER_COOKIE, secret, verify } from "./auth";
import { isMember, loadMembers, type MemberId, type MembersMap } from "./members";

/** One members read per request, shared by the layout, the pages and the cookie check. */
export const getMembers = cache((): Promise<MembersMap> => loadMembers(db()));

/**
 * A validly signed cookie still has to name a current member: the slug may have been
 * removed since it was signed. Takes the map so it can be tested without a request.
 */
export async function memberFromToken(
  token: string | undefined,
  key: string,
  members: MembersMap,
): Promise<MemberId | null> {
  const v = await verify(token, key);
  return isMember(members, v) ? v : null;
}

export async function getPlayerOrNull(): Promise<MemberId | null> {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  return memberFromToken(token, secret(), await getMembers());
}

export async function getPlayer(): Promise<MemberId> {
  const p = await getPlayerOrNull();
  if (!p) redirect("/gate");
  return p;
}
