import type { Metadata } from "next";
import { LinkButton } from "@/components/marketing/LinkButton";
import {
  DEMO_URL,
  DEPLOY_URL,
  PORTFOLIO_URL,
  REPO_URL,
  SELF_HOSTING_URL,
} from "@/components/marketing/links";
import { ROOMS } from "@/components/marketing/rooms";
import { ScreenSlot } from "@/components/marketing/ScreenSlot";
import { SITE } from "@/config/site";

const TITLE = SITE.name;
const DESCRIPTION = `A shared ${SITE.totalDays}-day scrapbook for a group of friends. Open source, built with Next.js, Neon and Vercel.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [{ url: "/og/about.png", width: 1200, height: 630, alt: `${TITLE} logo on cream` }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/about.png"],
  },
};

const STEPS = [
  { title: "Share one code", line: "Everyone enters the same group code at the door." },
  { title: "Pick your name", line: "No accounts. Choose who you are from the group." },
  { title: "Post for 100 days", line: "Add to the wall daily and play the rooms." },
];

const MAKE_STEPS = [
  { title: "Fork or use the template", line: "Copy the repository to your own GitHub." },
  {
    title: "Create a database and a blob store",
    line: "A Neon Postgres database and a Vercel Blob store for uploads.",
  },
  { title: "Deploy to Vercel", line: "Add the connection strings as environment variables." },
  { title: "Open /setup", line: "Name the group, add your people and pick a start date." },
];

const H2 = "font-display text-3xl sm:text-4xl text-brown";
const SECTION = "mx-auto w-full max-w-[1100px] px-4 sm:px-8 py-14 sm:py-20";

export default function AboutPage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-5 sm:px-8">
        <span className="font-display text-xl text-brown">{TITLE}</span>
        <a href={REPO_URL} className="label text-brown">
          GitHub
        </a>
      </header>
      <main>
        <section className={`${SECTION} grid items-center gap-10 md:grid-cols-[1.3fr_1fr]`}>
          <div>
            <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] text-brown">{TITLE}</h1>
            <p className="mt-5 max-w-[34ch] text-xl text-ink">
              A shared scrapbook where a group posts every day for 100 days.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={DEMO_URL} kind="primary">
                Try the live demo
              </LinkButton>
              <LinkButton href={REPO_URL} kind="ghost">
                Get the template
              </LinkButton>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[280px] rounded-[36px] border-[3px] border-brown bg-card p-3 shadow-hard">
            <ScreenSlot name="wall" alt={ROOMS[0].alt} label="Wall" />
          </div>
        </section>

        <section className={SECTION} aria-labelledby="how">
          <h2 id="how" className={H2}>
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-card border-2 border-brown bg-card p-5">
                <span className="label text-rust">Step {i + 1}</span>
                <h3 className="mt-2 font-display text-2xl text-brown">{s.title}</h3>
                <p className="mt-2 text-ink">{s.line}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={SECTION} aria-labelledby="rooms">
          <h2 id="rooms" className={H2}>
            The rooms
          </h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((r) => (
              <li
                key={r.slug}
                className="flex flex-col gap-4 rounded-card border-2 border-brown bg-card p-4 shadow-hard-sm"
              >
                <ScreenSlot name={r.slug} alt={r.alt} label={r.name} />
                <div>
                  <h3 className="font-display text-2xl text-brown">{r.name}</h3>
                  <p className="mt-1 text-ink">{r.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={SECTION} aria-labelledby="make">
          <h2 id="make" className={H2}>
            Make your own
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {MAKE_STEPS.map((s, i) => (
              <li key={s.title} className="rounded-card border-2 border-brown bg-card p-5">
                <span className="label text-rust">Step {i + 1}</span>
                <h3 className="mt-2 font-display text-2xl text-brown">{s.title}</h3>
                <p className="mt-2 text-ink">{s.line}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <LinkButton href={DEPLOY_URL} kind="primary">
              Deploy to Vercel
            </LinkButton>
            <a href={SELF_HOSTING_URL} className="text-brown underline underline-offset-4">
              Read the self-hosting guide
            </a>
          </div>
        </section>
      </main>
      <footer className="border-t-2 border-brown">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8">
          <p className="text-ink">
            Built by Brittany Perera.{" "}
            <a href={PORTFOLIO_URL} className="underline underline-offset-4">
              brittanyperera.com
            </a>
          </p>
          <a href={REPO_URL} className="underline underline-offset-4 text-brown">
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
