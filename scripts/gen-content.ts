import { writeFileSync } from "node:fs";
import { generate } from "@/lib/content/generate";

function main() {
  const g = generate();
  writeFileSync("src/lib/content/truth-or-truth.ts", g.truth);
  writeFileSync("src/lib/content/composer-prompts.ts", g.prompts);
  console.log("wrote src/lib/content/truth-or-truth.ts and composer-prompts.ts");
}

main();
