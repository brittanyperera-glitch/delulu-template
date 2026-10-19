// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SkinCard } from "@/components/SkinCard";
import { skinRow } from "../factories";
import { render } from "./members-wrapper";

const skin = skinRow({ id: 2, name: "Marathon", line: "26.2 or nothing" });

describe("SkinCard", () => {
  it("shows the name and how many posts carry the skin", () => {
    render(<SkinCard skin={skin} used={9} tilt={0} />);
    expect(screen.getByText("Marathon")).toBeInTheDocument();
    expect(screen.getByText("Used 9")).toBeInTheDocument();
  });

  it("flips to the one line on tap", async () => {
    render(<SkinCard skin={skin} used={0} tilt={-1} />);
    expect(screen.queryByText("26.2 or nothing")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Marathon" }));
    expect(screen.getByText("26.2 or nothing")).toBeInTheDocument();
  });

  it("counts a skin nothing has been posted under as zero, not as unworn", () => {
    render(<SkinCard skin={skin} used={0} tilt={1} />);
    expect(screen.getByText("Used 0")).toBeInTheDocument();
    expect(screen.getByTestId("skin-card-2").className).not.toContain("translate-y");
  });

  it("hides the edit control when the viewer does not own the skin", () => {
    render(<SkinCard skin={skin} used={0} tilt={0} />);
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("shows the edit control for the owner, pre-filled, and lets them save a change", async () => {
    render(<SkinCard skin={skin} used={0} tilt={0} editable />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByDisplayValue("Marathon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
