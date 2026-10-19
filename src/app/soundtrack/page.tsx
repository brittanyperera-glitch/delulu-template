import { SoundtrackRoom } from "@/components/SoundtrackRoom";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";
import { listTrackComments, type TrackCommentThread } from "@/lib/repo/track-comments";
import { listApproved, listTracks } from "@/lib/repo/tracks";

export const dynamic = "force-dynamic";

export default async function SoundtrackPage() {
  const { player, season } = await dayContext();
  const [approved, allTracks, skins, mine] = await Promise.all([
    listApproved(db(), season.id),
    listTracks(db(), season.id),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  // Comments for every track (the Mixtape shows them all, the Soundtrack the approved subset) so
  // flipping a cover or a record never waits on a fetch.
  const commentsByTrack: Record<number, TrackCommentThread[]> = {};
  await Promise.all(
    allTracks.map(async (t) => {
      commentsByTrack[t.id] = await listTrackComments(db(), t.id);
    }),
  );
  return (
    <SoundtrackRoom
      approved={approved}
      allTracks={allTracks}
      me={player}
      commentsByTrack={commentsByTrack}
      skins={skins.filter((s) => s.owner === player)}
      initialSkinId={mine}
    />
  );
}
