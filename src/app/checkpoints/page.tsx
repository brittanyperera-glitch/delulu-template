import { SaveScreen } from "@/components/SaveScreen";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { checkpointViews } from "@/lib/repo/checkpoints";

export const dynamic = "force-dynamic";

export default async function CheckpointsPage() {
  const { season } = await dayContext();
  const views = await checkpointViews(db(), season.id);
  return (
    <SectionPage title={STRINGS.nav.checkpoints} slug="checkpoints">
      <SaveScreen views={views} />
    </SectionPage>
  );
}
