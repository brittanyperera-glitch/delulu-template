import { STRINGS } from "@/lib/content/strings";

export type MediaKind = "photo" | "voice" | "video";

export const ALLOWED_TYPES: Record<MediaKind, readonly string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"],
  voice: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/aac"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

export const MAX_BYTES = 250 * 1024 * 1024;
export const MAX_SECONDS = { voice: 180, video: 60 } as const;

export function kindFor(contentType: string): MediaKind | null {
  for (const kind of Object.keys(ALLOWED_TYPES) as MediaKind[]) {
    if (ALLOWED_TYPES[kind].includes(contentType)) return kind;
  }
  return null;
}

export function validateMedia(
  kind: MediaKind,
  contentType: string,
  seconds?: number,
): string | null {
  if (!ALLOWED_TYPES[kind].includes(contentType)) return STRINGS.composer.wrongType[kind];
  if (kind === "voice" && seconds !== undefined && seconds > MAX_SECONDS.voice)
    return STRINGS.composer.tooLong.voice;
  if (kind === "video" && seconds !== undefined && seconds > MAX_SECONDS.video)
    return STRINGS.composer.tooLong.video;
  return null;
}

export const ALL_ALLOWED = [...ALLOWED_TYPES.photo, ...ALLOWED_TYPES.voice, ...ALLOWED_TYPES.video];
