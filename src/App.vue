<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useBuildStore, type BuildStoreStateSnapshot, type CharacterBuildSlot } from "@/stores/buildStore";
import { useBuildListStore, type DamageTallyTiming, type SavedBuild } from "@/stores/buildListStore";

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
import { useRotationSchemes, type RotationSchemesState } from "@/lib/combat/rotationSchemes";
import { buildPartySnapshots, buildPartySnapshotsByVariant } from "@/lib/combat/buildSnapshots";
import { makeEnemyModifierSnapshot } from "@/lib/combat/simulateRotation";
import { buildInitialStateFromCheckpoint, buildRelayCumulativeOutputPrefix, createRotationSimulationCache } from "@/lib/combat/simulationCache";
import type { Rotation, RotationSimulationResult } from "@/lib/combat/rotation";
import type { CharacterCombatSnapshot } from "@/lib/combat/rotation";
import {
  buildEnemyActionWindows,
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
  ROTATION_SP_STORAGE_KEY,
} from "@/lib/storageKeys";
import { useLocale } from "@/i18n/useLocale";
import { getCharacterDisplayNameByCharacter, getWeaponDisplayNameByWeapon } from "@/i18n/domain/displayNames";
import { getCharacterImagePath, getWeaponImagePath, getGearImagePath, toAssetUrl } from "@/lib/assets/imagePaths";
import { getEnemyDisplayName, getEnemyIconId } from "@/data/enemyCustomNames";
import {
  getContingencyContractVariant,
  normalizeActiveContingencyContracts,
  type ActiveContingencyContract,
} from "@/lib/combat/contracts";
import { normalizeCustomCombatTriggers, normalizeCustomTriggerVariables } from "@/lib/combat/triggers";
import {
  makeDefaultBuildStageSettings,
  normalizeBuildStageSettings,
  resolveBuildStageSettings,
  resolveEnemyBaseForStage,
  STAGE_PRESETS,
  type BuildStageSettings,
  normalizeCustomStageDefinitions,
  getStageDisplayName,
  type CustomStageDefinition,
} from "@/lib/stages/stageSettings";

const HISTORY_LIMIT = 5;

type BuildRuntimeSnapshot = {
  currentBuildState: BuildStoreStateSnapshot;
  rotationState: RotationSchemesState;
  stageSettings: BuildStageSettings;
  customStages: CustomStageDefinition[];
  damageTallyTiming: DamageTallyTiming;
  compareSettings: {
    enabled: boolean;
    leftVariantIndex: number;
    rightVariantIndex: number;
  };
  scopedRotationUiState: {
    sp: unknown;
    contracts: unknown;
  };
};

const currentBuildSnapshot = ref<BuildStoreStateSnapshot | null>(null);
const isHydratingBuildDetail = ref(false);
const compareBuildsEnabled = ref(false);
const compareTargetVariantIndex = ref(1);
const setToSourceVariantIndex = ref(0);
const debugModeEnabled = ref(false);
const mobileSummaryOpen = ref(false);
const confirmResetGuestOpen = ref(false);
const templateExitPromptOpen = ref(false);
const contractsPopupOpen = ref(false);
const stageSettingsPopupOpen = ref(false);
const stageOverrideEnemyId = ref("aggeloi_ram");
const triggersPopupOpen = ref(false);
const rotationStagePopupOpen = ref(false);
const buildListPageRef = ref<InstanceType<typeof BuildListPage> | null>(null);

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
const {
  userBuilds,
  templateBuilds,
  communityBuilds,
  communityBuildsLoading,
  communityBuildsError,
  activeBuild,
  activeBuildId,
  activeBuildSource,
} = storeToRefs(buildListStore);
const { t, locale, setLocale } = useLocale();
const route = useRoute();
const router = useRouter();
const activeDamageTallyTiming = ref<DamageTallyTiming>({ enabled: false, startTime: 0, endTime: 60 });
const undoHistory = ref<BuildRuntimeSnapshot[]>([]);
const redoHistory = ref<BuildRuntimeSnapshot[]>([]);
const currentHistorySnapshot = ref<BuildRuntimeSnapshot | null>(null);
const currentHistorySignature = ref("");
const isApplyingRuntimeSnapshot = ref(false);
const historyRevision = ref(0);
const activeTransientHistory = ref<{ baseline: BuildRuntimeSnapshot; baselineSignature: string } | null>(null);
const templateBaselineSnapshot = ref<BuildRuntimeSnapshot | null>(null);
const rotationSimulationCache = createRotationSimulationCache();
const buildSummarySimulationCaches = new Map<string, ReturnType<typeof createRotationSimulationCache>>();
const builderSimulationRevision = ref(0);
const simulationTransitionLoading = ref(false);
const LONG_ROTATION_COMPLEXITY_THRESHOLD = 96;
const longRotationNeedsRecalculation = ref(false);
let cachedLongBuilderSimulation: RotationSimulationResult | null = null;
let cachedLongBuilderSimulationBuildId = "";

/**
 * Vue flushing the overlay into the DOM is not enough: a single rAF callback
 * still runs before paint, so starting synchronous simulation from it prevents
 * the overlay from ever becoming visible. Waiting for the following frame
 * guarantees that the browser had a paint opportunity in between.
 */
function waitForBrowserPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    } else {
      setTimeout(resolve, 16);
    }
  });
}

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

const mainPageTitle = computed(() => {
  if (page.value === "build-list") return t("buildList.title");
  return workspace.value === "rotation" ? t("ui.rotationSimulator") : t("ui.buildCustomizations");
});

const activeBuildStageSettings = computed<BuildStageSettings>({
  get: () => normalizeBuildStageSettings(activeBuild.value?.stageSettings ?? makeDefaultBuildStageSettings()),
  set: (value) => {
    if (activeBuild.value) activeBuild.value.stageSettings = normalizeBuildStageSettings(value);
  },
});
const resolvedStageSettings = computed(() => resolveBuildStageSettings(activeBuildStageSettings.value));
const activeBuildCustomStages = computed<CustomStageDefinition[]>({
  get: () => normalizeCustomStageDefinitions(activeBuild.value?.customStages),
  set: (value) => { if (activeBuild.value) activeBuild.value.customStages = normalizeCustomStageDefinitions(value); },
});
const stageEnemyHpBaseOverrides = computed(() => Object.fromEntries(
  ENEMIES.filter((enemy) => enemy.id !== "aggeloi_ram_cc" && enemy.id !== "hedron_cc")
    .map((enemy) => [enemy.id, resolveEnemyBaseForStage(enemy, resolvedStageSettings.value).baseHpLv1]),
));
const stageEnemyStaggerOverrides = computed(() => resolvedStageSettings.value.enemyStaggerOverrides);
const selectableStageEnemies = computed(() => ENEMIES.filter((enemy) => enemy.id !== "aggeloi_ram_cc" && enemy.id !== "hedron_cc"));
function updateStageSettings(mutator: (draft: BuildStageSettings) => void) {
  const draft = cloneJson(activeBuildStageSettings.value);
  mutator(draft);
  activeBuildStageSettings.value = draft;
}
function setStageMode(mode: "preset" | "custom") {
  updateStageSettings((draft) => { draft.mode = mode; });
  if (mode === "custom" && !activeBuildStageSettings.value.custom.contractsEnabled) {
    contractsPopupOpen.value = false;
  }
}
function setCustomStageName(name: string) {
  updateStageSettings((draft) => { draft.custom.name = name; });
}
function setCustomStageContractsEnabled(enabled: boolean) {
  updateStageSettings((draft) => { draft.custom.contractsEnabled = enabled; });
  if (!enabled) contractsPopupOpen.value = false;
}
function setStageInitialSp(value: number) {
  updateStageSettings((draft) => { draft.initialSp = Math.max(0, Number.isFinite(value) ? value : 0); });
}
function setStageSpRegenRate(value: number) {
  updateStageSettings((draft) => { draft.spRegenRate = Math.max(0, Number.isFinite(value) ? value : 0); });
}
function setCustomStageEnemyHpMultiplier(enemyId: string, value: number) {
  updateStageSettings((draft) => { draft.custom.enemyHpMultipliers[enemyId] = Math.max(0.01, value || 1); });
}
function setCustomStageEnemyHp(enemyId: string, value: number) {
  updateStageSettings((draft) => {
    draft.custom.enemyHpBaseOverrides[enemyId] = Math.max(1, Math.round(value || 1));
  });
}
function setCustomStageEnemyStagger(enemyId: string, value: number) {
  updateStageSettings((draft) => {
    draft.custom.enemyStaggerOverrides[enemyId] = Math.max(1, Math.round(value || 1));
  });
}
function addCustomStageEnemyOverride() {
  const enemy = selectableStageEnemies.value.find((entry) => entry.id === stageOverrideEnemyId.value);
  if (!enemy) return;
  updateStageSettings((draft) => {
    draft.custom.enemyHpBaseOverrides[enemy.id] ??= enemy.baseHpLv1;
    draft.custom.enemyHpMultipliers[enemy.id] ??= 1;
    draft.custom.enemyStaggerOverrides[enemy.id] ??= enemy.staggerGauge;
  });
}
function removeCustomStageEnemyOverride(enemyId: string) {
  updateStageSettings((draft) => {
    delete draft.custom.enemyHpBaseOverrides[enemyId];
    delete draft.custom.enemyHpMultipliers[enemyId];
    delete draft.custom.enemyStaggerOverrides[enemyId];
  });
}

const {
  ENEMIES,
  enemySlots,
  targetedEnemySlotId,
  selectedEnemyId,
  selectedEnemy,
  enemyLevel,
  resolvedEnemyStats,
} = useEnemyState(stageEnemyHpBaseOverrides);
const selectedEnemyDisplayName = computed(() =>
  getEnemyDisplayName(selectedEnemy.value.id, selectedEnemy.value.name, locale.value as "en" | "zh-CN"),
);
const selectedEnemyIconPath = computed(() =>
  toAssetUrl(`/item-icons/enemies/${getEnemyIconId(selectedEnemy.value.id)}.webp`),
);

const {
  rotationSchemes,
  activeScheme,
  setActiveScheme,
  hydrateRotationSchemes,
  exportRotationSchemes,
} = useRotationSchemes(activeBuildId);
const relayDisplaySourceScheme = computed(() => {
  const schemes = rotationSchemes.value.schemes;
  const activeId = activeScheme.value.id;
  const activeIndex = schemes.findIndex((scheme) => scheme.id === activeId);
  if (activeIndex <= 0) {
    return activeScheme.value;
  }
  let sourceIndex = activeIndex;
  while (sourceIndex > 0 && schemes[sourceIndex]?.simulationMode === "relay_from_previous") {
    sourceIndex -= 1;
  }
  return schemes[sourceIndex] ?? activeScheme.value;
});
const rotationDisplayStageSettings = computed(() => resolveBuildStageSettings(
  normalizeBuildStageSettings(relayDisplaySourceScheme.value.stageSettings ?? activeBuildStageSettings.value),
  activeBuildCustomStages.value,
));
const activeContingencyContracts = computed<ActiveContingencyContract[]>(() =>
  normalizeActiveContingencyContracts(relayDisplaySourceScheme.value.activeContracts ?? []),
);
const contingencyTotalLevel = computed(() =>
  activeContingencyContracts.value.reduce((sum, entry) => {
    const variant = getContingencyContractVariant(entry.id, entry.variantId);
    return sum + (variant?.level ?? 0);
  }, 0),
);
const activeTriggerCount = computed(() =>
  normalizeCustomCombatTriggers(relayDisplaySourceScheme.value.triggers ?? []).length,
);
const rotationComplexities = computed(() => rotationSchemes.value.schemes.map((scheme, index, schemes) => {
  let stepCount = scheme.rotation.steps.length;
  for (let laterIndex = index + 1; laterIndex < schemes.length; laterIndex += 1) {
    const laterScheme = schemes[laterIndex];
    if (!laterScheme || laterScheme.simulationMode !== "relay_from_previous") break;
    stepCount += laterScheme.rotation.steps.length;
  }
  const triggerCount = normalizeCustomCombatTriggers(scheme.triggers ?? []).length;
  return stepCount * (triggerCount + 16) / 16;
}));
const builderRotationComplexity = computed(() => {
  const schemes = rotationSchemes.value.schemes;
  if (schemes.length === 0) return 0;
  let chainStartIndex = schemes.length - 1;
  while (chainStartIndex > 0 && schemes[chainStartIndex]?.simulationMode === "relay_from_previous") {
    chainStartIndex -= 1;
  }
  return rotationComplexities.value[chainStartIndex] ?? 0;
});
const isLongBuilderRotation = computed(() =>
  builderRotationComplexity.value > LONG_ROTATION_COMPLEXITY_THRESHOLD,
);
const isActiveRotationRelayed = computed(() => activeScheme.value.simulationMode === "relay_from_previous");
watch(isActiveRotationRelayed, (relayed) => {
  if (relayed) rotationStagePopupOpen.value = false;
});

const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";

function getBuildStorageScopeId(): string {
  return activeBuildId.value || BUILD_STORAGE_SCOPE_DEFAULT;
}

function getBattleStartConsumableIdsForActiveScheme(): (string | null)[] {
  if (activeScheme.value.teamSpConfig?.consumableBySlot) {
    return [...activeScheme.value.teamSpConfig.consumableBySlot];
  }
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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readScopedStorageState(storageKey: string): unknown {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const byBuild = record.byBuild;
      if (byBuild && typeof byBuild === "object") {
        return cloneJson((byBuild as Record<string, unknown>)[getBuildStorageScopeId()] ?? null);
      }
    }
    return cloneJson(parsed);
  } catch {
    return null;
  }
}

function writeScopedStorageState(storageKey: string, scopedValue: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  let parsed: Record<string, unknown> = {};
  const raw = window.localStorage.getItem(storageKey);
  if (raw) {
    try {
      const next = JSON.parse(raw) as unknown;
      if (next && typeof next === "object") {
        parsed = next as Record<string, unknown>;
      }
    } catch {
      parsed = {};
    }
  }

  const byBuild =
    parsed.byBuild && typeof parsed.byBuild === "object"
      ? { ...(parsed.byBuild as Record<string, unknown>) }
      : {};
  if (scopedValue == null) {
    delete byBuild[getBuildStorageScopeId()];
  } else {
    byBuild[getBuildStorageScopeId()] = cloneJson(scopedValue);
  }
  parsed.byBuild = byBuild;
  window.localStorage.setItem(storageKey, JSON.stringify(parsed));
}

function getEnemyCommandPlacementsForActiveScheme(): EnemyCommandPlacement[] {
  return getEnemyCommandPlacementsForSlot(targetedEnemySlotId.value);
}

function normalizeEnemyCommandPlacements(source: EnemyCommandPlacement[]): EnemyCommandPlacement[] {
  return source.map((entry) => ({
    id: entry.id,
    commandId: entry.commandId,
    startTime: Math.max(0, Number(entry.startTime ?? 0)),
    interrupted: entry.interrupted === true,
    interruptedSpGain: Math.max(0, Number(entry.interruptedSpGain ?? 0)),
    interruptedStagger: Math.max(0, Number(entry.interruptedStagger ?? 0)),
  }));
}

function getEnemyCommandPlacementsForSlot(slotId: string): EnemyCommandPlacement[] {
  return normalizeEnemyCommandPlacements(
    (activeScheme.value.rotation.enemySteps ?? [])
      .filter((step) => step.enemySlotId === slotId)
      .map(({ enemySlotId: _enemySlotId, ...placement }) => placement),
  );
}

function buildEnemyActionWindowsForActiveScheme() {
  return enemySlots.value.flatMap((slot) =>
    buildEnemyActionWindows(slot.enemyId, getEnemyCommandPlacementsForSlot(slot.slotId)).map((window) => ({
      ...window,
      enemySlotId: slot.slotId,
    })),
  );
}

watch(
  () => rotationSchemes.value.enemySlots,
  (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }
    const normalized = value.map((slot) => ({
      slotId: slot.slotId,
      enemyId: slot.enemyId,
      level: Math.max(1, Math.min(100, Math.round(slot.level))),
      spawnTimeEnabled: slot.spawnTimeEnabled === true,
      spawnTime:
        typeof slot.spawnTime === "number" && Number.isFinite(slot.spawnTime)
          ? Math.round(slot.spawnTime * 1000) / 1000
          : 0,
      noDeath: slot.noDeath === true,
    }));
    if (JSON.stringify(enemySlots.value) !== JSON.stringify(normalized)) {
      enemySlots.value = normalized;
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => rotationSchemes.value.targetedEnemySlotId,
  (value) => {
    const fallback = enemySlots.value[0]?.slotId ?? "enemy_slot_1";
    const normalized =
      typeof value === "string" && enemySlots.value.some((slot) => slot.slotId === value)
        ? value
        : fallback;
    if (targetedEnemySlotId.value !== normalized) {
      targetedEnemySlotId.value = normalized;
    }
  },
  { immediate: true },
);

watch(
  enemySlots,
  (value) => {
    const normalized = value.map((slot) => ({
      slotId: slot.slotId,
      enemyId: slot.enemyId,
      level: Math.max(1, Math.min(100, Math.round(slot.level))),
      spawnTimeEnabled: slot.spawnTimeEnabled === true,
      spawnTime:
        typeof slot.spawnTime === "number" && Number.isFinite(slot.spawnTime)
          ? Math.round(slot.spawnTime * 1000) / 1000
          : 0,
      noDeath: slot.noDeath === true,
    }));
    if (JSON.stringify(rotationSchemes.value.enemySlots ?? []) !== JSON.stringify(normalized)) {
      rotationSchemes.value.enemySlots = normalized;
    }
    const targeted = normalized.find((slot) => slot.slotId === targetedEnemySlotId.value) ?? normalized[0];
    if (targeted) {
      if (rotationSchemes.value.selectedEnemyId !== targeted.enemyId) {
        rotationSchemes.value.selectedEnemyId = targeted.enemyId;
      }
      if (rotationSchemes.value.enemyLevel !== targeted.level) {
        rotationSchemes.value.enemyLevel = targeted.level;
      }
    }
  },
  { deep: true },
);

watch(targetedEnemySlotId, (value) => {
  const fallback = enemySlots.value[0]?.slotId ?? "enemy_slot_1";
  const normalized =
    enemySlots.value.some((slot) => slot.slotId === value)
      ? value
      : fallback;
  if (rotationSchemes.value.targetedEnemySlotId !== normalized) {
    rotationSchemes.value.targetedEnemySlotId = normalized;
  }
  const targeted = enemySlots.value.find((slot) => slot.slotId === normalized);
  if (targeted) {
    if (rotationSchemes.value.selectedEnemyId !== targeted.enemyId) {
      rotationSchemes.value.selectedEnemyId = targeted.enemyId;
    }
    if (rotationSchemes.value.enemyLevel !== targeted.level) {
      rotationSchemes.value.enemyLevel = targeted.level;
    }
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

  return rotationSimulationCache.simulate({
    rotation,
    party: partySnapshots.value,
    partyVariantsBySlot: partyVariantsBySlot.value,
    initialVariantIndex: activeVariantIndex.value,
    enemySlots: enemySlots.value,
    targetedEnemySlotId: targetedEnemySlotId.value,
    enemyId: selectedEnemyId.value,
    enemyLevel: enemyLevel.value,
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
    enemyHpBaseOverrides: stageEnemyHpBaseOverrides.value,
    enemyStaggerOverrides: stageEnemyStaggerOverrides.value,
    contingencyContracts: getActiveContractsForActiveScheme(),
    internalCombatTriggerDefinitions: resolvedStageSettings.value.internalCombatTriggerDefinitions,
    customTriggers: normalizeCustomCombatTriggers(activeScheme.value.triggers ?? []),
    customTriggerVariables: normalizeCustomTriggerVariables(activeScheme.value.triggerVariables ?? []),
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindowsForActiveScheme(),
  }).result;
}

function getBuildSummarySimulationCache(schemeId: string) {
  let cache = buildSummarySimulationCaches.get(schemeId);
  if (!cache) {
    cache = createRotationSimulationCache();
    buildSummarySimulationCaches.set(schemeId, cache);
  }
  return cache;
}

function rebaseSummaryRotation(rotation: Rotation, displayOffset: number): Rotation {
  if (!(displayOffset > 0)) return rotation;
  return {
    ...rotation,
    steps: rotation.steps.map((step) => ({
      ...step,
      startTime: typeof step.startTime === "number" ? step.startTime - displayOffset : step.startTime,
    })),
  };
}

function getSummaryEnemyActionWindows(scheme: typeof activeScheme.value) {
  const slotIds = new Set([
    ...enemySlots.value.map((slot) => slot.slotId),
    ...(scheme.rotation.enemySteps ?? []).map((step) => step.enemySlotId),
  ]);
  return [...slotIds].flatMap((slotId) => {
    const slot = enemySlots.value.find((entry) => entry.slotId === slotId);
    const enemyId = slot?.enemyId ?? "";
    return buildEnemyActionWindows(
      enemyId,
      (scheme.rotation.enemySteps ?? [])
        .filter((step) => step.enemySlotId === slotId)
        .map(({ enemySlotId: _enemySlotId, ...placement }) => placement),
    ).map((window) => ({ ...window, enemySlotId: slotId }));
  });
}

function rebaseSummaryEnemyActionWindows(
  windows: ReturnType<typeof getSummaryEnemyActionWindows>,
  displayOffset: number,
) {
  if (!(displayOffset > 0)) return windows;
  return windows.map((window) => ({
    ...window,
    startTime: window.startTime - displayOffset,
    endTime: window.endTime - displayOffset,
  }));
}

function simulateFinalRotationChain(): RotationSimulationResult | null {
  const schemes = rotationSchemes.value.schemes;
  if (partySnapshots.value.length === 0 || schemes.length === 0) return null;

  let chainStartIndex = schemes.length - 1;
  while (chainStartIndex > 0 && schemes[chainStartIndex]?.simulationMode === "relay_from_previous") {
    chainStartIndex -= 1;
  }

  let previousResult: RotationSimulationResult | null = null;
  let inheritedContracts: ActiveContingencyContract[] = [];
  let inheritedTriggers = normalizeCustomCombatTriggers([]);
  let inheritedTriggerVariables = normalizeCustomTriggerVariables([]);

  for (let index = chainStartIndex; index < schemes.length; index += 1) {
    const scheme = schemes[index]!;
    const sourceStageSettings = normalizeBuildStageSettings(schemes[chainStartIndex]?.stageSettings ?? activeBuildStageSettings.value);
    const ownStageSettings = normalizeBuildStageSettings(scheme.stageSettings ?? activeBuildStageSettings.value);
    const stage = resolveBuildStageSettings(
      index > chainStartIndex && scheme.simulationMode === "relay_from_previous" ? sourceStageSettings : ownStageSettings,
      activeBuildCustomStages.value,
    );
    const ownContracts = stage.contractsEnabled
      ? normalizeActiveContingencyContracts(scheme.activeContracts ?? [])
      : [];
    const contracts = index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
      ? inheritedContracts
      : ownContracts;
    const ownTriggers = normalizeCustomCombatTriggers(scheme.triggers ?? []);
    const triggers = index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
      ? inheritedTriggers
      : ownTriggers;
    const ownTriggerVariables = normalizeCustomTriggerVariables(scheme.triggerVariables ?? []);
    const triggerVariables = index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
      ? inheritedTriggerVariables
      : ownTriggerVariables;
    const teamConfig = scheme.teamSpConfig;
    const startingEnergy = stage.lockInitialEnergy
      ? [0, 1, 2, 3].map(() => stage.initialEnergyPct)
      : teamConfig?.startingEnergyBySlot ?? [100, 100, 100, 100];
    const consumables = stage.disableConsumables
      ? [null, null, null, null]
      : teamConfig?.consumableBySlot ?? [null, null, null, null];
    const enemyHpOverrides = Object.fromEntries(selectableStageEnemies.value.map((enemy) => [
      enemy.id,
      resolveEnemyBaseForStage(enemy, stage).baseHpLv1,
    ]));
    const actionWindows = getSummaryEnemyActionWindows(scheme);
    const baseArgs = {
      rotation: scheme.rotation,
      party: partySnapshots.value,
      partyVariantsBySlot: partyVariantsBySlot.value,
      initialVariantIndex: activeVariantIndex.value,
      enemySlots: enemySlots.value,
      targetedEnemySlotId: targetedEnemySlotId.value,
      enemyId: selectedEnemyId.value,
      enemyLevel: enemyLevel.value,
      enemyStats: resolvedEnemyStats.value,
      enemyMods: makeEnemyModifierSnapshot({ resistances: {
        PHYSICAL_RESIST_PCT: selectedEnemy.value.resistances.Physical,
        HEAT_RESIST_PCT: selectedEnemy.value.resistances.Heat,
        CRYO_RESIST_PCT: selectedEnemy.value.resistances.Cryo,
        ELECTRIC_RESIST_PCT: selectedEnemy.value.resistances.Electric,
        NATURE_RESIST_PCT: selectedEnemy.value.resistances.Nature,
        AETHER_RESIST_PCT: selectedEnemy.value.resistances.Aether,
      } }),
      enemyStaggerGauge: selectedEnemy.value.staggerGauge,
      enemyStaggerNodes: selectedEnemy.value.staggerNodes,
      enemyStaggerRecoverySeconds: selectedEnemy.value.staggerRecoverySeconds,
      enemyFinisherMultiplier: selectedEnemy.value.finisherMultiplier,
      enemyFinisherSpGain: selectedEnemy.value.finisherSpGain,
      enemyHpBaseOverrides: enemyHpOverrides,
      enemyStaggerOverrides: stage.enemyStaggerOverrides,
      contingencyContracts: contracts,
      internalCombatTriggerDefinitions: stage.internalCombatTriggerDefinitions,
      customTriggers: triggers,
      customTriggerVariables: triggerVariables,
      battleStartInitialSp: stage.initialSp,
      battleStartSpRegenRate: stage.spRegenRate,
      battleStartStartingEnergyPctBySlot: startingEnergy,
      battleStartControlledOperatorSlot: teamConfig?.controlledOperatorSlot ?? 0,
      battleStartConsumableIdsBySlot: consumables,
      enemyActionWindows: actionWindows,
    };

    const shouldRelay = index > chainStartIndex
      && scheme.simulationMode === "relay_from_previous"
      && previousResult
      && (previousResult.simulationCheckpoints?.length ?? 0) > 0;
    if (shouldRelay) {
      const relayMarkers: RotationSimulationResult["relayTimeline"] = [...(previousResult!.relayTimeline ?? [])]
        .filter((entry) => entry.inherited !== true)
        .sort((left, right) => left.time - right.time);
      const relayMarker: RotationSimulationResult["relayTimeline"][number] | undefined = relayMarkers[0];
      const relayTime: number = relayMarker?.time ?? previousResult!.totalTime;
      const relayGameTime: number = relayMarker?.gameTime ?? previousResult!.totalGameTime;
      const displayOffset: number = (previousResult!.displayTimeOffset ?? 0) + relayTime;
      const displayGameOffset: number = (previousResult!.displayGameTimeOffset ?? 0) + relayGameTime;
      const checkpoints: NonNullable<RotationSimulationResult["simulationCheckpoints"]> = [...(previousResult!.simulationCheckpoints ?? [])]
        .filter((entry) => entry.time <= relayTime + 0.0001)
        .sort((left, right) => left.time - right.time);
      const checkpoint: NonNullable<RotationSimulationResult["simulationCheckpoints"]>[number] | undefined = checkpoints[checkpoints.length - 1];
      if (checkpoint) {
        previousResult = getBuildSummarySimulationCache(scheme.id).simulate({
          ...baseArgs,
          rotation: rebaseSummaryRotation(scheme.rotation, displayOffset),
          enemyActionWindows: rebaseSummaryEnemyActionWindows(actionWindows, displayOffset),
          contingencyContracts: inheritedContracts,
          customTriggers: inheritedTriggers,
          customTriggerVariables: inheritedTriggerVariables,
          battleStartConsumableIdsBySlot: [null, null, null, null],
          initialState: buildInitialStateFromCheckpoint(checkpoint, relayTime, relayGameTime, displayOffset, displayGameOffset),
          resumeOutputPrefix: buildRelayCumulativeOutputPrefix(previousResult!, checkpoint),
          relayStartTime: 0,
          relayStartGameTime: 0,
          emitRotationRelayedEvent: true,
        }).result;
      }
    } else {
      previousResult = getBuildSummarySimulationCache(scheme.id).simulate(baseArgs).result;
    }
    inheritedContracts = contracts;
    inheritedTriggers = triggers;
    inheritedTriggerVariables = triggerVariables;
  }
  return previousResult;
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
  return rotationSimulationCache.simulate({
    rotation,
    party: snapshotParty,
    partyVariantsBySlot: snapshotVariantsBySlot,
    initialVariantIndex: snapshot.activeVariantIndex ?? 0,
    enemySlots: enemySlots.value,
    targetedEnemySlotId: targetedEnemySlotId.value,
    enemyId: selectedEnemyId.value,
    enemyLevel: enemyLevel.value,
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
    enemyHpBaseOverrides: stageEnemyHpBaseOverrides.value,
    enemyStaggerOverrides: stageEnemyStaggerOverrides.value,
    contingencyContracts: getActiveContractsForActiveScheme(),
    internalCombatTriggerDefinitions: resolvedStageSettings.value.internalCombatTriggerDefinitions,
    customTriggers: normalizeCustomCombatTriggers(activeScheme.value.triggers ?? []),
    customTriggerVariables: normalizeCustomTriggerVariables(activeScheme.value.triggerVariables ?? []),
    battleStartConsumableIdsBySlot: getBattleStartConsumableIdsForActiveScheme(),
    enemyActionWindows: buildEnemyActionWindowsForActiveScheme(),
  }).result;
}

function getActiveContractsForActiveScheme(): ActiveContingencyContract[] {
  if (!resolvedStageSettings.value.contractsEnabled) {
    return [];
  }
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
    return normalizeActiveContingencyContracts(source);
  } catch {
    return [];
  }
}


function getTallyWindowSummary(
  simulation: RotationSimulationResult | null | undefined,
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
    const end = Math.max(0, (simulation.displayTimeOffset ?? 0) + simulation.totalTime);
    const duration = end;
    const totalDamage = simulation.totalDamage;
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
  void builderSimulationRevision.value;
  if (!isLongBuilderRotation.value) {
    return simulateFinalRotationChain();
  }
  if (
    cachedLongBuilderSimulationBuildId === activeBuildId.value
    && cachedLongBuilderSimulation
  ) {
    return cachedLongBuilderSimulation;
  }
  cachedLongBuilderSimulation = simulateFinalRotationChain();
  cachedLongBuilderSimulationBuildId = activeBuildId.value;
  return cachedLongBuilderSimulation;
});

const builderTallySummary = computed(() =>
  getTallyWindowSummary(builderRotationSimulation.value, activeDamageTallyTiming.value),
);

const builderRotationDps = computed(() => {
  return builderTallySummary.value.dps;
});

const finalSchemeDps = computed(() => {
  return getTallyWindowSummary(builderRotationSimulation.value, activeDamageTallyTiming.value).dps;
});

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];

const builderDamageContributions = computed(() => {
  const simulation = builderRotationSimulation.value;
  if (!simulation) {
    return [];
  }

  if (!activeDamageTallyTiming.value.enabled) {
    const totalDamage = simulation.totalDamage;
    return simulation.damageBySlot.map((entry, index) => ({
      ...entry,
      color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
      percent: totalDamage > 0 ? (entry.damage / totalDamage) * 100 : 0,
      localizedCharacterName: getCharacterDisplayNameByCharacter(
        CHARACTERS.find((character) => character.id === slots.value[entry.slot]?.selectedCharId) ?? null,
      ) || entry.characterName,
    }));
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

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  if (typeof window !== "undefined") {
    window.prompt("Copy to clipboard:", value);
  }
}

function captureRuntimeSnapshot(): BuildRuntimeSnapshot | null {
  if (page.value !== "build-detail" || !activeBuildId.value) {
    return null;
  }

  return {
    currentBuildState: cloneBuildSnapshot(buildStore.exportStateSnapshot()),
    rotationState: cloneJson(exportRotationSchemes()),
    stageSettings: cloneJson(activeBuildStageSettings.value),
    customStages: cloneJson(activeBuildCustomStages.value),
    damageTallyTiming: cloneJson(activeDamageTallyTiming.value),
    compareSettings: {
      enabled: compareBuildsEnabled.value,
      leftVariantIndex: activeVariantIndex.value,
      rightVariantIndex: compareTargetVariantIndex.value,
    },
    scopedRotationUiState: {
      sp: readScopedStorageState(ROTATION_SP_STORAGE_KEY),
      contracts: readScopedStorageState(ROTATION_CONTRACTS_STORAGE_KEY),
    },
  };
}

function captureSavedBuildRuntimeSnapshot(build: SavedBuild): BuildRuntimeSnapshot {
  return {
    currentBuildState: cloneBuildSnapshot(build.currentBuildState),
    rotationState: cloneJson(build.rotationState),
    stageSettings: cloneJson(build.stageSettings),
    customStages: cloneJson(normalizeCustomStageDefinitions(build.customStages)),
    damageTallyTiming: cloneJson(build.damageTallyTiming),
    compareSettings: cloneJson(
      build.compareSettings ?? {
        enabled: false,
        leftVariantIndex: build.currentBuildState.activeVariantIndex ?? 0,
        rightVariantIndex: 1,
      },
    ),
    scopedRotationUiState: cloneJson(
      build.scopedRotationUiState ?? {
        sp: null,
        contracts: null,
      },
    ),
  };
}

const isActiveTemplateBuild = computed(() => activeBuildSource.value === "template" || activeBuildSource.value === "community");

function hasUnsavedTemplateChanges(): boolean {
  if (!isActiveTemplateBuild.value || !templateBaselineSnapshot.value) {
    return false;
  }
  return snapshotSignature(captureRuntimeSnapshot()) !== snapshotSignature(templateBaselineSnapshot.value);
}

function snapshotSignature(snapshot: BuildRuntimeSnapshot | null): string {
  return snapshot ? JSON.stringify(snapshot) : "";
}

function pushHistoryEntry(stack: typeof undoHistory | typeof redoHistory, snapshot: BuildRuntimeSnapshot) {
  stack.value.push(cloneJson(snapshot));
  if (stack.value.length > HISTORY_LIMIT) {
    stack.value.splice(0, stack.value.length - HISTORY_LIMIT);
  }
}

function seedHistoryFromCurrentState() {
  const snapshot = captureRuntimeSnapshot();
  currentHistorySnapshot.value = snapshot ? cloneJson(snapshot) : null;
  currentHistorySignature.value = snapshotSignature(snapshot);
  undoHistory.value = [];
  redoHistory.value = [];
  activeTransientHistory.value = null;
}

function recordHistoryIfChanged() {
  if (isApplyingRuntimeSnapshot.value || activeTransientHistory.value) {
    return;
  }
  const snapshot = captureRuntimeSnapshot();
  if (!snapshot) {
    return;
  }
  const signature = snapshotSignature(snapshot);
  if (signature === currentHistorySignature.value) {
    return;
  }
  if (currentHistorySnapshot.value) {
    pushHistoryEntry(undoHistory, currentHistorySnapshot.value);
  }
  currentHistorySnapshot.value = cloneJson(snapshot);
  currentHistorySignature.value = signature;
  redoHistory.value = [];
}

const canUndo = computed(() => undoHistory.value.length > 0);
const canRedo = computed(() => redoHistory.value.length > 0);

function beginTransientHistory() {
  if (activeTransientHistory.value) {
    return;
  }
  const baseline = captureRuntimeSnapshot();
  if (!baseline) {
    return;
  }
  activeTransientHistory.value = {
    baseline: cloneJson(baseline),
    baselineSignature: snapshotSignature(baseline),
  };
}

function commitTransientHistory() {
  const transient = activeTransientHistory.value;
  if (!transient) {
    return;
  }
  activeTransientHistory.value = null;
  const snapshot = captureRuntimeSnapshot();
  if (!snapshot) {
    return;
  }
  const signature = snapshotSignature(snapshot);
  if (signature === transient.baselineSignature) {
    currentHistorySnapshot.value = cloneJson(snapshot);
    currentHistorySignature.value = signature;
    return;
  }
  pushHistoryEntry(undoHistory, transient.baseline);
  currentHistorySnapshot.value = cloneJson(snapshot);
  currentHistorySignature.value = signature;
  redoHistory.value = [];
}

function applyRuntimeSnapshot(snapshot: BuildRuntimeSnapshot) {
  if (!activeBuildId.value) {
    return;
  }

  isApplyingRuntimeSnapshot.value = true;
  try {
    activeTransientHistory.value = null;
    currentBuildSnapshot.value = cloneBuildSnapshot(snapshot.currentBuildState);
    buildStore.hydrateStateSnapshot(cloneBuildSnapshot(snapshot.currentBuildState));
    compareBuildsEnabled.value = snapshot.compareSettings.enabled;
    compareTargetVariantIndex.value = snapshot.compareSettings.rightVariantIndex;
    hydrateRotationSchemes(cloneJson(snapshot.rotationState));
    activeBuildStageSettings.value = cloneJson(snapshot.stageSettings);
    activeBuildCustomStages.value = cloneJson(snapshot.customStages);
    writeScopedStorageState(ROTATION_SP_STORAGE_KEY, snapshot.scopedRotationUiState.sp);
    writeScopedStorageState(ROTATION_CONTRACTS_STORAGE_KEY, snapshot.scopedRotationUiState.contracts);
    buildListStore.updateBuildRuntime({
      buildId: activeBuildId.value,
      currentBuildState: cloneBuildSnapshot(snapshot.currentBuildState),
      plannedBuildState: cloneBuildSnapshot(snapshot.currentBuildState),
      rotationState: cloneJson(snapshot.rotationState),
      stageSettings: cloneJson(snapshot.stageSettings),
      customStages: cloneJson(snapshot.customStages),
      scopedRotationUiState: cloneJson(snapshot.scopedRotationUiState),
      damageTallyTiming: cloneJson(snapshot.damageTallyTiming),
      compareSettings: cloneJson(snapshot.compareSettings),
    });
  } finally {
    isApplyingRuntimeSnapshot.value = false;
  }

  currentHistorySnapshot.value = cloneJson(snapshot);
  currentHistorySignature.value = snapshotSignature(snapshot);
  historyRevision.value += 1;
  persistCurrentBuild();
}

function undoLastChange() {
  const transient = activeTransientHistory.value;
  if (transient) {
    activeTransientHistory.value = null;
    const current = captureRuntimeSnapshot();
    if (current && snapshotSignature(current) !== transient.baselineSignature) {
      pushHistoryEntry(redoHistory, current);
      applyRuntimeSnapshot(transient.baseline);
      return;
    }
  }
  const target = undoHistory.value.pop();
  if (!target) {
    return;
  }
  const current = captureRuntimeSnapshot();
  if (current) {
    pushHistoryEntry(redoHistory, current);
  }
  applyRuntimeSnapshot(target);
}

function redoLastChange() {
  if (activeTransientHistory.value) {
    commitTransientHistory();
  }
  const target = redoHistory.value.pop();
  if (!target) {
    return;
  }
  const current = captureRuntimeSnapshot();
  if (current) {
    pushHistoryEntry(undoHistory, current);
  }
  applyRuntimeSnapshot(target);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

function handleUndoRedoKeydown(event: KeyboardEvent) {
  if (page.value !== "build-detail" || isEditableTarget(event.target)) {
    return;
  }
  const isModifier = event.metaKey || event.ctrlKey;
  if (!isModifier || event.altKey || event.key.toLowerCase() !== "z") {
    return;
  }

  event.preventDefault();
  if (event.shiftKey) {
    redoLastChange();
  } else {
    undoLastChange();
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleUndoRedoKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleUndoRedoKeydown);
  }
});

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
    mainAttr: selectedChar.value.mainAttr,
    secondaryAttr: selectedChar.value.secondaryAttr,
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
  void builderSimulationRevision.value;
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

async function recalculateBuilderRotation() {
  if (simulationTransitionLoading.value) return;
  simulationTransitionLoading.value = true;
  await nextTick();
  await waitForBrowserPaint();
  try {
    rotationSimulationCache.clear();
    for (const cache of buildSummarySimulationCaches.values()) cache.clear();
    cachedLongBuilderSimulation = null;
    cachedLongBuilderSimulationBuildId = "";
    longRotationNeedsRecalculation.value = false;
    builderSimulationRevision.value += 1;
    await nextTick();
    void builderRotationSimulation.value;
    await nextTick();
    persistCurrentBuild();
  } finally {
    simulationTransitionLoading.value = false;
  }
}

async function openRotationWorkspace() {
  if (simulationTransitionLoading.value || workspace.value === "rotation") return;
  const buildId = routeBuildId.value || activeBuildId.value;
  if (!buildId) return;
  simulationTransitionLoading.value = true;
  await nextTick();
  await waitForBrowserPaint();
  try {
    if (isLongBuilderRotation.value && longRotationNeedsRecalculation.value) {
      rotationSimulationCache.clear();
      for (const cache of buildSummarySimulationCaches.values()) cache.clear();
      cachedLongBuilderSimulation = null;
      cachedLongBuilderSimulationBuildId = "";
      longRotationNeedsRecalculation.value = false;
      builderSimulationRevision.value += 1;
      await nextTick();
      void builderRotationSimulation.value;
      await nextTick();
      persistCurrentBuild();
    }
    await router.push({ name: "build-rotation", params: { buildId } });
    await nextTick();
  } finally {
    simulationTransitionLoading.value = false;
  }
}

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
  currentBuildSnapshot.value = null;
  seedHistoryFromCurrentState();
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

function getSummaryForPersistence(): { totalDamage: number; dps: number } {
  // Only short rotations in the build workspace are meant to simulate live.
  // Saving from the rotation workspace or leaving a build must never demand a
  // builder simulation merely to refresh summary metadata.
  if (workspace.value === "builder" && !isLongBuilderRotation.value) {
    return {
      totalDamage: builderTallySummary.value.totalDamage,
      dps: finalSchemeDps.value,
    };
  }
  if (
    cachedLongBuilderSimulationBuildId === activeBuildId.value
    && cachedLongBuilderSimulation
  ) {
    return getTallyWindowSummary(cachedLongBuilderSimulation, activeDamageTallyTiming.value);
  }
  return {
    totalDamage: activeBuild.value?.summary.totalDamage ?? 0,
    dps: activeBuild.value?.summary.dps ?? 0,
  };
}

function persistCurrentBuild() {
  if (isHydratingBuildDetail.value || isApplyingRuntimeSnapshot.value) {
    return;
  }

  if (page.value !== "build-detail") {
    return;
  }

  if (!activeBuildId.value) {
    return;
  }

  // The route is the owner of the currently mounted build workspace. During a
  // route transition, never write the still-hydrated runtime into whichever
  // build id happened to update first.
  if (!routeBuildId.value || routeBuildId.value !== activeBuildId.value) {
    if (debugModeEnabled.value && typeof console !== "undefined") {
      console.warn("[Build scope] Skipped runtime persistence during build-id mismatch", {
        routeBuildId: routeBuildId.value,
        activeBuildId: activeBuildId.value,
      });
    }
    return;
  }

  if (!currentBuildSnapshot.value) {
    return;
  }
  if (!buildListStore.isUserBuild(activeBuildId.value)) {
    recordHistoryIfChanged();
    return;
  }
  currentBuildSnapshot.value = cloneBuildSnapshot(buildStore.exportStateSnapshot());
  const summary = getSummaryForPersistence();

  buildListStore.updateBuildRuntime({
    buildId: activeBuildId.value,
    currentBuildState: currentBuildSnapshot.value,
    plannedBuildState: currentBuildSnapshot.value,
    rotationState: exportRotationSchemes(),
    stageSettings: cloneJson(activeBuildStageSettings.value),
    customStages: cloneJson(activeBuildCustomStages.value),
    scopedRotationUiState: {
      sp: readScopedStorageState(ROTATION_SP_STORAGE_KEY),
      contracts: readScopedStorageState(ROTATION_CONTRACTS_STORAGE_KEY),
    },
    summary: {
      totalDamage: summary.totalDamage,
      dps: summary.dps,
    },
    damageTallyTiming: activeDamageTallyTiming.value,
    compareSettings: {
      enabled: compareBuildsEnabled.value,
      leftVariantIndex: activeVariantIndex.value,
      rightVariantIndex: compareTargetVariantIndex.value,
    },
  });
  recordHistoryIfChanged();
}

function hydrateBuildDetail(buildId: string): boolean {
  const selected = buildListStore.findBuildById(buildId);
  if (!selected) {
    return false;
  }

  isHydratingBuildDetail.value = true;
  try {
    cachedLongBuilderSimulation = null;
    cachedLongBuilderSimulationBuildId = "";
    longRotationNeedsRecalculation.value = false;
    buildListStore.setActiveBuild(buildId);
    templateBaselineSnapshot.value = buildListStore.isReadonlyBuild(buildId)
      ? captureSavedBuildRuntimeSnapshot(selected)
      : null;
    currentBuildSnapshot.value = cloneBuildSnapshot(selected.currentBuildState);
    activeDamageTallyTiming.value = cloneJson(selected.damageTallyTiming);
    buildStore.setActiveVariantIndex(selected.currentBuildState.activeVariantIndex ?? 0);
    buildStore.hydrateStateSnapshot(cloneBuildSnapshot(selected.currentBuildState));
    compareBuildsEnabled.value = selected.compareSettings?.enabled === true;
    compareTargetVariantIndex.value = selected.compareSettings?.rightVariantIndex ?? 1;
    hydrateRotationSchemes(cloneJson(selected.rotationState));
  } finally {
    isHydratingBuildDetail.value = false;
  }
  seedHistoryFromCurrentState();
  return true;
}

async function openBuild(buildId: string) {
  persistCurrentBuild();
  if (!buildListStore.hasBuild(buildId)) {
    return;
  }
  if (simulationTransitionLoading.value) return;
  simulationTransitionLoading.value = true;
  await nextTick();
  await waitForBrowserPaint();
  try {
    if (!await buildListStore.ensureBuildLoaded(buildId)) return;
    await router.push({ name: "build-builder", params: { buildId } });
    await nextTick();
    void builderRotationSimulation.value;
    await nextTick();
  } finally {
    simulationTransitionLoading.value = false;
  }
}

function updateActiveDamageTallyTiming(next: DamageTallyTiming) {
  activeDamageTallyTiming.value = cloneJson(next);
  persistCurrentBuild();
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

function importBuild(raw: unknown) {
  persistCurrentBuild();
  const id = buildListStore.importBuild(raw);
  if (!id) {
    if (typeof window !== "undefined") {
      window.alert(
        userBuilds.value.length >= 6
          ? t("buildList.maximumBuildsReached")
          : t("buildList.importInvalid"),
      );
    }
    return;
  }
  void router.push({ name: "build-builder", params: { buildId: id } });
}

async function copyBuild(buildId: string) {
  persistCurrentBuild();
  const id = await buildListStore.copyBuild(buildId);
  if (!id) {
    if (typeof window !== "undefined") {
      window.alert(t("buildList.maximumBuildsReached"));
    }
  }
}

function backToBuildList() {
  if (hasUnsavedTemplateChanges()) {
    templateExitPromptOpen.value = true;
    return;
  }
  persistCurrentBuild();
  void router.push({ name: "build-list" });
}

function cancelTemplateExitPrompt() {
  templateExitPromptOpen.value = false;
}

function discardTemplateChangesAndExit() {
  templateExitPromptOpen.value = false;
  if (templateBaselineSnapshot.value) {
    applyRuntimeSnapshot(cloneJson(templateBaselineSnapshot.value));
    templateBaselineSnapshot.value = cloneJson(templateBaselineSnapshot.value);
  }
  void router.push({ name: "build-list" });
}

function saveTemplateAsNewBuildAndExit() {
  if (!activeBuildId.value) {
    return;
  }
  const snapshot = captureRuntimeSnapshot();
  if (!snapshot) {
    templateExitPromptOpen.value = false;
    void router.push({ name: "build-list" });
    return;
  }
  const newBuildId = buildListStore.createBuildFromRuntime({
    sourceBuildId: activeBuildId.value,
    currentBuildState: snapshot.currentBuildState,
    plannedBuildState: snapshot.currentBuildState,
    rotationState: snapshot.rotationState,
    scopedRotationUiState: snapshot.scopedRotationUiState,
    summary: {
      ...getSummaryForPersistence(),
      updatedAt: Date.now(),
    },
    damageTallyTiming: snapshot.damageTallyTiming,
    compareSettings: snapshot.compareSettings,
  });
  if (!newBuildId) {
    if (typeof window !== "undefined") {
      window.alert(t("buildList.maximumBuildsReached"));
    }
    return;
  }
  templateExitPromptOpen.value = false;
  buildListStore.setActiveBuild(newBuildId);
  void router.push({ name: "build-list" });
}

function buildExportPayload(): SavedBuild | null {
  const source = activeBuild.value;
  const runtimeSnapshot = captureRuntimeSnapshot();
  if (!source || !runtimeSnapshot) {
    return null;
  }

  return {
    ...cloneJson(source),
    currentBuildState: cloneBuildSnapshot(runtimeSnapshot.currentBuildState),
    plannedBuildState: cloneBuildSnapshot(runtimeSnapshot.currentBuildState),
    rotationState: cloneJson(runtimeSnapshot.rotationState),
    scopedRotationUiState: cloneJson(runtimeSnapshot.scopedRotationUiState),
    summary: {
      ...getSummaryForPersistence(),
      updatedAt: Date.now(),
    },
    damageTallyTiming: cloneJson(runtimeSnapshot.damageTallyTiming),
    compareSettings: cloneJson(runtimeSnapshot.compareSettings),
  };
}

async function exportActiveBuild() {
  persistCurrentBuild();
  const payload = buildExportPayload();
  if (!payload) {
    return;
  }
  await copyText(JSON.stringify(payload, null, 2));
}

function editBuildMetadata(payload: { buildId: string; locale: "en" | "zh-CN"; name: string; description: string }) {
  buildListStore.updateBuildLocalizedMetadata({
    id: payload.buildId,
    locale: payload.locale,
    name: payload.name,
    description: payload.description,
  });
}

function deleteBuild(buildId: string) {
  buildListStore.removeBuild(buildId);
}

watch(
  [slots, activeVariantIndex],
  () => {
    if (
      isHydratingBuildDetail.value
      || isApplyingRuntimeSnapshot.value
      || page.value !== "build-detail"
      || workspace.value !== "builder"
      || !isLongBuilderRotation.value
      || cachedLongBuilderSimulationBuildId !== activeBuildId.value
      || !cachedLongBuilderSimulation
    ) {
      return;
    }
    longRotationNeedsRecalculation.value = true;
  },
  { deep: true, flush: "sync" },
);

watch(
  [slots, activeSlotIndex, rotationSchemes, page, activeBuildId, activeVariantIndex],
  () => {
    persistCurrentBuild();
  },
  { deep: true },
);

watch(
  [() => route.name, routeBuildId],
  async ([nextName, nextBuildId], [prevName, prevBuildId]) => {
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

    if (!buildListStore.hasBuild(nextBuildId)) {
      void router.replace({ name: "build-list" });
      return;
    }

    if (!buildListStore.findBuildById(nextBuildId)) {
      simulationTransitionLoading.value = true;
      await nextTick();
      await waitForBrowserPaint();
      try {
        if (!await buildListStore.ensureBuildLoaded(nextBuildId)) {
          void router.replace({ name: "build-list" });
          return;
        }
      } finally {
        simulationTransitionLoading.value = false;
      }
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
    <div
      v-if="simulationTransitionLoading"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/25 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-3 rounded-xl border border-white/50 bg-white/95 px-5 py-3 text-sm font-medium text-[#333] shadow-xl">
        <svg class="h-5 w-5 animate-spin text-[#929a18]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
          <path class="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span>{{ t("ui.loading") }}</span>
      </div>
    </div>
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
                {{ mainPageTitle }}
              </h1>
            </div>
          </div>

          <button
            v-if="page === 'build-list'"
            type="button"
            class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a] transition hover:border-[#b9b9b9] hover:text-[#222] disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="userBuilds.length >= 6"
            @click="buildListPageRef?.openImportDialog()"
          >
            {{ t("buildList.importBuild") }}
          </button>

          <div v-else class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4a4a4a] transition hover:border-[#b9b9b9] hover:text-[#222]"
              @click="backToBuildList"
            >
              {{ t("ui.backToBuilds") }}
            </button>
            <button
              v-if="debugModeEnabled"
              type="button"
              class="rounded-full border border-[#3d4f1c] bg-[#eff4cc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#364116] transition hover:bg-[#e6efb3]"
              @click="exportActiveBuild"
            >
              {{ locale === "zh-CN" ? "导出构筑" : "Export Build" }}
            </button>
            <template v-if="workspace === 'rotation'">
              <button
                type="button"
                class="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
                :class="isActiveRotationRelayed
                  ? 'cursor-not-allowed border-[#8aa0ad] bg-[#dce5ea] text-[#778994]'
                  : 'border-[#36516a] bg-[#eaf2f8] text-[#27445d] hover:bg-[#dceaf4]'"
                :disabled="isActiveRotationRelayed"
                @click="!isActiveRotationRelayed && (rotationStagePopupOpen = true)"
              >
                {{ locale === "zh-CN" ? `关卡：${getStageDisplayName(rotationDisplayStageSettings, 'zh-CN')}` : `Stage: ${getStageDisplayName(rotationDisplayStageSettings, 'en')}` }}
              </button>
              <button
                type="button"
                class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
                :class="canUndo ? 'text-[#4a4a4a] hover:border-[#b9b9b9] hover:text-[#222]' : 'cursor-not-allowed text-[#b5b5b5]'"
                :disabled="!canUndo"
                @click="undoLastChange"
              >
                {{ t("ui.undo") }}
              </button>
              <button
                type="button"
                class="rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
                :class="canRedo ? 'text-[#4a4a4a] hover:border-[#b9b9b9] hover:text-[#222]' : 'cursor-not-allowed text-[#b5b5b5]'"
                :disabled="!canRedo"
                @click="redoLastChange"
              >
                {{ t("ui.redo") }}
              </button>
            </template>

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
                :disabled="simulationTransitionLoading"
                @click="openRotationWorkspace"
              >
                {{ t("ui.rotation") }}
              </button>
            </div>

          </div>
        </div>
      </div>

      <BuildListPage
        v-if="page === 'build-list'"
        ref="buildListPageRef"
        :user-builds="userBuilds"
        :template-builds="templateBuilds"
        :community-builds="communityBuilds"
        :community-builds-loading="communityBuildsLoading"
        :community-builds-error="communityBuildsError"
        :active-build-id="activeBuildId"
        @open="openBuild"
        @create="createBuild"
        @import="importBuild"
        @copy="copyBuild"
        @refresh-community="buildListStore.loadCommunityBuilds"
        @edit-metadata="editBuildMetadata"
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
                :main-attribute="selectedChar.mainAttr"
                :secondary-attribute="selectedChar.secondaryAttr"
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
                :main-attribute="selectedChar.mainAttr"
                :secondary-attribute="selectedChar.secondaryAttr"
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
                  <div v-if="debugModeEnabled" class="mt-1 text-xs font-medium text-[#666]">
                    {{ locale === "zh-CN" ? "轮转复杂度" : "Rotation complexity" }}:
                    {{ Number.isInteger(builderRotationComplexity) ? builderRotationComplexity : builderRotationComplexity.toFixed(2) }}
                  </div>
                  <div v-if="isLongBuilderRotation && longRotationNeedsRecalculation" class="mt-1 text-sm font-semibold text-[#b42323]">
                    {{ locale === "zh-CN" ? "长轮转，请手动重新计算" : "Long rotation, please manually recalculate" }}
                  </div>
                </div>

                <div class="flex items-end gap-2">
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
                  <button
                    v-if="isLongBuilderRotation"
                    type="button"
                    class="rounded-lg border border-[#b8c22d] bg-[#ece81a] px-3 py-2 text-sm font-semibold text-[#292929] transition hover:bg-[#e1dd16] disabled:cursor-wait disabled:opacity-60"
                    :disabled="simulationTransitionLoading"
                    @click="recalculateBuilderRotation"
                  >
                    {{ locale === "zh-CN" ? "重新计算" : "Recalculate" }}
                  </button>
                </div>
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
          :history-revision="historyRevision"
          :debug-mode="debugModeEnabled"
          :enemies="selectableStageEnemies"
          :enemy-slots="enemySlots"
          :targeted-enemy-slot-id="targetedEnemySlotId"
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
          :contracts-popup-open="contractsPopupOpen"
          :stage-contracts-enabled="resolvedStageSettings.contractsEnabled"
          :stage-initial-sp="resolvedStageSettings.initialSp"
          :stage-sp-regen-rate="resolvedStageSettings.spRegenRate"
          :enemy-hp-base-overrides="stageEnemyHpBaseOverrides"
          :stage-settings="activeBuildStageSettings"
          :custom-stages="activeBuildCustomStages"
          :stage-workspace-popup-open="rotationStagePopupOpen"
          :triggers-popup-open="triggersPopupOpen"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @update:enemy-slots="enemySlots = $event"
          @update:targeted-enemy-slot-id="targetedEnemySlotId = $event"
          @update:selected-enemy-id="selectedEnemyId = $event"
          @update:enemy-level="enemyLevel = $event"
          @update:damage-tally-timing="updateActiveDamageTallyTiming"
          @update:contracts-popup-open="contractsPopupOpen = $event"
          @update:triggers-popup-open="triggersPopupOpen = $event"
          @update:stage-workspace-popup-open="rotationStagePopupOpen = $event"
          @update:custom-stages="activeBuildCustomStages = $event"
          @undo="undoLastChange"
          @redo="redoLastChange"
          @history-transient-start="beginTransientHistory"
          @history-transient-commit="commitTransientHistory"
        />
      </template>
    </div>

    <div
      v-if="stageSettingsPopupOpen"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      @click.self="stageSettingsPopupOpen = false"
    >
      <section class="flex h-[min(720px,calc(100vh-2rem))] w-[min(720px,calc(100vw-2rem))] flex-none flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-[#e4e4e4] px-5 py-4">
          <div>
            <h2 class="text-lg font-semibold text-[#222]">{{ locale === "zh-CN" ? "关卡设置" : "Stage Settings" }}</h2>
            <p class="mt-1 text-xs text-[#777]">{{ locale === "zh-CN" ? "关卡设置应用于整个构筑。" : "Stage settings apply to the entire build." }}</p>
          </div>
          <button type="button" class="rounded-lg border border-[#d4d4d4] px-3 py-1.5 text-sm" @click="stageSettingsPopupOpen = false">{{ t("ui.close") }}</button>
        </header>
        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div class="grid grid-cols-2 gap-3 rounded-xl border border-[#ddd] bg-[#fafafa] p-3">
            <label class="text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">
              {{ t("rotation.startingSp") }}
              <input :value="activeBuildStageSettings.initialSp" type="number" min="0" step="10" class="mt-1 w-full rounded-lg border border-[#ccc] bg-white px-3 py-2 text-sm font-normal tracking-normal text-[#222]" @change="setStageInitialSp(Number(($event.target as HTMLInputElement).value))">
            </label>
            <label class="text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">
              {{ t("rotation.spRegen") }}
              <input :value="activeBuildStageSettings.spRegenRate" type="number" min="0" step="0.5" class="mt-1 w-full rounded-lg border border-[#ccc] bg-white px-3 py-2 text-sm font-normal tracking-normal text-[#222]" @change="setStageSpRegenRate(Number(($event.target as HTMLInputElement).value))">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in STAGE_PRESETS"
              :key="preset.id"
              type="button"
              class="rounded-xl border p-4 text-left transition"
              :class="activeBuildStageSettings.mode === 'preset' && activeBuildStageSettings.presetId === preset.id ? 'border-[#66751b] bg-[#f5f8df]' : 'border-[#ddd] hover:bg-[#fafafa]'"
              @click="setStageMode('preset')"
            >
              <div class="font-semibold text-[#222]">{{ preset.name }}</div>
              <div class="mt-1 text-xs text-[#777]">{{ locale === "zh-CN" ? "启用危机合约及预设敌人生命值。" : "Contracts enabled with preset enemy HP bases." }}</div>
            </button>
            <button
              type="button"
              class="rounded-xl border p-4 text-left transition"
              :class="activeBuildStageSettings.mode === 'custom' ? 'border-[#66751b] bg-[#f5f8df]' : 'border-[#ddd] hover:bg-[#fafafa]'"
              @click="setStageMode('custom')"
            >
              <div class="font-semibold text-[#222]">{{ locale === "zh-CN" ? "自定义关卡" : "Custom Stage" }}</div>
              <div class="mt-1 text-xs text-[#777]">{{ locale === "zh-CN" ? "编辑合约权限及敌人1级基础生命值。" : "Edit contract availability and enemy Lv. 1 base HP." }}</div>
            </button>
          </div>

          <div v-if="activeBuildStageSettings.mode === 'preset'" class="space-y-3 rounded-xl border border-[#ddd] bg-[#fafafa] p-4">
            <div>
              <div class="text-sm font-semibold text-[#333]">{{ resolvedStageSettings.name }}</div>
              <div class="mt-1 text-xs text-[#777]">{{ locale === 'zh-CN' ? '预设数值为只读。' : 'Preset values are read-only.' }}</div>
            </div>
            <div class="text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">{{ locale === 'zh-CN' ? '敌人生命倍率' : 'Enemy HP Multipliers' }}</div>
            <div v-if="Object.keys(resolvedStageSettings.enemyHpMultipliers).length === 0" class="text-sm text-[#888]">{{ locale === 'zh-CN' ? '无倍率设置' : 'No multiplier settings' }}</div>
            <div v-for="(multiplier, enemyId) in resolvedStageSettings.enemyHpMultipliers" :key="enemyId" class="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 rounded-lg border border-[#ddd] bg-white px-3 py-2">
              <span class="truncate text-sm text-[#333]">{{ getEnemyDisplayName(String(enemyId), selectableStageEnemies.find((enemy) => enemy.id === enemyId)?.name ?? String(enemyId), locale as 'en' | 'zh-CN') }}</span>
              <input :value="multiplier" type="number" disabled class="w-full cursor-not-allowed rounded-md border border-[#ddd] bg-[#f1f1f1] px-2 py-1.5 text-sm text-[#666]">
            </div>
            <div class="text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">{{ locale === 'zh-CN' ? '敌人失衡值' : 'Enemy Stagger' }}</div>
            <div v-if="Object.keys(resolvedStageSettings.enemyStaggerOverrides).length === 0" class="text-sm text-[#888]">{{ locale === 'zh-CN' ? '无失衡值设置' : 'No stagger settings' }}</div>
            <div v-for="(stagger, enemyId) in resolvedStageSettings.enemyStaggerOverrides" :key="enemyId" class="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 rounded-lg border border-[#ddd] bg-white px-3 py-2">
              <span class="truncate text-sm text-[#333]">{{ getEnemyDisplayName(String(enemyId), selectableStageEnemies.find((enemy) => enemy.id === enemyId)?.name ?? String(enemyId), locale as 'en' | 'zh-CN') }}</span>
              <input :value="stagger" type="number" disabled class="w-full cursor-not-allowed rounded-md border border-[#ddd] bg-[#f1f1f1] px-2 py-1.5 text-sm text-[#666]">
            </div>
          </div>

          <div v-if="activeBuildStageSettings.mode === 'custom'" class="space-y-4 rounded-xl border border-[#ddd] bg-[#fafafa] p-4">
            <label class="block text-sm text-[#444]">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">{{ locale === "zh-CN" ? "关卡名称" : "Stage Name" }}</span>
              <input :value="activeBuildStageSettings.custom.name" class="w-full rounded-lg border border-[#ccc] bg-white px-3 py-2" @change="setCustomStageName(($event.target as HTMLInputElement).value)">
            </label>
            <label class="flex items-center gap-2 text-sm text-[#333]">
              <input type="checkbox" :checked="activeBuildStageSettings.custom.contractsEnabled" @change="setCustomStageContractsEnabled(($event.target as HTMLInputElement).checked)">
              {{ locale === "zh-CN" ? "启用危机合约" : "Enable Contingency Contracts" }}
            </label>
            <div>
              <div class="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#666]">{{ locale === "zh-CN" ? "敌人生命值覆盖" : "Enemy HP Overrides" }}</div>
              <div class="flex gap-2">
                <select v-model="stageOverrideEnemyId" class="min-w-0 flex-1 rounded-lg border border-[#ccc] bg-white px-3 py-2 text-sm">
                  <option v-for="enemy in selectableStageEnemies" :key="enemy.id" :value="enemy.id">{{ getEnemyDisplayName(enemy.id, enemy.name, locale as 'en' | 'zh-CN') }}</option>
                </select>
                <button type="button" class="rounded-lg border border-[#bbb] bg-white px-3 py-2 text-sm" @click="addCustomStageEnemyOverride">{{ locale === "zh-CN" ? "添加" : "Add" }}</button>
              </div>
              <div class="mt-3 space-y-2">
                <div v-for="(hp, enemyId) in activeBuildStageSettings.custom.enemyHpBaseOverrides" :key="enemyId" class="grid grid-cols-[minmax(0,1fr)_105px_95px_95px_auto] items-end gap-2 rounded-lg border border-[#ddd] bg-white p-2">
                  <span class="truncate text-sm text-[#333]">{{ getEnemyDisplayName(String(enemyId), selectableStageEnemies.find((enemy) => enemy.id === enemyId)?.name ?? String(enemyId), locale as 'en' | 'zh-CN') }}</span>
                  <label class="text-[10px] uppercase tracking-[0.08em] text-[#777]">{{ locale === 'zh-CN' ? '1级基础生命' : 'Lv.1 Base HP' }}<input :value="hp" type="number" min="1" step="1" class="mt-1 w-full rounded-md border border-[#ccc] px-2 py-1.5 text-sm" @change="setCustomStageEnemyHp(String(enemyId), Number(($event.target as HTMLInputElement).value))"></label>
                  <label class="text-[10px] uppercase tracking-[0.08em] text-[#777]">{{ locale === 'zh-CN' ? '生命倍率' : 'HP Multiplier' }}<input :value="activeBuildStageSettings.custom.enemyHpMultipliers[String(enemyId)] ?? 1" type="number" min="0.01" step="0.01" class="mt-1 w-full rounded-md border border-[#ccc] px-2 py-1.5 text-sm" @change="setCustomStageEnemyHpMultiplier(String(enemyId), Number(($event.target as HTMLInputElement).value))"></label>
                  <label class="text-[10px] uppercase tracking-[0.08em] text-[#777]">{{ locale === 'zh-CN' ? '失衡值' : 'Stagger' }}<input :value="activeBuildStageSettings.custom.enemyStaggerOverrides[String(enemyId)] ?? 1" type="number" min="1" step="1" class="mt-1 w-full rounded-md border border-[#ccc] px-2 py-1.5 text-sm" @change="setCustomStageEnemyStagger(String(enemyId), Number(($event.target as HTMLInputElement).value))"></label>
                  <button type="button" class="rounded-md border border-[#d8bcbc] px-2 py-1.5 text-xs text-[#852f2f]" @click="removeCustomStageEnemyOverride(String(enemyId))">{{ locale === "zh-CN" ? "移除" : "Remove" }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
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

    <div
      v-if="templateExitPromptOpen"
      class="fixed inset-0 z-[170] flex items-center justify-center bg-black/35 px-4"
    >
      <div class="w-full max-w-lg rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-2xl">
        <div class="text-lg font-semibold text-[#1b1b1b]">
          {{ t("buildList.templateChangedTitle") }}
        </div>
        <div class="mt-2 text-sm leading-6 text-[#666]">
          {{ t("buildList.templateChangedBody") }}
        </div>
        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#f5f5f5]"
            @click="cancelTemplateExitPrompt"
          >
            {{ t("ui.cancel") }}
          </button>
          <button
            type="button"
            class="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#f5f5f5]"
            @click="discardTemplateChangesAndExit"
          >
            {{ t("buildList.discardChanges") }}
          </button>
          <button
            type="button"
            class="rounded-md border border-[#d8d18a] bg-[#f7f4cf] px-3 py-2 text-sm font-semibold text-[#4f4a1d] transition hover:bg-[#f2edb9]"
            @click="saveTemplateAsNewBuildAndExit"
          >
            {{ t("buildList.saveAsNew") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
