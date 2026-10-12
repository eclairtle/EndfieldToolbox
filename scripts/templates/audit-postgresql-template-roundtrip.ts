import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import detailSeed from "../../src/data/postgresqlTemplateBuildDetails.json";
import previewSeed from "../../src/data/postgresqlTemplateBuildPreviews.json";
import { interpretPostgresqlBuildPreviews, interpretPostgresqlBuildRows } from "../../src/lib/persistence/postgresqlBuildSchema";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const legacyDefault = JSON.parse(fs.readFileSync(path.join(root, "database/backups/templates/defaultTemplateBuilds.editor-backup.json"), "utf8"));
const legacyMarble = JSON.parse(fs.readFileSync(path.join(root, "database/backups/templates/marbleAggeloimorai24sTemplate.editor-backup.json"), "utf8"));
const legacyTyphoeus = JSON.parse(fs.readFileSync(path.join(root, "database/backups/templates/typhoeusPowerfulDecapitationTemplate.editor-backup.json"), "utf8"));
const legacyBuilds = [...legacyDefault.builds, legacyMarble, legacyTyphoeus];
const interpreted = interpretPostgresqlBuildRows(detailSeed);
const previews = interpretPostgresqlBuildPreviews(previewSeed);

const comparableVariant = (slot: any, variantIndex: number, activeVariantIndex: number) => {
  const cached = slot.characterBuilds?.[slot.selectedCharId]?.[variantIndex];
  const source = variantIndex === activeVariantIndex || !cached ? slot : cached;
  return {
    characterId: slot.selectedCharId,
    characterAscension: source.characterAscension,
    characterPotential: source.characterPotential,
    level: source.level,
    characterTalentToggles: source.characterTalentToggles ?? {},
    uniqueTalentToggles: source.uniqueTalentToggles ?? {},
    characterSkillLevels: source.characterSkillLevels ?? {},
    selectedWeaponId: source.selectedWeaponId,
    weaponAscension: source.weaponAscension,
    weaponPotential: source.weaponPotential,
    weaponLevel: source.weaponLevel,
    weaponSkillLevels: source.weaponSkillLevels ?? [],
    armor: source.armor ?? null,
    gloves: source.gloves ?? null,
    kit1: source.kit1 ?? null,
    kit2: source.kit2 ?? null,
  };
};

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  const canonicalize = (value: any): any => Array.isArray(value)
    ? value.map(canonicalize)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
      : value;
  const actualText = JSON.stringify(canonicalize(actual));
  const expectedText = JSON.stringify(canonicalize(expected));
  if (actualText !== expectedText) {
    let index = 0;
    while (actualText[index] === expectedText[index] && index < actualText.length && index < expectedText.length) index += 1;
    throw new Error(`Round-trip mismatch: ${label} near ${actualText.slice(Math.max(0, index - 80), index + 120)} <> ${expectedText.slice(Math.max(0, index - 80), index + 120)}`);
  }
};

for (const legacy of legacyBuilds) {
  const restored = interpreted.builds.find((build) => build.id === legacy.id);
  const preview = previews.builds.find((build) => build.id === legacy.id);
  if (!restored) throw new Error(`Missing restored build ${legacy.id}`);
  if (!preview) throw new Error(`Missing preview ${legacy.id}`);
  assertEqual(preview.slots, legacy.currentBuildState.slots.map((slot: any, slotIndex: number) => ({
    slot: slotIndex,
    characterId: slot.selectedCharId,
    weaponId: slot.selectedWeaponId,
    gearIds: [slot.armor, slot.gloves, slot.kit1, slot.kit2].map((gear: any) => gear?.gearId ?? null),
  })), `${legacy.id}.previewSlots`);
  for (const stateKey of ["currentBuildState", "plannedBuildState"] as const) {
    const before = legacy[stateKey];
    const after = restored[stateKey];
    const activeVariantIndex = before.activeVariantIndex ?? 0;
    assertEqual(after.activeVariantIndex, activeVariantIndex, `${legacy.id}.${stateKey}.activeVariantIndex`);
    for (let slotIndex = 0; slotIndex < 4; slotIndex += 1) {
      for (let variantIndex = 0; variantIndex < 4; variantIndex += 1) {
        const expected = comparableVariant(before.slots[slotIndex], variantIndex, activeVariantIndex);
        const actualSlot = after.slots[slotIndex];
        const variant = actualSlot.characterBuilds[actualSlot.selectedCharId]?.[variantIndex] ?? actualSlot;
        const actual = comparableVariant({ ...actualSlot, ...variant, characterBuilds: {} }, 0, 0);
        assertEqual(actual, expected, `${legacy.id}.${stateKey}.slot${slotIndex}.variant${variantIndex}`);
      }
    }
  }
  assertEqual(restored.rotationState.schemes.map((scheme) => scheme.rotation), legacy.rotationState.schemes.map((scheme: any) => scheme.rotation), `${legacy.id}.rotations`);
  assertEqual(restored.rotationState.enemySlots ?? [], legacy.rotationState.enemySlots ?? [], `${legacy.id}.enemySlots`);
  assertEqual(restored.customStages ?? [], legacy.customStages ?? [], `${legacy.id}.customStages`);
}

console.log(`PostgreSQL template round-trip passed for ${legacyBuilds.length} builds.`);
