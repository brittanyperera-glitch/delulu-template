// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SkinBadge } from "@/components/SkinBadge";
import { SkinPicker } from "@/components/SkinPicker";
import { skinRow } from "../factories";
import { render } from "./members-wrapper";

const skin = (id: number, name: string) => skinRow({ id, name });

describe("SkinBadge", () => {
  it("shows the initial and lights up when equipped", () => {
    render(<SkinBadge skin={skin(1, "Marathon")} lit />);
    const badge = screen.getByLabelText("Marathon");
    expect(badge.textContent).toBe("M");
    expect(badge.className).toContain("ring-orange");
  });
});

describe("SkinPicker", () => {
  it("selects a skin and offers New", async () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    render(
      <SkinPicker
        skins={[skin(1, "CEO Alex"), skin(2, "Marathon")]}
        selectedId={null}
        onSelect={onSelect}
        onNew={onNew}
      />,
    );
    await userEvent.click(screen.getByLabelText("Marathon"));
    expect(onSelect).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole("button", { name: /new/i }));
    expect(onNew).toHaveBeenCalled();
  });
});
