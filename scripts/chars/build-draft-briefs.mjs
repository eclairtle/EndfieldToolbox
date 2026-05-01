#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFTS_DIR = path.join(ROOT, "src/data/chars/drafts");
const RAW_DIR = path.join(DRAFTS_DIR, "raw");
const OUTPUT_DIR = path.join(DRAFTS_DIR, "briefs");

const STRIP_TAGS_RE = /<[^>]*>/g;

function cleanText(input) {
  return String(input ?? "")
    .replace(STRIP_TAGS_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function byNumericSuffix(left, right) {
  const leftN = Number((left.match(/_(\d+)(?:\D.*)?$/) ?? [])[1] ?? Number.NaN);
  const rightN = Number((right.match(/_(\d+)(?:\D.*)?$/) ?? [])[1] ?? Number.NaN);
  if (Number.isFinite(leftN) && Number.isFinite(rightN) && leftN !== rightN) {
    return leftN - rightN;
  }
  return left.localeCompare(right);
}

async function readDraftMetaBySlug() {
  const entries = await fs.readdir(DRAFTS_DIR, { withFileTypes: true });
  const result = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    if (entry.name === "index.ts" || entry.name === "types.ts") continue;
    const source = await fs.readFile(path.join(DRAFTS_DIR, entry.name), "utf8");
    const slug = (source.match(/wikiUrl:\s*"https:\/\/warfarin\.wiki\/en\/operators\/([^"]+)"/) ?? [])[1];
    if (!slug) continue;
    const nameCn = (source.match(/nameCn:\s*"([^"]+)"/) ?? [])[1] ?? "";
    const gamedataId = (source.match(/gamedataId:\s*"([^"]+)"/) ?? [])[1] ?? "";
    result.set(slug, { nameCn, gamedataId, draftFile: entry.name });
  }
  return result;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const draftMetaBySlug = await readDraftMetaBySlug();
  const entries = await fs.readdir(RAW_DIR, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "manifest.json")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  let generated = 0;

  for (const file of jsonFiles) {
    const slug = file.replace(/\.json$/, "");
    const absPath = path.join(RAW_DIR, file);
    const raw = await fs.readFile(absPath, "utf8");
    const parsed = JSON.parse(raw);
    const data = parsed?.data ?? {};
    const meta = parsed?.meta ?? {};
    const draftMeta = draftMetaBySlug.get(slug);

    const table = data.potentialTalentEffectTable ?? {};
    const talentKeys = Object.keys(table).filter((key) => key.includes("_talent_")).sort(byNumericSuffix);
    const potentialKeys = Object.keys(table).filter((key) => key.includes("_potential_")).sort(byNumericSuffix);

    const lines = [];
    lines.push(`# ${meta?.name ?? slug}`);
    lines.push("");
    lines.push(`- Slug: \`${slug}\``);
    if (draftMeta?.gamedataId) lines.push(`- Gamedata ID: \`${draftMeta.gamedataId}\``);
    if (draftMeta?.nameCn) lines.push(`- CN Name: ${draftMeta.nameCn}`);
    lines.push(`- Source JSON: \`src/data/chars/drafts/raw/${file}\``);
    lines.push(`- Wiki: https://warfarin.wiki/en/operators/${slug}`);
    lines.push("");

    lines.push("## Talents");
    lines.push("");
    if (talentKeys.length === 0) {
      lines.push("- None found in `potentialTalentEffectTable`.");
      lines.push("");
    } else {
      for (const key of talentKeys) {
        const desc = cleanText(table[key]?.desc);
        lines.push(`- \`${key}\`: ${desc || "(no desc)"}`);
      }
      lines.push("");
    }

    lines.push("## Potentials");
    lines.push("");
    if (potentialKeys.length === 0) {
      lines.push("- None found in `potentialTalentEffectTable`.");
      lines.push("");
    } else {
      for (const key of potentialKeys) {
        const desc = cleanText(table[key]?.desc);
        lines.push(`- \`${key}\`: ${desc || "(no desc)"}`);
      }
      lines.push("");
    }

    lines.push("## Notes");
    lines.push("");
    lines.push("- Use this brief with `public/gamedata.json` for frame timing and command offsets.");
    lines.push("- Validate implementations with `npm run chars:audit` and `npm run type-check`.");
    lines.push("");

    const outPath = path.join(OUTPUT_DIR, `${slug}.md`);
    await fs.writeFile(outPath, `${lines.join("\n")}`, "utf8");
    generated += 1;
  }

  console.log(`Generated ${generated} draft brief(s) in ${path.relative(ROOT, OUTPUT_DIR)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
