// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/truth", () => ({ answerTruthAction: vi.fn() }));

import { answerTruthAction } from "@/actions/truth";
import { Podiums } from "@/components/Podiums";
import { STRINGS } from "@/lib/content/strings";
import { TEST_MEMBERS_MAP } from "../factories";

const row = (author: string, body: string) => ({
  id: 1,
  seasonId: 1,
  day: 4,
  author,
  body,
  createdAt: new Date(),
});

describe("Podiums", () => {
  it("hides the other answers until everyone is in", () => {
    render(
      <Podiums
        question="Q?"
        me="alex"
        members={TEST_MEMBERS_MAP}
        open={false}
        answers={[row("alex", "mine only")]}
      />,
    );
    // Selector scoped to "p": the draft textarea is pre-filled with the same text while
    // waiting for the other answer, so an unscoped query matches both and throws.
    expect(screen.getByText("mine only", { selector: "p" })).toBeInTheDocument();
    // Sam and Jo have not answered at all here, so the accurate label is "Not answered", not
    // "Waiting" (which the component reserves for a real answer withheld pending reveal).
    expect(screen.getAllByText("Not answered")).toHaveLength(2);
  });

  it("shows all three in one column when everyone is in", () => {
    const { container } = render(
      <Podiums
        question="Q?"
        me="alex"
        members={TEST_MEMBERS_MAP}
        open
        answers={[row("alex", "mine"), row("sam", "theirs"), row("jo", "also theirs")]}
      />,
    );
    expect(screen.getByText("mine")).toBeInTheDocument();
    expect(screen.getByText("theirs")).toBeInTheDocument();
    expect(screen.getByText("also theirs")).toBeInTheDocument();
    expect(screen.queryByText("Waiting")).toBeNull();
    const names = ["Alex", "Sam", "Jo"].map((n) => screen.getByText(n, { selector: "span" }));
    const columns = new Set(names.map((n) => n.parentElement?.parentElement));
    expect(columns.size).toBe(1);
    expect(container.querySelector('[class*="grid-cols"]')).toBeNull();
  });

  it("withholds a written answer from the viewer while the day is still open", () => {
    render(
      <Podiums
        question="Q?"
        me="alex"
        members={TEST_MEMBERS_MAP}
        open={false}
        answers={[row("alex", "mine"), row("sam", "secret")]}
      />,
    );
    expect(screen.queryByText("secret")).toBeNull();
    expect(screen.getByText(STRINGS.truth.waiting)).toBeInTheDocument();
  });

  it("submits only the answer body, never a client-supplied day", async () => {
    render(
      <Podiums question="Q?" me="alex" members={TEST_MEMBERS_MAP} open={false} answers={[]} />,
    );
    await userEvent.type(screen.getByPlaceholderText("your answer"), "my real answer");
    await userEvent.click(screen.getByRole("button", { name: "Answer" }));
    expect(answerTruthAction).toHaveBeenCalledWith("my real answer");
  });
});
