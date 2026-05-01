import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../../src/i18n/locales/en";
import { zhCN } from "../../src/i18n/locales/zh-CN";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const args = new Set(process.argv.slice(2));
const preserve = !args.has("--overwrite");

function mergeWithPreserve(source: JsonValue, existing: JsonValue): JsonValue {
  if (Array.isArray(source)) {
    if (!preserve || !Array.isArray(existing)) {
      return source;
    }
    return source.map((value, index) => mergeWithPreserve(value, existing[index] as JsonValue));
  }

  if (source && typeof source === "object") {
    const out: Record<string, JsonValue> = {};
    const existingRecord = existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, JsonValue>)
      : {};

    for (const [key, value] of Object.entries(source as Record<string, JsonValue>)) {
      out[key] = mergeWithPreserve(value, existingRecord[key]);
    }

    return out;
  }

  if (preserve && existing !== undefined && typeof existing === typeof source) {
    return existing;
  }

  return source;
}

function toTsLiteral(value: JsonValue, indent = 0): string {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const rows = value.map((entry) => `${" ".repeat(indent + 2)}${toTsLiteral(entry, indent + 2)}`);
    return `[\n${rows.join(",\n")}\n${pad}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }
    const rows = entries.map(([key, entryValue]) => `${" ".repeat(indent + 2)}${JSON.stringify(key)}: ${toTsLiteral(entryValue, indent + 2)}`);
    return `{\n${rows.join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

async function main() {
  const merged = mergeWithPreserve(en as unknown as JsonValue, zhCN as unknown as JsonValue);

  const fileText = `import type { MessageSchema } from \"./en\";\n\nexport const zhCN: MessageSchema = ${toTsLiteral(merged)};\n`;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const target = path.resolve(__dirname, "../../src/i18n/locales/zh-CN.ts");
  await writeFile(target, fileText, "utf8");

  const mode = preserve ? "preserve" : "overwrite";
  console.log(`Updated zh-CN locale from EN (${mode} mode): ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
