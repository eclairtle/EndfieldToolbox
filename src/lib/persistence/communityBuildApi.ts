import { GEARS } from "@/data/gears";
import type { BuildStoreStateSnapshot, CharacterBuildSlot } from "@/stores/buildStore";
import type { SavedBuild } from "@/stores/buildListStore";
import { getStageDisplayName, resolveBuildStageSettings } from "@/lib/stages/stageSettings";

const COMMUNITY_API_BASE_URL = "http://localhost:8000";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function variantSource(slot: CharacterBuildSlot, variantIndex: number, activeVariantIndex: number) {
  const cached = slot.characterBuilds?.[slot.selectedCharId];
  return variantIndex === activeVariantIndex || !Array.isArray(cached) || !cached[variantIndex]
    ? slot
    : cached[variantIndex]!;
}

function canonicalVariant(slot: CharacterBuildSlot, variantIndex: number, activeVariantIndex: number) {
  const source = variantSource(slot, variantIndex, activeVariantIndex);
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

function canonicalParty(snapshot: BuildStoreStateSnapshot) {
  const activeVariantIndex = snapshot.activeVariantIndex ?? 0;
  return {
    activeVariantIndex,
    slots: snapshot.slots.map((slot, slotIndex) => {
      const serialized: string[] = [];
      const variants = [0, 1, 2, 3].map((variantIndex) => {
        const build = canonicalVariant(slot, variantIndex, activeVariantIndex);
        const value = JSON.stringify(build);
        const sameAsVariantIndex = serialized.indexOf(value);
        serialized.push(value);
        return sameAsVariantIndex >= 0
          ? { index: variantIndex, sameAsVariantIndex }
          : { index: variantIndex, build };
      });
      return {
        slot: slotIndex,
        label: slot.label ?? `Character ${slotIndex + 1}`,
        activeBuffs: clone(slot.activeBuffs ?? []),
        variants,
      };
    }),
  };
}

function effectivePreviewStage(build: SavedBuild) {
  const schemes = build.rotationState.schemes;
  let sourceIndex = schemes.length - 1;
  while (sourceIndex > 0 && schemes[sourceIndex]?.simulationMode === "relay_from_previous") sourceIndex -= 1;
  const settings = schemes[sourceIndex]?.stageSettings ?? build.stageSettings;
  const resolved = resolveBuildStageSettings(settings, build.customStages ?? []);
  const kind = settings.mode === "custom" ? "custom" as const : "preset" as const;
  const id = kind === "custom" ? settings.customStageId ?? resolved.id : settings.presetId;
  return {
    kind,
    id,
    name: getStageDisplayName(resolved, "en"),
    nameByLocale: { "zh-CN": getStageDisplayName(resolved, "zh-CN") },
  };
}

export function makeCommunityBuildUpload(build: SavedBuild, username: string) {
  const gearById = new Map(GEARS.map((gear) => [gear.id, gear]));
  const activeVariantIndex = build.currentBuildState.activeVariantIndex ?? 0;
  const previewSlots = build.currentBuildState.slots.map((slot, slotIndex) => {
    const source = variantSource(slot, activeVariantIndex, activeVariantIndex);
    const gearIds = [source.armor, source.gloves, source.kit1, source.kit2]
      .map((gear) => gear?.gearId ?? null);
    return {
      slot: slotIndex,
      characterId: slot.selectedCharId,
      weaponId: source.selectedWeaponId,
      gearIds,
      gearSetIds: [...new Set(gearIds.flatMap((id) => {
        const setName = id ? gearById.get(id)?.set : null;
        return setName ? [setName] : [];
      }))],
    };
  });
  return {
    schemaVersion: 1,
    username: username.trim() || null,
    currentParty: canonicalParty(build.currentBuildState),
    plannedParty: canonicalParty(build.plannedBuildState),
    preview: {
      name: build.name,
      description: build.description ?? "",
      nameByLocale: clone(build.nameByLocale ?? {}),
      descriptionByLocale: clone(build.descriptionByLocale ?? {}),
      slots: previewSlots,
      stage: effectivePreviewStage(build),
      summary: clone(build.summary),
    },
    rotations: build.rotationState.schemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.name || "Rotation",
      description: scheme.description ?? "",
      nameByLocale: clone(scheme.nameByLocale ?? {}),
      descriptionByLocale: clone(scheme.descriptionByLocale ?? {}),
      simulationMode: scheme.simulationMode ?? "independent",
      teamSpConfig: clone(scheme.teamSpConfig ?? null),
      activeContracts: clone(scheme.activeContracts ?? []),
      triggers: clone(scheme.triggers ?? []),
      triggerVariables: clone(scheme.triggerVariables ?? []),
      stageSettings: clone(scheme.stageSettings ?? null),
      rotation: {
        steps: clone(scheme.rotation.steps ?? []),
        enemySteps: clone(scheme.rotation.enemySteps ?? []),
        groups: clone((scheme.rotation.groups ?? []).map((group) => ({ ...group, name: group.name || "Group" }))),
        critRiggingRules: clone(scheme.rotation.critRiggingRules ?? []),
      },
    })),
    stageSettings: clone(build.stageSettings),
    customStages: clone(build.customStages ?? []),
    damageTallyTiming: clone(build.damageTallyTiming),
    compareSettings: clone(build.compareSettings ?? { enabled: false, leftVariantIndex: 0, rightVariantIndex: 1 }),
    enemySlots: clone(build.rotationState.enemySlots ?? []),
    targetedEnemySlotId: build.rotationState.targetedEnemySlotId ?? null,
    selectedEnemyId: build.rotationState.selectedEnemyId,
    enemyLevel: build.rotationState.enemyLevel,
    activeRotationId: build.rotationState.activeSchemeId || null,
  };
}

export async function submitCommunityBuild(build: SavedBuild, username: string) {
  const response = await fetch(`${COMMUNITY_API_BASE_URL}/builds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(makeCommunityBuildUpload(build, username)),
  });
  if (!response.ok) {
    let detail = `Upload failed (${response.status})`;
    try {
      const body = await response.json() as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (body.detail) detail = JSON.stringify(body.detail);
    } catch { /* response was not JSON */ }
    throw new Error(detail);
  }
  return await response.json() as { buildId: string };
}
