import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => ({ has: false }));
const getMembers = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ has: () => cookieJar.has }),
}));
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "v", className: "c" });
  return { Caprasimo: font, EB_Garamond: font, Figtree: font, JetBrains_Mono: font };
});
vi.mock("@/lib/session", () => ({ getMembers }));
vi.mock("@/components/DemoBanner", () => ({ DemoBanner: () => null }));
vi.mock("@/components/ui/Grain", () => ({ Grain: () => null }));
vi.mock("../../src/app/globals.css", () => ({}));

import RootLayout from "@/app/layout";
import { MembersProvider } from "@/components/MembersProvider";

function findProvider(node: ReactNode): ReactElement<{ members: unknown }> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findProvider(n);
      if (hit) return hit;
    }
    return null;
  }
  const el = node as ReactElement<{ children?: ReactNode; members: unknown }>;
  if (el.type === MembersProvider) return el;
  return findProvider(el.props?.children);
}

const MAP = { alex: { slug: "alex", name: "Alex" } };

describe("root layout members", () => {
  beforeEach(() => {
    getMembers.mockReset();
    getMembers.mockResolvedValue(MAP);
  });

  it("does not load or ship members to a visitor without a player cookie", async () => {
    cookieJar.has = false;
    const tree = await RootLayout({ children: null });
    expect(getMembers).not.toHaveBeenCalled();
    expect(findProvider(tree)?.props.members).toEqual({});
  });

  it("loads members for a visitor with a player cookie", async () => {
    cookieJar.has = true;
    const tree = await RootLayout({ children: null });
    expect(getMembers).toHaveBeenCalledOnce();
    expect(findProvider(tree)?.props.members).toEqual(MAP);
  });
});
