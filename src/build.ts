import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SECTIONS_DIR = join(ROOT, "content/sections");
const FULL_DIR = join(ROOT, "content/full");
const DIST_DIR = join(ROOT, "dist");

async function readAndConcat(dir: string, separator: string): Promise<string> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const parts: string[] = [];
  for (const file of files) {
    const content = await readFile(join(dir, file), "utf-8");
    parts.push(content.trimEnd());
  }
  return parts.join(separator) + "\n";
}

function validate(content: string, label: string): void {
  if (content.trim().length === 0) {
    throw new Error(`${label} is empty`);
  }
  if (!content.startsWith("# ")) {
    throw new Error(`${label} must start with an H1 heading`);
  }
}

async function main(): Promise<void> {
  await mkdir(DIST_DIR, { recursive: true });

  // llms.txt: simple concatenation
  const llmsTxt = await readAndConcat(SECTIONS_DIR, "\n\n");
  validate(llmsTxt, "llms.txt");
  await writeFile(join(DIST_DIR, "llms.txt"), llmsTxt);

  // llms-full.txt: concatenation with --- separators
  const llmsFullTxt = await readAndConcat(FULL_DIR, "\n\n---\n\n");
  validate(llmsFullTxt, "llms-full.txt");
  await writeFile(join(DIST_DIR, "llms-full.txt"), llmsFullTxt);

  const llmsSize = Buffer.byteLength(llmsTxt, "utf-8");
  const fullSize = Buffer.byteLength(llmsFullTxt, "utf-8");
  console.log(`dist/llms.txt      ${(llmsSize / 1024).toFixed(1)} KB`);
  console.log(`dist/llms-full.txt ${(fullSize / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
