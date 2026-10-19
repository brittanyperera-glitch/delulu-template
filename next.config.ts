import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes AGENTS.md and CLAUDE.md at the repo root on every run.
  // A repo-root CLAUDE.md silently becomes project instructions for this repo.
  agentRules: false,
};

export default nextConfig;
