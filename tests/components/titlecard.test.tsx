// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TitleCard } from "@/components/TitleCard";
import { STRINGS } from "@/lib/content/strings";

describe("TitleCard", () => {
  it("counts the days left and names the day", () => {
    render(<TitleCard day={7} />);
    expect(screen.getByText("93")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.home.daysLeft)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.home.dayOf(7, 100))).toBeInTheDocument();
  });

  it("reaches zero on the last day rather than going negative", () => {
    render(<TitleCard day={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.home.dayOf(100, 100))).toBeInTheDocument();
  });

  // The run is 100 days. Day 101 must not read "Day 101 of 100".
  it("never counts past the last day", () => {
    render(<TitleCard day={101} />);
    expect(screen.getByText(STRINGS.home.dayOf(100, 100))).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.home.dayOf(101, 100))).toBeNull();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
