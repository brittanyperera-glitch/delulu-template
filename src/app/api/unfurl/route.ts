import { isDemo } from "@/lib/demo";
import { getPlayerOrNull } from "@/lib/session";
import { unfurl } from "@/lib/unfurl";

export async function GET(request: Request) {
  if (!(await getPlayerOrNull())) return new Response("Unauthorized", { status: 401 });
  // Anyone can post in the demo, so the server must not fetch what they paste.
  if (isDemo())
    return Response.json({ error: "Link previews are switched off in the demo." }, { status: 403 });
  const url = new URL(request.url).searchParams.get("url") ?? "";
  return Response.json(await unfurl(url), {
    headers: { "cache-control": "private, max-age=3600" },
  });
}
