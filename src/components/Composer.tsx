"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { type ComposerInput, createPostAction } from "@/actions/posts";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { promptFor } from "@/lib/content/composer-prompts";
import { STRINGS } from "@/lib/content/strings";
import type { LinkMeta, Skin } from "@/lib/db/schema";
import { PAPERS, type Paper } from "@/lib/db/schema";
import { type MemberId, type MembersMap, othersOf } from "@/lib/members";
import { MAX_SECONDS, type MediaKind, validateMedia } from "@/lib/upload";
import { uploadMedia } from "@/lib/upload-client";
import { NewSkinSheet } from "./NewSkinSheet";
import { Recorder } from "./Recorder";
import { SkinPicker } from "./SkinPicker";

const otherNames = (members: MembersMap, me: MemberId) => othersOf(members, me).map((m) => m.name);

type Kind = "text" | "photo" | "link" | "voice" | "video";
const KINDS: Kind[] = ["text", "photo", "link", "voice", "video"];
const STAMPS = ["W", "L"] as const;

export function Composer({
  open,
  onClose,
  skins: initialSkins,
  player,
}: {
  open: boolean;
  onClose: () => void;
  skins: Skin[];
  player: MemberId;
}) {
  const router = useRouter();
  const [skins, setSkins] = useState(initialSkins);
  // The last skin you made is the one you are most likely wearing; null when you own none.
  const [skinId, setSkinId] = useState<number | null>(initialSkins.at(-1)?.id ?? null);
  const [kind, setKind] = useState<Kind>("text");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [media, setMedia] = useState<{ blob: Blob; seconds?: number; name: string } | null>(null);
  const [stamps, setStamps] = useState<string[]>([]);
  // null means inherit the skin's paper, which is the common case.
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSkin, setNewSkin] = useState(false);
  const [pending, start] = useTransition();
  const members = useMembers();
  const [prompt, setPrompt] = useState(() => promptFor(otherNames(members, player)));
  useEffect(() => {
    if (open) setPrompt(promptFor(otherNames(members, player)));
  }, [open, player, members]);

  const ready =
    skinId !== null &&
    ((kind === "text" && body.trim().length > 0) ||
      ((kind === "photo" || kind === "voice" || kind === "video") && media !== null) ||
      (kind === "link" && url.trim().length > 0));

  // Debounced, and stale replies are dropped, so typing a URL does not fire one fetch per keystroke.
  const unfurlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unfurlSeq = useRef(0);

  function resolveLink(u: string) {
    setUrl(u);
    setMeta(null);
    if (unfurlTimer.current) clearTimeout(unfurlTimer.current);
    if (!/^https?:\/\//i.test(u.trim())) return;
    const seq = ++unfurlSeq.current;
    unfurlTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/unfurl?url=${encodeURIComponent(u.trim())}`);
        if (res.ok && seq === unfurlSeq.current) setMeta((await res.json()) as LinkMeta);
      } catch {
        setMeta(null);
      }
    }, 400);
  }

  function onFile(k: MediaKind, file: File | undefined) {
    if (!file) return;
    if (k === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const err = validateMedia("video", file.type, v.duration);
        if (err) setError(err);
        else setMedia({ blob: file, seconds: Math.round(v.duration), name: file.name });
        URL.revokeObjectURL(v.src);
      };
      v.src = URL.createObjectURL(file);
      return;
    }
    const err = validateMedia(k, file.type);
    if (err) setError(err);
    else setMedia({ blob: file, name: file.name });
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        const input: ComposerInput = {
          skinId: skinId as number,
          type: kind,
          stamps,
          body: body.trim() || undefined,
          paper: paper ?? undefined,
        };
        if (kind === "link")
          input.linkMeta = meta ?? { url: url.trim(), title: new URL(url.trim()).hostname };
        if (media && kind !== "text" && kind !== "link") {
          const { url: mediaUrl } = await uploadMedia(media.blob, kind, media.name);
          input.mediaUrl = mediaUrl;
          input.mediaSeconds = media.seconds;
        }
        await createPostAction(input);
        setBody("");
        setUrl("");
        setMeta(null);
        setMedia(null);
        setStamps([]);
        setPaper(null);
        onClose();
        router.refresh();
      } catch {
        setError(STRINGS.composer.failed);
      }
    });
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="label text-muted">{STRINGS.composer.skinPicker}</span>
          <SkinPicker
            skins={skins}
            selectedId={skinId}
            onSelect={setSkinId}
            onNew={() => setNewSkin(true)}
          />
          {/* A polaroid is white because that is what makes it a polaroid, so a photo
              ignores the paper. Offering the choice anyway would be a control that lies. */}
          <div
            className={`flex flex-row flex-wrap items-center gap-2 ${kind === "photo" ? "hidden" : ""}`}
          >
            <span className="label text-muted">{STRINGS.paperPicker.paper}</span>
            <button type="button" onClick={() => setPaper(null)} aria-pressed={paper === null}>
              <Pill
                tone="cream"
                className={paper === null ? "ring-2 ring-brown ring-offset-2" : ""}
              >
                {STRINGS.paperPicker.inherit}
              </Pill>
            </button>
            {PAPERS.map((p) => (
              <button key={p} type="button" onClick={() => setPaper(p)} aria-pressed={paper === p}>
                <Pill tone={p} className={paper === p ? "ring-2 ring-brown ring-offset-2" : ""}>
                  {STRINGS.papers[p]}
                </Pill>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-row items-baseline gap-3">
          <p className="font-display text-brown text-lg leading-snug flex-1">{prompt}</p>
          <button
            type="button"
            className="label text-rust"
            onClick={() => setBody((b) => (b ? b : `${prompt} `))}
          >
            {STRINGS.composer.use}
          </button>
        </div>
        <div className="flex flex-row gap-2 overflow-x-auto" role="tablist">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className="shrink-0"
            >
              <Pill tone={kind === k ? "brown" : "cream"}>{STRINGS.composer.kinds[k]}</Pill>
            </button>
          ))}
        </div>
        {kind === "text" ? (
          <TextArea
            placeholder={STRINGS.composer.placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
        ) : null}
        {kind === "photo" ? (
          <div className="flex flex-col gap-2">
            <label className="label h-12 rounded-full border-2 border-dashed border-brown text-brown inline-flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile("photo", e.target.files?.[0])}
              />
              {media ? media.name : STRINGS.composer.pickPhoto}
            </label>
            <Field
              placeholder={STRINGS.composer.caption}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
            />
          </div>
        ) : null}
        {kind === "link" ? (
          <div className="flex flex-col gap-3">
            <Field
              placeholder={STRINGS.composer.pasteLink}
              inputMode="url"
              value={url}
              onChange={(e) => resolveLink(e.target.value)}
            />
            {meta ? <p className="font-body font-bold text-brown">{meta.title}</p> : null}
            <Field
              placeholder={STRINGS.composer.caption}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
            />
          </div>
        ) : null}
        {kind === "voice" ? (
          media ? (
            <p className="label text-avocado">{STRINGS.composer.recorded}</p>
          ) : (
            <Recorder
              kind="voice"
              maxSeconds={MAX_SECONDS.voice}
              onDone={(blob, seconds) => setMedia({ blob, seconds, name: "voice.webm" })}
            />
          )
        ) : null}
        {kind === "video" ? (
          <div className="flex flex-col gap-2">
            <label className="label h-12 rounded-full border-2 border-dashed border-brown text-brown inline-flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => onFile("video", e.target.files?.[0])}
              />
              {media ? media.name : STRINGS.composer.pickVideo}
            </label>
            <Field
              placeholder={STRINGS.composer.caption}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
            />
          </div>
        ) : null}
        <div className="flex flex-row gap-2">
          {STAMPS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={stamps.includes(s)}
              onClick={() =>
                setStamps((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))
              }
            >
              <Pill tone={stamps.includes(s) ? (s === "W" ? "orange" : "rust") : "cream"}>
                {STRINGS.stamps[s] ?? s}
              </Pill>
            </button>
          ))}
        </div>
        {error ? (
          <div className="flex flex-row items-center justify-between gap-3">
            <p className="font-body text-rust">{error}</p>
            <Button kind="ghost" onClick={submit}>
              {STRINGS.composer.retry}
            </Button>
          </div>
        ) : null}
        <Button kind="primary" disabled={!ready || pending} onClick={submit}>
          {STRINGS.composer.post}
        </Button>
      </div>
      <NewSkinSheet
        open={newSkin}
        onClose={() => setNewSkin(false)}
        onSaved={(skin) => {
          setSkins((xs) => [...xs, skin]);
          setSkinId(skin.id);
          setNewSkin(false);
        }}
      />
    </Sheet>
  );
}
