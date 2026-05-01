import { en } from "../../src/i18n/locales/en";
import { zhCN } from "../../src/i18n/locales/zh-CN";

type JsonLike = string | number | boolean | null | JsonLike[] | { [key: string]: JsonLike };

function collectMissingPaths(source: JsonLike, target: JsonLike, prefix = ""): string[] {
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) {
      return [prefix || "<root>"];
    }

    const missing: string[] = [];
    for (let i = 0; i < source.length; i += 1) {
      missing.push(...collectMissingPaths(source[i] as JsonLike, target[i] as JsonLike, `${prefix}[${i}]`));
    }
    return missing;
  }

  if (source && typeof source === "object") {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      return [prefix || "<root>"];
    }

    const missing: string[] = [];
    for (const [key, value] of Object.entries(source)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (!(key in (target as Record<string, JsonLike>))) {
        missing.push(nextPrefix);
        continue;
      }
      missing.push(...collectMissingPaths(value as JsonLike, (target as Record<string, JsonLike>)[key] as JsonLike, nextPrefix));
    }
    return missing;
  }

  if (target === undefined) {
    return [prefix || "<root>"];
  }

  return [];
}

function failIfMissing(missing: string[], label: string) {
  if (missing.length === 0) {
    return;
  }

  console.error(`${label} coverage failed with ${missing.length} missing entries:`);
  for (const entry of missing.slice(0, 100)) {
    console.error(`  - ${entry}`);
  }
  if (missing.length > 100) {
    console.error(`  ...and ${missing.length - 100} more`);
  }
  process.exit(1);
}

function main() {
  const missingLocaleKeys = collectMissingPaths(en as unknown as JsonLike, zhCN as unknown as JsonLike);
  failIfMissing(missingLocaleKeys, "Locale keys");
  console.log("i18n coverage check passed.");
}

main();
