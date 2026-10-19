// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaveScreen } from "@/components/SaveScreen";
import type { Checkpoint, JarItem, Recap } from "@/lib/db/schema";

const recap: Recap = {
  from: 1,
  to: 10,
  posts: 6,
  trululus: 1,
  ws: 3,
  ls: 1,
  skinsUsed: 2,
  topPostId: 9,
};

function checkpoint(over: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: 1,
    seasonId: 1,
    day: 10,
    recapJson: null,
    jarItemId: null,
    postId: null,
    openedBy: null,
    createdAt: new Date(),
    ...over,
  };
}

const feralItem: JarItem = {
  id: 5,
  seasonId: 1,
  author: "alex",
  body: "cold plunge",
  size: "feral",
  putBackCount: 0,
  drawnAt: new Date(),
  drawnBy: "alex",
  donePostId: null,
  doneDay: null,
  createdAt: new Date(),
};

describe("SaveScreen", () => {
  it("shows nothing saved yet with no Checkpoints", () => {
    render(<SaveScreen views={[]} />);
    expect(screen.getByText("Nothing saved yet.")).toBeInTheDocument();
  });

  it("offers Open for a Checkpoint that has not posted", () => {
    render(<SaveScreen views={[{ checkpoint: checkpoint(), feral: null }]} />);
    expect(screen.getByText("CHECKPOINT - DAY 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("shows the recap and the drawn Feral quest once opened", () => {
    const opened = checkpoint({ recapJson: recap, jarItemId: 5, postId: 3, openedBy: "alex" });
    render(<SaveScreen views={[{ checkpoint: opened, feral: feralItem }]} />);
    expect(screen.getByText("PROGRESS SAVED")).toBeInTheDocument();
    expect(screen.getByText(/6 posts, 1 trululus/)).toBeInTheDocument();
    expect(screen.getByText("cold plunge")).toBeInTheDocument();
    expect(screen.getByText("CONTINUE?")).toBeInTheDocument();
  });

  it("says the Feral tier is empty and offers a way to add one", () => {
    const opened = checkpoint({ recapJson: recap, jarItemId: null, postId: 3, openedBy: "alex" });
    render(<SaveScreen views={[{ checkpoint: opened, feral: null }]} />);
    expect(screen.getByText("The Feral tier is empty.")).toBeInTheDocument();
    expect(screen.getByText("Add a Feral quest")).toBeInTheDocument();
  });
});
