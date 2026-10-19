"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { MembersMap } from "@/lib/members";

const MembersContext = createContext<MembersMap | null>(null);

export function MembersProvider({
  members,
  children,
}: {
  members: MembersMap;
  children: ReactNode;
}) {
  return <MembersContext.Provider value={members}>{children}</MembersContext.Provider>;
}

/** Throws outside the provider, so a missing mount fails loudly instead of rendering slugs. */
export function useMembers(): MembersMap {
  const members = useContext(MembersContext);
  if (members === null) throw new Error("useMembers() needs a <MembersProvider> above it");
  return members;
}
