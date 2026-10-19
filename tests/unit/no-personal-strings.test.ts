import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Keeps the template free of the original couple's names and Berlin-only helpers.
const BANNED = /britt|antek|perera|berlinDate|berlinLongDate|delulu_(player|gate)/i;
// Credit line and repo/portfolio URLs for the template's author are intended; names inside the
// product (members, copy, comments) are not.
const ALLOWED = /brittanyperera-glitch|brittanyperera\.com|Brittany Perera/g;
const ROOTS = ["src", "tests", "docs", "scripts", "README.md"];
const SELF = join("tests", "unit", "no-personal-strings.test.ts");
const TEXT = /\.(ts|tsx|md|json|css|mjs|sql)$/;

function files(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

describe("template stays generic", () => {
  it("has no personal names or Berlin-only helpers in source, tests, docs or scripts", () => {
    const hits = ROOTS.flatMap((root) => files(root))
      .filter((f) => TEXT.test(f) && f !== SELF)
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          .flatMap((line, i) => (BANNED.test(line.replace(ALLOWED, "")) ? [`${f}:${i + 1}`] : [])),
      );
    expect(hits.slice(0, 20), `${hits.length} hits`).toEqual([]);
  });
});
