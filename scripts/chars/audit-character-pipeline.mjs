#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CHARS_DIR = path.join(ROOT, "src/data/chars");
const REGISTRY_PATH = path.join(ROOT, "src/data/characters.ts");

function extractImportedCharacterMap(source) {
  const map = new Map();
  const importRe = /import\s+\{\s*([A-Z0-9_]+)\s*\}\s+from\s+"\.\/chars\/([^"]+)";/g;
  for (const match of source.matchAll(importRe)) {
    const constName = match[1];
    const fileBase = match[2];
    if (constName && fileBase) {
      map.set(fileBase, constName);
    }
  }
  return map;
}

function extractRegistryList(source) {
  const start = source.indexOf("export const CHARACTERS: CharacterBase[] = [");
  if (start < 0) {
    return new Set();
  }
  const rest = source.slice(start);
  const end = rest.indexOf("];");
  const body = end >= 0 ? rest.slice(0, end) : rest;
  const consts = new Set();
  for (const match of body.matchAll(/\b([A-Z0-9_]+)\b/g)) {
    const token = match[1];
    if (token && token !== "CHARACTERS" && token !== "CharacterBase") {
      consts.add(token);
    }
  }
  return consts;
}

function extractCommandBlocks(source) {
  const blocks = [];
  const idRe = /id:\s*"([^"]+)"/g;

  for (const match of source.matchAll(idRe)) {
    const id = match[1];
    const idx = match.index ?? -1;
    if (!id || idx < 0) continue;
    const nextIdx = source.indexOf("\n  {", idx + 1);
    const end = nextIdx >= 0 ? nextIdx : source.length;
    blocks.push({ id, block: source.slice(idx, end) });
  }
  return blocks;
}

async function main() {
  const findings = [];
  const strict = process.argv.includes("--strict");

  const entries = await readdir(CHARS_DIR, { withFileTypes: true });
  const charFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .filter((name) => name !== "index.ts")
    .sort((a, b) => a.localeCompare(b));

  const implementedFiles = charFiles.filter((name) => !name.startsWith("drafts"));
  const implementedBases = implementedFiles
    .map((name) => name.replace(/\.ts$/, ""))
    .sort((a, b) => a.localeCompare(b));

  const registrySource = await readFile(REGISTRY_PATH, "utf8");
  const importedByFile = extractImportedCharacterMap(registrySource);
  const listedConsts = extractRegistryList(registrySource);

  for (const base of implementedBases) {
    const expectedPath = path.join(CHARS_DIR, `${base}.ts`);
    const source = await readFile(expectedPath, "utf8");

    const hasFinisherVariant = source.includes('basicAttackVariant: "final_strike"');
    const hasDiveVariant = source.includes('basicAttackVariant: "dive_attack"');
    if (!hasFinisherVariant) {
      findings.push({ severity: "warn", message: `${base}: missing finisher variant (basicAttackVariant: "final_strike")` });
    }
    if (!hasDiveVariant) {
      findings.push({ severity: "warn", message: `${base}: missing dive variant (basicAttackVariant: "dive_attack")` });
    }

    const commandBlocks = extractCommandBlocks(source);
    for (const command of commandBlocks) {
      if (command.id.endsWith("_basic_finisher") && !command.block.includes('basicAttackVariant: "final_strike"')) {
        findings.push({ severity: "error", message: `${base}:${command.id} should declare basicAttackVariant: "final_strike"` });
      }
      if (command.id.endsWith("_basic_dive") && !command.block.includes('basicAttackVariant: "dive_attack"')) {
        findings.push({ severity: "error", message: `${base}:${command.id} should declare basicAttackVariant: "dive_attack"` });
      }
      if (
        command.block.includes('variant: "enhanced_')
        && !command.block.includes("hiddenInLibrary: true")
      ) {
        findings.push({ severity: "warn", message: `${base}:${command.id} enhanced variant is not hiddenInLibrary` });
      }
    }
  }

  for (const base of implementedBases) {
    if (!importedByFile.has(base)) {
      findings.push({ severity: "error", message: `characters.ts is missing import for ./chars/${base}` });
      continue;
    }
    const constName = importedByFile.get(base);
    if (constName && !listedConsts.has(constName)) {
      findings.push({ severity: "error", message: `characters.ts imports ${constName} but does not include it in CHARACTERS` });
    }
  }

  for (const [fileBase, constName] of importedByFile) {
    if (!implementedBases.includes(fileBase)) {
      findings.push({ severity: "error", message: `characters.ts imports ${constName} from ./chars/${fileBase}, but file is missing` });
    }
  }

  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warn");

  if (findings.length === 0) {
    console.log("Character pipeline audit: no findings.");
    return;
  }

  for (const finding of findings) {
    const label = finding.severity.toUpperCase().padEnd(5, " ");
    console.log(`${label} ${finding.message}`);
  }

  console.log(
    `\nCharacter pipeline audit summary: ${errors.length} error(s), ${warnings.length} warning(s).`,
  );

  if (errors.length > 0 || (strict && warnings.length > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
