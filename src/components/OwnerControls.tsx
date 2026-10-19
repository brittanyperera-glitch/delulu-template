"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePostAction, editPostAction, hidePostAction } from "@/actions/posts";
import { Recorder } from "@/components/Recorder";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Post } from "@/lib/db/schema";
import { MAX_SECONDS, type MediaKind, validateMedia } from "@/lib/upload";
import { uploadMedia } from "@/lib/upload-client";

type Picked = { blob: Blob; kind: MediaKind; seconds?: number; name: string };

export function OwnerControls({ post }: { post: Post }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "edit" | "confirm">("idle");
  const [body, setBody] = useState(post.body ?? "");
  const [media, setMedia] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Same validation the composer runs: a video's length is read off its metadata, everything
  // else is checked on its content type alone.
  function onFile(kind: MediaKind, file: File | undefined) {
    if (!file) return;
    setError(null);
    if (kind === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const err = validateMedia("video", file.type, v.duration);
        if (err) setError(err);
        else
          setMedia({ blob: file, kind: "video", seconds: Math.round(v.duration), name: file.name });
        URL.revokeObjectURL(v.src);
      };
      v.src = URL.createObjectURL(file);
      return;
    }
    const err = validateMedia(kind, file.type);
    if (err) setError(err);
    else setMedia({ blob: file, kind, name: file.name });
  }

  function reset() {
    setMedia(null);
    setError(null);
    setBody(post.body ?? "");
    setMode("idle");
  }

  // A post must still say something after the edit: text, media just attached, or media it
  // already carried (any non-text post).
  const canSave = body.trim().length > 0 || media !== null || post.type !== "text";

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-3">
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        <div className="flex flex-col gap-2">
          <span className="label text-muted">
            {post.type === "text" ? STRINGS.post.addMedia : STRINGS.post.replace}
          </span>
          {media ? (
            <div className="flex flex-row items-center gap-2">
              <Pill tone="avocado">{STRINGS.composer.kinds[media.kind]}</Pill>
              <span className="label min-w-0 truncate text-muted">{media.name}</span>
              <button type="button" className="label text-rust" onClick={() => setMedia(null)}>
                {STRINGS.post.cancel}
              </button>
            </div>
          ) : (
            <div className="flex flex-row flex-wrap items-center gap-2">
              <label className="label inline-flex cursor-pointer items-center rounded-full border-2 border-dashed border-brown px-3 py-1 text-brown">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile("photo", e.target.files?.[0])}
                />
                {STRINGS.composer.kinds.photo}
              </label>
              <label className="label inline-flex cursor-pointer items-center rounded-full border-2 border-dashed border-brown px-3 py-1 text-brown">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => onFile("video", e.target.files?.[0])}
                />
                {STRINGS.composer.kinds.video}
              </label>
              <Recorder
                kind="voice"
                maxSeconds={MAX_SECONDS.voice}
                onDone={(blob, seconds) =>
                  setMedia({ blob, kind: "voice", seconds, name: "voice.webm" })
                }
              />
            </div>
          )}
        </div>
        {error ? <p className="font-body text-sm text-rust">{error}</p> : null}
        <div className="flex flex-row gap-2">
          <Button
            kind="primary"
            disabled={pending || !canSave}
            onClick={() =>
              start(async () => {
                setError(null);
                try {
                  let uploaded: { url: string; type: MediaKind; seconds?: number } | undefined;
                  if (media) {
                    const { url } = await uploadMedia(media.blob, media.kind, media.name);
                    uploaded = { url, type: media.kind, seconds: media.seconds };
                  }
                  await editPostAction(post.id, { body, media: uploaded });
                  setMedia(null);
                  setMode("idle");
                  router.refresh();
                } catch {
                  setError(STRINGS.composer.failed);
                }
              })
            }
          >
            {STRINGS.post.save}
          </Button>
          <Button kind="ghost" onClick={reset}>
            {STRINGS.post.cancel}
          </Button>
        </div>
      </div>
    );
  }
  if (mode === "confirm") {
    return (
      <div className="flex flex-row items-center gap-3">
        <span className="font-body font-bold text-brown">{STRINGS.post.deleteAsk}</span>
        <Button
          kind="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await deletePostAction(post.id);
              router.push("/");
            })
          }
        >
          {STRINGS.post.yes}
        </Button>
        <Button kind="ghost" onClick={() => setMode("idle")}>
          {STRINGS.post.no}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-row gap-4">
      <button type="button" className="label text-muted" onClick={() => setMode("edit")}>
        {STRINGS.post.edit}
      </button>
      <button
        type="button"
        className="label text-muted disabled:opacity-40"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await hidePostAction(post.id, post.hiddenAt === null);
            router.refresh();
          })
        }
      >
        {post.hiddenAt === null ? STRINGS.post.hide : STRINGS.post.unhide}
      </button>
      <button type="button" className="label text-muted" onClick={() => setMode("confirm")}>
        {STRINGS.post.delete}
      </button>
    </div>
  );
}
