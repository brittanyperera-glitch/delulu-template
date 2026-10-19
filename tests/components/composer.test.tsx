// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/posts", () => ({ createPostAction: vi.fn(async () => ({ id: 1 })) }));
vi.mock("@/actions/skins", () => ({ createSkinAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { createPostAction } from "@/actions/posts";
import { Composer } from "@/components/Composer";
import { skinRow } from "../factories";
import { render } from "./members-wrapper";

const skins = [skinRow()];

describe("Composer", () => {
  it("cannot post with no skin at all", async () => {
    render(<Composer open onClose={() => {}} skins={[]} player="alex" />);
    await userEvent.type(screen.getByPlaceholderText(/say the ridiculous thing/i), "so back");
    expect(screen.getByRole("button", { name: "Post it" })).toBeDisabled();
  });

  it("disables Post until text exists, then posts with stamps under the preselected skin", async () => {
    render(<Composer open onClose={() => {}} skins={skins} player="alex" />);
    const post = screen.getByRole("button", { name: "Post it" });
    expect(post).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText(/say the ridiculous thing/i), "so back");
    expect(post).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Big Dubs" }));
    await userEvent.click(post);
    expect(createPostAction).toHaveBeenCalledWith(
      expect.objectContaining({ skinId: 1, type: "text", body: "so back", stamps: ["W"] }),
    );
  });
  it("shows a prompt that can be used as the opener", async () => {
    render(<Composer open onClose={() => {}} skins={skins} player="alex" />);
    await userEvent.click(screen.getByRole("button", { name: /use/i }));
    const box = screen.getByPlaceholderText(/say the ridiculous thing/i) as HTMLTextAreaElement;
    expect(box.value.length).toBeGreaterThan(5);
  });
});
