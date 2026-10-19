import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { isDemo } from "@/lib/demo";
import { getPlayerOrNull } from "@/lib/session";
import { ALL_ALLOWED, MAX_BYTES } from "@/lib/upload";

export async function POST(request: Request) {
  if (isDemo())
    return Response.json({ error: "Uploads are switched off in the demo." }, { status: 403 });
  const body = (await request.json()) as HandleUploadBody;
  // The upload-completed callback is a server-to-server POST with no cookies; handleUpload
  // verifies its signature. Only the token request is gated on the player.
  const isCallback = body.type === "blob.upload-completed";
  const player = isCallback ? null : await getPlayerOrNull();
  if (!isCallback && !player) return new Response("Unauthorized", { status: 401 });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const result = await handleUpload({
    body,
    request,
    token,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ALL_ALLOWED,
      maximumSizeInBytes: MAX_BYTES,
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ player }),
    }),
    onUploadCompleted: async () => {
      // Nothing to do: the post row is written by createPost after the client has the URL.
    },
  });
  return Response.json(result);
}
