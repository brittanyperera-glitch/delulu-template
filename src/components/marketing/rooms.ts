import { SITE } from "@/config/site";

export type Room = { slug: string; name: string; blurb: string; alt: string };

// One line per room, each under 18 words, checked against src/app/<room>/page.tsx and strings.ts.
export const ROOMS: Room[] = [
  {
    slug: "wall",
    name: "Wall",
    blurb: "A shared feed of posts, plus what is waiting on you today.",
    alt: "The Wall: a feed of scrapbook posts from the group",
  },
  {
    slug: "manifesto",
    name: "Manifesto",
    blurb: `Your rules for the ${SITE.totalDays} days. One edit a day, with a version history.`,
    alt: "The Manifesto page showing a list of personal rules",
  },
  {
    slug: "delusions",
    name: "Delusions",
    blurb: "Plant a life you are acting as if you already have. Stamp it when it happens.",
    alt: "The Delusions page with planted delusions and a stamp button",
  },
  {
    slug: "jar",
    name: "The Jar",
    blurb: "Drop in quests sized from tiny to feral, then draw one at random.",
    alt: "The Jar page listing quests by size with a draw button",
  },
  {
    slug: "truth",
    name: "Truth",
    blurb: "One question a day. Answers stay hidden until everyone has answered or the day ends.",
    alt: "The Truth page with the daily question and answers",
  },
  {
    slug: "dares",
    name: "Dares",
    blurb: "Deal a dare to someone. They flip it, then accept, negotiate or chicken out.",
    alt: "The Dares page showing dealt dares and their status",
  },
  {
    slug: "bets",
    name: "Bets",
    blurb: "Make a claim with stakes. The loser owns up and a receipt lands on the wall.",
    alt: "The Bets page with proposed and settled bets",
  },
  {
    slug: "bombs",
    name: "Time Bombs",
    blurb: "Seal a note that opens on a set day, or when someone does something.",
    alt: "The Time Bombs page showing armed sealed notes",
  },
  {
    slug: "prophecies",
    name: "Prophecies",
    blurb: `Predict where you will be by day ${SITE.totalDays}. Sealed early, judged at the end.`,
    alt: "The Prophecies page with sealed predictions",
  },
  {
    slug: "checkpoints",
    name: "Checkpoints",
    blurb: "At set milestones, save a recap of that stretch: posts, stamps and the top post.",
    alt: "The Checkpoints page with saved progress cards",
  },
  {
    slug: "soundtrack",
    name: "Soundtrack",
    blurb: "Add songs for the run. Another member approves each one onto the record.",
    alt: "The Soundtrack page showing a record sleeve and track list",
  },
];
