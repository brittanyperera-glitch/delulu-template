import { type NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE, PLAYER_COOKIE, secret, verify } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { isDemo } from "@/lib/demo";
import { loadMembers } from "@/lib/members";
import { decideRoute } from "@/lib/routing";
import { memberFromToken } from "@/lib/session";

export async function proxy(req: NextRequest) {
  // Decided here, not in the page: under loading.tsx a page's notFound() streams a 200.
  if (req.nextUrl.pathname === "/demo-code" && !isDemo()) {
    return new NextResponse("Not found", { status: 404 });
  }
  const s = secret();
  // The same lookup getPlayerOrNull uses, so a cookie for a removed member is signed out here
  // too instead of bouncing between / and /gate. Only read the DB when there is a cookie to check,
  // so public traffic (/about, previews) never needs it. Proxy runs on the Node runtime.
  const token = req.cookies.get(PLAYER_COOKIE)?.value;
  const player = token ? await memberFromToken(token, s, await loadMembers(db())) : null;
  const gate = await verify(req.cookies.get(GATE_COOKIE)?.value, s);
  const route = decideRoute(req.nextUrl.pathname, player !== null, gate === "gate", isDemo());
  if (route === "allow") return NextResponse.next();
  if (route === "401") return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.redirect(new URL(route, req.url));
}

// Excluded: build assets, icons, and the public files the about page and link previews load.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|icon-192.png|icon-512.png|apple-touch-icon.png|og/|screens/|robots.txt|sitemap.xml).*)",
  ],
};
