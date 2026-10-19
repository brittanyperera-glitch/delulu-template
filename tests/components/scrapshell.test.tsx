// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { paperFor, patternFor, ScrapShell } from "@/components/ScrapShell";
import { postRow, skinRow } from "../factories";

describe("paperFor", () => {
  it("prefers the scrap's own paper over the skin's", () => {
    expect(paperFor({ paper: "rust", type: "text" }, { paper: "avocado" })).toBe("rust");
  });

  it("falls back to the skin's paper", () => {
    expect(paperFor({ paper: null, type: "text" }, { paper: "avocado" })).toBe("avocado");
  });

  // The pre-paper defaults, which have to survive for every skin invented before the picker
  // existed: a note read as a note, and everything else as the pale card.
  it("keeps the old defaults when nothing has chosen", () => {
    expect(paperFor({ paper: null, type: "text" }, { paper: null })).toBe("mustard");
    expect(paperFor({ paper: null, type: "photo" }, { paper: null })).toBe("card");
    expect(paperFor({ paper: null, type: "link" }, { paper: null })).toBe("card");
  });
});

describe("patternFor", () => {
  it("maps a pattern to its class and nothing to nothing", () => {
    expect(patternFor({ pattern: "grid" })).toBe("pat-grid");
    expect(patternFor({ pattern: "torn" })).toBe("pat-torn");
    expect(patternFor({ pattern: null })).toBe("");
  });
});

describe("ScrapShell", () => {
  it("paints a text scrap in the skin's paper", () => {
    render(
      <ScrapShell post={postRow({ type: "text" })} skin={skinRow({ paper: "rust" })} tilt={0}>
        <span>hello</span>
      </ScrapShell>,
    );
    const card = screen.getByText("hello").parentElement;
    expect(card?.className).toContain("bg-rust");
    // Card supplies the ink for a dark paper, so nothing inside has to hardcode it.
    expect(card?.className).toContain("text-cream");
  });

  // A polaroid is white whatever the skin picked, because that is what makes it a polaroid.
  it("ignores the skin's paper for a photo and keeps the polaroid white", () => {
    render(
      <ScrapShell post={postRow({ type: "photo" })} skin={skinRow({ paper: "rust" })} tilt={0}>
        <span>shot</span>
      </ScrapShell>,
    );
    const card = screen.getByText("shot").parentElement;
    expect(card?.className).toContain("bg-card");
    expect(card?.className).not.toContain("bg-rust");
  });

  it("carries the skin's pattern onto the scrap", () => {
    render(
      <ScrapShell post={postRow({ type: "text" })} skin={skinRow({ pattern: "dots" })} tilt={0}>
        <span>dotty</span>
      </ScrapShell>,
    );
    expect(screen.getByText("dotty").parentElement?.className).toContain("pat-dots");
  });

  it("gives each post type its own frame", () => {
    for (const [type, cls] of [
      ["video", "filmstrip"],
      ["link", "relative"],
    ] as const) {
      const { unmount } = render(
        <ScrapShell post={postRow({ type })} skin={skinRow()} tilt={0}>
          <span>{type}</span>
        </ScrapShell>,
      );
      expect(screen.getByText(type).parentElement?.className, type).toContain(cls);
      unmount();
    }
  });
});
