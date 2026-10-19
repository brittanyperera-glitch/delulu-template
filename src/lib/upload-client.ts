"use client";
import { upload } from "@vercel/blob/client";
import { shrinkImage } from "./shrink-client";
import type { MediaKind } from "./upload";

export async function uploadMedia(
  file: Blob,
  kind: MediaKind,
  name = "media",
): Promise<{ url: string; contentType: string }> {
  const payload = kind === "photo" && file instanceof File ? await shrinkImage(file) : file;
  const raw =
    payload.type ||
    (kind === "voice" ? "audio/webm" : kind === "video" ? "video/webm" : "image/jpeg");
  // A recorder hands back e.g. "audio/webm;codecs=opus"; the upload token's allow-list is exact
  // ("audio/webm"), so a codec suffix gets the PUT rejected. The bytes are still webm; drop it.
  const contentType = raw.split(";")[0].trim();
  const result = await upload(`${kind}/${Date.now()}-${name}`, payload, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType,
  });
  return { url: result.url, contentType };
}
