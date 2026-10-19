import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { activeSeason } from "@/lib/repo/seasons";

/**
 * Same shape as getPlayer(): one read per request, and the only place that decides where a
 * visitor goes when the season has not been started. redirect() is typed never, so the
 * caller gets a season or never gets a value.
 */
export const requireSeason = cache(async () => {
  const season = await activeSeason(db());
  if (!season) redirect("/setup");
  return season;
});
