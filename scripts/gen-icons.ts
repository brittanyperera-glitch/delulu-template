import { readFileSync } from "node:fs";
import sharp from "sharp";

async function main() {
  const svg = readFileSync("public/icon.svg");
  for (const [name, size] of [
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["apple-touch-icon.png", 180],
  ] as const) {
    await sharp(svg).resize(size, size).png().toFile(`public/${name}`);
    console.log(`public/${name}`);
  }
}

main();
