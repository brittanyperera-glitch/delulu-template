// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CreedBlock } from "@/components/CreedBlock";
import { STRINGS } from "@/lib/content/strings";

const PROPS = { body: "I am so back.", delusions: 2, trululu: 1, spoilers: 3, happened: 1 };

beforeEach(() => {
  localStorage.clear();
});

describe("CreedBlock", () => {
  it("shows the creed body by default, alongside the Delusions and Spoilers lines", () => {
    render(<CreedBlock {...PROPS} />);
    expect(screen.getByText("I am so back.")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.wall.delusionsLine(2, 1))).toBeInTheDocument();
    expect(screen.getByText(STRINGS.wall.spoilersLine(3, 1))).toBeInTheDocument();
  });

  it("hides the creed body on Hide, but keeps Delusions and Spoilers", async () => {
    render(<CreedBlock {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.manifesto.hide }));
    expect(screen.queryByText("I am so back.")).not.toBeInTheDocument();
    expect(screen.getByText(STRINGS.wall.delusionsLine(2, 1))).toBeInTheDocument();
    expect(screen.getByText(STRINGS.wall.spoilersLine(3, 1))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.manifesto.show })).toBeInTheDocument();
  });

  it("shows the creed body again on Show, and remembers the choice for next time", async () => {
    render(<CreedBlock {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.manifesto.hide }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.manifesto.show }));
    expect(screen.getByText("I am so back.")).toBeInTheDocument();
    expect(localStorage.getItem("scrapbook:creed-collapsed")).toBe("0");
  });

  it("restores a collapsed choice from localStorage on a fresh render", () => {
    localStorage.setItem("scrapbook:creed-collapsed", "1");
    render(<CreedBlock {...PROPS} />);
    expect(screen.queryByText("I am so back.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.manifesto.show })).toBeInTheDocument();
  });
});
