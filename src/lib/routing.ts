export type Route = "allow" | "/gate" | "/name" | "/" | "/about" | "401";

const PUBLIC = ["/about", "/demo-code"];

/** Pure routing decision so middleware stays a two-line wrapper. */
export function decideRoute(
  pathname: string,
  hasPlayer: boolean,
  hasGate: boolean,
  publicLanding = false,
): Route {
  // Vercel Blob posts its upload-completed callback here with no cookies; the route verifies it.
  if (pathname === "/api/upload") return "allow";
  // The daily cron call carries no cookies; the route checks its own bearer secret and demo flag.
  if (pathname === "/api/demo-reset") return "allow";
  if (pathname.startsWith("/api/")) return hasPlayer ? "allow" : "401";
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "allow";
  if (pathname === "/gate") return hasPlayer ? "/" : "allow";
  if (pathname === "/name") return hasPlayer ? "/" : hasGate ? "allow" : "/gate";
  // A member who opens it is sent home by the page once a season exists.
  if (pathname === "/setup") return hasPlayer || hasGate ? "allow" : "/gate";
  if (hasPlayer) return "allow";
  // Past the gate but no name yet (e.g. lost a first-run setup race): finish signing in.
  if (hasGate) return "/name";
  // Only the public showcase lands strangers on the marketing page; a private deployment shows the gate.
  return publicLanding ? "/about" : "/gate";
}
