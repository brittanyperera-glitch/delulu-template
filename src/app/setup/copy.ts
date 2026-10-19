import { SITE } from "@/config/site";

/** Local to first-run setup: the shared strings file belongs to another workstream. */
export const SETUP = {
  title: "Set up",
  people: "who is in",
  namePlaceholder: "name",
  colourLabel: "colour",
  add: "Add someone",
  remove: "Remove",
  firstDay: "day one",
  timezone: "timezone",
  cta: `Start the ${SITE.totalDays} days`,
  saving: "Starting...",
  failed: "That did not save. Try again.",
} as const;
