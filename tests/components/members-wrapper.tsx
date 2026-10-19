import { render as rtlRender } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MembersProvider } from "@/components/MembersProvider";
import { TEST_MEMBERS_MAP } from "../factories";

function Wrapper({ children }: { children: ReactNode }) {
  return <MembersProvider members={TEST_MEMBERS_MAP}>{children}</MembersProvider>;
}

/** RTL render with the alex/sam/jo members mounted, for components that call useMembers. */
export function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: Wrapper });
}
