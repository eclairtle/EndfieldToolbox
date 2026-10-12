import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultBackupPath = path.join(root, "database/backups/templates/defaultTemplateBuilds.editor-backup.json");
const marbleBackupPath = path.join(root, "database/backups/templates/marbleAggeloimorai24sTemplate.editor-backup.json");
const typhoeusBackupPath = path.join(root, "database/backups/templates/typhoeusPowerfulDecapitationTemplate.editor-backup.json");
const previewOutputPath = path.join(root, "src/data/postgresqlTemplateBuildPreviews.json");
const detailOutputPath = path.join(root, "src/data/postgresqlTemplateBuildDetails.json");

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const defaults = JSON.parse(fs.readFileSync(defaultBackupPath, "utf8"));
const marble = JSON.parse(fs.readFileSync(marbleBackupPath, "utf8"));
const typhoeus = JSON.parse(fs.readFileSync(typhoeusBackupPath, "utf8"));
const templates = [...defaults.builds, marble, typhoeus];

function selectedVariantBuild(slot, variantIndex, activeVariantIndex) {
  const cached = slot.characterBuilds?.[slot.selectedCharId];
  const source = variantIndex === activeVariantIndex || !Array.isArray(cached) || !cached[variantIndex]
    ? slot
    : cached[variantIndex];
  return {
    characterId: slot.selectedCharId,
    characterAscension: source.characterAscension,
    characterPotential: source.characterPotential,
    level: source.level,
    characterTalentToggles: clone(source.characterTalentToggles ?? {}),
    uniqueTalentToggles: clone(source.uniqueTalentToggles ?? {}),
    characterSkillLevels: clone(source.characterSkillLevels ?? {}),
    weapon: {
      weaponId: source.selectedWeaponId,
      weaponAscension: source.weaponAscension,
      weaponPotential: source.weaponPotential,
      weaponLevel: source.weaponLevel,
      weaponSkillLevels: clone(source.weaponSkillLevels ?? []),
    },
    gear: {
      armor: clone(source.armor ?? null),
      gloves: clone(source.gloves ?? null),
      kit1: clone(source.kit1 ?? null),
      kit2: clone(source.kit2 ?? null),
    },
  };
}

function canonicalParty(snapshot) {
  const activeVariantIndex = Number.isInteger(snapshot?.activeVariantIndex) ? snapshot.activeVariantIndex : 0;
  return {
    activeVariantIndex,
    slots: (snapshot?.slots ?? []).map((slot, slotIndex) => {
      const variants = [];
      const canonicalByIndex = [];
      for (let variantIndex = 0; variantIndex < 4; variantIndex += 1) {
        const build = selectedVariantBuild(slot, variantIndex, activeVariantIndex);
        const serialized = JSON.stringify(build);
        const sameAsVariantIndex = canonicalByIndex.findIndex((entry) => entry === serialized);
        variants.push(sameAsVariantIndex >= 0
          ? { index: variantIndex, sameAsVariantIndex }
          : { index: variantIndex, build });
        canonicalByIndex.push(serialized);
      }
      return {
        slot: slotIndex,
        label: slot.label ?? `Character ${slotIndex + 1}`,
        activeBuffs: clone(slot.activeBuffs ?? []),
        variants,
      };
    }),
  };
}

function previewStage(build) {
  const schemes = build.rotationState?.schemes ?? [];
  if (schemes.length === 0) {
    return { kind: "preset", id: "none", name: "None", nameByLocale: { "zh-CN": "无" } };
  }
  let sourceIndex = schemes.length - 1;
  while (sourceIndex > 0 && schemes[sourceIndex]?.simulationMode === "relay_from_previous") {
    sourceIndex -= 1;
  }
  const settings = schemes[sourceIndex]?.stageSettings ?? build.stageSettings ?? {};
  if (settings.mode === "custom") {
    const custom = (build.customStages ?? []).find((stage) => stage.id === settings.customStageId);
    return {
      kind: "custom",
      id: custom?.id ?? settings.customStageId ?? "custom",
      name: custom?.name ?? settings.custom?.name ?? "Custom Stage",
      nameByLocale: { "zh-CN": custom?.name_cn ?? settings.custom?.name_cn ?? "自定义关卡" },
    };
  }
  const id = ["contingency_contracts", "powerful_decapitation"].includes(settings.presetId)
    ? settings.presetId
    : "none";
  if (id === "powerful_decapitation") {
    return { kind: "preset", id, name: "Powerful Decapitation", nameByLocale: { "zh-CN": "斩首蓄势" } };
  }
  return id === "contingency_contracts"
    ? { kind: "preset", id, name: "Contingency Contracts", nameByLocale: { "zh-CN": "危机合约" } }
    : { kind: "preset", id, name: "None", nameByLocale: { "zh-CN": "无" } };
}

const seed = {
  schemaVersion: 1,
  activeBuildId: defaults.activeBuildId,
  builds: [],
  buildPreviews: [],
  buildRevisions: [],
  rotations: [],
  rotationSteps: [],
  enemySteps: [],
  rotationGroups: [],
  critRiggingRules: [],
  simulationSummaries: [],
};

for (const build of templates) {
  const revisionId = `${build.id}:revision:1`;
  const currentParty = canonicalParty(build.currentBuildState);
  const plannedParty = canonicalParty(build.plannedBuildState);
  seed.builds.push({
    id: build.id,
    currentRevisionId: revisionId,
    name: build.name,
    description: build.description ?? "",
    nameByLocale: clone(build.nameByLocale ?? {}),
    descriptionByLocale: clone(build.descriptionByLocale ?? {}),
  });
  seed.buildRevisions.push({
    id: revisionId,
    buildId: build.id,
    revisionNumber: 1,
    currentParty,
    plannedParty,
    stageSettings: clone(build.stageSettings),
    customStages: clone(build.customStages ?? []),
    damageTallyTiming: clone(build.damageTallyTiming),
    compareSettings: clone(build.compareSettings ?? { enabled: false, leftVariantIndex: 0, rightVariantIndex: 1 }),
    enemySlots: clone(build.rotationState?.enemySlots ?? []),
    targetedEnemySlotId: build.rotationState?.targetedEnemySlotId ?? null,
    selectedEnemyId: build.rotationState?.selectedEnemyId ?? "rhodagn",
    enemyLevel: build.rotationState?.enemyLevel ?? 90,
    activeRotationId: build.rotationState?.activeSchemeId ?? null,
  });
  for (const [position, scheme] of (build.rotationState?.schemes ?? []).entries()) {
    const rotationId = `${revisionId}:rotation:${position + 1}`;
    seed.rotations.push({
      id: rotationId,
      schemeId: scheme.id,
      revisionId,
      position,
      name: scheme.name,
      description: scheme.description ?? "",
      nameByLocale: clone(scheme.nameByLocale ?? {}),
      descriptionByLocale: clone(scheme.descriptionByLocale ?? {}),
      simulationMode: scheme.simulationMode ?? "independent",
      teamSpConfig: clone(scheme.teamSpConfig ?? null),
      activeContracts: clone(scheme.activeContracts ?? []),
      triggers: clone(scheme.triggers ?? []),
      triggerVariables: clone(scheme.triggerVariables ?? []),
      stageSettings: clone(scheme.stageSettings ?? null),
    });
    for (const [sequence, step] of (scheme.rotation?.steps ?? []).entries()) {
      seed.rotationSteps.push({ rotationId, sequence, ...clone(step) });
    }
    for (const [sequence, step] of (scheme.rotation?.enemySteps ?? []).entries()) {
      seed.enemySteps.push({ rotationId, sequence, ...clone(step) });
    }
    for (const [sequence, group] of (scheme.rotation?.groups ?? []).entries()) {
      seed.rotationGroups.push({ rotationId, sequence, ...clone(group) });
    }
    for (const [sequence, rule] of (scheme.rotation?.critRiggingRules ?? []).entries()) {
      seed.critRiggingRules.push({ rotationId, sequence, ...clone(rule) });
    }
  }
  seed.simulationSummaries.push({
    revisionId,
    ...clone(build.summary ?? { totalDamage: null, dps: null, updatedAt: null }),
  });
  seed.buildPreviews.push({
    buildId: build.id,
    name: build.name,
    description: build.description ?? "",
    nameByLocale: clone(build.nameByLocale ?? {}),
    descriptionByLocale: clone(build.descriptionByLocale ?? {}),
    slots: (build.currentBuildState?.slots ?? []).map((slot, slotIndex) => ({
      slot: slotIndex,
      characterId: slot.selectedCharId,
      weaponId: slot.selectedWeaponId,
      gearIds: [slot.armor, slot.gloves, slot.kit1, slot.kit2].map((gear) => gear?.gearId ?? null),
    })),
    stage: previewStage(build),
    summary: clone(build.summary ?? { totalDamage: null, dps: null, updatedAt: null }),
  });
}

const previewSeed = {
  schemaVersion: seed.schemaVersion,
  activeBuildId: seed.activeBuildId,
  buildPreviews: seed.buildPreviews,
};
const { buildPreviews: _buildPreviews, ...detailSeed } = seed;
fs.writeFileSync(previewOutputPath, `${JSON.stringify(previewSeed)}\n`);
fs.writeFileSync(detailOutputPath, `${JSON.stringify(detailSeed)}\n`);
console.log(`Wrote ${templates.length} previews to ${path.relative(root, previewOutputPath)}`);
console.log(`Wrote lazy build details to ${path.relative(root, detailOutputPath)}`);
