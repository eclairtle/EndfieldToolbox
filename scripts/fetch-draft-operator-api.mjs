#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRAFTS_DIR = path.join(ROOT, "src/data/chars/drafts");
const OUTPUT_DIR = path.join(DRAFTS_DIR, "raw");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const API_BASE = "https://api.warfarin.wiki/v1/en/operators";
const MAX_RETRIES = 4;

const SKIP_FILES = new Set(["index.ts", "types.ts"]);

function extractWikiSlug(source, filePath) {
  const match = source.match(/wikiUrl:\s*"https:\/\/warfarin\.wiki\/en\/operators\/([^"]+)"/);
  if (!match) {
    throw new Error(`Could not find wikiUrl in ${filePath}`);
  }
  return match[1];
}

async function collectDraftTargets() {
  const entries = await fs.readdir(DRAFTS_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !SKIP_FILES.has(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const targets = [];

  for (const file of files) {
    const absPath = path.join(DRAFTS_DIR, file);
    const content = await fs.readFile(absPath, "utf8");
    const slug = extractWikiSlug(content, file);
    targets.push({
      file,
      slug,
      url: `${API_BASE}/${slug}`,
      outPath: path.join(OUTPUT_DIR, `${slug}.json`),
    });
  }

  return targets;
}

async function fetchRawJson(target) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(target.url, {
        headers: {
          "User-Agent": "EndfieldToolbox/1.0",
          "Accept": "application/json",
        },
      });

      const body = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
      }

      // Validate JSON so bad payloads are caught early.
      JSON.parse(body);
      await fs.writeFile(target.outPath, body, "utf8");

      return {
        status: response.status,
        bytes: Buffer.byteLength(body, "utf8"),
        attempt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }
  }

  throw lastError;
}

async function main() {
  const force = process.argv.includes("--force");
  const onlyMissing = process.argv.includes("--only-missing");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const targets = await collectDraftTargets();
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: API_BASE,
    mode: onlyMissing ? "only-missing" : (force ? "force-refresh" : "default"),
    retriesPerRequest: MAX_RETRIES,
    totalDrafts: targets.length,
    downloadedCount: 0,
    cachedCount: 0,
    failureCount: 0,
    entries: [],
  };

  for (const target of targets) {
    const output = path.relative(ROOT, target.outPath);
    let exists = false;
    let existingBytes = 0;

    try {
      const stat = await fs.stat(target.outPath);
      exists = stat.isFile();
      existingBytes = stat.size;
    } catch {
      exists = false;
    }

    if (!force && exists) {
      manifest.cachedCount += 1;
      manifest.entries.push({
        file: target.file,
        slug: target.slug,
        apiUrl: target.url,
        output,
        ok: true,
        source: "cached",
        bytes: existingBytes,
      });
      console.log(`SKIP ${target.slug} (cached: ${existingBytes} bytes)`);
      continue;
    }

    if (onlyMissing && exists) {
      manifest.cachedCount += 1;
      manifest.entries.push({
        file: target.file,
        slug: target.slug,
        apiUrl: target.url,
        output,
        ok: true,
        source: "cached",
        bytes: existingBytes,
      });
      continue;
    }

    try {
      const result = await fetchRawJson(target);
      manifest.downloadedCount += 1;
      manifest.entries.push({
        file: target.file,
        slug: target.slug,
        apiUrl: target.url,
        output,
        ok: true,
        source: "downloaded",
        httpStatus: result.status,
        bytes: result.bytes,
        attempt: result.attempt,
      });
      console.log(`OK   ${target.slug} (${result.bytes} bytes, attempt ${result.attempt})`);
    } catch (error) {
      manifest.failureCount += 1;
      manifest.entries.push({
        file: target.file,
        slug: target.slug,
        apiUrl: target.url,
        output,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAIL ${target.slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`\nSaved manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
  console.log(`Downloaded: ${manifest.downloadedCount}, Cached: ${manifest.cachedCount}, Failed: ${manifest.failureCount}`);

  if (manifest.failureCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
