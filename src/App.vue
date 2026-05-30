<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useBuildStore, type BuildStoreStateSnapshot, type CharacterBuildSlot } from "@/stores/buildStore";
import { useBuildListStore, type DamageTallyTiming } from "@/stores/buildListStore";

import CharacterCard from "@/components/cards/characterCard.vue";
import WeaponCard from "@/components/cards/weaponCard.vue";
import GearCard from "@/components/cards/gearCard.vue";
import SummaryPanel from "@/components/panels/summaryPanel.vue";
import BuildListPage from "@/components/pages/BuildListPage.vue";
import { useEnemyState } from "@/composables/useEnemyState";
import { CHARACTERS, type CharacterBase } from "@/data/characters";
import { WEAPONS, type WeaponBase } from "@/data/weapons";
import { GEARS, type GearBase } from "@/data/gears";
import RotationWorkspace from "@/components/workspaces/RotationWorkspace.vue";
import { useRotationSchemes } from "@/lib/combat/rotationSchemes";
import { buildPartySnapshots, buildPartySnapshotsByVariant } from "@/lib/combat/buildSnapshots";
import { makeEnemyModifierSnapshot, simulateRotation } from "@/lib/combat/simulateRotation";
import type { CharacterCombatSnapshot } from "@/lib/combat/rotation";
import {
  buildEnemyActionWindows,
  getDefaultEnemyCommandPlacements,
  type EnemyCommandPlacement,
} from "@/lib/enemy/enemyActionWindows";
import { computeFinalStats, makeBaseModifierStats, MODIFIER_STAT_KEYS, type FinalStats, type ModifierStatKey } from "@/lib/build/stats";
import { combineModifierPartials, getWeaponUniqueStaticModifiers } from "@/lib/combat/weaponEffects";
import { getActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import { applyGears } from "@/lib/build/gearsApply";
import { computeCharacterPlannerCost, computeWeaponPlannerCost } from "@/lib/progression/plannerCosts";
import { buildDeltaCostLines, hasMismatchedWeaponEssence } from "@/lib/progression/buildCostDiff";
import {
  ROTATION_CONTRACTS_STORAGE_KEY,
  ROTATION_ENEMY_COMMANDS_STORAGE_KEY,
  ROTATION_SP_STORAGE_KEY,
} from "@/lib/storageKeys";
import { useLocale } from "@/i18n/useLocale";
import { getCharacterDisplayNameByCharacter, getWeaponDisplayNameByWeapon } from "@/i18n/domain/displayNames";
import { getCharacterImagePath, getWeaponImagePath, getGearImagePath, toAssetUrl } from "@/lib/assets/imagePaths";
import { getEnemyDisplayName } from "@/data/enemyCustomNames";
import type { ActiveContingencyContract } from "@/lib/combat/contracts";

const currentBuildSnapshot = ref<BuildStoreStateSnapshot | null>(null);
const isHydratingBuildDetail = ref(false);
const compareBuildsEnabled = ref(false);
const compareTargetVariantIndex = ref(1);
const setToSourceVariantIndex = ref(0);
const debugModeEnabled = ref(false);
const mobileSummaryOpen = ref(false);
const confirmResetGuestOpen = ref(false);

const buildStore = useBuildStore();
const buildListStore = useBuildListStore();
const {
  slots,
  activeSlotIndex,
  activeSlot,
  selectedChar,
  selectedWeapon,
  availableWeapons,
  armorOptions,
  gloveOptions,
  kitOptions,
  selectedGearObjects,
  activeGearSet,
  benchmarkResults,
  out,
  activeVariantIndex,
} = storeToRefs(buildStore);
const { builds, activeBuildId } = storeToRefs(buildListStore);
const { t, locale, setLocale } = useLocale();
const route = useRoute();
const router = useRouter();
const activeDamageTallyTiming = computed<DamageTallyTiming>(() =>
  buildListStore.activeBuild?.damageTallyTiming ?? { enabled: false, startTime: 0, endTime: 60 },
);

const routeBuildId = computed(() =>
  typeof route.params.buildId === "string" ? route.params.buildId : "",
);

function isBuildDetailRouteName(name: unknown): name is "build-builder" | "build-rotation" {
  return name === "build-builder" || name === "build-rotation";
}

const page = computed<"build-list" | "build-detail">(() =>
  isBuildDetailRouteName(route.name) ? "build-detail" : "build-list",
);

const workspace = computed<"builder" | "rotation">({
  get: () => (route.name === "build-rotation" ? "rotation" : "builder"),
  set: (value) => {
    if (page.value !== "build-detail") {
      return;
    }
    const buildId = routeBuildId.value || activeBuildId.value;
    if (!buildId) {
      return;
    }
    const targetRouteName = value === "rotation" ? "build-rotation" : "build-builder";
    if (route.name === targetRouteName && routeBuildId.value === buildId) {
      return;
    }
    void router.push({ name: targetRouteName, params: { buildId } });
  },
});

const {
  ENEMIES,
  selectedEnemyId,
  selectedEnemy,
  enemyLevel,
  resolvedEnemyStats,
} = useEnemyState();
const selectedEnemyDisplayName = computed(() =>
  getEnemyDisplayName(selectedEnemy.value.id, selectedEnemy.value.name, locale.value as "en" | "zh-CN"),
);
const selectedEnemyIconPath = computed(() => toAssetUrl(`/item-icons/enemies/${selectedEnemy.value.id}.webp`));

const {
  rotationSchemes,
  activeScheme,
  setActiveScheme,
  hydrateRotationSchemes,
  exportRotationSchemes,
  resetRotationSchemes,
} = useRotationSchemes(activeBuildId);

const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";

function getBuildStorageScopeId(): string {
  return activeBuildId.value || BUILD_STORAGE_SCOPE_DEFAULT;
}

function getBattleStartConsumableIdsForActiveScheme(): (string | null)[] {
  if (typeof window === "undefined") {
    return [null, null, null, null];
  }
  const raw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
  if (!raw) {
    return [null, null, null, null];
  }
  try {
    const parsed = JSON.parse(raw) as {
      byBuild?: Record<string, { byScheme?: Record<string, { consumableBySlot?: (string | null)[] }> }>;
      byScheme?: Record<string, { consumableBySlot?: (string | null)[] }>;
    };
    const fromByBuild = parsed.byBuild?.[getBuildStorageScopeId()]?.byScheme?.[activeScheme.value.id]?.consumableBySlot;
    const fromLegacy = parsed.byScheme?.[activeScheme.value.id]?.consumableBySlot;
    const source = fromByBuild ?? fromLegacy ?? [];
    return [0, 1, 2, 3].map((index) => {
      const value = source[index];
      return typeof value === "string" && value.length > 0 ? value : null;
    });
  } catch {
    return [null, null, null, null];
  }
}

function getEnemyCommandPlacementsForActiveScheme(): EnemyCommandPlacement[] {
  if (typeof window === "undefined") {
    return getDefaultEnemyCommandPlacements(selectedEnemyId.value);
  }
  const raw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
  if (!raw) {
    return getDefaultEnemyCommandPlacements(selectedEnemyId.value);
  }
  try {
    const parsed = JSON.parse(raw) as {
      byBuild?: Record<string, { byScheme?: Record<string, Record<string, EnemyCommandPlacement[]>> }>;
      byScheme?: Record<string, Record<string, EnemyCommandPlacement[]>>;
    };
    const fromByBuild = parsed.byBuild?.[getBuildStorageScopeId()]?.byScheme?.[activeScheme.value.id]?.[selectedEnemyId.value];
    const fromLegacy = parsed.byScheme?.[activeScheme.value.id]?.[selectedEnemyId.value];
    const source = fromByBuild ?? fromLegacy;
    if (!Array.isArray(source)) {
      return getDefaultEnemyCommandPlacements(selectedEnemyId.value);
    }
    return source.map((entry) => ({
      id: entry.id,
      commandId: entry.commandId,
      startTime: Math.max(0, Number(entry.startTime ?? 0)),
      interrupted: entry.interrupted === true,
      interruptedSpGain: Math.max(0, Number(entry.interruptedSpGain ?? 0)),
      interruptedStagger: Math.max(0, Number(entry.interruptedStagger ?? 0)),
    }));
  } catch {
    return getDefaultEnemyCommandPlacements(selectedEnemyId.value);
  }
}

watch(
  () => rotationSchemes.value.enemyLevel,
  (value) => {
    const normalized = Math.max(1, Math.min(100, Math.round(value)));
    if (enemyLevel.value !== normalized) {
      enemyLevel.value = normalized;
    }
  },
  { immediate: true },
);

watch(enemyLevel, (value) => {
  const normalized = Math.max(1, Math.min(100, Math.round(value)));
  if (rotationSchemes.value.enemyLevel !== normalized) {
    rotationSchemes.value.enemyLevel = normalized;
  }
});

const partySnapshots = computed(() => buildPartySnapshots(slots.value));
const buildCostReactivityStamp = computed(() =>
  JSON.stringify(
    slots.value.map((slot) => ({
      selectedCharId: slot.selectedCharId,
      level: slot.level,
      characterAscension: slot.characterAscension,
      characterPotential: slot.characterPotential,
      characterTalentToggles: slot.characterTalentToggles,
      uniqueTalentToggles: slot.uniqueTalentToggles,
      characterSkillLevels: slot.characterSkillLevels,
      selectedWeaponId: slot.selectedWeaponId,
      weaponLevel: slot.weaponLevel,
      weaponAscension: slot.weaponAscension,
      weaponPotential: slot.weaponPotential,
      weaponSkillLevels: slot.weaponSkillLevels,
    })),
  ),
);

const partyVariantsBySlot = computed(() => {
  const out: Partial<Record<0 | 1 | 2 | 3, CharacterCombatSnapshot[]>> = {};
  for (const variantIndex of [0, 1, 2, 3] as const) {
    const snapshots = buildPartySnapshotsByVariant(slots.value, variantIndex, activeVariantIndex.value);
    for (const snapshot of snapshots) {
      if (!out[snapshot.slot]) {
        out[snapshot.slot] = [null, null, null, null] as unknown as CharacterCombatSnapshot[];
      }
      out[snapshot.slot]![variantIndex] = snapshot;
    }
  }
  return out;
});
function simulateForRotation(rotation: { steps: any[]; groups?: any[] } | null | undefined) {
  if (partySnapshots.value.length === 0 || !rotation) {
    return null;
  }

  return simulateRotation({
    rotation,
    party: partySnapshots.value,
    partyVariantsBySlot: partyVariantsBySlot.value,
    initialVariantIndex: activeVariantIndex.value,
    enemyStats: resolvedEnemyStats.value,
    enemyMods: makeEnemyModifierSnapshot({
      resistances: {
        PHYSICAL_RESIST_PCT: selectedEnemy.value.resistances.Physical,
        HEAT_RESIST_PCT: selectedEnemy.value.resistances.Heat,
        CRYO_RESIST_PCT: selectedEnemy.value.resistances.Cryo,
        ELECTRIC_RESIST_PCT: selectedEnemy.value.resistances.Electric,
        NATURE_RESIST_PCT: selectedEnemy.value.resistances.Nature,
        AETHER_RESIST_PCT: selectedEnemy.value.resistances.Aether,
      },
    }),
    enemyStaggerGauge: selectedEnemy.value.staggerGauge,
    enemyStaggerNodes: selectedEnemy.value.staggerNodes,
    enemyStaggerRecoverySeconds: selectedEnemy.value.staggerRecoverySeconds,
    enemyFinisherMultiplier: selectedEnemy.value.finisherMultiplier,
    enemyFinisherSpGain: selectedEnemy.value.finisherSpGain,
    contingencyContracts: getActiveContractsForActiveScheme(),
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindows(selectedEnemyId.value, getEnemyCommandPlacementsForActiveScheme()),
  });
}

function snapshotForVariant(snapshot: BuildStoreStateSnapshot, variantIndex: number): BuildStoreStateSnapshot {
  const next = cloneBuildSnapshot(snapshot);
  next.activeVariantIndex = variantIndex;
  next.slots = next.slots.map((slot) => {
    const clonedSlot = JSON.parse(JSON.stringify(slot)) as CharacterBuildSlot;
    const sourceActiveVariantIndex = snapshot.activeVariantIndex ?? 0;
    if (variantIndex === sourceActiveVariantIndex) {
      return clonedSlot;
    }
    const selectedCharId = clonedSlot.selectedCharId;
    if (!selectedCharId) {
      return clonedSlot;
    }
    const variants = clonedSlot.characterBuilds[selectedCharId];
    const variant = Array.isArray(variants) ? variants[variantIndex] : null;
    if (!variant) {
      return clonedSlot;
    }
    return {
      ...clonedSlot,
      characterAscension: variant.characterAscension,
      characterPotential: variant.characterPotential,
      level: variant.level,
      characterTalentToggles: { ...variant.characterTalentToggles },
      uniqueTalentToggles: { ...variant.uniqueTalentToggles },
      characterSkillLevels: { ...variant.characterSkillLevels },
      selectedWeaponId: variant.selectedWeaponId,
      weaponAscension: variant.weaponAscension,
      weaponPotential: variant.weaponPotential,
      weaponLevel: variant.weaponLevel,
      weaponSkillLevels: [...variant.weaponSkillLevels],
      armor: variant.armor ? JSON.parse(JSON.stringify(variant.armor)) : null,
      gloves: variant.gloves ? JSON.parse(JSON.stringify(variant.gloves)) : null,
      kit1: variant.kit1 ? JSON.parse(JSON.stringify(variant.kit1)) : null,
      kit2: variant.kit2 ? JSON.parse(JSON.stringify(variant.kit2)) : null,
    };
  });
  return next;
}

function simulateForSnapshot(
  snapshot: BuildStoreStateSnapshot | null | undefined,
  rotation: { steps: any[]; groups?: any[] } | null | undefined,
) {
  if (!snapshot || !rotation) {
    return null;
  }
  const snapshotParty = buildPartySnapshots(snapshot.slots);
  const snapshotVariantsBySlot: Partial<Record<0 | 1 | 2 | 3, CharacterCombatSnapshot[]>> = {};
  for (const variantIndex of [0, 1, 2, 3] as const) {
    const snapshots = buildPartySnapshotsByVariant(snapshot.slots, variantIndex, snapshot.activeVariantIndex ?? 0);
    for (const variantSnapshot of snapshots) {
      if (!snapshotVariantsBySlot[variantSnapshot.slot]) {
        snapshotVariantsBySlot[variantSnapshot.slot] = [null, null, null, null] as unknown as CharacterCombatSnapshot[];
      }
      snapshotVariantsBySlot[variantSnapshot.slot]![variantIndex] = variantSnapshot;
    }
  }
  if (snapshotParty.length === 0) {
    return null;
  }
  return simulateRotation({
    rotation,
    party: snapshotParty,
    partyVariantsBySlot: snapshotVariantsBySlot,
    initialVariantIndex: snapshot.activeVariantIndex ?? 0,
    enemyStats: resolvedEnemyStats.value,
    enemyMods: makeEnemyModifierSnapshot({
      resistances: {
        PHYSICAL_RESIST_PCT: selectedEnemy.value.resistances.Physical,
        HEAT_RESIST_PCT: selectedEnemy.value.resistances.Heat,
        CRYO_RESIST_PCT: selectedEnemy.value.resistances.Cryo,
        ELECTRIC_RESIST_PCT: selectedEnemy.value.resistances.Electric,
        NATURE_RESIST_PCT: selectedEnemy.value.resistances.Nature,
        AETHER_RESIST_PCT: selectedEnemy.value.resistances.Aether,
      },
    }),
    enemyStaggerGauge: selectedEnemy.value.staggerGauge,
    enemyStaggerNodes: selectedEnemy.value.staggerNodes,
    enemyStaggerRecoverySeconds: selectedEnemy.value.staggerRecoverySeconds,
    enemyFinisherMultiplier: selectedEnemy.value.finisherMultiplier,
    enemyFinisherSpGain: selectedEnemy.value.finisherSpGain,
    contingencyContracts: getActiveContractsForActiveScheme(),
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindows(selectedEnemyId.value, getEnemyCommandPlacementsForActiveScheme()),
  });
}

function getActiveContractsForActiveScheme(): ActiveContingencyContract[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(ROTATION_CONTRACTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as {
      byBuild?: Record<string, { byScheme?: Record<string, ActiveContingencyContract[]> }>;
      byScheme?: Record<string, ActiveContingencyContract[]>;
    };
    const fromByBuild = parsed.byBuild?.[getBuildStorageScopeId()]?.byScheme?.[activeScheme.value.id];
    const fromLegacy = parsed.byScheme?.[activeScheme.value.id];
    const source = fromByBuild ?? fromLegacy ?? [];
    if (!Array.isArray(source)) {
      return [];
    }
    return source
      .filter((entry) => entry && typeof entry.id === "string" && Number.isFinite(entry.level))
      .map((entry) => ({ id: entry.id, level: Math.max(1, Math.floor(entry.level)) }));
  } catch {
    return [];
  }
}


function getTallyWindowSummary(
  simulation: ReturnType<typeof simulateRotation> | null | undefined,
  timing: DamageTallyTiming,
): { totalDamage: number; dps: number } {
  if (!simulation) {
    return { totalDamage: 0, dps: 0 };
  }

  const getAutoWindow = () => {
    const actionStart = simulation.actions.length > 0
      ? simulation.actions.reduce((min, action) => Math.min(min, action.realStartTime), Number.POSITIVE_INFINITY)
      : 0;
    const start = Number.isFinite(actionStart) ? Math.max(0, actionStart) : 0;
    const end = simulation.timeline.length > 0
      ? simulation.timeline.reduce((max, entry) => Math.max(max, entry.time), 0)
      : simulation.actions.reduce((max, action) => Math.max(max, action.realEndTime), 0);
    return { start, end };
  };

  if (!timing.enabled) {
    const { start, end } = getAutoWindow();
    const duration = Math.max(0, end - start);
    const totalDamage = simulation.timeline
      .filter((entry) => entry.time >= start - 0.0001 && entry.time <= end + 0.0001)
      .reduce((sum, entry) => sum + entry.damage, 0);
    return {
      totalDamage,
      dps: duration > 0 ? totalDamage / duration : 0,
    };
  }

  const start = Math.min(timing.startTime, timing.endTime);
  const end = Math.max(timing.startTime, timing.endTime);
  const duration = Math.max(0, end - start);
  const totalDamage = simulation.timeline
    .filter((entry) => entry.time >= start - 0.0001 && entry.time <= end + 0.0001)
    .reduce((sum, entry) => sum + entry.damage, 0);
  return {
    totalDamage,
    dps: duration > 0 ? totalDamage / duration : 0,
  };
}

const builderRotationSimulation = computed(() => {
  return simulateForRotation(activeScheme.value.rotation);
});

const builderTallySummary = computed(() =>
  getTallyWindowSummary(builderRotationSimulation.value, activeDamageTallyTiming.value),
);

const builderRotationDps = computed(() => {
  return builderTallySummary.value.dps;
});

const firstSchemeSimulation = computed(() => {
  const firstScheme = rotationSchemes.value.schemes[0];
  return simulateForRotation(firstScheme?.rotation);
});

const firstSchemeDps = computed(() => {
  return getTallyWindowSummary(firstSchemeSimulation.value, activeDamageTallyTiming.value).dps;
});

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];

const builderDamageContributions = computed(() => {
  const simulation = builderRotationSimulation.value;
  if (!simulation) {
    return [];
  }

  const start = activeDamageTallyTiming.value.enabled
    ? Math.min(activeDamageTallyTiming.value.startTime, activeDamageTallyTiming.value.endTime)
    : 0;
  const end = activeDamageTallyTiming.value.enabled
    ? Math.max(activeDamageTallyTiming.value.startTime, activeDamageTallyTiming.value.endTime)
    : simulation.totalTime;
  const damageBySlotInWindow = new Map<number, number>();
  for (const hit of simulation.timeline) {
    if (hit.time < start - 0.0001 || hit.time > end + 0.0001) {
      continue;
    }
    damageBySlotInWindow.set(hit.slot, (damageBySlotInWindow.get(hit.slot) ?? 0) + hit.damage);
  }
  const totalDamage = builderTallySummary.value.totalDamage;
  return simulation.damageBySlot.map((entry, index) => ({
    ...entry,
    damage: damageBySlotInWindow.get(entry.slot) ?? 0,
    color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
    percent: totalDamage > 0 ? ((damageBySlotInWindow.get(entry.slot) ?? 0) / totalDamage) * 100 : 0,
    localizedCharacterName: getCharacterDisplayNameByCharacter(
      CHARACTERS.find((character) => character.id === slots.value[entry.slot]?.selectedCharId) ?? null,
    ) || entry.characterName,
  }));
});

function cloneBuildSnapshot(snapshot: BuildStoreStateSnapshot): BuildStoreStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BuildStoreStateSnapshot;
}

function updateSharedCharacter(charId: string) {
  buildStore.setCharacter(charId);
  persistCurrentBuild();
}

function setActiveBuildVariant(index: number) {
  buildStore.setActiveVariantIndex(index);
  if (setToSourceVariantIndex.value === index) {
    setToSourceVariantIndex.value = (index + 1) % 4;
  }
  persistCurrentBuild();
}

function setCurrentVariantToSelectedSource() {
  const targetVariant = activeVariantIndex.value;
  const sourceVariant = setToSourceVariantIndex.value;
  if (targetVariant === sourceVariant) {
    return;
  }

  const snapshot = cloneBuildSnapshot(buildStore.exportStateSnapshot());
  const sourceMaterialized = snapshotForVariant(snapshot, sourceVariant);
  const selectedIndex = activeSlotIndex.value;
  const sourceSlot = sourceMaterialized.slots[selectedIndex];
  const targetSlot = snapshot.slots[selectedIndex];

  if (!sourceSlot || !targetSlot) {
    return;
  }
  const selectedCharId = targetSlot.selectedCharId;
  if (!selectedCharId) {
    return;
  }

  const variants = (Array.isArray(targetSlot.characterBuilds[selectedCharId])
    ? [...targetSlot.characterBuilds[selectedCharId]]
    : []) as any[];
  variants[targetVariant] = {
    characterAscension: sourceSlot.characterAscension,
    characterPotential: sourceSlot.characterPotential,
    level: sourceSlot.level,
    characterTalentToggles: { ...sourceSlot.characterTalentToggles },
    uniqueTalentToggles: { ...sourceSlot.uniqueTalentToggles },
    characterSkillLevels: { ...sourceSlot.characterSkillLevels },
    selectedWeaponId: sourceSlot.selectedWeaponId,
    weaponAscension: sourceSlot.weaponAscension,
    weaponPotential: sourceSlot.weaponPotential,
    weaponLevel: sourceSlot.weaponLevel,
    weaponSkillLevels: [...sourceSlot.weaponSkillLevels],
    armor: sourceSlot.armor ? JSON.parse(JSON.stringify(sourceSlot.armor)) : null,
    gloves: sourceSlot.gloves ? JSON.parse(JSON.stringify(sourceSlot.gloves)) : null,
    kit1: sourceSlot.kit1 ? JSON.parse(JSON.stringify(sourceSlot.kit1)) : null,
    kit2: sourceSlot.kit2 ? JSON.parse(JSON.stringify(sourceSlot.kit2)) : null,
  };
  targetSlot.characterBuilds[selectedCharId] = variants;

  targetSlot.characterAscension = sourceSlot.characterAscension;
  targetSlot.characterPotential = sourceSlot.characterPotential;
  targetSlot.level = sourceSlot.level;
  targetSlot.characterTalentToggles = { ...sourceSlot.characterTalentToggles };
  targetSlot.uniqueTalentToggles = { ...sourceSlot.uniqueTalentToggles };
  targetSlot.characterSkillLevels = { ...sourceSlot.characterSkillLevels };
  targetSlot.selectedWeaponId = sourceSlot.selectedWeaponId;
  targetSlot.armor = sourceSlot.armor ? JSON.parse(JSON.stringify(sourceSlot.armor)) : null;
  targetSlot.gloves = sourceSlot.gloves ? JSON.parse(JSON.stringify(sourceSlot.gloves)) : null;
  targetSlot.kit1 = sourceSlot.kit1 ? JSON.parse(JSON.stringify(sourceSlot.kit1)) : null;
  targetSlot.kit2 = sourceSlot.kit2 ? JSON.parse(JSON.stringify(sourceSlot.kit2)) : null;
  targetSlot.weaponAscension = sourceSlot.weaponAscension;
  targetSlot.weaponPotential = sourceSlot.weaponPotential;
  targetSlot.weaponLevel = sourceSlot.weaponLevel;
  targetSlot.weaponSkillLevels = [...sourceSlot.weaponSkillLevels];

  if (sourceSlot.selectedWeaponId) {
    const key = `${selectedCharId}::${sourceSlot.selectedWeaponId}`;
    targetSlot.weaponBuilds[key] = {
      weaponAscension: sourceSlot.weaponAscension,
      weaponPotential: sourceSlot.weaponPotential,
      weaponLevel: sourceSlot.weaponLevel,
      weaponSkillLevels: [...sourceSlot.weaponSkillLevels],
    };
  }

  snapshot.activeVariantIndex = targetVariant;
  buildStore.hydrateStateSnapshot(snapshot);
  persistCurrentBuild();
}

function getCharacterById(id: string): CharacterBase | null {
  return CHARACTERS.find((char) => char.id === id) ?? null;
}

function getWeaponById(id: string): WeaponBase | null {
  return WEAPONS.find((weapon) => weapon.id === id) ?? null;
}

function getGearById(id: string): GearBase | null {
  return GEARS.find((gear) => gear.id === id) ?? null;
}

function getSlotPreview(slot: CharacterBuildSlot) {
  const character = slot.selectedCharId ? getCharacterById(slot.selectedCharId) : null;
  const weapon = slot.selectedWeaponId ? getWeaponById(slot.selectedWeaponId) : null;
  const gears = [slot.armor, slot.gloves, slot.kit1, slot.kit2]
    .map((instance) => (instance?.gearId ? getGearById(instance.gearId) : null));

  return {
    characterPath: getCharacterImagePath(character),
    weaponPath: getWeaponImagePath(weapon),
    gearPaths: gears.map((gear) => getGearImagePath(gear)),
  };
}

function computeSlotFinalStats(slot: CharacterBuildSlot): { out: FinalStats } | null {
  const character = slot.selectedCharId ? getCharacterById(slot.selectedCharId) : null;
  if (!character) {
    return null;
  }

  const weapon = slot.selectedWeaponId ? getWeaponById(slot.selectedWeaponId) : null;
  if (!weapon || weapon.weaponType !== character.weaponType) {
    return null;
  }

  const gearBases = [
    slot.armor?.gearId ? getGearById(slot.armor.gearId) : null,
    slot.gloves?.gearId ? getGearById(slot.gloves.gearId) : null,
    slot.kit1?.gearId ? getGearById(slot.kit1.gearId) : null,
    slot.kit2?.gearId ? getGearById(slot.kit2.gearId) : null,
  ];

  const activeSet = getActiveGearSetInfo(gearBases);
  const weaponStaticModifiers = getWeaponUniqueStaticModifiers({
    weaponId: weapon.id,
    uniqueSkillLevel: slot.weaponSkillLevels[2] ?? 1,
  });

  const outValue = computeFinalStats({
    char: character,
    level: slot.level,
    weapon,
    weaponLevel: slot.weaponLevel,
    weaponSkillLevels: slot.weaponSkillLevels,
    characterAscensionStage: slot.characterAscension,
    characterPotential: slot.characterPotential,
    characterTalentToggles: slot.characterTalentToggles,
    weaponAscensionStage: slot.weaponAscension,
    weaponPotential: slot.weaponPotential,
    gearBases,
    gearInstances: [slot.armor, slot.gloves, slot.kit1, slot.kit2],
    extraModifierDeltas: combineModifierPartials(
      activeSet?.staticModifiers,
      weaponStaticModifiers,
    ),
  });

  return { out: outValue };
}

const baselineOut = computed(() => {
  if (!compareBuildsEnabled.value || !currentBuildSnapshot.value) {
    return null;
  }
  const sourceSnapshot = snapshotForVariant(currentBuildSnapshot.value, compareTargetVariantIndex.value);
  const slot = sourceSnapshot.slots[activeSlotIndex.value];
  return slot ? computeSlotFinalStats(slot)?.out ?? null : null;
});

const activeGearContribution = computed(() => {
  if (!selectedChar.value || !activeSlot.value) {
    return null;
  }

  const zeroMods = makeBaseModifierStats();
  for (const key of MODIFIER_STAT_KEYS) {
    zeroMods[key] = 0;
  }

  const gearResult = applyGears({
    attrs: { STR: 0, AGI: 0, INT: 0, WIL: 0 },
    gearBases: [
      selectedGearObjects.value.armor,
      selectedGearObjects.value.gloves,
      selectedGearObjects.value.kit1,
      selectedGearObjects.value.kit2,
    ],
    gearInstances: [
      activeSlot.value.armor,
      activeSlot.value.gloves,
      activeSlot.value.kit1,
      activeSlot.value.kit2,
    ],
    mods: zeroMods,
  });

  const attributes = (["STR", "AGI", "INT", "WIL"] as const)
    .map((key) => ({ key, value: gearResult.attrs[key] }))
    .filter((entry) => entry.value !== 0);

  const modifiers = (MODIFIER_STAT_KEYS as readonly ModifierStatKey[])
    .map((key) => ({ key, value: gearResult.mods[key] }))
    .filter((entry) => entry.value !== 0);

  return { attributes, modifiers };
});

const compareTargetActiveSlot = computed(() => {
  if (!compareBuildsEnabled.value || !activeSlot.value) {
    return null;
  }
  const liveSnapshot = buildStore.exportStateSnapshot();
  const targetSnapshot = snapshotForVariant(liveSnapshot, compareTargetVariantIndex.value);
  return targetSnapshot.slots[activeSlotIndex.value] ?? null;
});

const comparisonSummaries = computed(() => {
  if (!compareBuildsEnabled.value || !currentBuildSnapshot.value) {
    return null;
  }
  const leftSnapshot = snapshotForVariant(currentBuildSnapshot.value, activeVariantIndex.value);
  const rightSnapshot = snapshotForVariant(currentBuildSnapshot.value, compareTargetVariantIndex.value);
  const leftSimulation = simulateForSnapshot(leftSnapshot, activeScheme.value.rotation);
  const rightSimulation = simulateForSnapshot(rightSnapshot, activeScheme.value.rotation);
  return {
    left: getTallyWindowSummary(leftSimulation, activeDamageTallyTiming.value),
    right: getTallyWindowSummary(rightSimulation, activeDamageTallyTiming.value),
  };
});

function updateCompareEnabled(value: boolean) {
  compareBuildsEnabled.value = value;
  persistCurrentBuild();
}

function updateCompareTargetVariant(index: number) {
  compareTargetVariantIndex.value = Math.max(0, Math.min(3, index));
  persistCurrentBuild();
}

const characterBuildCost = computed(() => {
  void buildCostReactivityStamp.value;
  if (!activeSlot.value) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: null as string | null };
  }
  if (!compareBuildsEnabled.value) {
    return {
      lines: [] as { name: string; amount: number; iconPath?: string }[],
      note: t("planner.enableCompareModeToSeeCostDifference"),
    };
  }

  const liveSnapshot = buildStore.exportStateSnapshot();
  const currentSnapshot = snapshotForVariant(liveSnapshot, activeVariantIndex.value);
  const targetSnapshot = snapshotForVariant(liveSnapshot, compareTargetVariantIndex.value);
  const currentSlot = currentSnapshot.slots[activeSlotIndex.value];
  const targetSlot = targetSnapshot.slots[activeSlotIndex.value];
  if (!currentSlot || !targetSlot) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: null as string | null };
  }
  if (!currentSlot.selectedCharId || !targetSlot.selectedCharId) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.selectCharacterInBoth") };
  }
  if (currentSlot.selectedCharId !== targetSlot.selectedCharId) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.plannerCharacterMustMatch") };
  }

  const character = getCharacterById(currentSlot.selectedCharId);
  if (!character) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.characterCostUnavailable") };
  }

  const plannerCostLocale: "en" | "zh-CN" = locale.value === "zh-CN" ? "zh-CN" : "en";

  const forward = computeCharacterPlannerCost({
    character,
    currentSlot,
    plannedSlot: targetSlot,
    locale: plannerCostLocale,
  });
  const backward = computeCharacterPlannerCost({
    character,
    currentSlot: targetSlot,
    plannedSlot: currentSlot,
    locale: plannerCostLocale,
  });
  const { lines, missingParts, warnings } = buildDeltaCostLines({
    forward,
    backward,
    sanityLabel: t("builder.totalSanityEquivalent"),
  });
  const warningNote = warnings.length > 0 ? warnings.join(" ") : null;
  const missingNote = missingParts.length > 0
    ? t("planner.partialMissingApiData", { parts: missingParts.join(", ") })
    : null;
  const note = [warningNote, missingNote].filter((value) => Boolean(value)).join(" ").trim() || null;

  return { lines, note };
});

const weaponBuildCost = computed(() => {
  void buildCostReactivityStamp.value;
  if (!activeSlot.value) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: null as string | null };
  }
  if (!compareBuildsEnabled.value) {
    return {
      lines: [] as { name: string; amount: number; iconPath?: string }[],
      note: t("planner.enableCompareModeToSeeCostDifference"),
    };
  }

  const liveSnapshot = buildStore.exportStateSnapshot();
  const currentSnapshot = snapshotForVariant(liveSnapshot, activeVariantIndex.value);
  const targetSnapshot = snapshotForVariant(liveSnapshot, compareTargetVariantIndex.value);
  const currentSlot = currentSnapshot.slots[activeSlotIndex.value];
  const targetSlot = targetSnapshot.slots[activeSlotIndex.value];
  if (!currentSlot || !targetSlot) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: null as string | null };
  }
  if (!currentSlot.selectedWeaponId || !targetSlot.selectedWeaponId) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.selectWeaponInBoth") };
  }
  if (currentSlot.selectedWeaponId !== targetSlot.selectedWeaponId) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.plannerWeaponMustMatch") };
  }

  const weapon = getWeaponById(currentSlot.selectedWeaponId);
  if (!weapon) {
    return { lines: [] as { name: string; amount: number; iconPath?: string }[], note: t("planner.weaponCostUnavailable") };
  }

  const plannerCostLocale: "en" | "zh-CN" = locale.value === "zh-CN" ? "zh-CN" : "en";
  const currentHasMismatchedEssence = hasMismatchedWeaponEssence(currentSlot);
  const targetHasMismatchedEssence = hasMismatchedWeaponEssence(targetSlot);

  const forward = computeWeaponPlannerCost({
    weapon,
    currentSlot,
    plannedSlot: targetSlot,
    locale: plannerCostLocale,
  });
  const backward = computeWeaponPlannerCost({
    weapon,
    currentSlot: targetSlot,
    plannedSlot: currentSlot,
    locale: plannerCostLocale,
  });
  const { lines, missingParts } = buildDeltaCostLines({
    forward,
    backward,
    skipIds: targetHasMismatchedEssence ? new Set(["item_weapon_etching_essence"]) : undefined,
    sanityLabel: t("builder.totalSanityEquivalent"),
  });
  let mismatchWarning: string | null = null;
  if (targetHasMismatchedEssence) {
    mismatchWarning = plannerCostLocale === "zh-CN"
      ? "目标构筑有非适配基质，已跳过基质蚀刻计算"
      : "Target build uses mismatched essence; essence cost skipped";
  } else if (currentHasMismatchedEssence) {
    mismatchWarning = plannerCostLocale === "zh-CN"
      ? "当前构筑有非适配基质，假设为切换至+1/+1/+1基质后蚀刻"
      : "Starting build uses mismatched essence; cost assumes switching to +1/+1/+1 first";
  }
  const noteParts: string[] = [];
  if (mismatchWarning) {
    noteParts.push(`__warn__:${mismatchWarning}`);
  }
  if (missingParts.length > 0) {
    noteParts.push(t("planner.partialMissingApiData", { parts: missingParts.join(", ") }));
  }
  const note = noteParts.join(" ").trim() || null;

  return { lines, note };
});

function resetGuestUser() {
  persistCurrentBuild();
  buildListStore.resetAll();
  buildStore.resetGuestUser();
  resetRotationSchemes();
  currentBuildSnapshot.value = null;
  void router.replace({ name: "build-list" });
}

function openResetGuestConfirm() {
  confirmResetGuestOpen.value = true;
}

function closeResetGuestConfirm() {
  confirmResetGuestOpen.value = false;
}

function confirmResetGuestUser() {
  confirmResetGuestOpen.value = false;
  resetGuestUser();
}

function persistCurrentBuild() {
  if (isHydratingBuildDetail.value) {
    return;
  }

  if (page.value !== "build-detail") {
    return;
  }

  if (!activeBuildId.value) {
    return;
  }

  if (!currentBuildSnapshot.value) {
    return;
  }
  currentBuildSnapshot.value = cloneBuildSnapshot(buildStore.exportStateSnapshot());

  buildListStore.updateBuildRuntime({
    buildId: activeBuildId.value,
    currentBuildState: currentBuildSnapshot.value,
    plannedBuildState: currentBuildSnapshot.value,
    rotationState: exportRotationSchemes(),
    summary: {
      totalDamage: getTallyWindowSummary(firstSchemeSimulation.value, activeDamageTallyTiming.value).totalDamage,
      dps: firstSchemeDps.value,
    },
    damageTallyTiming: activeDamageTallyTiming.value,
    compareSettings: {
      enabled: compareBuildsEnabled.value,
      leftVariantIndex: activeVariantIndex.value,
      rightVariantIndex: compareTargetVariantIndex.value,
    },
  });
}

function hydrateBuildDetail(buildId: string): boolean {
  const selected = builds.value.find((build) => build.id === buildId) ?? null;
  if (!selected) {
    return false;
  }

  isHydratingBuildDetail.value = true;
  try {
    buildListStore.setActiveBuild(buildId);
    currentBuildSnapshot.value = cloneBuildSnapshot(selected.currentBuildState);
    buildStore.setActiveVariantIndex(selected.currentBuildState.activeVariantIndex ?? 0);
    buildStore.hydrateStateSnapshot(cloneBuildSnapshot(selected.currentBuildState));
    compareBuildsEnabled.value = selected.compareSettings?.enabled === true;
    compareTargetVariantIndex.value = selected.compareSettings?.rightVariantIndex ?? 1;
    hydrateRotationSchemes(selected.rotationState);
  } finally {
    isHydratingBuildDetail.value = false;
  }
  return true;
}

function openBuild(buildId: string) {
  persistCurrentBuild();
  if (!builds.value.some((build) => build.id === buildId)) {
    return;
  }
  void router.push({ name: "build-builder", params: { buildId } });
}

function updateActiveDamageTallyTiming(next: DamageTallyTiming) {
  if (!activeBuildId.value || !currentBuildSnapshot.value) {
    return;
  }
  currentBuildSnapshot.value = cloneBuildSnapshot(buildStore.exportStateSnapshot());
  buildListStore.updateBuildRuntime({
    buildId: activeBuildId.value,
    currentBuildState: currentBuildSnapshot.value,
    plannedBuildState: currentBuildSnapshot.value,
    rotationState: exportRotationSchemes(),
    damageTallyTiming: next,
    compareSettings: {
      enabled: compareBuildsEnabled.value,
      leftVariantIndex: activeVariantIndex.value,
      rightVariantIndex: compareTargetVariantIndex.value,
    },
  });
}

function createBuild() {
  persistCurrentBuild();
  const id = buildListStore.createBuild();
  if (!id) {
    if (typeof window !== "undefined") {
      window.alert(t("buildList.maximumBuildsReached"));
    }
    return;
  }
  void router.push({ name: "build-builder", params: { buildId: id } });
}

function copyBuild(buildId: string) {
  persistCurrentBuild();
  const id = buildListStore.copyBuild(buildId);
  if (!id) {
    if (typeof window !== "undefined") {
      window.alert(t("buildList.maximumBuildsReached"));
    }
  }
}

function backToBuildList() {
  persistCurrentBuild();
  void router.push({ name: "build-list" });
}

function renameBuild(payload: { buildId: string; name: string }) {
  buildListStore.renameBuild(payload.buildId, payload.name);
}

function deleteBuild(buildId: string) {
  buildListStore.removeBuild(buildId);
}

watch(
  [slots, activeSlotIndex, rotationSchemes, firstSchemeSimulation, firstSchemeDps, page, activeBuildId, activeVariantIndex],
  () => {
    persistCurrentBuild();
  },
  { deep: true },
);

watch(
  [() => route.name, routeBuildId],
  ([nextName, nextBuildId], [prevName, prevBuildId]) => {
    const nextIsBuildDetail = isBuildDetailRouteName(nextName);
    const prevIsBuildDetail = isBuildDetailRouteName(prevName);

    if (prevIsBuildDetail && (!nextIsBuildDetail || prevBuildId !== nextBuildId)) {
      persistCurrentBuild();
    }

    if (!nextIsBuildDetail) {
      return;
    }

    if (!nextBuildId) {
      void router.replace({ name: "build-list" });
      return;
    }

    if (!builds.value.some((build) => build.id === nextBuildId)) {
      void router.replace({ name: "build-list" });
      return;
    }

    if (activeBuildId.value !== nextBuildId || !currentBuildSnapshot.value) {
      hydrateBuildDetail(nextBuildId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="min-h-screen w-full bg-[#ececec] text-[#1b1b1b]">
    <div class="w-full border-b border-[#dadada] bg-white/80 backdrop-blur">
      <div class="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-3">
        <div class="flex flex-col">
          <div class="text-sm font-semibold uppercase tracking-[0.22em] text-[#2a2a2a]">
            {{ t("ui.toolboxBrand") }} <span class="ml-1 text-[10px] font-bold tracking-[0.18em] text-[#b58f00]">{{ t("ui.alphaTag") }}</span>
          </div>
          <div class="text-[11px] text-[#6e6e6e]">
            {{ t("ui.alphaDisclaimer") }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
            :class="
              debugModeEnabled
                ? 'border-[#ece81a] bg-[#ece81a] text-[#1b1b1b]'
                : 'border-[#d0d0d0] bg-white text-[#3a3a3a] hover:border-[#b9b9b9] hover:text-[#111]'
            "
            @click="debugModeEnabled = !debugModeEnabled"
          >
            {{ debugModeEnabled ? t("ui.debugOn") : t("ui.debugOff") }}
          </button>
          <div class="flex rounded-full border border-[#d0d0d0] bg-white p-1 shadow-sm">
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="locale === 'en' ? 'bg-[#ece81a] text-[#1b1b1b]' : 'text-[#555] hover:bg-[#f3f3f3]'"
              @click="setLocale('en')"
            >
              EN
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="locale === 'zh-CN' ? 'bg-[#ece81a] text-[#1b1b1b]' : 'text-[#555] hover:bg-[#f3f3f3]'"
              @click="setLocale('zh-CN')"
            >
              中文
            </button>
          </div>
          <button
            type="button"
            class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#3a3a3a] transition hover:border-[#b9b9b9] hover:text-[#111]"
            @click="openResetGuestConfirm"
          >
            {{ t("ui.resetGuestUser") }}
          </button>
        </div>
      </div>
    </div>
    <div class="w-full px-6 py-6">
      <div class="mb-6 border-b border-[#d0d0d0] pb-4">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex items-end gap-4">
            <div class="h-16 w-2 bg-[#ece81a]"></div>
            <div>
              <h1 class="text-3xl font-semibold uppercase tracking-[0.18em] text-[#1b1b1b]">
                {{ t("ui.combatSimulator") }}
              </h1>
            </div>
          </div>

          <div v-if="page === 'build-detail'" class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a] transition hover:border-[#b9b9b9] hover:text-[#222]"
              @click="backToBuildList"
            >
              {{ t("ui.backToBuilds") }}
            </button>

            <div class="flex rounded-full border border-[#d0d0d0] bg-white p-1 shadow-sm">
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition"
                :class="
                  workspace === 'builder'
                    ? 'bg-[#ece81a] text-[#1b1b1b]'
                    : 'text-[#555] hover:bg-[#f3f3f3]'
                "
                @click="workspace = 'builder'"
              >
                {{ t("ui.builder") }}
              </button>
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition"
                :class="
                  workspace === 'rotation'
                    ? 'bg-[#ece81a] text-[#1b1b1b]'
                    : 'text-[#555] hover:bg-[#f3f3f3]'
                "
                @click="workspace = 'rotation'"
              >
                {{ t("ui.rotation") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BuildListPage
        v-if="page === 'build-list'"
        :builds="builds"
        :active-build-id="activeBuildId"
        @open="openBuild"
        @create="createBuild"
        @copy="copyBuild"
        @rename="renameBuild"
        @delete="deleteBuild"
      />

      <template v-else>
        <section
          v-if="workspace === 'builder'"
          class="mb-6 rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="h-6 w-1 bg-[#ece81a]"></div>
              <h2 class="text-lg font-semibold">{{ t("builder.partySlots") }}</h2>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              v-for="(slot, index) in slots"
              :key="slot.id"
              type="button"
              @click="buildStore.setActiveSlot(index)"
              class="rounded-xl border px-4 py-3 text-left transition"
              :class="
                index === activeSlotIndex
                  ? 'border-[#c8d13c] bg-[#dfe86a] text-[#1b1b1b]'
                  : 'border-[#d4d4d4] bg-[#f8f8f8] text-[#333]'
              "
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold">{{ t("builder.slot", { index: index + 1 }) }}</div>
                  <div class="mt-1 truncate text-sm">
                    {{ getCharacterDisplayNameByCharacter(CHARACTERS.find((character) => character.id === slot.selectedCharId) ?? null) || t("builder.selectedNone") }}
                  </div>
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                  <img
                    :src="getSlotPreview(slot).characterPath"
                    :alt="t('builder.character')"
                    class="h-9 w-9 rounded-md border border-[#d4d4d4] bg-white object-contain"
                  />
                  <img
                    :src="getSlotPreview(slot).weaponPath"
                    :alt="t('builder.weapon')"
                    class="h-7 w-7 rounded border border-[#d4d4d4] bg-white object-contain"
                  />
                  <div class="grid grid-cols-2 gap-1">
                    <img
                      v-for="(gearPath, gearIndex) in getSlotPreview(slot).gearPaths"
                      :key="`${slot.id}-preview-gear-${gearIndex}`"
                      :src="gearPath"
                      :alt="t('builder.gear')"
                      class="h-4 w-4 rounded border border-[#d4d4d4] bg-white object-contain"
                    />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        <div
          v-if="workspace === 'builder'"
          class="grid grid-cols-1 gap-6 2xl:grid-cols-[720px_minmax(0,1fr)] xl:grid-cols-[560px_minmax(0,1fr)]"
        >
          <section class="min-w-0">
            <div class="grid gap-6 sm:grid-cols-2 2xl:grid-cols-2">
              <CharacterCard
                :key="`character-${activeBuildId}-${activeSlot!.id}-${activeVariantIndex}-${activeSlot!.selectedCharId}-${activeSlot!.characterAscension}`"
                :characters="CHARACTERS"
                :selected-char-id="activeSlot!.selectedCharId"
                :selected-character="selectedChar"
                :character-locked="false"
                :level="activeSlot!.level"
                :ascension-stage="activeSlot!.characterAscension"
                :potential="activeSlot!.characterPotential"
                :compare-level="compareTargetActiveSlot?.level"
                :compare-ascension-stage="compareTargetActiveSlot?.characterAscension"
                :compare-potential="compareTargetActiveSlot?.characterPotential"
                :talent-toggles="activeSlot!.characterTalentToggles"
                :unique-talent-toggles="activeSlot!.uniqueTalentToggles"
                :skill-levels="activeSlot!.characterSkillLevels"
                :compare-skill-levels="compareTargetActiveSlot?.characterSkillLevels"
                :build-cost-title="t('builder.currentToPlannerCost')"
                :build-cost-lines="characterBuildCost.lines"
                :build-cost-note="characterBuildCost.note"
                @update:selected-char-id="updateSharedCharacter($event)"
                @update:level="buildStore.setCharacterLevel($event)"
                @update:ascension-stage="buildStore.setCharacterAscension($event)"
                @update:potential="buildStore.setCharacterPotential($event)"
                @toggle:talent="buildStore.toggleTalent($event)"
                @toggle:unique-talent="buildStore.toggleUniqueTalent($event)"
                @update:skill-level="buildStore.setCharacterSkillLevel($event.key, $event.value)"
              />

              <WeaponCard
                v-if="activeSlot!.selectedCharId || activeSlot!.selectedWeaponId"
                :key="`weapon-${activeBuildId}-${activeSlot!.id}-${activeVariantIndex}-${activeSlot!.selectedWeaponId}-${activeSlot!.weaponAscension}`"
                :weapons="availableWeapons"
                :selected-weapon-id="activeSlot!.selectedWeaponId"
                :weapon-locked="false"
                :weapon-level="activeSlot!.weaponLevel"
                :weapon-ascension-stage="activeSlot!.weaponAscension"
                :weapon-potential="activeSlot!.weaponPotential"
                :weapon-skill-levels="activeSlot!.weaponSkillLevels"
                :compare-weapon-level="compareTargetActiveSlot?.weaponLevel"
                :compare-weapon-ascension-stage="compareTargetActiveSlot?.weaponAscension"
                :compare-weapon-potential="compareTargetActiveSlot?.weaponPotential"
                :compare-weapon-skill-levels="compareTargetActiveSlot?.weaponSkillLevels"
                :character="selectedChar"
                :build-cost-title="t('builder.currentToPlannerCost')"
                :build-cost-lines="weaponBuildCost.lines"
                :build-cost-note="weaponBuildCost.note"
                @update:selected-weapon-id="buildStore.setWeapon($event)"
                @update:weapon-level="buildStore.setWeaponLevel($event)"
                @update:weapon-ascension-stage="buildStore.setWeaponAscension($event)"
                @update:weapon-potential="buildStore.setWeaponPotential($event)"
                @update:weapon-skill-level="buildStore.updateWeaponSkillLevel($event)"
              />

              <GearCard
                :title="t('builder.armor')"
                :options="armorOptions"
                :gear-instance="activeSlot!.armor"
                @update:selected-gear-id="buildStore.setGear('armor', $event)"
                @update:sub-level="buildStore.updateGearSubLevel('armor', $event.index, $event.value)"
              />

              <GearCard
                :title="t('builder.gloves')"
                :options="gloveOptions"
                :gear-instance="activeSlot!.gloves"
                @update:selected-gear-id="buildStore.setGear('gloves', $event)"
                @update:sub-level="buildStore.updateGearSubLevel('gloves', $event.index, $event.value)"
              />

              <GearCard
                :title="t('builder.kit1')"
                :options="kitOptions"
                :gear-instance="activeSlot!.kit1"
                @update:selected-gear-id="buildStore.setGear('kit1', $event)"
                @update:sub-level="buildStore.updateGearSubLevel('kit1', $event.index, $event.value)"
              />

              <GearCard
                :title="t('builder.kit2')"
                :options="kitOptions"
                :gear-instance="activeSlot!.kit2"
                @update:selected-gear-id="buildStore.setGear('kit2', $event)"
                @update:sub-level="buildStore.updateGearSubLevel('kit2', $event.index, $event.value)"
              />
            </div>
          </section>

          <section class="min-w-0 space-y-6">
            <button
              v-if="selectedChar && selectedWeapon && out"
              type="button"
              class="fixed right-3 top-20 z-40 h-9 w-9 rounded-full border border-[#d4d4d4] bg-white text-lg font-semibold text-[#444] shadow-md transition hover:bg-[#f5f5f5] lg:hidden"
              :aria-label="mobileSummaryOpen ? 'Hide summary panel' : 'Show summary panel'"
              @click="mobileSummaryOpen = !mobileSummaryOpen"
            >
              {{ mobileSummaryOpen ? ">" : "<" }}
            </button>

            <div
              v-if="selectedChar && selectedWeapon && out && mobileSummaryOpen"
              class="fixed inset-y-0 right-0 z-30 w-[min(92vw,460px)] overflow-y-auto border-l border-[#d4d4d4] bg-[#f3f3f3] p-3 pt-16 shadow-2xl lg:hidden"
            >
              <SummaryPanel
                :character-name="getCharacterDisplayNameByCharacter(selectedChar)"
                :weapon-name="getWeaponDisplayNameByWeapon(selectedWeapon)"
                :out="out"
                :baseline-out="baselineOut"
                :active-variant-index="activeVariantIndex"
                :compare-enabled="compareBuildsEnabled"
                :compare-target-variant="compareTargetVariantIndex"
                :set-to-source-variant="setToSourceVariantIndex"
                :active-gear-set="activeGearSet"
                :gear-contribution="activeGearContribution"
                :benchmarks="benchmarkResults"
                @update:active-variant-index="setActiveBuildVariant"
                @update:compare-enabled="updateCompareEnabled"
                @update:compare-target-variant="updateCompareTargetVariant"
                @update:set-to-source-variant="setToSourceVariantIndex = $event"
                @apply:set-to-build="setCurrentVariantToSelectedSource"
              />
            </div>

            <div class="hidden lg:block">
              <SummaryPanel
                v-if="selectedChar && selectedWeapon && out"
                :character-name="getCharacterDisplayNameByCharacter(selectedChar)"
                :weapon-name="getWeaponDisplayNameByWeapon(selectedWeapon)"
                :out="out"
                :baseline-out="baselineOut"
                :active-variant-index="activeVariantIndex"
                :compare-enabled="compareBuildsEnabled"
                :compare-target-variant="compareTargetVariantIndex"
                :set-to-source-variant="setToSourceVariantIndex"
                :active-gear-set="activeGearSet"
                :gear-contribution="activeGearContribution"
                :benchmarks="benchmarkResults"
                @update:active-variant-index="setActiveBuildVariant"
                @update:compare-enabled="updateCompareEnabled"
                @update:compare-target-variant="updateCompareTargetVariant"
                @update:set-to-source-variant="setToSourceVariantIndex = $event"
                @apply:set-to-build="setCurrentVariantToSelectedSource"
              />
            </div>

            <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
              <div class="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div class="text-xs uppercase tracking-[0.24em] text-[#777]">{{ t("ui.rotation") }}</div>
                  <div class="mt-1 text-lg font-semibold">{{ t("rotation.rotationSummary") }}</div>
                </div>

                <label class="block min-w-[220px]">
                  <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.rotationScheme") }}</div>
                  <select
                    :value="activeScheme.id"
                    class="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                    @change="setActiveScheme(($event.target as HTMLSelectElement).value)"
                  >
                    <option
                      v-for="scheme in rotationSchemes.schemes"
                      :key="scheme.id"
                      :value="scheme.id"
                    >
                      {{ scheme.name }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
                  <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.totalDamage") }}</div>
                  <div
                    class="mt-2 text-3xl font-semibold tabular-nums"
                    :class="
                      comparisonSummaries && comparisonSummaries.right.totalDamage > comparisonSummaries.left.totalDamage
                        ? 'text-[#1b7f2a]'
                        : comparisonSummaries && comparisonSummaries.right.totalDamage < comparisonSummaries.left.totalDamage
                          ? 'text-[#b42323]'
                          : 'text-[#1b1b1b]'
                    "
                  >
                    <template v-if="comparisonSummaries">
                      {{ `${Math.round(comparisonSummaries.left.totalDamage).toLocaleString()} → ${Math.round(comparisonSummaries.right.totalDamage).toLocaleString()}` }}
                    </template>
                    <template v-else>
                      {{ Math.round(builderTallySummary.totalDamage).toLocaleString() }}
                    </template>
                  </div>
                </div>
                <div class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
                  <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.dps") }}</div>
                  <div
                    class="mt-2 text-3xl font-semibold tabular-nums"
                    :class="
                      comparisonSummaries && comparisonSummaries.right.dps > comparisonSummaries.left.dps
                        ? 'text-[#1b7f2a]'
                        : comparisonSummaries && comparisonSummaries.right.dps < comparisonSummaries.left.dps
                          ? 'text-[#b42323]'
                          : 'text-[#1b1b1b]'
                    "
                  >
                    <template v-if="comparisonSummaries">
                      {{ `${Math.round(comparisonSummaries.left.dps).toLocaleString()} → ${Math.round(comparisonSummaries.right.dps).toLocaleString()}` }}
                    </template>
                    <template v-else>
                      {{ Math.round(builderRotationDps).toLocaleString() }}
                    </template>
                  </div>
                </div>
              </div>

              <div v-if="builderDamageContributions.length > 0" class="mt-4 rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.damageContribution") }}</div>
                <div class="text-sm text-[#666]">{{ t("rotation.damageContributionHint") }}</div>
                <div class="mt-3 h-4 overflow-hidden rounded-md border border-[#dadada] bg-[#f1f1f1]">
                  <div class="flex h-full w-full">
                    <div
                      v-for="entry in builderDamageContributions"
                      :key="entry.slot"
                      class="h-full"
                      :style="{
                        width: `${entry.percent}%`,
                        backgroundColor: entry.color,
                      }"
                    />
                  </div>
                </div>
                <div class="mt-3 space-y-2">
                  <div
                    v-for="entry in builderDamageContributions"
                    :key="`builder-contribution-${entry.slot}`"
                    class="flex items-center justify-between gap-3 text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
                      <span class="text-[#1b1b1b]">{{ entry.localizedCharacterName }}</span>
                    </div>
                    <div class="text-[#555]">
                      {{ Math.round(entry.damage).toLocaleString() }} ({{ entry.percent.toFixed(1) }}%)
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2 text-sm text-[#666]">
                <img
                  :src="selectedEnemyIconPath"
                  :alt="selectedEnemyDisplayName"
                  class="h-5 w-5 rounded-sm border border-[#d8d8d8] object-cover"
                />
                <span>
                  {{ selectedEnemyDisplayName }} {{ t("enemy.level") }} {{ enemyLevel }} · {{ t("rotation.realTime") }} {{ (builderRotationSimulation?.totalTime ?? 0).toFixed(2) }}{{ t("enemy.seconds") }} · {{ t("rotation.gameTime") }} {{ (builderRotationSimulation?.totalGameTime ?? 0).toFixed(2) }}{{ t("enemy.seconds") }}
                </span>
              </div>
            </section>
          </section>
        </div>

        <RotationWorkspace
          v-else
          :build-id="activeBuildId ?? undefined"
          :debug-mode="debugModeEnabled"
          :enemies="ENEMIES"
          :selected-enemy-id="selectedEnemyId"
          :enemy-name="selectedEnemyDisplayName"
          :enemy-level="enemyLevel"
          :enemy-stats="resolvedEnemyStats"
          :enemy-stagger-gauge="selectedEnemy.staggerGauge"
          :enemy-stagger-nodes="selectedEnemy.staggerNodes"
          :enemy-stagger-recovery-seconds="selectedEnemy.staggerRecoverySeconds"
          :enemy-finisher-multiplier="selectedEnemy.finisherMultiplier"
          :enemy-finisher-sp-gain="selectedEnemy.finisherSpGain"
          :damage-tally-timing="activeDamageTallyTiming"
          @update:selected-enemy-id="selectedEnemyId = $event"
          @update:enemy-level="enemyLevel = $event"
          @update:damage-tally-timing="updateActiveDamageTallyTiming"
        />
      </template>
    </div>

    <div
      v-if="confirmResetGuestOpen"
      class="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 px-4"
      @click.self="closeResetGuestConfirm"
    >
      <div class="w-full max-w-md rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-2xl">
        <div class="text-lg font-semibold text-[#1b1b1b]">
          {{ locale === "zh-CN" ? "确认重置游客数据？" : "Reset guest data?" }}
        </div>
        <div class="mt-2 text-sm text-[#666]">
          {{
            locale === "zh-CN"
              ? "这将清空当前游客用户构筑与轮换数据，且无法撤销。"
              : "This will clear current guest builds and rotation data. This cannot be undone."
          }}
        </div>
        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#f5f5f5]"
            @click="closeResetGuestConfirm"
          >
            {{ t("ui.cancel") }}
          </button>
          <button
            type="button"
            class="rounded-md border border-[#f0d0d0] bg-[#fff5f5] px-3 py-2 text-sm font-semibold text-[#9a3131] transition hover:bg-[#ffeaea]"
            @click="confirmResetGuestUser"
          >
            {{ locale === "zh-CN" ? "确认重置" : "Yes, reset" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
