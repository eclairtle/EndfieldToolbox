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
import { buildPartySnapshots } from "@/lib/combat/buildSnapshots";
import { makeEnemyModifierSnapshot, simulateRotation } from "@/lib/combat/simulateRotation";
import {
  buildEnemyActionWindows,
  getDefaultEnemyCommandPlacements,
  type EnemyCommandPlacement,
} from "@/lib/enemy/enemyActionWindows";
import { computeFinalStats, type FinalStats } from "@/lib/build/stats";
import { combineModifierPartials, getWeaponUniqueStaticModifiers } from "@/lib/combat/weaponEffects";
import { getActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import { ROTATION_ENEMY_COMMANDS_STORAGE_KEY, ROTATION_SP_STORAGE_KEY } from "@/lib/storageKeys";
import { computeCharacterPlannerCost, computeWeaponPlannerCost } from "@/lib/progression/plannerCosts";
import { useLocale } from "@/i18n/useLocale";
import { getCharacterDisplayNameByCharacter, getWeaponDisplayNameByWeapon } from "@/i18n/domain/displayNames";
import { getCharacterImagePath, getWeaponImagePath, getGearImagePath } from "@/lib/assets/imagePaths";

const plannerMode = ref<"current" | "planner">("current");
const currentBuildSnapshot = ref<BuildStoreStateSnapshot | null>(null);
const plannedBuildSnapshot = ref<BuildStoreStateSnapshot | null>(null);
const isHydratingBuildDetail = ref(false);

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

const COST_NAME_KEY_MAP: Record<string, string> = {
  "T-Creds": "cost.itemTCreds",
  "Character EXP": "cost.itemCharacterExp",
  "Weapon EXP": "cost.itemWeaponExp",
  "Protoprism": "cost.itemProtoprism",
  "Protohedron": "cost.itemProtohedron",
  "Protodisk": "cost.itemProtodisk",
  "Protoset": "cost.itemProtoset",
  "Cast Die": "cost.itemCastDie",
  "Heavy Cast Die": "cost.itemHeavyCastDie",
  "D96 Steel Sample 4": "cost.itemD96SteelSample4",
  "Metadiastima Photoemission Tube": "cost.itemMetadiastimaPhotoemissionTube",
};

function localizeCostName(name: string) {
  const key = COST_NAME_KEY_MAP[name];
  if (!key) {
    return name;
  }
  const localized = t(key as never);
  return localized === key ? name : localized;
}


const {
  ENEMIES,
  selectedEnemyId,
  selectedEnemy,
  enemyLevel,
  resolvedEnemyStats,
} = useEnemyState();

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
function simulateForRotation(rotation: { steps: any[]; groups?: any[] } | null | undefined) {
  if (partySnapshots.value.length === 0 || !rotation) {
    return null;
  }

  return simulateRotation({
    rotation,
    party: partySnapshots.value,
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
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindows(selectedEnemyId.value, getEnemyCommandPlacementsForActiveScheme()),
  });
}

function simulateForBuildSnapshot(
  snapshot: BuildStoreStateSnapshot | null,
  rotation: { steps: any[]; groups?: any[] } | null | undefined,
) {
  if (!snapshot || !rotation) {
    return null;
  }

  const snapshotParty = buildPartySnapshots(snapshot.slots);
  if (snapshotParty.length === 0) {
    return null;
  }

  return simulateRotation({
    rotation,
    party: snapshotParty,
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
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindows(selectedEnemyId.value, getEnemyCommandPlacementsForActiveScheme()),
  });
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

const currentPlannerRotationSimulation = computed(() =>
  simulateForBuildSnapshot(currentBuildSnapshot.value, activeScheme.value.rotation),
);

const plannedPlannerRotationSimulation = computed(() =>
  simulateForBuildSnapshot(plannedBuildSnapshot.value, activeScheme.value.rotation),
);

const currentPlannerRotationDps = computed(() => {
  return getTallyWindowSummary(currentPlannerRotationSimulation.value, activeDamageTallyTiming.value).dps;
});

const plannedPlannerRotationDps = computed(() => {
  return getTallyWindowSummary(plannedPlannerRotationSimulation.value, activeDamageTallyTiming.value).dps;
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

function syncModeSnapshotFromEditor() {
  const exported = cloneBuildSnapshot(buildStore.exportStateSnapshot());
  if (plannerMode.value === "current") {
    currentBuildSnapshot.value = exported;
  } else {
    plannedBuildSnapshot.value = exported;
  }
}

function setPlannerMode(mode: "current" | "planner") {
  if (plannerMode.value === mode) {
    return;
  }

  const selectedSlotIndex = activeSlotIndex.value;
  syncModeSnapshotFromEditor();
  plannerMode.value = mode;
  const targetSnapshot = mode === "current" ? currentBuildSnapshot.value : plannedBuildSnapshot.value;
  if (targetSnapshot) {
    const hydratedSnapshot = cloneBuildSnapshot(targetSnapshot);
    hydratedSnapshot.activeSlotIndex = selectedSlotIndex;
    buildStore.hydrateStateSnapshot(hydratedSnapshot);
    buildStore.setActiveSlot(selectedSlotIndex);
  }
  persistCurrentBuild();
}

function resetPlannerSlotToCurrent() {
  if (plannerMode.value !== "planner") {
    return;
  }

  syncModeSnapshotFromEditor();
  if (!currentBuildSnapshot.value || !plannedBuildSnapshot.value) {
    return;
  }

  const slotIndex = activeSlotIndex.value;
  const currentSnapshot = cloneBuildSnapshot(currentBuildSnapshot.value);
  const nextPlannedSnapshot = cloneBuildSnapshot(plannedBuildSnapshot.value);
  const currentSlot = currentSnapshot.slots[slotIndex];
  if (!currentSlot) {
    return;
  }

  nextPlannedSnapshot.slots[slotIndex] = JSON.parse(JSON.stringify(currentSlot)) as CharacterBuildSlot;
  plannedBuildSnapshot.value = nextPlannedSnapshot;
  buildStore.hydrateStateSnapshot(cloneBuildSnapshot(nextPlannedSnapshot));
  persistCurrentBuild();
}

function applyCharacterToSnapshot(
  snapshot: BuildStoreStateSnapshot,
  charId: string,
  slotIndex: number,
): BuildStoreStateSnapshot {
  const hydratedSnapshot = cloneBuildSnapshot(snapshot);
  hydratedSnapshot.activeSlotIndex = slotIndex;
  buildStore.hydrateStateSnapshot(hydratedSnapshot);
  buildStore.setActiveSlot(slotIndex);
  buildStore.setCharacter(charId);
  return cloneBuildSnapshot(buildStore.exportStateSnapshot());
}

function updateSharedCharacter(charId: string) {
  syncModeSnapshotFromEditor();
  if (!currentBuildSnapshot.value || !plannedBuildSnapshot.value) {
    return;
  }

  const selectedSlotIndex = activeSlotIndex.value;
  const nextCurrent = applyCharacterToSnapshot(currentBuildSnapshot.value, charId, selectedSlotIndex);
  const nextPlanned = applyCharacterToSnapshot(plannedBuildSnapshot.value, charId, selectedSlotIndex);

  nextCurrent.activeSlotIndex = selectedSlotIndex;
  nextPlanned.activeSlotIndex = selectedSlotIndex;

  currentBuildSnapshot.value = nextCurrent;
  plannedBuildSnapshot.value = nextPlanned;

  const targetSnapshot = plannerMode.value === "current" ? nextCurrent : nextPlanned;
  buildStore.hydrateStateSnapshot(cloneBuildSnapshot(targetSnapshot));
  buildStore.setActiveSlot(selectedSlotIndex);
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
  if (plannerMode.value !== "planner" || !currentBuildSnapshot.value) {
    return null;
  }
  const slot = currentBuildSnapshot.value.slots[activeSlotIndex.value];
  return slot ? computeSlotFinalStats(slot)?.out ?? null : null;
});

const plannerDamageComparison = computed(() => {
  if (plannerMode.value !== "planner") {
    return null;
  }

  const currentDamage = getTallyWindowSummary(currentPlannerRotationSimulation.value, activeDamageTallyTiming.value).totalDamage;
  const plannedDamage = getTallyWindowSummary(plannedPlannerRotationSimulation.value, activeDamageTallyTiming.value).totalDamage;
  return { current: currentDamage, planned: plannedDamage };
});

const plannerDpsComparison = computed(() => {
  if (plannerMode.value !== "planner") {
    return null;
  }

  return {
    current: currentPlannerRotationDps.value,
    planned: plannedPlannerRotationDps.value,
  };
});

const characterBuildCost = computed(() => {
  if (plannerMode.value !== "planner") {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.switchToPlannerForCost") };
  }
  const currentSlot = currentBuildSnapshot.value?.slots[activeSlotIndex.value];
  const plannedSlot = plannedBuildSnapshot.value?.slots[activeSlotIndex.value];
  if (!currentSlot || !plannedSlot || !currentSlot.selectedCharId || !plannedSlot.selectedCharId) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.selectCharacterInBoth") };
  }
  if (currentSlot.selectedCharId !== plannedSlot.selectedCharId) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.plannerCharacterMustMatch") };
  }

  const plannedNotLower =
    plannedSlot.level >= currentSlot.level
    && plannedSlot.characterAscension >= currentSlot.characterAscension
    && plannedSlot.characterPotential >= currentSlot.characterPotential
    && plannedSlot.characterSkillLevels.basic >= currentSlot.characterSkillLevels.basic
    && plannedSlot.characterSkillLevels.battleSkill >= currentSlot.characterSkillLevels.battleSkill
    && plannedSlot.characterSkillLevels.comboSkill >= currentSlot.characterSkillLevels.comboSkill
    && plannedSlot.characterSkillLevels.ultimate >= currentSlot.characterSkillLevels.ultimate
    && Object.keys(currentSlot.characterTalentToggles).every(
      (key) =>
        !currentSlot.characterTalentToggles[key as keyof typeof currentSlot.characterTalentToggles]
        || plannedSlot.characterTalentToggles[key as keyof typeof plannedSlot.characterTalentToggles],
    )
    && Object.keys({ ...currentSlot.uniqueTalentToggles, ...plannedSlot.uniqueTalentToggles }).every(
      (key) => !currentSlot.uniqueTalentToggles[key] || plannedSlot.uniqueTalentToggles[key],
    );

  if (!plannedNotLower) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.valuesMustBeNotLower") };
  }

  const character = getCharacterById(currentSlot.selectedCharId);
  if (!character) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.characterCostUnavailable") };
  }

  const result = computeCharacterPlannerCost({
    character,
    currentSlot,
    plannedSlot,
  });

  const hasAnyUpgrade =
    plannedSlot.level > currentSlot.level
    || plannedSlot.characterAscension > currentSlot.characterAscension
    || plannedSlot.characterPotential > currentSlot.characterPotential
    || plannedSlot.characterSkillLevels.basic > currentSlot.characterSkillLevels.basic
    || plannedSlot.characterSkillLevels.battleSkill > currentSlot.characterSkillLevels.battleSkill
    || plannedSlot.characterSkillLevels.comboSkill > currentSlot.characterSkillLevels.comboSkill
    || plannedSlot.characterSkillLevels.ultimate > currentSlot.characterSkillLevels.ultimate
    || Object.keys({ ...currentSlot.characterTalentToggles, ...plannedSlot.characterTalentToggles }).some(
      (key) =>
        !currentSlot.characterTalentToggles[key as keyof typeof currentSlot.characterTalentToggles]
        && plannedSlot.characterTalentToggles[key as keyof typeof plannedSlot.characterTalentToggles],
    )
    || Object.keys({ ...currentSlot.uniqueTalentToggles, ...plannedSlot.uniqueTalentToggles }).some(
      (key) => !currentSlot.uniqueTalentToggles[key] && plannedSlot.uniqueTalentToggles[key],
    );

  if (!hasAnyUpgrade) {
    return { lines: [] as { name: string; amount: number }[], note: t("ui.noAdditionalCost") };
  }

  return {
    lines: result.lines.map((line) => ({
      ...line,
      name: localizeCostName(line.name),
    })),
    note: result.missingParts.length > 0
      ? t("planner.partialMissingApiData", {
        parts: `${result.missingParts.slice(0, 2).join(", ")}${result.missingParts.length > 2 ? ", ..." : ""}`,
      })
      : null,
  };
});

const weaponBuildCost = computed(() => {
  if (plannerMode.value !== "planner") {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.switchToPlannerForCost") };
  }
  const currentSlot = currentBuildSnapshot.value?.slots[activeSlotIndex.value];
  const plannedSlot = plannedBuildSnapshot.value?.slots[activeSlotIndex.value];
  if (!currentSlot || !plannedSlot || !currentSlot.selectedWeaponId || !plannedSlot.selectedWeaponId) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.selectWeaponInBoth") };
  }
  if (currentSlot.selectedWeaponId !== plannedSlot.selectedWeaponId) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.plannerWeaponMustMatch") };
  }

  const plannedNotLower =
    plannedSlot.weaponLevel >= currentSlot.weaponLevel
    && plannedSlot.weaponAscension >= currentSlot.weaponAscension
    && plannedSlot.weaponPotential >= currentSlot.weaponPotential
    && (plannedSlot.weaponSkillLevels[0] ?? 1) >= (currentSlot.weaponSkillLevels[0] ?? 1)
    && (plannedSlot.weaponSkillLevels[1] ?? 1) >= (currentSlot.weaponSkillLevels[1] ?? 1)
    && (plannedSlot.weaponSkillLevels[2] ?? 1) >= (currentSlot.weaponSkillLevels[2] ?? 1);

  if (!plannedNotLower) {
    return { lines: [] as { name: string; amount: number }[], note: t("planner.valuesMustBeNotLower") };
  }

  const hasAnyUpgrade =
    plannedSlot.weaponLevel > currentSlot.weaponLevel
    || plannedSlot.weaponAscension > currentSlot.weaponAscension
    || plannedSlot.weaponPotential > currentSlot.weaponPotential
    || (plannedSlot.weaponSkillLevels[0] ?? 1) > (currentSlot.weaponSkillLevels[0] ?? 1)
    || (plannedSlot.weaponSkillLevels[1] ?? 1) > (currentSlot.weaponSkillLevels[1] ?? 1)
    || (plannedSlot.weaponSkillLevels[2] ?? 1) > (currentSlot.weaponSkillLevels[2] ?? 1);

  if (!hasAnyUpgrade) {
    return { lines: [] as { name: string; amount: number }[], note: t("ui.noAdditionalCost") };
  }

  const weapon = getWeaponById(currentSlot.selectedWeaponId);
  if (!weapon) {
    return {
      lines: [] as { name: string; amount: number }[],
      note: t("planner.weaponCostUnavailable"),
    };
  }

  const result = computeWeaponPlannerCost({
    weapon,
    currentSlot,
    plannedSlot,
  });

  if (plannedSlot.weaponPotential > currentSlot.weaponPotential) {
    result.missingParts.push("weapon potential");
  }
  if (
    (plannedSlot.weaponSkillLevels[0] ?? 1) > (currentSlot.weaponSkillLevels[0] ?? 1)
    || (plannedSlot.weaponSkillLevels[1] ?? 1) > (currentSlot.weaponSkillLevels[1] ?? 1)
    || (plannedSlot.weaponSkillLevels[2] ?? 1) > (currentSlot.weaponSkillLevels[2] ?? 1)
  ) {
    result.missingParts.push("weapon skills");
  }

  return {
    lines: result.lines.map((line) => ({
      ...line,
      name: localizeCostName(line.name),
    })),
    note: result.missingParts.length > 0
      ? t("planner.partialMissingApiData", {
        parts: `${[...new Set(result.missingParts)].slice(0, 2).join(", ")}${result.missingParts.length > 2 ? ", ..." : ""}`,
      })
      : null,
  };
});

function resetGuestUser() {
  persistCurrentBuild();
  buildListStore.resetAll();
  buildStore.resetGuestUser();
  resetRotationSchemes();
  plannerMode.value = "current";
  currentBuildSnapshot.value = null;
  plannedBuildSnapshot.value = null;
  void router.replace({ name: "build-list" });
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

  if (!currentBuildSnapshot.value || !plannedBuildSnapshot.value) {
    return;
  }
  syncModeSnapshotFromEditor();

  buildListStore.updateBuildRuntime({
    buildId: activeBuildId.value,
    currentBuildState: currentBuildSnapshot.value,
    plannedBuildState: plannedBuildSnapshot.value,
    rotationState: exportRotationSchemes(),
    summary: {
      totalDamage: getTallyWindowSummary(firstSchemeSimulation.value, activeDamageTallyTiming.value).totalDamage,
      dps: firstSchemeDps.value,
    },
    damageTallyTiming: activeDamageTallyTiming.value,
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
    plannedBuildSnapshot.value = cloneBuildSnapshot(selected.plannedBuildState);
    plannerMode.value = "current";
    buildStore.hydrateStateSnapshot(cloneBuildSnapshot(selected.currentBuildState));
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
  if (!activeBuildId.value || !currentBuildSnapshot.value || !plannedBuildSnapshot.value) {
    return;
  }
  syncModeSnapshotFromEditor();
  buildListStore.updateBuildRuntime({
    buildId: activeBuildId.value,
    currentBuildState: currentBuildSnapshot.value,
    plannedBuildState: plannedBuildSnapshot.value,
    rotationState: exportRotationSchemes(),
    damageTallyTiming: next,
  });
}

function createBuild() {
  persistCurrentBuild();
  const id = buildListStore.createBuild();
  if (!id) {
    if (typeof window !== "undefined") {
      window.alert("maximum builds reached");
    }
    return;
  }
  void router.push({ name: "build-builder", params: { buildId: id } });
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
  [slots, activeSlotIndex, rotationSchemes, firstSchemeSimulation, firstSchemeDps, page, activeBuildId, plannerMode],
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

    if (activeBuildId.value !== nextBuildId || !currentBuildSnapshot.value || !plannedBuildSnapshot.value) {
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
            {{ t("ui.toolboxBrand") }} <span class="ml-1 text-[10px] font-bold tracking-[0.18em] text-[#b58f00]">ALPHA</span>
          </div>
          <div class="text-[11px] text-[#6e6e6e]">
            most of the character data are currently incomplete. You are likely to find bugs and inaccuracies
          </div>
        </div>
        <div class="flex items-center gap-2">
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
            @click="resetGuestUser"
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
              <div class="text-xs uppercase tracking-[0.28em] text-[#7d7d7d]">
                {{ t("ui.combatSimulator") }}
              </div>
              <h1 class="text-3xl font-semibold tracking-tight">
                {{ t("ui.appTitle") }}
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
        @rename="renameBuild"
        @delete="deleteBuild"
      />

      <template v-else>
        <section
          v-if="workspace === 'builder'"
          class="mb-6 rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm"
        >
          <div class="mb-3 flex items-center gap-3">
            <div class="h-6 w-1 bg-[#ece81a]"></div>
            <h2 class="text-lg font-semibold">{{ t("builder.partySlots") }}</h2>
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
                :characters="CHARACTERS"
                :selected-char-id="activeSlot!.selectedCharId"
                :selected-character="selectedChar"
                :character-locked="false"
                :level="activeSlot!.level"
                :ascension-stage="activeSlot!.characterAscension"
                :potential="activeSlot!.characterPotential"
                :talent-toggles="activeSlot!.characterTalentToggles"
                :unique-talent-toggles="activeSlot!.uniqueTalentToggles"
                :skill-levels="activeSlot!.characterSkillLevels"
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
                :weapons="availableWeapons"
                :selected-weapon-id="activeSlot!.selectedWeaponId"
                :weapon-locked="false"
                :weapon-level="activeSlot!.weaponLevel"
                :weapon-ascension-stage="activeSlot!.weaponAscension"
                :weapon-potential="activeSlot!.weaponPotential"
                :weapon-skill-levels="activeSlot!.weaponSkillLevels"
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
            <SummaryPanel
              v-if="selectedChar && selectedWeapon && out"
              :character-name="getCharacterDisplayNameByCharacter(selectedChar)"
              :weapon-name="getWeaponDisplayNameByWeapon(selectedWeapon)"
              :out="out"
              :baseline-out="baselineOut"
              :planner-mode="plannerMode"
              :active-gear-set="activeGearSet"
              :benchmarks="benchmarkResults"
              @update:planner-mode="setPlannerMode"
              @reset:planner-to-current="resetPlannerSlotToCurrent"
            />

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
                      plannerDamageComparison && plannerDamageComparison.planned > plannerDamageComparison.current
                        ? 'text-[#1b7f2a]'
                        : plannerDamageComparison && plannerDamageComparison.planned < plannerDamageComparison.current
                          ? 'text-[#b42323]'
                          : 'text-[#1b1b1b]'
                    "
                  >
                    <template v-if="plannerDamageComparison">
                      {{ `${Math.round(plannerDamageComparison.current).toLocaleString()} → ${Math.round(plannerDamageComparison.planned).toLocaleString()}` }}
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
                      plannerDpsComparison && plannerDpsComparison.planned > plannerDpsComparison.current
                        ? 'text-[#1b7f2a]'
                        : plannerDpsComparison && plannerDpsComparison.planned < plannerDpsComparison.current
                          ? 'text-[#b42323]'
                          : 'text-[#1b1b1b]'
                    "
                  >
                    <template v-if="plannerDpsComparison">
                      {{ `${Math.round(plannerDpsComparison.current).toLocaleString()} → ${Math.round(plannerDpsComparison.planned).toLocaleString()}` }}
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

              <div class="mt-3 text-sm text-[#666]">
                {{ selectedEnemy.name }} {{ t("enemy.level") }} {{ enemyLevel }} · {{ t("rotation.realTime") }} {{ (builderRotationSimulation?.totalTime ?? 0).toFixed(2) }}{{ t("enemy.seconds") }} · {{ t("rotation.gameTime") }} {{ (builderRotationSimulation?.totalGameTime ?? 0).toFixed(2) }}{{ t("enemy.seconds") }}
              </div>
            </section>
          </section>
        </div>

        <RotationWorkspace
          v-else
          :build-id="activeBuildId ?? undefined"
          :enemies="ENEMIES"
          :selected-enemy-id="selectedEnemyId"
          :enemy-name="selectedEnemy.name"
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
  </div>
</template>
