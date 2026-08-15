<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import { useBuildStore, type CharacterBuildSlot } from "@/stores/buildStore";
import type { EnemyBase } from "@/data/enemies";
import { CHARACTERS } from "@/data/characters";
import {
  makeBaseModifierStats,
  MODIFIER_STAT_KEYS,
  type ModifierStats,
  type ModifierStatKey,
} from "@/lib/build/stats";
import {
  resolveCommandTransform,
} from "@/lib/commands";
import type {
  ActorCombatStateSnapshot,
  CharacterCombatSnapshot,
  CountdownTimelineEntry,
  CritRiggingRule,
  EnemyLifecycleTimelineEntry,
  EnemySlotState,
  PartySlot,
  Rotation,
  RotationCombatEvent,
  RotationSimulationResult,
  RotationStep,
  RotationTimeExtension,
} from "@/lib/combat/rotation";
import { CRIT_RIG_HIT_INDEX_EXECUTE, CRIT_RIG_HIT_INDEX_REACTION } from "@/lib/combat/rotation";
import { buildCombatSnapshot, buildPartySnapshotsByVariant } from "@/lib/combat/buildSnapshots";
import {
  getRotationSchemeLocalizedDescription,
  getRotationSchemeLocalizedName,
  useRotationSchemes,
  type RotationTeamSpConfig,
} from "@/lib/combat/rotationSchemes";
import {
  getActorStateAtTime,
  getEnemyStateAtTime,
  makeEnemyModifierSnapshot,
} from "@/lib/combat/simulateRotation";
import { compileRotationTimeline } from "@/lib/combat/compileRotationTimeline";
import {
  buildInitialStateFromCheckpoint,
  buildRelayCumulativeOutputPrefix,
  createRotationSimulationCache,
  type RotationSimulationRecomputeDebug,
} from "@/lib/combat/simulationCache";
import { modifierLabels } from "@/lib/modifierDisplay";
import { getAverageCritMultiplier, getTotalDamageBonus } from "@/lib/combat/combatDamage";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import {
  buildEnemyActionWindows,
  getDefaultEnemyCommandPlacements,
  getEnemyCommandDefinitions,
  type EnemyCommandPlacement,
} from "@/lib/enemy/enemyActionWindows";
import { CONSUMABLES, CONSUMABLE_BY_ID, getConsumableDisplayName } from "@/data/consumables";
import { getEnemyDisplayName, getEnemyIconId } from "@/data/enemyCustomNames";
import { useLocale } from "@/i18n/useLocale";
import type { CharacterSkillKey } from "@/lib/build/characterSkills";
import { getCharacterDisplayName } from "@/i18n/domain/displayNames";
import { getCharacterSkillDisplayName } from "@/i18n/domain/skillNames";
import { getLocalizedHitName } from "@/i18n/domain/hitNames";
import { getLocalizedInflictionElementLabel } from "@/i18n/domain/elementLabels";
import { getLocalizedStatusBuffLabel } from "@/i18n/domain/statusBuffLabels";
import RotationSelectedCommandPanel from "@/components/workspaces/rotation/RotationSelectedCommandPanel.vue";
import RotationHitDetailsModal from "@/components/workspaces/rotation/RotationHitDetailsModal.vue";
import RotationContingencyContractsPopup from "@/components/workspaces/rotation/RotationContingencyContractsPopup.vue";
import RotationTriggersPopup from "@/components/workspaces/rotation/RotationTriggersPopup.vue";
import RotationStageSettingsPanel from "@/components/workspaces/rotation/RotationStageSettingsPanel.vue";
import { MAX_CUSTOM_STAGES, NO_STAGE_ID, STAGE_PRESETS, getStageDisplayName, makeCustomStageDefinition, normalizeBuildStageSettings, normalizeCustomStageDefinitions, resolveBuildStageSettings, resolveEnemyBaseForStage, type BuildStageSettings, type CustomStageDefinition, type StagePresetId } from "@/lib/stages/stageSettings";
import { EMPTY_SELECTION_ICON_PATH, getCharacterImagePath, toAssetUrl } from "@/lib/assets/imagePaths";
import { getActiveInternalCombatTriggers, getActiveInternalTriggerVariables } from "@/lib/combat/internalTriggers";
import {
  CONTINGENCY_CONTRACTS,
  getContingencyContractVariantIconAssetPath,
  getContingencyContractVariant,
  getLocalizedContingencyContractVariantDescription,
  getLocalizedContingencyContractVariantName,
  isContingencyContractVariantVisible,
  normalizeActiveContingencyContracts,
  resolveContingencyContracts,
  type ActiveContingencyContract,
} from "@/lib/combat/contracts";
import {
  CUSTOM_TRIGGER_ACTION_OPTIONS,
  CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS,
  CUSTOM_TRIGGER_EVENT_OPTIONS,
  CUSTOM_TRIGGER_STATUS_BASIC_STAT_OPTIONS,
  CUSTOM_TRIGGER_STATUS_STACKING_RULE_OPTIONS,
  CUSTOM_TRIGGER_STATUS_OPTIONS,
  CUSTOM_TRIGGER_TARGET_OPTIONS,
  MAX_CUSTOM_TRIGGERS,
  getAllTriggerVariables,
  getCustomTriggerOptionDescription,
  getCustomTriggerOptionLabel,
  getDefaultTriggerVariableId,
  getPrimaryTriggerAction,
  makeDefaultApplyStatusAction,
  makeDefaultComparatorTriggerCondition,
  makeDefaultCustomTrigger,
  makeDefaultExecuteHitAction,
  makeDefaultFireTriggerAction,
  makeDefaultIfThenElseAction,
  makeDefaultForEachEnemyAction,
  makeDefaultForEachOperatorAction,
  makeDefaultLogicTriggerCondition,
  makeDefaultModifyVariableAction,
  makeDefaultModifyHpAction,
  makeCustomTriggerVariableId,
  makeDefaultReplaceEnemyAction,
  makeDefaultRemoveStatusAction,
  makeDefaultBreakAction,
  makeDefaultCountdownAction,
  makeDefaultRelayRotationAction,
  makeDefaultStopTriggerAction,
  makeDefaultSetTriggerEnabledAction,
  makeDefaultSetTargetEnemyAction,
  makeDefaultWaitAction,
  normalizeCustomCombatTrigger,
  normalizeCustomCombatTriggers,
  normalizeCustomTriggerVariables,
  sanitizeTriggersAgainstVariables,
  triggerEventSupportsAlias,
  type CustomCombatTrigger,
  type TriggerAction,
  type TriggerConditionNode,
  type TriggerStatusStackingRule,
  type TriggerNumericSource,
  type TriggerVariableDefinition,
} from "@/lib/combat/triggers";

const props = defineProps<{
  buildId?: string;
  historyRevision?: number;
  debugMode?: boolean;
  enemies: EnemyBase[];
  enemySlots: EnemySlotState[];
  targetedEnemySlotId: string;
  selectedEnemyId: string;
  enemyName: string;
  enemyLevel: number;
  enemyStats: EnemyResolvedStats;
  enemyStaggerGauge: number;
  enemyStaggerNodes?: number[];
  enemyStaggerRecoverySeconds: number;
  enemyFinisherMultiplier: number;
  enemyFinisherSpGain: number;
  damageTallyTiming?: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
  contractsPopupOpen?: boolean;
  stageContractsEnabled?: boolean;
  stageInitialSp?: number;
  stageSpRegenRate?: number;
  enemyHpBaseOverrides?: Record<string, number>;
  stageSettings?: BuildStageSettings;
  customStages?: CustomStageDefinition[];
  triggersPopupOpen?: boolean;
  stageWorkspacePopupOpen?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:enemySlots", value: EnemySlotState[]): void;
  (e: "update:targetedEnemySlotId", value: string): void;
  (e: "update:selectedEnemyId", value: string): void;
  (e: "update:enemyLevel", value: number): void;
  (e: "update:damageTallyTiming", value: { enabled: boolean; startTime: number; endTime: number }): void;
  (e: "update:contractsPopupOpen", value: boolean): void;
  (e: "update:triggersPopupOpen", value: boolean): void;
  (e: "update:stageWorkspacePopupOpen", value: boolean): void;
  (e: "update:customStages", value: CustomStageDefinition[]): void;
  (e: "undo"): void;
  (e: "redo"): void;
  (e: "historyTransientStart"): void;
  (e: "historyTransientCommit"): void;
}>();

const buildStore = useBuildStore();
const route = useRoute();
const { slots, activeVariantIndex } = storeToRefs(buildStore);
const { t, locale } = useLocale();

const DEFAULT_AXIS_SCALE = 116;
const MIN_TIMELINE_SCALE_PERCENT = 50;
const MAX_TIMELINE_SCALE_PERCENT = 200;
const axisScale = ref(DEFAULT_AXIS_SCALE);
const timelineScalePercent = computed(() => Math.round((axisScale.value / DEFAULT_AXIS_SCALE) * 100));
const AXIS_SNAP_SECONDS = 0.1;
const TRACK_LABEL_WIDTH = 160;
const CONTRACT_TILE_SIZE = 72;
const CONTRACT_TILE_GAP = 8;
const CONTRACT_CARD_PADDING = 8;
const CONTRACT_LEVEL_ROW_HEIGHT = 92;
const CONTRACT_COLUMN_HEIGHT = CONTRACT_LEVEL_ROW_HEIGHT * 3 + CONTRACT_TILE_GAP * 2;
const TEAM_SP_MAX = 300;
const PRE_BATTLE_SP_MAX = 200;
const PRE_BATTLE_SP_REGEN_RATE = 50;
const PRE_BATTLE_SECONDS = 15;
const GENERATED_SP_TEAM_ENERGY_RATE = 0.065;
const SWITCH_BACK_COOLDOWN_SECONDS = 2;
const TIMELINE_ROW_HEIGHT = 112;
const CONTROL_TRACK_OFFSET = 16;
const ENEMY_FINISHER_AVAILABLE_STATUS_ID = "enemy_finisher_available";
const MAX_STEPS_PER_ROTATION = 128;
const MAX_ROTATIONS_PER_BUILD = 4;
const NO_SWITCH_LOCK_UNTIL = Number.NEGATIVE_INFINITY;
const debugMode = ref(false);
function reportSimulationRecompute(debug: RotationSimulationRecomputeDebug, label?: string) {
  if (!debugMode.value) {
    return;
  }
  const regionLabel = debug.recalculatedCheckpointCount === 1 ? "region" : "regions";
  const checkpointTimes = debug.recalculatedCheckpointTimes
    .map((time) => `${time.toFixed(3).replace(/\.000$/, "")}s`)
    .join(", ");
  const reusedLabel = debug.reusedThroughCheckpointTime == null
    ? "full recomputation"
    : `reused through ${debug.reusedThroughCheckpointTime.toFixed(3).replace(/\.000$/, "")}s`;
  console.info(
    `[Simulation${label ? `: ${label}` : ""}] Recalculated ${debug.recalculatedCheckpointCount} checkpoint ${regionLabel}`
    + ` (${reusedLabel}; checkpoints: ${checkpointTimes || "none"}).`,
  );
}

const rotationSimulationCacheBySchemeId = new Map<string, ReturnType<typeof createRotationSimulationCache>>();
function getRotationSimulationCache(schemeId: string, label?: string) {
  let cache = rotationSimulationCacheBySchemeId.get(schemeId);
  if (!cache) {
    cache = createRotationSimulationCache({
      onRecompute: (debug) => reportSimulationRecompute(debug, label),
    });
    rotationSimulationCacheBySchemeId.set(schemeId, cache);
  }
  return cache;
}

function makeStepId(): string {
  return `step_${Math.random().toString(36).slice(2, 10)}`;
}

function toPartySlot(index: number): PartySlot {
  return Math.max(0, Math.min(3, index)) as PartySlot;
}

function buildSnapshot(slot: CharacterBuildSlot, index: number): CharacterCombatSnapshot | null {
  return buildCombatSnapshot(slot, index);
}

type TeamSpConfig = RotationTeamSpConfig;

function getInitialControlledOperatorSlotForSimulation(simulationResult: RotationSimulationResult): PartySlot {
  return toPartySlot(Number(simulationResult.initialControlledOperatorSlot ?? 0));
}

function getInitialSwitchBackLockedUntilBySlotForSimulation(
  simulationResult: RotationSimulationResult,
): Map<PartySlot, number> {
  return new Map(simulationResult.initialSwitchBackLockedUntilBySlot ?? []);
}

function makeDefaultTeamSpConfig(): TeamSpConfig {
  return { initialSp: 200, spRegenRate: 8, startingEnergyBySlot: [100, 100, 100, 100], consumableBySlot: [null, null, null, null], controlledOperatorSlot: 0 };
}

function normalizeTeamSpConfig(value: Partial<TeamSpConfig> | null | undefined): TeamSpConfig {
  return {
    initialSp: value?.initialSp ?? 200,
    spRegenRate: value?.spRegenRate ?? 8,
    startingEnergyBySlot: Array.isArray(value?.startingEnergyBySlot)
      ? [0, 1, 2, 3].map((index) => Math.max(0, Math.min(100, value?.startingEnergyBySlot?.[index] ?? 0)))
      : [100, 100, 100, 100],
    consumableBySlot: Array.isArray(value?.consumableBySlot)
      ? [0, 1, 2, 3].map((index) => {
        const id = value?.consumableBySlot?.[index];
        return typeof id === "string" && id.length > 0 ? id : null;
      })
      : [null, null, null, null],
    controlledOperatorSlot: toPartySlot(Number(value?.controlledOperatorSlot ?? 0)),
  };
}

function normalizeEnemyCommandPlacement(value: Partial<EnemyCommandPlacement> | null | undefined): EnemyCommandPlacement | null {
  if (!value || typeof value.id !== "string" || typeof value.commandId !== "string") {
    return null;
  }
  return {
    id: value.id,
    commandId: value.commandId,
    startTime: Number(value.startTime ?? 0),
    interrupted: value.interrupted === true,
    interruptedSpGain: Math.max(0, Number(value.interruptedSpGain ?? 0)),
    interruptedStagger: Math.max(0, Number(value.interruptedStagger ?? 0)),
  };
}

// App.vue already owns rotation-scheme hydration/scope switching.
// Use the shared singleton state here without a second scope watcher to avoid racey reloads.
const {
  rotationSchemes,
  activeScheme,
  activeRotation: rotation,
  setActiveScheme,
  addScheme,
  updateActiveSchemeLocalizedMetadata,
  setActiveSchemeSimulationMode,
  removeActiveScheme,
} = useRotationSchemes();
const selectedLibrarySlot = ref<PartySlot>(0);
const sidebarMode = ref<"character" | "enemy">("character");
const controlPanelMode = ref<"simple" | "detailed">("simple");
const consumablePickerOpen = ref(false);
const enemyPickerOpen = ref(false);
const selectedStepIds = ref<string[]>(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
const selectionAnchorId = ref<string | null>(rotation.value.steps[0]?.id ?? null);
const selectedEnemyCommandId = ref<string | null>(null);
const cursorTime = ref(0);
const highlightedContractVariantRef = ref<{ contractId: string; variantId: string } | null>(null);
const rotationMetadataEditorOpen = ref(false);
const stageWorkspacePopupOpen = computed({
  get: () => props.stageWorkspacePopupOpen === true && !isActiveSchemeRelayed.value,
  set: (value: boolean) => emit("update:stageWorkspacePopupOpen", value && !isActiveSchemeRelayed.value),
});
const stageWorkspaceTab = ref<"stage" | "triggers" | "contracts">("stage");
function selectStageWorkspaceTab(value: string) {
  if (value === "stage" || value === "triggers" || value === "contracts") stageWorkspaceTab.value = value;
}
const stageOverrideEnemyId = ref(props.enemies[0]?.id ?? "");
const stageEditorTab = ref<"overview" | "enemies" | "script">("overview");
const stageScriptDraft = ref("");
const stageScriptStatus = ref("");
const rotationNameDraft = ref("");
const rotationDescriptionDraft = ref("");
const CONTRACT_DISPLAY_LEVELS = [1, 2, 3] as const;
const rotationCountLabel = computed(() => `${rotationSchemes.value.schemes.length} / ${MAX_ROTATIONS_PER_BUILD}`);
const currentRotationLocale = computed<"en" | "zh-CN">(() => locale.value === "zh-CN" ? "zh-CN" : "en");
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
function schemeStageSettings(scheme: typeof activeScheme.value): BuildStageSettings {
  return normalizeBuildStageSettings(scheme.stageSettings ?? props.stageSettings);
}
const activeStageSettings = computed(() => schemeStageSettings(activeScheme.value));
const displayStageSettings = computed(() => schemeStageSettings(relayDisplaySourceScheme.value));
const customStages = computed(() => normalizeCustomStageDefinitions(props.customStages));
watch(
  () => [props.customStages, rotationSchemes.value.schemes] as const,
  () => {
    if (customStages.value.length > 0) return;
    const migrated: CustomStageDefinition[] = [];
    const idsByScript = new Map<string, string>();
    for (const scheme of rotationSchemes.value.schemes) {
      const settings = scheme.stageSettings;
      if (settings?.mode !== "custom" || settings.customStageId) continue;
      const key = JSON.stringify({ ...settings.custom, initialSp: settings.initialSp, spRegenRate: settings.spRegenRate });
      let id = idsByScript.get(key);
      if (!id && migrated.length < MAX_CUSTOM_STAGES) {
        id = `custom_stage_migrated_${migrated.length + 1}`;
        migrated.push({ id, ...structuredClone(settings.custom), initialSp: settings.initialSp, spRegenRate: settings.spRegenRate });
        idsByScript.set(key, id);
      }
      if (id) settings.customStageId = id;
    }
    if (migrated.length > 0) emit("update:customStages", migrated);
  },
  { immediate: true, deep: true },
);
const resolvedStageSettings = computed(() => resolveBuildStageSettings(displayStageSettings.value, customStages.value));
const activeResolvedStageSettings = computed(() => resolveBuildStageSettings(activeStageSettings.value, customStages.value));
const stageEnemyHpBaseOverrides = computed(() => Object.fromEntries(props.enemies.map((enemy) => [
  enemy.id,
  resolveEnemyBaseForStage(enemy, resolvedStageSettings.value).baseHpLv1,
])));
function updateStageSettings(mutator: (draft: BuildStageSettings) => void) {
  if (isActiveSchemeRelayed.value) return;
  const draft = structuredClone(activeStageSettings.value);
  mutator(draft);
  activeScheme.value.stageSettings = normalizeBuildStageSettings(draft);
}
function setStageMode(mode: "preset" | "custom") { updateStageSettings((draft) => { draft.mode = mode; }); }
function setStageInitialSp(value: number) { updateStageSettings((draft) => { draft.initialSp = Math.max(0, Number.isFinite(value) ? value : 0); }); }
function setStageSpRegenRate(value: number) { updateStageSettings((draft) => { draft.spRegenRate = Math.max(0, Number.isFinite(value) ? value : 0); }); }
function setCustomStageName(value: string) { updateStageSettings((draft) => { draft.custom.name = value.trim() || "Custom Stage"; }); }
function setCustomStageContractsEnabled(value: boolean) { updateStageSettings((draft) => { draft.custom.contractsEnabled = value; }); if (!value && stageWorkspaceTab.value === "contracts") stageWorkspaceTab.value = "stage"; }
function setCustomStageEnemyHp(enemyId: string, value: number) { updateStageSettings((draft) => { draft.custom.enemyHpBaseOverrides[enemyId] = Math.max(1, Math.round(value || 1)); }); }
function setCustomStageEnemyHpMultiplier(enemyId: string, value: number) { updateStageSettings((draft) => { draft.custom.enemyHpMultipliers[enemyId] = Math.max(0.01, value || 1); }); }
function addCustomStageEnemyOverride() { const enemy = props.enemies.find((entry) => entry.id === stageOverrideEnemyId.value); if (enemy) updateStageSettings((draft) => { draft.custom.enemyHpBaseOverrides[enemy.id] ??= enemy.baseHpLv1; draft.custom.enemyHpMultipliers[enemy.id] ??= 1; }); }
function removeCustomStageEnemyOverride(enemyId: string) { updateStageSettings((draft) => { delete draft.custom.enemyHpBaseOverrides[enemyId]; delete draft.custom.enemyHpMultipliers[enemyId]; }); }
function enemyDisplayName(enemyId: string) { const enemy = props.enemies.find((entry) => entry.id === enemyId); return getEnemyDisplayName(enemyId, enemy?.name ?? enemyId, locale.value as "en" | "zh-CN"); }
function selectPresetStage(id: StagePresetId = NO_STAGE_ID) { updateStageSettings((draft) => { draft.mode = "preset"; draft.presetId = id; }); }
function selectCustomStage(id: string) { updateStageSettings((draft) => { draft.mode = "custom"; draft.customStageId = id; }); }
function addCustomStage() { if (customStages.value.length >= MAX_CUSTOM_STAGES) return; const next = [...customStages.value, makeCustomStageDefinition(customStages.value.length + 1)]; emit("update:customStages", next); selectCustomStage(next[next.length - 1]!.id); }
function updateSelectedCustomStage(mutator: (draft: CustomStageDefinition) => void) { const id = activeStageSettings.value.customStageId; if (!id || isActiveSchemeRelayed.value) return; const next = structuredClone(customStages.value); const stage = next.find((entry) => entry.id === id); if (!stage) return; mutator(stage); emit("update:customStages", next); }
function removeCustomStage(id: string) { if (isActiveSchemeRelayed.value) return; const next = customStages.value.filter((entry) => entry.id !== id); emit("update:customStages", next); if (activeStageSettings.value.customStageId === id) selectPresetStage(); }
const selectedStageDefinition = computed(() => resolvedStageSettings.value);
function syncStageScript() { stageScriptDraft.value = JSON.stringify(selectedStageDefinition.value, null, 2); stageScriptStatus.value = ""; }
watch([selectedStageDefinition, stageEditorTab], () => { if (stageEditorTab.value === "script") syncStageScript(); }, { deep: true });
async function copyStageScript() {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) await navigator.clipboard.writeText(stageScriptDraft.value);
  else if (typeof window !== "undefined") window.prompt("Copy stage script:", stageScriptDraft.value);
  stageScriptStatus.value = locale.value === "zh-CN" ? "已复制" : "Copied";
}
function applyStageScript() {
  const id = activeStageSettings.value.customStageId;
  if (!id || isActiveSchemeRelayed.value) return;
  try {
    const parsed = JSON.parse(stageScriptDraft.value) as Partial<CustomStageDefinition>;
    updateSelectedCustomStage((draft) => Object.assign(draft, parsed, { id }));
    stageScriptStatus.value = locale.value === "zh-CN" ? "已应用" : "Applied";
  } catch (error) { stageScriptStatus.value = error instanceof Error ? error.message : String(error); }
}
const selectedConsumableId = computed(() => displayTeamSpConfig.value.consumableBySlot[selectedLibrarySlot.value] ?? null);
const selectedConsumable = computed(() =>
  selectedConsumableId.value ? CONSUMABLE_BY_ID[selectedConsumableId.value] ?? null : null,
);
const selectedConsumableLabel = computed(() =>
  selectedConsumable.value
    ? getConsumableDisplayName(selectedConsumable.value, locale.value as "en" | "zh-CN")
    : t("builder.selectedNone"),
);
const selectedConsumableIconPath = computed(() =>
  selectedConsumableId.value
    ? toAssetUrl(`/item-icons/usable/${selectedConsumableId.value}.webp`)
    : EMPTY_SELECTION_ICON_PATH,
);
const stageStartingEnergyBySlot = computed(() =>
  resolvedStageSettings.value.lockInitialEnergy
    ? [0, 1, 2, 3].map(() => resolvedStageSettings.value.initialEnergyPct)
    : teamSpConfig.value.startingEnergyBySlot,
);
const stageConsumableIdsBySlot = computed(() =>
  resolvedStageSettings.value.disableConsumables
    ? [null, null, null, null]
    : teamSpConfig.value.consumableBySlot,
);
const simulatedEnemySlots = shallowRef<EnemySlotState[] | null>(null);
const selectedEnemyEditorSlotId = ref<string>("");
const targetedEnemySlot = computed(() =>
  getLogicalEnemySlots().find((slot) => slot.slotId === props.targetedEnemySlotId)
  ?? getLogicalEnemySlots()[0]
  ?? null,
);
const selectedEnemyEditorSlot = computed(() =>
  getLogicalEnemySlots().find((slot) => slot.slotId === selectedEnemyEditorSlotId.value)
  ?? targetedEnemySlot.value
  ?? getLogicalEnemySlots()[0]
  ?? null,
);
const targetedEnemyId = computed(() => targetedEnemySlot.value?.enemyId ?? props.selectedEnemyId);
const selectedEnemyData = computed(() =>
  props.enemies.find((enemy) => enemy.id === (selectedEnemyEditorSlot.value?.enemyId ?? props.selectedEnemyId)) ?? null,
);
const selectedEnemyIconPath = computed(() =>
  selectedEnemyData.value
    ? toAssetUrl(`/item-icons/enemies/${getEnemyIconId(selectedEnemyData.value.id)}.webp`)
    : EMPTY_SELECTION_ICON_PATH,
);
const canCreateRotationScheme = computed(() => rotationSchemes.value.schemes.length < MAX_ROTATIONS_PER_BUILD);
const contractsPopupOpen = computed({
  get: () => props.contractsPopupOpen === true,
  set: (value: boolean) => emit("update:contractsPopupOpen", value),
});
const triggersPopupOpen = computed({
  get: () => props.triggersPopupOpen === true,
  set: (value: boolean) => emit("update:triggersPopupOpen", value),
});
const hasBlockingPopupOpen = computed(() =>
  consumablePickerOpen.value
  || enemyPickerOpen.value
  || contractsPopupOpen.value
  || triggersPopupOpen.value
  || stageWorkspacePopupOpen.value,
);
const activeSchemeIndex = computed(() =>
  rotationSchemes.value.schemes.findIndex((scheme) => scheme.id === activeScheme.value.id),
);
const activeSchemeCanRelay = computed(() => activeSchemeIndex.value > 0);
const isActiveSchemeRelayed = computed(() =>
  activeSchemeCanRelay.value && activeScheme.value.simulationMode === "relay_from_previous",
);
const relaySourceScheme = computed(() =>
  activeSchemeIndex.value > 0 ? rotationSchemes.value.schemes[activeSchemeIndex.value - 1] ?? null : null,
);
const relayModeSummary = computed(() => {
  if (!isActiveSchemeRelayed.value || !relaySourceScheme.value) {
    return "";
  }
  return locale.value === "zh-CN"
    ? `当前从 ${getLocalizedRotationSchemeName(relaySourceScheme.value)} 继承运行时状态`
    : `Currently inheriting runtime state from ${getLocalizedRotationSchemeName(relaySourceScheme.value)}`;
});

function getLocalizedRotationSchemeName(scheme: typeof activeScheme.value): string {
  return getRotationSchemeLocalizedName(scheme, currentRotationLocale.value);
}

function getLocalizedRotationSchemeDescription(scheme: typeof activeScheme.value): string {
  return getRotationSchemeLocalizedDescription(scheme, currentRotationLocale.value);
}

const simulation = shallowRef<RotationSimulationResult>({} as RotationSimulationResult);
const simulationLoading = ref(false);
const simulationDisplayTimeOffset = computed(() => simulation.value.displayTimeOffset ?? 0);
const simulationDisplayGameTimeOffset = computed(() => simulation.value.displayGameTimeOffset ?? 0);

function toDisplayedRealTime(localTime: number): number {
  return localTime + simulationDisplayTimeOffset.value;
}

function toDisplayedGameTime(localGameTime: number): number {
  return localGameTime + simulationDisplayGameTimeOffset.value;
}

function getStoredRotationTimeFromLocal(localTime: number): number {
  return isActiveSchemeRelayed.value
    ? localTime + simulationDisplayTimeOffset.value
    : localTime;
}

function getLocalTimelineTimeFromStored(storedTime: number): number {
  return isActiveSchemeRelayed.value
    ? storedTime - simulationDisplayTimeOffset.value
    : storedTime;
}

function rebaseRotationForSimulation(rotationInput: Rotation, displayOffset: number): Rotation {
  if (!(displayOffset > 0)) {
    return rotationInput;
  }
  return {
    ...rotationInput,
    steps: rotationInput.steps.map((step) => ({
      ...step,
      startTime: typeof step.startTime === "number" ? step.startTime - displayOffset : step.startTime,
    })),
  };
}

function rebaseEnemyActionWindowsForSimulation(windows: ReturnType<typeof getSchemeEnemyActionWindows>, displayOffset: number) {
  if (!(displayOffset > 0)) {
    return windows;
  }
  return windows.map((window) => ({
    ...window,
    startTime: window.startTime - displayOffset,
    endTime: window.endTime - displayOffset,
  }));
}

function syncSchemeRelayDisplayOffset(
  scheme: (typeof rotationSchemes.value.schemes)[number],
  nextDisplayTimeOffset: number,
  nextDisplayGameTimeOffset: number,
) {
  if (scheme.simulationMode !== "relay_from_previous") {
    scheme.relayDisplayTimeOffset = undefined;
    scheme.relayDisplayGameTimeOffset = undefined;
    return;
  }

  const previousDisplayTimeOffset = scheme.relayDisplayTimeOffset;
  const deltaTime = previousDisplayTimeOffset == null
    ? 0
    : nextDisplayTimeOffset - previousDisplayTimeOffset;
  if (Math.abs(deltaTime) > 0.0001) {
    scheme.rotation.steps = scheme.rotation.steps.map((step) => ({
      ...step,
      startTime: typeof step.startTime === "number" ? step.startTime + deltaTime : step.startTime,
    }));
    if (scheme.enemyCommandsBySlot && typeof scheme.enemyCommandsBySlot === "object") {
      scheme.enemyCommandsBySlot = Object.fromEntries(
        Object.entries(scheme.enemyCommandsBySlot).map(([slotId, placements]) => [
          slotId,
          Array.isArray(placements)
            ? placements.map((placement) => ({
                ...placement,
                startTime: Number.isFinite(placement.startTime) ? placement.startTime + deltaTime : placement.startTime,
              }))
            : [],
        ]),
      );
    }
  }

  scheme.relayDisplayTimeOffset = nextDisplayTimeOffset;
  scheme.relayDisplayGameTimeOffset = nextDisplayGameTimeOffset;
}
watch(
  () => activeScheme.value.id,
  () => {
    activeScheme.value.teamSpConfig = normalizeTeamSpConfig(activeScheme.value.teamSpConfig);
  },
  { immediate: true },
);
const teamSpConfig = computed<TeamSpConfig>(() => {
  return activeScheme.value.teamSpConfig ?? makeDefaultTeamSpConfig();
});
const displayTeamSpConfig = computed<TeamSpConfig>(() =>
  normalizeTeamSpConfig(relayDisplaySourceScheme.value.teamSpConfig),
);
const activeContingencyContracts = computed<ActiveContingencyContract[]>(() => {
  if (!activeResolvedStageSettings.value.contractsEnabled) return [];
  try {
    if (isActiveSchemeRelayed.value) {
      return [];
    }
    const scheme = activeScheme.value;
    if (!scheme || typeof scheme !== "object") {
      return [];
    }
    return normalizeActiveContingencyContracts(scheme.activeContracts ?? []);
  } catch (error) {
    console.warn("Failed to resolve active contingency contracts", error);
    return [];
  }
});
const displayContingencyContracts = computed<ActiveContingencyContract[]>(() => {
  if (!resolvedStageSettings.value.contractsEnabled) return [];
  try {
    const scheme = relayDisplaySourceScheme.value;
    if (!scheme || typeof scheme !== "object") {
      return [];
    }
    return normalizeActiveContingencyContracts(scheme.activeContracts ?? []);
  } catch (error) {
    console.warn("Failed to resolve display contingency contracts", error);
    return [];
  }
});
const visibleContingencyContracts = computed(() => {
  try {
    return CONTINGENCY_CONTRACTS
      .map((contract) => ({
        ...contract,
        variants: contract.variants.filter((variant) => isContingencyContractVariantVisible(variant)),
      }))
      .filter((contract) => contract.variants.length > 0);
  } catch (error) {
    console.warn("Failed to resolve visible contingency contracts", error);
    return [];
  }
});
const visibleContingencyContractColumns = computed(() => {
  try {
    const columns: Array<{
      key: string;
      cardWidth: number;
      families: Array<{
        key: string;
        cardWidth: number;
        entriesByLevel: Record<number, Array<{
          contractId: string;
          variantId: string;
          level: number;
          name: string;
          description: string;
          iconPath: string;
          isActive: boolean;
        }>>;
      }>;
    }> = [];
    const byKey = new Map<string, (typeof columns)[number]>();

    for (const contract of visibleContingencyContracts.value) {
      const columnKey = contract.groupAlias ?? contract.id;
      let column = byKey.get(columnKey);
      if (!column) {
        column = {
          key: columnKey,
          cardWidth: 0,
          families: [],
        };
        byKey.set(columnKey, column);
        columns.push(column);
      }

      const entriesByLevel: Record<number, Array<{
        contractId: string;
        variantId: string;
        level: number;
        name: string;
        description: string;
        iconPath: string;
        isActive: boolean;
      }>> = { 1: [], 2: [], 3: [] };

      for (const variant of contract.variants) {
        const row = entriesByLevel[variant.level] ?? (entriesByLevel[variant.level] = []);
        row.push({
          contractId: contract.id,
          variantId: variant.id,
          level: variant.level,
          name: getLocalizedContingencyContractVariantName(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
          description: getLocalizedContingencyContractVariantDescription(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
          iconPath: toAssetUrl(getContingencyContractVariantIconAssetPath(variant) ?? "/icons/no_selection.svg"),
          isActive: activeContingencyContracts.value.some((entry) => entry.id === contract.id && entry.variantId === variant.id),
        });
      }

      const widthTracks = Math.max(
        1,
        ...CONTRACT_DISPLAY_LEVELS.map((level) => Math.max(1, entriesByLevel[level]?.length ?? 0)),
      );

      column.families.push({
        key: contract.id,
        cardWidth: widthTracks * CONTRACT_TILE_SIZE
          + Math.max(0, widthTracks - 1) * CONTRACT_TILE_GAP
          + CONTRACT_CARD_PADDING * 2,
        entriesByLevel,
      });
    }

    for (const column of columns) {
      column.cardWidth = column.families.reduce((sum, family, index) => {
        return sum + family.cardWidth + (index > 0 ? CONTRACT_TILE_GAP : 0);
      }, 0);
    }

    return columns;
  } catch (error) {
    console.warn("Failed to build contingency contract layout", error);
    return [];
  }
});
const disabledGenericActions = computed(() =>
  resolveContingencyContracts(activeContingencyContracts.value).disabledGenericActions,
);
const dodgeDisabledByContracts = computed(() => disabledGenericActions.value.has("dodge"));
const contingencyTotalLevel = computed(() => {
  try {
    return displayContingencyContracts.value.reduce((sum, entry) => {
      const variant = getContingencyContractVariant(entry.id, entry.variantId);
      return sum + (variant?.level ?? 0);
    }, 0);
  } catch (error) {
    console.warn("Failed to compute contingency total level", error);
    return 0;
  }
});
const activeContractSummary = computed(() => {
  try {
    return activeContingencyContracts.value.flatMap((entry) => {
      const variant = getContingencyContractVariant(entry.id, entry.variantId);
      if (!variant) {
        return [];
      }
      return [{
        id: `${entry.id}:${variant.id}`,
        name: getLocalizedContingencyContractVariantName(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
        description: getLocalizedContingencyContractVariantDescription(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
        level: variant.level,
      }];
    });
  } catch (error) {
    console.warn("Failed to build active contingency contract summary", error);
    return [];
  }
});
const highlightedContract = computed(() => {
  try {
    const highlighted = highlightedContractVariantRef.value;
    let variant = highlighted
      ? getContingencyContractVariant(highlighted.contractId, highlighted.variantId)
      : null;

    if (!variant) {
      const firstEntry = visibleContingencyContractColumns.value
        .flatMap((column) =>
          column.families.flatMap((family) => CONTRACT_DISPLAY_LEVELS.flatMap((level) => family.entriesByLevel[level] ?? [])),
        )[0] ?? null;
      if (!firstEntry) {
        return null;
      }
      variant = getContingencyContractVariant(firstEntry.contractId, firstEntry.variantId);
    }

    if (!variant) {
      return null;
    }

    return {
      id: variant.id,
      name: getLocalizedContingencyContractVariantName(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
      description: getLocalizedContingencyContractVariantDescription(variant, locale.value === "zh-CN" ? "zh-CN" : "en"),
      iconPath: toAssetUrl(getContingencyContractVariantIconAssetPath(variant) ?? "/icons/no_selection.svg"),
      level: variant.level,
    };
  } catch (error) {
    console.warn("Failed to resolve highlighted contingency contract", error);
    return null;
  }
});

function toggleContractVariant(contractId: string, variantId: string) {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object") {
    return;
  }
  const next = [...activeContingencyContracts.value];
  const existingIndex = next.findIndex((entry) => entry.id === contractId);
  if (existingIndex >= 0 && next[existingIndex]!.variantId === variantId) {
    next.splice(existingIndex, 1);
  } else if (existingIndex >= 0) {
    next[existingIndex] = { id: contractId, variantId };
  } else {
    next.push({ id: contractId, variantId });
  }
  scheme.activeContracts = next;
}

function highlightContractVariant(contractId: string, variantId: string) {
  highlightedContractVariantRef.value = { contractId, variantId };
}

function setCurrentRotationSimulationMode(mode: "independent" | "relay_from_previous") {
  setActiveSchemeSimulationMode(mode);
}
const activeCustomTriggers = computed<CustomCombatTrigger[]>(() => {
  if (isActiveSchemeRelayed.value) {
    return [];
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object" || !Array.isArray(scheme.triggers)) {
    return [];
  }
  return scheme.triggers;
});
const displayCustomTriggers = computed<CustomCombatTrigger[]>(() => {
  const scheme = relayDisplaySourceScheme.value;
  if (!scheme || typeof scheme !== "object" || !Array.isArray(scheme.triggers)) {
    return [];
  }
  return normalizeCustomCombatTriggers(scheme.triggers);
});
const MAX_CUSTOM_TRIGGER_VARIABLES = 32;
const activeCustomTriggerVariables = computed<TriggerVariableDefinition[]>(() => {
  if (isActiveSchemeRelayed.value) {
    return [];
  }
  const scheme = activeScheme.value as { triggerVariables?: TriggerVariableDefinition[] };
  return normalizeCustomTriggerVariables(scheme.triggerVariables ?? []);
});
const activeInternalTriggers = computed<CustomCombatTrigger[]>(() =>
  getActiveInternalCombatTriggers(activeContingencyContracts.value),
);
const activeInternalTriggerVariables = computed<TriggerVariableDefinition[]>(() =>
  getActiveInternalTriggerVariables(activeContingencyContracts.value),
);
const activeTriggerVariables = computed<TriggerVariableDefinition[]>(() =>
  getAllTriggerVariables(activeCustomTriggerVariables.value),
);
const triggerEditorState = ref<{
  mode: "create" | "edit";
  triggerId: string | null;
  draft: CustomCombatTrigger;
}>({
  mode: "create",
  triggerId: null,
  draft: makeDefaultCustomTrigger(),
});
const triggerEditorTab = ref<"overview" | "conditions" | "actions" | "script">("overview");
const triggerEditorPanel = ref<"trigger" | "variable">("trigger");
const triggerListMode = ref<"custom" | "internal">("custom");
const triggerTransferStatus = ref<{
  tone: "success" | "error";
  message: string;
} | null>(null);
const triggerImportState = ref({
  open: false,
  script: "",
});
const selectedTriggerVariableId = ref<string | null>(null);
const triggerEditorScript = ref("");
const triggerEditorScriptBaseline = ref("");
const triggerScriptPromptState = ref<{
  open: boolean;
  nextTab: "overview" | "conditions" | "actions" | null;
  continueSave: boolean;
  error: string;
}>({
  open: false,
  nextTab: null,
  continueSave: false,
  error: "",
});

function serializeTriggerScript(trigger: CustomCombatTrigger) {
  const stripConditionIds = (node: TriggerConditionNode): TriggerConditionNode => {
    if (node.kind === "logic") {
      return {
        kind: "logic",
        id: "",
        operator: node.operator,
        conditions: node.conditions.map(stripConditionIds),
      };
    }
    return {
      kind: "comparator",
      id: "",
      left: node.left,
      comparator: node.comparator,
      right: node.right,
    };
  };
  const serialized = {
    ...trigger,
    conditions: Array.isArray(trigger.conditions) ? trigger.conditions.map(stripConditionIds).map((node) => {
      const { id: _id, ...rest } = node;
      return rest;
    }) : [],
  };
  const stripNestedIds = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(stripNestedIds);
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    const objectValue = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(objectValue)) {
      if (key === "id" && (objectValue.kind === "logic" || objectValue.kind === "comparator")) {
        continue;
      }
      next[key] = stripNestedIds(entry);
    }
    return next;
  };
  return JSON.stringify(stripNestedIds(serialized), null, 2);
}

function syncTriggerScriptFromDraft() {
  const serialized = serializeTriggerScript(triggerEditorState.value.draft);
  triggerEditorScript.value = serialized;
  triggerEditorScriptBaseline.value = serialized;
}

function isTriggerScriptDirty() {
  return triggerEditorScript.value !== triggerEditorScriptBaseline.value;
}

function parseTriggerScriptToDraft(script: string) {
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(script);
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to parse JSON.",
    };
  }
  const normalized = normalizeCustomCombatTrigger(parsedRaw);
  if (!normalized) {
    return {
      ok: false as const,
      error: locale.value === "zh-CN"
        ? "脚本无法解析为有效的触发器。"
        : "Script could not be parsed as a valid trigger.",
    };
  }
  sanitizeTriggersAgainstVariables([normalized], activeCustomTriggerVariables.value);
  return {
    ok: true as const,
    draft: normalized,
  };
}

function applyTriggerScriptToDraft() {
  const result = parseTriggerScriptToDraft(triggerEditorScript.value);
  if (!result.ok) {
    return result;
  }
  triggerEditorState.value.draft = result.draft;
  syncTriggerScriptFromDraft();
  return result;
}

function openInvalidTriggerScriptPrompt(args: {
  nextTab?: "overview" | "conditions" | "actions" | null;
  continueSave?: boolean;
  error: string;
}) {
  triggerScriptPromptState.value = {
    open: true,
    nextTab: args.nextTab ?? null,
    continueSave: args.continueSave === true,
    error: args.error,
  };
}

function closeInvalidTriggerScriptPrompt() {
  triggerScriptPromptState.value = {
    open: false,
    nextTab: null,
    continueSave: false,
    error: "",
  };
}

function discardInvalidTriggerScriptChanges() {
  const pendingTab = triggerScriptPromptState.value.nextTab;
  const continueSave = triggerScriptPromptState.value.continueSave;
  syncTriggerScriptFromDraft();
  closeInvalidTriggerScriptPrompt();
  if (pendingTab) {
    triggerEditorTab.value = pendingTab;
    return;
  }
  if (continueSave) {
    saveTriggerDraft();
  }
}

function cancelInvalidTriggerScriptPrompt() {
  closeInvalidTriggerScriptPrompt();
  triggerEditorTab.value = "script";
}

function resetTriggerDraft() {
  triggerEditorState.value = {
    mode: "create",
    triggerId: null,
    draft: makeDefaultCustomTrigger(),
  };
  triggerEditorTab.value = "overview";
  triggerEditorPanel.value = "trigger";
  closeInvalidTriggerScriptPrompt();
  syncTriggerScriptFromDraft();
}

function beginCreateTrigger() {
  triggerListMode.value = "custom";
  clearTriggerTransferStatus();
  resetTriggerDraft();
}

function beginEditTrigger(trigger: CustomCombatTrigger) {
  triggerListMode.value = "custom";
  clearTriggerTransferStatus();
  triggerEditorPanel.value = "trigger";
  selectedTriggerVariableId.value = null;
  triggerEditorState.value = {
    mode: "edit",
    triggerId: trigger.id,
    draft: JSON.parse(JSON.stringify(trigger)) as CustomCombatTrigger,
  };
  triggerEditorTab.value = "overview";
  closeInvalidTriggerScriptPrompt();
  syncTriggerScriptFromDraft();
}

function beginEditTriggerVariable(variable: TriggerVariableDefinition) {
  triggerEditorPanel.value = "variable";
  selectedTriggerVariableId.value = variable.id;
}

function stopEditingTriggerVariable() {
  selectedTriggerVariableId.value = null;
  triggerEditorPanel.value = "trigger";
}

function ensurePrimaryTriggerAction(draft: CustomCombatTrigger): TriggerAction {
  if (!Array.isArray(draft.actions) || draft.actions.length === 0) {
    draft.actions = [getPrimaryTriggerAction(makeDefaultCustomTrigger())];
  }
  return draft.actions[0]!;
}

function ensureTriggerActions(draft: CustomCombatTrigger): TriggerAction[] {
  if (!Array.isArray(draft.actions) || draft.actions.length === 0) {
    draft.actions = [getPrimaryTriggerAction(makeDefaultCustomTrigger())];
  }
  return draft.actions;
}

function ensureTriggerConditions(draft: CustomCombatTrigger): TriggerConditionNode[] {
  if (!Array.isArray(draft.conditions)) {
    draft.conditions = [];
  }
  return draft.conditions;
}

function ensureSchemeTriggerVariables(): TriggerVariableDefinition[] {
  const scheme = activeScheme.value as { triggerVariables?: TriggerVariableDefinition[] };
  if (!Array.isArray(scheme.triggerVariables)) {
    scheme.triggerVariables = [];
  }
  return scheme.triggerVariables;
}

function getEditableTriggerVariable(variableId: string) {
  return ensureSchemeTriggerVariables().find((entry) => entry.id === variableId) ?? null;
}

function sanitizeSchemeTriggersAgainstVariables() {
  const scheme = activeScheme.value as { triggers?: CustomCombatTrigger[]; triggerVariables?: TriggerVariableDefinition[] };
  if (!Array.isArray(scheme.triggers)) {
    scheme.triggers = [];
  }
  scheme.triggerVariables = normalizeCustomTriggerVariables(scheme.triggerVariables ?? []);
  sanitizeTriggersAgainstVariables(scheme.triggers, scheme.triggerVariables);
  const editingTriggerId = triggerEditorState.value.triggerId;
  if (editingTriggerId) {
    const latest = scheme.triggers.find((entry) => entry.id === editingTriggerId);
    if (latest) {
      triggerEditorState.value.draft = JSON.parse(JSON.stringify(latest)) as CustomCombatTrigger;
    }
  } else {
    sanitizeTriggersAgainstVariables([triggerEditorState.value.draft], scheme.triggerVariables);
  }
  if (triggerEditorTab.value !== "script") {
    syncTriggerScriptFromDraft();
  }
}

function addTriggerVariable() {
  const variables = ensureSchemeTriggerVariables();
  if (variables.length >= MAX_CUSTOM_TRIGGER_VARIABLES) {
    return;
  }
  const variable: TriggerVariableDefinition = {
    id: makeCustomTriggerVariableId(),
    name: `Var ${variables.length + 1}`,
    type: "number",
    initialValue: { type: "number_literal", value: 0 },
  };
  variables.push(variable);
  sanitizeSchemeTriggersAgainstVariables();
  beginEditTriggerVariable(variable);
}

function removeTriggerVariable(variableId: string) {
  const scheme = activeScheme.value as { triggerVariables?: TriggerVariableDefinition[] };
  if (!Array.isArray(scheme.triggerVariables)) {
    return;
  }
  scheme.triggerVariables = scheme.triggerVariables.filter((entry) => entry.id !== variableId);
  if (selectedTriggerVariableId.value === variableId) {
    stopEditingTriggerVariable();
  }
  sanitizeSchemeTriggersAgainstVariables();
}

function duplicateTriggerVariable(variable: TriggerVariableDefinition) {
  const variables = ensureSchemeTriggerVariables();
  if (variables.length >= MAX_CUSTOM_TRIGGER_VARIABLES) {
    return;
  }
  const duplicated: TriggerVariableDefinition = {
    ...JSON.parse(JSON.stringify(variable)),
    id: makeCustomTriggerVariableId(),
    name: `${variable.name} Copy`,
  };
  variables.push(duplicated);
  sanitizeSchemeTriggersAgainstVariables();
  beginEditTriggerVariable(duplicated);
}

function setTriggerVariableName(variable: TriggerVariableDefinition, name: string) {
  const editable = getEditableTriggerVariable(variable.id);
  if (!editable) return;
  editable.name = name;
}

function setTriggerVariableType(variable: TriggerVariableDefinition, type: "string" | "number" | "boolean") {
  const editable = getEditableTriggerVariable(variable.id);
  if (!editable || editable.type === type) {
    return;
  }
  editable.type = type;
  editable.initialValue =
    type === "string"
      ? { type: "string_literal", value: "" }
      : type === "boolean"
        ? { type: "boolean_literal", value: false }
        : { type: "number_literal", value: 0 };
  sanitizeSchemeTriggersAgainstVariables();
}

function setTriggerVariableInitialString(variable: TriggerVariableDefinition, value: string) {
  const editable = getEditableTriggerVariable(variable.id);
  if (!editable || editable.type !== "string") return;
  editable.initialValue = { type: "string_literal", value };
}
function setTriggerVariableInitialNumber(variable: TriggerVariableDefinition, value: number) {
  const editable = getEditableTriggerVariable(variable.id);
  if (!editable || editable.type !== "number") return;
  editable.initialValue = { type: "number_literal", value: Number.isFinite(value) ? value : 0 };
}
function setTriggerVariableInitialBoolean(variable: TriggerVariableDefinition, value: boolean) {
  const editable = getEditableTriggerVariable(variable.id);
  if (!editable || editable.type !== "boolean") return;
  editable.initialValue = { type: "boolean_literal", value };
}

function getTriggerVariablesByType(type: "string" | "number" | "boolean") {
  return activeTriggerVariables.value.filter((entry) => entry.type === type);
}

const selectedCustomTriggerVariable = computed<TriggerVariableDefinition | null>(() => {
  if (!selectedTriggerVariableId.value) {
    return null;
  }
  return activeCustomTriggerVariables.value.find((entry) => entry.id === selectedTriggerVariableId.value) ?? null;
});

const selectedInternalTrigger = computed<CustomCombatTrigger | null>(() => {
  if (!triggerEditorState.value.triggerId) {
    return activeInternalTriggers.value[0] ?? null;
  }
  return activeInternalTriggers.value.find((entry) => entry.id === triggerEditorState.value.triggerId) ?? activeInternalTriggers.value[0] ?? null;
});

function setTriggerListMode(mode: "custom" | "internal") {
  triggerListMode.value = mode;
  if (mode === "internal") {
    triggerEditorPanel.value = "trigger";
    selectedTriggerVariableId.value = null;
    const next = activeInternalTriggers.value[0] ?? null;
    if (next) {
      viewInternalTrigger(next);
    }
    return;
  }
  beginCreateTrigger();
}

function viewInternalTrigger(trigger: CustomCombatTrigger) {
  triggerListMode.value = "internal";
  clearTriggerTransferStatus();
  triggerEditorPanel.value = "trigger";
  selectedTriggerVariableId.value = null;
  triggerEditorState.value = {
    mode: "edit",
    triggerId: trigger.id,
    draft: JSON.parse(JSON.stringify(trigger)) as CustomCombatTrigger,
  };
  triggerEditorTab.value = "overview";
  syncTriggerScriptFromDraft();
}

async function copyTriggerScript() {
  const trigger = triggerListMode.value === "internal"
    ? selectedInternalTrigger.value
    : triggerEditorState.value.draft;
  if (!trigger) {
    return;
  }
  const serialized = serializeTriggerScript(trigger);
  await copyText(serialized);
  setTriggerTransferStatus(
    "success",
    locale.value === "zh-CN" ? "触发器脚本已复制到剪贴板" : "trigger script copied to clipboard",
  );
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  }
}

function setTriggerTransferStatus(tone: "success" | "error", message: string) {
  triggerTransferStatus.value = { tone, message };
}

function clearTriggerTransferStatus() {
  triggerTransferStatus.value = null;
}

function serializeAllCustomTriggersScript() {
  return JSON.stringify({
    variables: activeCustomTriggerVariables.value,
    triggers: activeCustomTriggers.value,
  }, null, 2);
}

async function copyAllTriggersScript() {
  await copyText(serializeAllCustomTriggersScript());
  setTriggerTransferStatus(
    "success",
    locale.value === "zh-CN" ? "全部触发器已复制到剪贴板" : "All triggers copied to clipboard",
  );
}

function openTriggerImportDialog() {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  triggerImportState.value.open = true;
  triggerImportState.value.script = "";
  clearTriggerTransferStatus();
}

function closeTriggerImportDialog() {
  triggerImportState.value.open = false;
  triggerImportState.value.script = "";
}

function importTriggerScript() {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  const raw = triggerImportState.value.script.trim();
  const invalidMessage = locale.value === "zh-CN" ? "无效的导入脚本" : "invalid import script";
  const successMessage = locale.value === "zh-CN" ? "导入成功" : "import successful";
  if (!raw) {
    setTriggerTransferStatus("error", invalidMessage);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    setTriggerTransferStatus("error", invalidMessage);
    return;
  }

  const scheme = activeScheme.value as {
    triggers?: CustomCombatTrigger[];
    triggerVariables?: TriggerVariableDefinition[];
  } | null;
  if (!scheme || typeof scheme !== "object") {
    setTriggerTransferStatus("error", invalidMessage);
    return;
  }

  const bulkPayload = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as { variables?: unknown; triggers?: unknown }
    : null;

  if (bulkPayload && ("variables" in bulkPayload || "triggers" in bulkPayload)) {
    const importedVariables = normalizeCustomTriggerVariables(bulkPayload.variables ?? []).slice(0, MAX_CUSTOM_TRIGGER_VARIABLES);
    const importedTriggers = normalizeCustomCombatTriggers(bulkPayload.triggers ?? []).slice(0, MAX_CUSTOM_TRIGGERS);
    if (!Array.isArray(scheme.triggerVariables)) {
      scheme.triggerVariables = [];
    }
    if (!Array.isArray(scheme.triggers)) {
      scheme.triggers = [];
    }

    for (const importedVariable of importedVariables) {
      const existingIndex = scheme.triggerVariables.findIndex((entry) => entry.id === importedVariable.id);
      if (existingIndex >= 0) {
        scheme.triggerVariables.splice(existingIndex, 1, importedVariable);
        continue;
      }
      if (scheme.triggerVariables.length >= MAX_CUSTOM_TRIGGER_VARIABLES) {
        continue;
      }
      scheme.triggerVariables.push(importedVariable);
    }

    const mergedVariables = normalizeCustomTriggerVariables(scheme.triggerVariables);
    scheme.triggerVariables = mergedVariables;

    for (const importedTrigger of importedTriggers) {
      sanitizeTriggersAgainstVariables([importedTrigger], mergedVariables);
      const existingIndex = scheme.triggers.findIndex((entry) => entry.id === importedTrigger.id);
      if (existingIndex >= 0) {
        scheme.triggers.splice(existingIndex, 1, importedTrigger);
        continue;
      }
      if (scheme.triggers.length >= MAX_CUSTOM_TRIGGERS) {
        continue;
      }
      scheme.triggers.push(importedTrigger);
    }

    sanitizeSchemeTriggersAgainstVariables();
    beginCreateTrigger();
    closeTriggerImportDialog();
    setTriggerTransferStatus("success", successMessage);
    return;
  }

  const importedTrigger = normalizeCustomCombatTrigger(parsed);
  if (!importedTrigger) {
    setTriggerTransferStatus("error", invalidMessage);
    return;
  }

  if (!Array.isArray(scheme.triggers)) {
    scheme.triggers = [];
  }
  sanitizeTriggersAgainstVariables([importedTrigger], activeCustomTriggerVariables.value);
  const existingIndex = scheme.triggers.findIndex((entry) => entry.id === importedTrigger.id);
  if (existingIndex >= 0) {
    scheme.triggers.splice(existingIndex, 1, importedTrigger);
  } else if (scheme.triggers.length < MAX_CUSTOM_TRIGGERS) {
    scheme.triggers.push(importedTrigger);
  } else {
    setTriggerTransferStatus("error", invalidMessage);
    return;
  }
  sanitizeSchemeTriggersAgainstVariables();
  beginEditTrigger(importedTrigger);
  closeTriggerImportDialog();
  setTriggerTransferStatus("success", successMessage);
}

function getNumericSourceMode(source: TriggerNumericSource) {
  return source.type === "variable_ref" ? "variable" : "literal";
}

function setNumericSourceMode(source: TriggerNumericSource, mode: "literal" | "variable") {
  if (mode === "variable") {
    source.type = "variable_ref";
    (source as TriggerNumericSource & { variableId?: string; variableType?: "number" }).variableId = getDefaultTriggerVariableId("number");
    (source as TriggerNumericSource & { variableId?: string; variableType?: "number" }).variableType = "number";
    delete (source as Record<string, unknown>).value;
    return;
  }
  source.type = "number_literal";
  (source as TriggerNumericSource & { value?: number }).value = 1;
  delete (source as Record<string, unknown>).variableId;
  delete (source as Record<string, unknown>).variableType;
}

function getNumericSourceLiteralValue(source: TriggerNumericSource) {
  return source.type === "number_literal" ? source.value : 1;
}

function setNumericSourceLiteralValue(source: TriggerNumericSource, value: number) {
  if (source.type !== "number_literal") return;
  source.value = Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
}

function getNumericSourceVariableId(source: TriggerNumericSource) {
  return source.type === "variable_ref" ? source.variableId : getDefaultTriggerVariableId("number");
}

function setNumericSourceVariableId(source: TriggerNumericSource, variableId: string) {
  if (source.type !== "variable_ref") return;
  source.variableId = variableId;
  source.variableType = "number";
}

function addRootComparatorTriggerCondition(draft: CustomCombatTrigger) {
  ensureTriggerConditions(draft).push(makeDefaultComparatorTriggerCondition());
}

function addRootLogicTriggerCondition(draft: CustomCombatTrigger) {
  ensureTriggerConditions(draft).push(makeDefaultLogicTriggerCondition());
}

function makeDefaultTriggerActionByType(actionType: TriggerAction["type"]): TriggerAction {
  return actionType === "REMOVE_STATUS"
    ? makeDefaultRemoveStatusAction()
    : actionType === "REPLACE_ENEMY"
      ? makeDefaultReplaceEnemyAction()
        : actionType === "MODIFY_HP"
          ? makeDefaultModifyHpAction()
          : actionType === "MODIFY_VARIABLE"
            ? makeDefaultModifyVariableAction()
        : actionType === "SET_TARGET_ENEMY"
          ? makeDefaultSetTargetEnemyAction()
          : actionType === "EXECUTE_HIT"
            ? makeDefaultExecuteHitAction()
            : actionType === "WAIT"
              ? makeDefaultWaitAction()
    : actionType === "COUNTDOWN"
              ? makeDefaultCountdownAction()
            : actionType === "RELAY_ROTATION"
              ? makeDefaultRelayRotationAction()
            : actionType === "SET_TRIGGER_ENABLED"
                ? makeDefaultSetTriggerEnabledAction()
                : actionType === "STOP_TRIGGER"
                  ? makeDefaultStopTriggerAction()
                  : actionType === "BREAK"
                    ? makeDefaultBreakAction()
                : actionType === "IF_THEN_ELSE"
                  ? makeDefaultIfThenElseAction()
                  : actionType === "FOR_EACH_ENEMY"
                    ? makeDefaultForEachEnemyAction()
                    : actionType === "FOR_EACH_OPERATOR"
                      ? makeDefaultForEachOperatorAction()
                  : actionType === "FIRE_TRIGGER"
                    ? makeDefaultFireTriggerAction()
                    : makeDefaultApplyStatusAction();
}

function removeRootTriggerCondition(draft: CustomCombatTrigger, index: number) {
  if (!Array.isArray(draft.conditions)) {
    return;
  }
  draft.conditions.splice(index, 1);
}

function moveRootTriggerCondition(draft: CustomCombatTrigger, index: number, direction: -1 | 1) {
  const conditions = ensureTriggerConditions(draft);
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= conditions.length) {
    return;
  }
  const [condition] = conditions.splice(index, 1);
  if (!condition) {
    return;
  }
  conditions.splice(nextIndex, 0, condition);
}

function duplicateRootTriggerCondition(draft: CustomCombatTrigger, index: number) {
  const conditions = ensureTriggerConditions(draft);
  const source = conditions[index];
  if (!source) {
    return;
  }
  conditions.splice(index + 1, 0, JSON.parse(JSON.stringify(source)) as TriggerConditionNode);
}

function addTriggerAction(draft: CustomCombatTrigger, type: TriggerAction["type"] = "APPLY_STATUS") {
  const actions = ensureTriggerActions(draft);
  actions.push(makeDefaultTriggerActionByType(type));
}

function removeTriggerAction(draft: CustomCombatTrigger, index: number) {
  if (!Array.isArray(draft.actions)) {
    return;
  }
  draft.actions.splice(index, 1);
}

function duplicateTriggerAction(draft: CustomCombatTrigger, index: number) {
  const actions = ensureTriggerActions(draft);
  const source = actions[index];
  if (!source) {
    return;
  }
  actions.splice(index + 1, 0, JSON.parse(JSON.stringify(source)) as TriggerAction);
}

function saveTriggerDraft() {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  if (triggerEditorTab.value === "script" && isTriggerScriptDirty()) {
    const result = applyTriggerScriptToDraft();
    if (!result.ok) {
      openInvalidTriggerScriptPrompt({
        continueSave: true,
        error: result.error,
      });
      return;
    }
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object") {
    return;
  }
  if (!Array.isArray(scheme.triggers)) {
    scheme.triggers = [];
  }

  const draft = JSON.parse(JSON.stringify(triggerEditorState.value.draft)) as CustomCombatTrigger;
  draft.name = draft.name.trim() || t("rotation.newTrigger");
  const actions = ensureTriggerActions(draft);
  for (const action of actions) {
    if (action.type === "APPLY_STATUS") {
      if (action.durationSeconds.type === "number_literal") {
        action.durationSeconds.value = Math.max(0, Number(action.durationSeconds.value ?? 0));
      }
      if (action.stacks.type === "number_literal") {
        action.stacks.value = Math.max(1, Math.round(action.stacks.value ?? 1));
      }
    }
  }

  if (triggerEditorState.value.mode === "edit" && triggerEditorState.value.triggerId) {
    const index = scheme.triggers.findIndex((entry) => entry.id === triggerEditorState.value.triggerId);
    if (index >= 0) {
      scheme.triggers.splice(index, 1, draft);
    } else if (scheme.triggers.length < MAX_CUSTOM_TRIGGERS) {
      scheme.triggers.push(draft);
    }
  } else if (scheme.triggers.length < MAX_CUSTOM_TRIGGERS) {
    scheme.triggers.push(draft);
  }

  beginCreateTrigger();
}

function removeTrigger(triggerId: string) {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object" || !Array.isArray(scheme.triggers)) {
    return;
  }
  scheme.triggers = scheme.triggers.filter((entry) => entry.id !== triggerId);
  if (triggerEditorState.value.triggerId === triggerId) {
    beginCreateTrigger();
  }
}

function duplicateTrigger(trigger: CustomCombatTrigger) {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object") {
    return;
  }
  if (!Array.isArray(scheme.triggers)) {
    scheme.triggers = [];
  }
  if (scheme.triggers.length >= MAX_CUSTOM_TRIGGERS) {
    return;
  }
  const clone = JSON.parse(JSON.stringify(trigger)) as CustomCombatTrigger;
  clone.id = makeDefaultCustomTrigger().id;
  clone.name = `${trigger.name} Copy`;
  scheme.triggers.push(clone);
}

function moveTrigger(triggerId: string, direction: -1 | 1) {
  if (isActiveSchemeRelayed.value) {
    return;
  }
  const scheme = activeScheme.value;
  if (!scheme || typeof scheme !== "object" || !Array.isArray(scheme.triggers)) {
    return;
  }
  const index = scheme.triggers.findIndex((entry) => entry.id === triggerId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= scheme.triggers.length) {
    return;
  }
  const [trigger] = scheme.triggers.splice(index, 1);
  if (!trigger) {
    return;
  }
  scheme.triggers.splice(nextIndex, 0, trigger);
}

watch(triggersPopupOpen, (open) => {
  if (open && !isActiveSchemeRelayed.value) {
    beginCreateTrigger();
  }
});

watch(isActiveSchemeRelayed, (relayed) => {
  if (relayed) {
    contractsPopupOpen.value = false;
    triggersPopupOpen.value = false;
  }
});

function getTriggerEventLabel(eventType: CustomCombatTrigger["event"]["type"]) {
  const option = CUSTOM_TRIGGER_EVENT_OPTIONS.find((entry) => entry.id === eventType) ?? CUSTOM_TRIGGER_EVENT_OPTIONS[0]!;
  return getCustomTriggerOptionLabel(option, locale.value === "zh-CN" ? "zh-CN" : "en");
}

function getTriggerActionLabel(actionType: TriggerAction["type"]) {
  const option = CUSTOM_TRIGGER_ACTION_OPTIONS.find((entry) => entry.id === actionType) ?? CUSTOM_TRIGGER_ACTION_OPTIONS[0]!;
  return getCustomTriggerOptionLabel(option, locale.value === "zh-CN" ? "zh-CN" : "en");
}

function getTriggerTargetLabel(target: "event_operator" | "controlled_operator" | "current_operator" | "event_enemy_target" | "event_enemy_group_member" | "enemy_in_slot" | "current_enemy") {
  const option = CUSTOM_TRIGGER_TARGET_OPTIONS.find((entry) => entry.id === target) ?? CUSTOM_TRIGGER_TARGET_OPTIONS[0]!;
  return getCustomTriggerOptionLabel(option, locale.value === "zh-CN" ? "zh-CN" : "en");
}

function getTriggerStatusLabel(statusId: string) {
  const option = CUSTOM_TRIGGER_STATUS_OPTIONS.find((entry) => entry.id === statusId) ?? CUSTOM_TRIGGER_STATUS_OPTIONS[0]!;
  return locale.value === "zh-CN" ? option.label.zh : option.label.en;
}

function summarizeTriggerConditionNode(node: TriggerConditionNode): string {
  if (node.kind === "logic") {
    const childSummary = node.conditions.map((entry) => summarizeTriggerConditionNode(entry)).join(", ");
    return `${node.operator}{${childSummary}}`;
  }
  const left = node.left.type === "enemy_identity"
    ? (locale.value === "zh-CN" ? "敌人身份" : "Enemy Identity")
    : node.left.type === "operator_hp_ratio"
      ? (locale.value === "zh-CN" ? "干员生命比例" : "Operator HP Ratio")
      : node.left.type === "enemy_hp_ratio"
        ? (locale.value === "zh-CN" ? "敌人生命比例" : "Enemy HP Ratio")
        : node.left.type === "status_stack_count"
          ? (locale.value === "zh-CN" ? "状态层数" : "Status Stack Count")
        : node.left.type;
  const right = node.right.type === "enemy_id_literal"
    ? node.right.enemyId
    : node.right.type === "number_literal"
      ? String(node.right.value)
      : node.right.type === "boolean_literal"
        ? String(node.right.value)
        : node.right.type === "enemy_identity"
          ? (locale.value === "zh-CN" ? "敌人身份" : "Enemy Identity")
          : node.right.type === "operator_hp_ratio"
            ? (locale.value === "zh-CN" ? "干员生命比例" : "Operator HP Ratio")
            : node.right.type === "enemy_hp_ratio"
              ? (locale.value === "zh-CN" ? "敌人生命比例" : "Enemy HP Ratio")
              : node.right.type === "status_stack_count"
                ? (locale.value === "zh-CN" ? "状态层数" : "Status Stack Count")
              : node.right.type;
  return `${left} ${node.comparator} ${right}`;
}

function setTriggerActionType(draft: CustomCombatTrigger, actionType: TriggerAction["type"]) {
  const current = ensurePrimaryTriggerAction(draft);
  if (current.type === actionType) {
    return;
  }
  draft.actions = [makeDefaultTriggerActionByType(actionType)];
}

function setTriggerActionTypeAt(draft: CustomCombatTrigger, index: number, actionType: TriggerAction["type"]) {
  const actions = ensureTriggerActions(draft);
  const current = actions[index];
  if (!current || current.type === actionType) {
    return;
  }
  actions.splice(index, 1, makeDefaultTriggerActionByType(actionType));
}

function getTriggerActionStatusId(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS" && action.type !== "REMOVE_STATUS") {
    return "bladebreaking";
  }
  return action.status.type === "status_id_literal" ? action.status.statusId : "bladebreaking";
}

function setTriggerActionStatusId(action: TriggerAction, statusId: string) {
  if (action.type !== "APPLY_STATUS" && action.type !== "REMOVE_STATUS") {
    return;
  }
  action.status = {
    type: "status_id_literal",
    statusId: (CUSTOM_TRIGGER_STATUS_OPTIONS.find((entry) => entry.id === statusId)?.id ?? "bladebreaking"),
  };
}

function hasTriggerActionTarget(action: TriggerAction): action is Extract<
  TriggerAction,
  { target: unknown }
> {
  return action.type !== "WAIT" && action.type !== "COUNTDOWN" && action.type !== "RELAY_ROTATION" && action.type !== "SET_TRIGGER_ENABLED" && action.type !== "STOP_TRIGGER" && action.type !== "BREAK" && action.type !== "IF_THEN_ELSE" && action.type !== "FOR_EACH_ENEMY" && action.type !== "FOR_EACH_OPERATOR" && action.type !== "FIRE_TRIGGER";
}

function getTriggerActionTargetOption(action: TriggerAction): "event_operator" | "controlled_operator" | "current_operator" | "event_enemy_target" | "event_enemy_group_member" | "enemy_in_slot" | "current_enemy" | "team" | "global" {
  if (!hasTriggerActionTarget(action)) {
    return "event_operator";
  }
  if (action.type === "REPLACE_ENEMY" || action.type === "SET_TARGET_ENEMY" || action.type === "EXECUTE_HIT") {
    if (action.target.type === "enemy_from_group") {
      return "event_enemy_group_member";
    }
    if (action.target.type === "enemy_in_slot") {
      return "enemy_in_slot";
    }
    if (action.target.type === "current_enemy") return "current_enemy";
    return "event_enemy_target";
  }
  if (action.target.type === "team") {
    return "team";
  }
  if (action.target.type === "global") {
    return "global";
  }
  if (action.target.type === "controlled_operator") {
    return "controlled_operator";
  }
  if (action.target.type === "current_operator") return "current_operator";
  if (action.target.type === "current_enemy") return "current_enemy";
  if (action.target.type === "enemy_from_group") {
    return "event_enemy_group_member";
  }
  if (action.target.type === "enemy_in_slot") {
    return "enemy_in_slot";
  }
  if (action.target.type === "alias_enemy") {
    return "event_enemy_target";
  }
  return "event_operator";
}

function setTriggerActionTargetOption(action: TriggerAction, option: string) {
  if (!hasTriggerActionTarget(action)) {
    return;
  }
  if (action.type === "REPLACE_ENEMY" || action.type === "SET_TARGET_ENEMY" || action.type === "EXECUTE_HIT") {
    if (option === "current_enemy") { action.target = { type: "current_enemy" }; return; }
    if (option === "event_enemy_target") {
      action.target = { type: "alias_enemy", alias: "event_enemy_target" };
      return;
    }
    if (option === "event_enemy_group_member") {
      action.target = { type: "enemy_from_group", alias: "event_enemy_group", index: { type: "number_literal", value: 1 } };
      return;
    }
    if (option === "enemy_in_slot") {
      action.target = { type: "enemy_in_slot", slotNumber: { type: "number_literal", value: 1 } };
      return;
    }
    action.target = { type: "alias_enemy", alias: "event_enemy_target" };
    return;
  }
  if ((action.type === "APPLY_STATUS" || action.type === "REMOVE_STATUS") && option === "team") {
    action.target = { type: "team" };
    return;
  }
  if ((action.type === "APPLY_STATUS" || action.type === "REMOVE_STATUS") && option === "global") {
    action.target = { type: "global" };
    return;
  }
  if (option === "controlled_operator") {
    action.target = { type: "controlled_operator" };
    return;
  }
  if (option === "current_operator") { action.target = { type: "current_operator" }; return; }
  if (option === "current_enemy") { action.target = { type: "current_enemy" }; return; }
  if (option === "event_enemy_target") {
    action.target = { type: "alias_enemy", alias: "event_enemy_target" };
    return;
  }
  if (option === "event_enemy_group_member") {
    action.target = { type: "enemy_from_group", alias: "event_enemy_group", index: { type: "number_literal", value: 1 } };
    return;
  }
  if (option === "enemy_in_slot") {
    action.target = { type: "enemy_in_slot", slotNumber: { type: "number_literal", value: 1 } };
    return;
  }
  action.target = { type: "alias_operator", alias: "event_operator" };
}

function getTriggerActionDurationValue(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS") {
    return 0;
  }
  return action.durationSeconds.type === "number_literal" ? action.durationSeconds.value : 0;
}

function setTriggerActionDurationValue(action: TriggerAction, value: number) {
  if (action.type !== "APPLY_STATUS") {
    return;
  }
  action.durationSeconds = { type: "number_literal", value: Math.max(0, Number.isFinite(value) ? value : 0) };
}

function getTriggerActionDurationMode(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS") {
    return "literal";
  }
  if (action.durationSeconds.type === "event_status_duration") {
    return "event_status_duration";
  }
  if (action.durationSeconds.type === "variable_ref") {
    return "variable";
  }
  return "literal";
}

function setTriggerActionDurationMode(action: TriggerAction, mode: string) {
  if (action.type !== "APPLY_STATUS") {
    return;
  }
  if (mode === "event_status_duration") {
    action.durationSeconds = { type: "event_status_duration" };
    return;
  }
  if (mode === "variable") {
    action.durationSeconds = {
      type: "variable_ref",
      variableId: getTriggerVariablesByType("number")[0]?.id ?? "",
      variableType: "number",
    };
    return;
  }
  action.durationSeconds = { type: "number_literal", value: 0 };
}

function getTriggerActionDurationVariableId(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS") {
    return getTriggerVariablesByType("number")[0]?.id ?? "";
  }
  return action.durationSeconds.type === "variable_ref"
    ? action.durationSeconds.variableId
    : (getTriggerVariablesByType("number")[0]?.id ?? "");
}

function setTriggerActionDurationVariableId(action: TriggerAction, variableId: string) {
  if (action.type !== "APPLY_STATUS") {
    return;
  }
  action.durationSeconds = {
    type: "variable_ref",
    variableId,
    variableType: "number",
  };
}

function getTriggerActionStacksValue(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS") {
    return 1;
  }
  return action.stacks.type === "number_literal" ? action.stacks.value : 1;
}

function setTriggerActionStacksValue(action: TriggerAction, value: number) {
  if (action.type !== "APPLY_STATUS") {
    return;
  }
  action.stacks = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function getTriggerActionMaxStacksValue(action: TriggerAction) {
  if (action.type !== "APPLY_STATUS" || !action.maxStacks) {
    return 1;
  }
  return action.maxStacks.type === "number_literal" ? action.maxStacks.value : 1;
}

function setTriggerActionMaxStacksValue(action: TriggerAction, value: number) {
  if (action.type !== "APPLY_STATUS") {
    return;
  }
  action.maxStacks = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function isTriggerActionRefreshExistingStacks(action: TriggerAction) {
  return isApplyStatusTriggerAction(action) ? action.refreshExistingStacks !== false : true;
}

function setTriggerActionRefreshExistingStacks(action: TriggerAction, value: boolean) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.refreshExistingStacks = value;
}

function isTriggerActionIndependentStacks(action: TriggerAction) {
  return isApplyStatusTriggerAction(action) && action.independentStacks === true;
}

function setTriggerActionIndependentStacks(action: TriggerAction, value: boolean) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.independentStacks = value;
}

function getTriggerActionTargetSlotNumber(action: TriggerAction) {
  if (!hasTriggerActionTarget(action)) {
    return 1;
  }
  return action.target.type === "enemy_in_slot" ? getNumericSourceLiteralValue(action.target.slotNumber) : 1;
}
function getTriggerActionTargetSlotSource(action: TriggerAction): TriggerNumericSource | null {
  return hasTriggerActionTarget(action) && action.target.type === "enemy_in_slot" ? action.target.slotNumber : null;
}

function setTriggerActionTargetSlotNumber(action: TriggerAction, value: number) {
  if (!hasTriggerActionTarget(action)) {
    return;
  }
  if (action.target.type !== "enemy_in_slot") {
    return;
  }
  setNumericSourceLiteralValue(action.target.slotNumber, value);
}

function getTriggerActionTargetGroupIndex(action: TriggerAction) {
  if (!hasTriggerActionTarget(action)) {
    return 1;
  }
  return action.target.type === "enemy_from_group" ? getNumericSourceLiteralValue(action.target.index) : 1;
}
function getTriggerActionTargetGroupIndexSource(action: TriggerAction): TriggerNumericSource | null {
  return hasTriggerActionTarget(action) && action.target.type === "enemy_from_group" ? action.target.index : null;
}

function setTriggerActionTargetGroupIndex(action: TriggerAction, value: number) {
  if (!hasTriggerActionTarget(action)) {
    return;
  }
  if (action.target.type !== "enemy_from_group") {
    return;
  }
  setNumericSourceLiteralValue(action.target.index, value);
}

function isApplyStatusTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "APPLY_STATUS" }> {
  return action.type === "APPLY_STATUS";
}

function isTriggerActionPermanent(action: TriggerAction) {
  return isApplyStatusTriggerAction(action) && action.permanent === true;
}

function setTriggerActionPermanent(action: TriggerAction, value: boolean) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.permanent = value;
}

function isTriggerActionHidden(action: TriggerAction) {
  return isApplyStatusTriggerAction(action) && action.hidden === true;
}

function setTriggerActionHidden(action: TriggerAction, value: boolean) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.hidden = value;
}

function isTriggerActionUseDefault(action: TriggerAction) {
  return isApplyStatusTriggerAction(action) && action.useDefault === true;
}

function setTriggerActionUseDefault(action: TriggerAction, value: boolean) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.useDefault = value;
}

function getTriggerActionStackingRule(action: TriggerAction): TriggerStatusStackingRule {
  if (!isApplyStatusTriggerAction(action)) {
    return "default";
  }
  return action.stackingRule ?? "default";
}

function setTriggerActionStackingRule(action: TriggerAction, value: string) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  action.stackingRule = value === "additive" || value === "replace" ? value : "default";
}

function getTriggerActionStatEntries(action: TriggerAction) {
  if (!isApplyStatusTriggerAction(action)) {
    return [];
  }
  if (!Array.isArray(action.statEntries)) {
    action.statEntries = [];
  }
  return action.statEntries;
}

function addTriggerActionStatEntry(action: TriggerAction) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  getTriggerActionStatEntries(action).push({
    statKind: "modifier",
    statKey: MODIFIER_STAT_KEYS[0]!,
    value: { type: "number_literal", value: 0 },
  });
}

function removeTriggerActionStatEntry(action: TriggerAction, index: number) {
  if (!isApplyStatusTriggerAction(action)) {
    return;
  }
  getTriggerActionStatEntries(action).splice(index, 1);
}

function getTriggerActionStatEntryKind(action: TriggerAction, index: number): "modifier" | "basic" {
  return getTriggerActionStatEntries(action)[index]?.statKind === "basic" ? "basic" : "modifier";
}

function setTriggerActionStatEntryKind(action: TriggerAction, index: number, value: string) {
  const entry = getTriggerActionStatEntries(action)[index];
  if (!entry) {
    return;
  }
  entry.statKind = value === "basic" ? "basic" : "modifier";
  entry.statKey = entry.statKind === "basic"
    ? "ATK"
    : MODIFIER_STAT_KEYS[0]!;
}

function getTriggerActionStatEntryKey(action: TriggerAction, index: number) {
  return String(getTriggerActionStatEntries(action)[index]?.statKey ?? "");
}

function setTriggerActionStatEntryKey(action: TriggerAction, index: number, value: string) {
  const entry = getTriggerActionStatEntries(action)[index];
  if (!entry) {
    return;
  }
  if (entry.statKind === "basic") {
    entry.statKey = value === "HP" ? "HP" : "ATK";
  } else {
    entry.statKey = MODIFIER_STAT_KEYS.find((key) => key === value) ?? MODIFIER_STAT_KEYS[0]!;
  }
}

function getTriggerActionStatEntryValueMode(action: TriggerAction, index: number) {
  const expression = getTriggerActionStatEntries(action)[index]?.value;
  return expression?.type === "variable_ref" ? "variable" : "literal";
}

function setTriggerActionStatEntryValueMode(action: TriggerAction, index: number, mode: string) {
  const entry = getTriggerActionStatEntries(action)[index];
  if (!entry) {
    return;
  }
  entry.value = mode === "variable"
    ? { type: "variable_ref", variableId: getTriggerVariablesByType("number")[0]?.id ?? "", variableType: "number" }
    : { type: "number_literal", value: 0 };
}

function getTriggerActionStatEntryValueNumber(action: TriggerAction, index: number) {
  const expression = getTriggerActionStatEntries(action)[index]?.value;
  return expression?.type === "number_literal" ? expression.value : 0;
}

function setTriggerActionStatEntryValueNumber(action: TriggerAction, index: number, value: number) {
  const entry = getTriggerActionStatEntries(action)[index];
  if (!entry) {
    return;
  }
  entry.value = { type: "number_literal", value: Number.isFinite(value) ? value : 0 };
}

function getTriggerActionStatEntryValueVariableId(action: TriggerAction, index: number) {
  const expression = getTriggerActionStatEntries(action)[index]?.value;
  return expression?.type === "variable_ref" ? expression.variableId : (getTriggerVariablesByType("number")[0]?.id ?? "");
}

function setTriggerActionStatEntryValueVariableId(action: TriggerAction, index: number, variableId: string) {
  const entry = getTriggerActionStatEntries(action)[index];
  if (!entry) {
    return;
  }
  entry.value = { type: "variable_ref", variableId, variableType: "number" };
}

function isReplaceEnemyTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "REPLACE_ENEMY" }> {
  return action.type === "REPLACE_ENEMY";
}

function isModifyHpTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "MODIFY_HP" }> {
  return action.type === "MODIFY_HP";
}

function isSetTargetEnemyTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "SET_TARGET_ENEMY" }> {
  return action.type === "SET_TARGET_ENEMY";
}

function isExecuteHitTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "EXECUTE_HIT" }> {
  return action.type === "EXECUTE_HIT";
}

function isWaitTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "WAIT" }> {
  return action.type === "WAIT";
}

function isCountdownTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "COUNTDOWN" }> {
  return action.type === "COUNTDOWN";
}

function isSetTriggerEnabledAction(action: TriggerAction): action is Extract<TriggerAction, { type: "SET_TRIGGER_ENABLED" }> {
  return action.type === "SET_TRIGGER_ENABLED";
}

function isStopTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "STOP_TRIGGER" }> {
  return action.type === "STOP_TRIGGER";
}

function getTriggerActionEnemyId(action: TriggerAction) {
  if (!isReplaceEnemyTriggerAction(action) || action.enemyId.type !== "enemy_id_literal") {
    return props.enemies[0]?.id ?? "rhodagn";
  }
  return action.enemyId.enemyId;
}

function setTriggerActionEnemyId(action: TriggerAction, enemyId: string) {
  if (!isReplaceEnemyTriggerAction(action)) {
    return;
  }
  action.enemyId = {
    type: "enemy_id_literal",
    enemyId,
  };
}

function isTriggerActionResetHp(action: TriggerAction) {
  return isReplaceEnemyTriggerAction(action)
    ? (action.resetHp.type === "boolean_literal" ? action.resetHp.value : true)
    : true;
}

function setTriggerActionResetHp(action: TriggerAction, value: boolean) {
  if (!isReplaceEnemyTriggerAction(action)) {
    return;
  }
  action.resetHp = {
    type: "boolean_literal",
    value,
  };
}

function getTriggerActionReplaceEnemyLevel(action: TriggerAction) {
  return isReplaceEnemyTriggerAction(action)
    ? (action.level.type === "number_literal" ? action.level.value : 90)
    : 90;
}

function setTriggerActionReplaceEnemyLevel(action: TriggerAction, value: number) {
  if (!isReplaceEnemyTriggerAction(action)) {
    return;
  }
  action.level = {
    type: "number_literal",
    value: Math.max(1, Math.round(Number.isFinite(value) ? value : 90)),
  };
}

function isTriggerActionReplaceEnemyNoDeath(action: TriggerAction) {
  return isReplaceEnemyTriggerAction(action)
    ? (action.noDeath.type === "boolean_literal" ? action.noDeath.value : false)
    : false;
}

function setTriggerActionReplaceEnemyNoDeath(action: TriggerAction, value: boolean) {
  if (!isReplaceEnemyTriggerAction(action)) {
    return;
  }
  action.noDeath = {
    type: "boolean_literal",
    value,
  };
}

function getTriggerActionPrimarySummary(action: TriggerAction) {
  if (action.type === "REPLACE_ENEMY") {
    const enemyId = getTriggerActionEnemyId(action);
    const enemy = props.enemies.find((entry) => entry.id === enemyId);
    if (!enemy) {
      return enemyId;
    }
    return `${getEnemyDisplayName(enemy.id, enemy.name, locale.value as "en" | "zh-CN")} Lv${getTriggerActionReplaceEnemyLevel(action)}`;
  }
  if (action.type === "MODIFY_HP") {
    const amount = action.amount.type === "number_literal" ? action.amount.value : 0;
    return `${action.operation === "heal" ? (locale.value === "zh-CN" ? "治疗" : "Heal") : (locale.value === "zh-CN" ? "伤害" : "Damage")} ${amount}`;
  }
  if (action.type === "MODIFY_VARIABLE") {
    const variable = activeTriggerVariables.value.find((entry) => entry.id === action.variableId);
    return locale.value === "zh-CN"
      ? `${action.operation} ${variable?.name ?? action.variableId}`
      : `${action.operation} ${variable?.name ?? action.variableId}`;
  }
  if (action.type === "SET_TARGET_ENEMY") {
    return locale.value === "zh-CN" ? "切换目标敌人" : "Set Target Enemy";
  }
  if (action.type === "WAIT") {
    const duration = action.durationSeconds.type === "number_literal" ? action.durationSeconds.value : 0;
    return locale.value === "zh-CN" ? `等待 ${duration}s` : `Wait ${duration}s`;
  }
  if (action.type === "COUNTDOWN") {
    const duration = action.durationSeconds.type === "number_literal" ? action.durationSeconds.value : 0;
    return locale.value === "zh-CN" ? `倒计时 ${duration}s` : `Countdown ${duration}s`;
  }
  if (action.type === "SET_TRIGGER_ENABLED") {
    const target = action.target.type === "self"
      ? (locale.value === "zh-CN" ? "本触发器" : "This Trigger")
      : (locale.value === "zh-CN" ? `触发器槽位 ${action.target.slotNumber}` : `Trigger Slot ${action.target.slotNumber}`);
    const op = action.operation === "enable"
      ? (locale.value === "zh-CN" ? "启用" : "Enable")
      : (locale.value === "zh-CN" ? "禁用" : "Disable");
    return `${op} ${target}`;
  }
  if (action.type === "STOP_TRIGGER") {
    const target = action.target.type === "self"
      ? (locale.value === "zh-CN" ? "本触发器" : "This Trigger")
      : (locale.value === "zh-CN" ? `触发器槽位 ${action.target.slotNumber}` : `Trigger Slot ${action.target.slotNumber}`);
    return locale.value === "zh-CN" ? `停止 ${target}` : `Stop ${target}`;
  }
  if (action.type === "BREAK") {
    return locale.value === "zh-CN" ? "中断当前实例" : "Break Current Instance";
  }
  if (action.type === "IF_THEN_ELSE") {
    return locale.value === "zh-CN" ? "条件分支" : "Conditional Branch";
  }
  if (action.type === "FIRE_TRIGGER") {
    const target = action.target.type === "self"
      ? (locale.value === "zh-CN" ? "本触发器" : "This Trigger")
      : (locale.value === "zh-CN" ? `触发器槽位 ${action.target.slotNumber}` : `Trigger Slot ${action.target.slotNumber}`);
    return locale.value === "zh-CN" ? `触发 ${target}` : `Fire ${target}`;
  }
  if (action.type === "EXECUTE_HIT") {
    return action.hitName;
  }
  return getTriggerStatusLabel(getTriggerActionStatusId(action));
}

function getTriggerActionHpOperation(action: TriggerAction) {
  return isModifyHpTriggerAction(action) ? action.operation : "damage";
}

function setTriggerActionHpOperation(action: TriggerAction, operation: "damage" | "heal") {
  if (!isModifyHpTriggerAction(action)) {
    return;
  }
  action.operation = operation;
}

function getTriggerActionHpAmount(action: TriggerAction) {
  return isModifyHpTriggerAction(action) && action.amount.type === "number_literal" ? action.amount.value : 0;
}

function setTriggerActionHpAmount(action: TriggerAction, value: number) {
  if (!isModifyHpTriggerAction(action)) {
    return;
  }
  action.amount = {
    type: "number_literal",
    value: Math.max(0, Number.isFinite(value) ? value : 0),
  };
}

function getTriggerActionExecuteHitName(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) ? action.hitName : "Execute Hit";
}

function setTriggerActionExecuteHitName(action: TriggerAction, value: string) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.hitName = value.trim() || "Execute Hit";
}

function getTriggerActionExecuteHitAttackType(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) ? action.attackType : "BATTLE_SKILL";
}

function setTriggerActionExecuteHitAttackType(action: TriggerAction, value: "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE" | "TALENT" | "REACTION" | "GENERIC") {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.attackType = value;
}

function getTriggerActionExecuteHitDamageType(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) ? action.damageType : "Physical";
}

function setTriggerActionExecuteHitDamageType(action: TriggerAction, value: "Physical" | "Heat" | "Cryo" | "Electric" | "Nature" | "Aether") {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.damageType = value;
}

function getTriggerActionExecuteHitTargets(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) ? action.targets : "targeted_enemy";
}

function setTriggerActionExecuteHitTargets(action: TriggerAction, value: "targeted_enemy" | "all_enemies" | "finisher") {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.targets = value;
}

function getTriggerActionExecuteHitSource(action: TriggerAction) {
  if (!isExecuteHitTriggerAction(action)) {
    return "event_operator";
  }
  return action.source.type === "controlled_operator" ? "controlled_operator" : action.source.type === "current_operator" ? "current_operator" : "event_operator";
}

function setTriggerActionExecuteHitSource(action: TriggerAction, value: "event_operator" | "controlled_operator" | "current_operator") {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.source = value === "controlled_operator"
    ? { type: "controlled_operator" }
    : value === "current_operator"
      ? { type: "current_operator" }
      : { type: "alias_operator", alias: "event_operator" };
}

function getTriggerActionExecuteHitMultiplier(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) && action.multiplier.type === "number_literal" ? action.multiplier.value : 1;
}

function setTriggerActionExecuteHitMultiplier(action: TriggerAction, value: number) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.multiplier = { type: "number_literal", value: Number.isFinite(value) ? value : 1 };
}

function getTriggerActionExecuteHitFlatAmount(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) && action.flatAmount.type === "number_literal" ? action.flatAmount.value : 0;
}

function setTriggerActionExecuteHitFlatAmount(action: TriggerAction, value: number) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.flatAmount = { type: "number_literal", value: Number.isFinite(value) ? value : 0 };
}

function getTriggerActionExecuteHitStagger(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) && action.stagger.type === "number_literal" ? action.stagger.value : 0;
}

function setTriggerActionExecuteHitStagger(action: TriggerAction, value: number) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.stagger = { type: "number_literal", value: Number.isFinite(value) ? value : 0 };
}

function isTriggerActionExecuteHitNoCrit(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) && action.noCrit === true;
}

function setTriggerActionExecuteHitNoCrit(action: TriggerAction, value: boolean) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.noCrit = value;
}

function isTriggerActionExecuteHitIgnoreInvuln(action: TriggerAction) {
  return isExecuteHitTriggerAction(action) && action.ignoreEnemyInvulnerability === true;
}

function setTriggerActionExecuteHitIgnoreInvuln(action: TriggerAction, value: boolean) {
  if (!isExecuteHitTriggerAction(action)) {
    return;
  }
  action.ignoreEnemyInvulnerability = value;
}

function getTriggerActionWaitSeconds(action: TriggerAction) {
  return (isWaitTriggerAction(action) || isCountdownTriggerAction(action)) && action.durationSeconds.type === "number_literal"
    ? action.durationSeconds.value
    : 0;
}

function setTriggerActionWaitSeconds(action: TriggerAction, value: number) {
  if (!isWaitTriggerAction(action) && !isCountdownTriggerAction(action)) {
    return;
  }
  action.durationSeconds = { type: "number_literal", value: Math.max(0, Number.isFinite(value) ? value : 0) };
}

function getTriggerActionEnableOperation(action: TriggerAction) {
  return isSetTriggerEnabledAction(action) ? action.operation : "disable";
}

function setTriggerActionEnableOperation(action: TriggerAction, value: "enable" | "disable") {
  if (!isSetTriggerEnabledAction(action)) {
    return;
  }
  action.operation = value;
}

function getTriggerActionEnableTarget(action: TriggerAction) {
  if (!isSetTriggerEnabledAction(action) && !isStopTriggerAction(action)) {
    return "self";
  }
  return action.target.type === "trigger_in_slot" ? "trigger_in_slot" : "self";
}

function setTriggerActionEnableTarget(action: TriggerAction, value: "self" | "trigger_in_slot") {
  if (!isSetTriggerEnabledAction(action) && !isStopTriggerAction(action)) {
    return;
  }
  action.target = value === "trigger_in_slot"
    ? { type: "trigger_in_slot", slotNumber: { type: "number_literal", value: 1 } }
    : { type: "self" };
}

function getTriggerActionEnableTargetSlotNumber(action: TriggerAction) {
  return (isSetTriggerEnabledAction(action) || isStopTriggerAction(action)) && action.target.type === "trigger_in_slot" ? getNumericSourceLiteralValue(action.target.slotNumber) : 1;
}
function getTriggerActionEnableTargetSlotSource(action: TriggerAction): TriggerNumericSource | null {
  return (isSetTriggerEnabledAction(action) || isStopTriggerAction(action)) && action.target.type === "trigger_in_slot" ? action.target.slotNumber : null;
}

function setTriggerActionEnableTargetSlotNumber(action: TriggerAction, value: number) {
  if ((!isSetTriggerEnabledAction(action) && !isStopTriggerAction(action)) || action.target.type !== "trigger_in_slot") {
    return;
  }
  setNumericSourceLiteralValue(action.target.slotNumber, value);
}

function isModifyVariableTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "MODIFY_VARIABLE" }> {
  return action.type === "MODIFY_VARIABLE";
}

function getTriggerActionVariableId(action: TriggerAction) {
  return isModifyVariableTriggerAction(action) ? action.variableId : getDefaultTriggerVariableId("number");
}

function setTriggerActionVariableId(action: TriggerAction, variableId: string) {
  if (!isModifyVariableTriggerAction(action)) return;
  const variable = activeTriggerVariables.value.find((entry) => entry.id === variableId);
  const type = variable?.type ?? "number";
  action.variableId = variableId;
  action.variableType = type;
  action.value =
    type === "string"
      ? { type: "string_literal", value: "" }
      : type === "boolean"
        ? { type: "boolean_literal", value: false }
        : { type: "number_literal", value: 0 };
  if (action.operation !== "set" && type !== "number") {
    action.operation = "set";
  }
}

function getTriggerActionVariableOperation(action: TriggerAction) {
  return isModifyVariableTriggerAction(action) ? action.operation : "set";
}

function setTriggerActionVariableOperation(action: TriggerAction, operation: "set" | "add" | "subtract") {
  if (!isModifyVariableTriggerAction(action)) return;
  if (action.variableType !== "number" && operation !== "set") return;
  action.operation = operation;
}

function getTriggerActionVariableValueString(action: TriggerAction) {
  return isModifyVariableTriggerAction(action) && action.value.type === "string_literal" ? action.value.value : "";
}
function setTriggerActionVariableValueString(action: TriggerAction, value: string) {
  if (!isModifyVariableTriggerAction(action)) return;
  action.value = { type: "string_literal", value };
}
function getTriggerActionVariableValueNumber(action: TriggerAction) {
  return isModifyVariableTriggerAction(action) && action.value.type === "number_literal" ? action.value.value : 0;
}
function setTriggerActionVariableValueNumber(action: TriggerAction, value: number) {
  if (!isModifyVariableTriggerAction(action)) return;
  action.value = { type: "number_literal", value: Number.isFinite(value) ? value : 0 };
}
function getTriggerActionVariableValueBoolean(action: TriggerAction) {
  return isModifyVariableTriggerAction(action) && action.value.type === "boolean_literal" ? action.value.value : false;
}
function setTriggerActionVariableValueBoolean(action: TriggerAction, value: boolean) {
  if (!isModifyVariableTriggerAction(action)) return;
  action.value = { type: "boolean_literal", value };
}

function getTriggerConditionSummary(trigger: CustomCombatTrigger) {
  if (!Array.isArray(trigger.conditions) || trigger.conditions.length === 0) {
    return locale.value === "zh-CN" ? "无条件" : "No condition";
  }
  return trigger.conditions.map((entry) => summarizeTriggerConditionNode(entry)).join(" && ");
}

function setTriggerEditorTab(nextTab: "overview" | "conditions" | "actions" | "script") {
  if (triggerEditorTab.value === nextTab) {
    return;
  }
  if (nextTab === "script") {
    syncTriggerScriptFromDraft();
    triggerEditorTab.value = nextTab;
    return;
  }
  if (triggerEditorTab.value === "script" && isTriggerScriptDirty()) {
    const result = applyTriggerScriptToDraft();
    if (!result.ok) {
      openInvalidTriggerScriptPrompt({
        nextTab,
        error: result.error,
      });
      return;
    }
  }
  triggerEditorTab.value = nextTab;
}

const contractsPopupVm = computed(() => ({
  locale: locale.value,
  t,
  visibleContingencyContractColumns: visibleContingencyContractColumns.value,
  highlightedContract: highlightedContract.value,
  contingencyTotalLevel: contingencyTotalLevel.value,
  activeContractSummary: activeContractSummary.value,
  CONTRACT_COLUMN_HEIGHT,
  CONTRACT_CARD_PADDING,
  CONTRACT_LEVEL_ROW_HEIGHT,
  CONTRACT_DISPLAY_LEVELS,
  EMPTY_SELECTION_ICON_PATH,
}));

const stageSettingsVm = computed(() => ({
  locale: locale.value, t, enemies: props.enemies, STAGE_PRESETS,
  activeStageSettings: isActiveSchemeRelayed.value ? displayStageSettings.value : activeStageSettings.value,
  selectedStage: selectedStageDefinition.value,
  customStages: customStages.value,
  isCustom: (isActiveSchemeRelayed.value ? displayStageSettings.value : activeStageSettings.value).mode === "custom",
  isActiveSchemeRelayed: isActiveSchemeRelayed.value,
  stageEditorTab: stageEditorTab.value,
  setStageEditorTab: (value: string) => { if (value === "overview" || value === "enemies" || value === "script") stageEditorTab.value = value; },
  stageOverrideEnemyId: stageOverrideEnemyId.value,
  setStageOverrideEnemyId: (value: string) => { stageOverrideEnemyId.value = value; },
  selectPresetStage, selectCustomStage, addCustomStage, removeCustomStage, enemyDisplayName,
  stageDisplayName: (stage: { name: string; name_cn?: string }) => getStageDisplayName(stage, locale.value as "en" | "zh-CN"),
  updateCustomField: (field: string, value: unknown) => updateSelectedCustomStage((draft) => {
    if (field === "name") draft.name = String(value).trim() || "Custom Stage";
    else if (field === "name_cn") draft.name_cn = String(value).trim() || undefined;
    else if (field === "contractsEnabled") draft.contractsEnabled = value === true;
    else if (field === "initialSp") draft.initialSp = Math.max(0, Number(value) || 0);
    else if (field === "spRegenRate") draft.spRegenRate = Math.max(0, Number(value) || 0);
    else if (field === "lockInitialEnergy") draft.lockInitialEnergy = value === true;
    else if (field === "initialEnergyPct") draft.initialEnergyPct = Math.max(0, Math.min(100, Number(value) || 0));
    else if (field === "disableConsumables") draft.disableConsumables = value === true;
  }),
  enemyRows: [...new Set([...Object.keys(selectedStageDefinition.value.enemyHpBaseOverrides), ...Object.keys(selectedStageDefinition.value.enemyHpMultipliers)])].map((id) => ({ id, baseHp: selectedStageDefinition.value.enemyHpBaseOverrides[id], multiplier: selectedStageDefinition.value.enemyHpMultipliers[id] })),
  addEnemyOverride: () => { const enemy = props.enemies.find((entry) => entry.id === stageOverrideEnemyId.value); if (enemy) updateSelectedCustomStage((draft) => { draft.enemyHpBaseOverrides[enemy.id] ??= enemy.baseHpLv1; draft.enemyHpMultipliers[enemy.id] ??= 1; }); },
  updateEnemy: (id: string, field: string, value: number) => updateSelectedCustomStage((draft) => { if (field === "baseHp") draft.enemyHpBaseOverrides[id] = Math.max(1, Math.round(value || 1)); else draft.enemyHpMultipliers[id] = Math.max(0.01, value || 1); }),
  removeEnemy: (id: string) => updateSelectedCustomStage((draft) => { delete draft.enemyHpBaseOverrides[id]; delete draft.enemyHpMultipliers[id]; }),
  stageScriptDraft: stageScriptDraft.value, stageScriptStatus: stageScriptStatus.value,
  setStageScript: (value: string) => { stageScriptDraft.value = value; }, copyStageScript, applyStageScript,
}));

const triggersPopupVm = computed(() => ({
  locale: locale.value,
  t,
  triggerListMode: triggerListMode.value,
  activeCustomTriggers: activeCustomTriggers.value,
  activeCustomTriggerVariables: activeCustomTriggerVariables.value,
  activeInternalTriggers: activeInternalTriggers.value,
  activeInternalTriggerVariables: activeInternalTriggerVariables.value,
  activeTriggerVariables: activeTriggerVariables.value,
  selectedCustomTriggerVariable: selectedCustomTriggerVariable.value,
  selectedInternalTrigger: selectedInternalTrigger.value,
  MAX_CUSTOM_TRIGGERS,
  MAX_CUSTOM_TRIGGER_VARIABLES,
  triggerEditorState: triggerEditorState.value,
  triggerEditorTab: triggerEditorTab.value,
  triggerEditorPanel: triggerEditorPanel.value,
  triggerEditorScript: triggerEditorScript.value,
  triggerTransferStatus: triggerTransferStatus.value,
  triggerImportState: triggerImportState.value,
  triggerScriptPromptState: triggerScriptPromptState.value,
  setTriggerEditorScript: (value: string) => { triggerEditorScript.value = value; },
  setTriggerImportScript: (value: string) => { triggerImportState.value.script = value; },
  setTriggerEditorTab,
  setTriggerListMode,
  viewInternalTrigger,
  discardInvalidTriggerScriptChanges,
  cancelInvalidTriggerScriptPrompt,
  beginCreateTrigger,
  beginEditTrigger,
  beginEditTriggerVariable,
  stopEditingTriggerVariable,
  copyTriggerScript,
  copyAllTriggersScript,
  copyText,
  openTriggerImportDialog,
  closeTriggerImportDialog,
  importTriggerScript,
  duplicateTrigger,
  moveTrigger,
  removeTrigger,
  addTriggerVariable,
  removeTriggerVariable,
  duplicateTriggerVariable,
  setTriggerVariableName,
  setTriggerVariableType,
  setTriggerVariableInitialString,
  setTriggerVariableInitialNumber,
  setTriggerVariableInitialBoolean,
  saveTriggerDraft,
  addRootComparatorTriggerCondition,
  addRootLogicTriggerCondition,
  removeRootTriggerCondition,
  moveRootTriggerCondition,
  duplicateRootTriggerCondition,
  addTriggerAction,
  ensureTriggerActions,
  duplicateTriggerAction,
  removeTriggerAction,
  setTriggerActionTypeAt,
  getTriggerEventLabel,
  getTriggerActionLabel,
  getPrimaryTriggerAction,
  getTriggerActionPrimarySummary,
  getTriggerTargetLabel,
  getTriggerActionTargetOption,
  setTriggerActionTargetOption,
  getTriggerConditionSummary,
  isTriggerActionResetHp,
  setTriggerActionResetHp,
  getTriggerActionReplaceEnemyLevel,
  setTriggerActionReplaceEnemyLevel,
  isTriggerActionReplaceEnemyNoDeath,
  setTriggerActionReplaceEnemyNoDeath,
  isTriggerActionPermanent,
  setTriggerActionPermanent,
  isTriggerActionHidden,
  setTriggerActionHidden,
  isTriggerActionUseDefault,
  setTriggerActionUseDefault,
  getTriggerActionStackingRule,
  setTriggerActionStackingRule,
  getTriggerActionStatEntries,
  addTriggerActionStatEntry,
  removeTriggerActionStatEntry,
  getTriggerActionStatEntryKind,
  setTriggerActionStatEntryKind,
  getTriggerActionStatEntryKey,
  setTriggerActionStatEntryKey,
  getTriggerActionStatEntryValueMode,
  setTriggerActionStatEntryValueMode,
  getTriggerActionStatEntryValueNumber,
  setTriggerActionStatEntryValueNumber,
  getTriggerActionStatEntryValueVariableId,
  setTriggerActionStatEntryValueVariableId,
  getTriggerActionDurationMode,
  getTriggerActionDurationValue,
  getTriggerActionDurationVariableId,
  setTriggerActionDurationMode,
  setTriggerActionDurationValue,
  setTriggerActionDurationVariableId,
  getTriggerActionStacksValue,
  setTriggerActionStacksValue,
  getTriggerActionMaxStacksValue,
  setTriggerActionMaxStacksValue,
  isTriggerActionRefreshExistingStacks,
  setTriggerActionRefreshExistingStacks,
  isTriggerActionIndependentStacks,
  setTriggerActionIndependentStacks,
  getTriggerActionStatusId,
  setTriggerActionStatusId,
  getTriggerActionEnemyId,
  setTriggerActionEnemyId,
  getTriggerActionHpOperation,
  setTriggerActionHpOperation,
  getTriggerActionHpAmount,
  setTriggerActionHpAmount,
  getTriggerActionExecuteHitName,
  setTriggerActionExecuteHitName,
  getTriggerActionExecuteHitSource,
  setTriggerActionExecuteHitSource,
  getTriggerActionExecuteHitAttackType,
  setTriggerActionExecuteHitAttackType,
  getTriggerActionExecuteHitDamageType,
  setTriggerActionExecuteHitDamageType,
  getTriggerActionExecuteHitTargets,
  setTriggerActionExecuteHitTargets,
  getTriggerActionExecuteHitMultiplier,
  setTriggerActionExecuteHitMultiplier,
  getTriggerActionExecuteHitFlatAmount,
  setTriggerActionExecuteHitFlatAmount,
  getTriggerActionExecuteHitStagger,
  setTriggerActionExecuteHitStagger,
  isTriggerActionExecuteHitNoCrit,
  setTriggerActionExecuteHitNoCrit,
  isTriggerActionExecuteHitIgnoreInvuln,
  setTriggerActionExecuteHitIgnoreInvuln,
  getTriggerActionWaitSeconds,
  setTriggerActionWaitSeconds,
  getTriggerActionEnableOperation,
  setTriggerActionEnableOperation,
  getTriggerActionEnableTarget,
  setTriggerActionEnableTarget,
  getTriggerActionEnableTargetSlotNumber,
  getTriggerActionEnableTargetSlotSource,
  setTriggerActionEnableTargetSlotNumber,
  getTriggerActionVariableId,
  setTriggerActionVariableId,
  getTriggerActionVariableOperation,
  setTriggerActionVariableOperation,
  getTriggerActionVariableValueString,
  setTriggerActionVariableValueString,
  getTriggerActionVariableValueNumber,
  setTriggerActionVariableValueNumber,
  getTriggerActionVariableValueBoolean,
  setTriggerActionVariableValueBoolean,
  getTriggerActionTargetSlotNumber,
  getTriggerActionTargetSlotSource,
  setTriggerActionTargetSlotNumber,
  getTriggerActionTargetGroupIndex,
  getTriggerActionTargetGroupIndexSource,
  setTriggerActionTargetGroupIndex,
  getTriggerVariablesByType,
  getNumericSourceMode,
  setNumericSourceMode,
  getNumericSourceLiteralValue,
  setNumericSourceLiteralValue,
  getNumericSourceVariableId,
  setNumericSourceVariableId,
  getEnemyDisplayName,
  modifierLabel,
  getTriggerStatusBasicStatLabel,
  CUSTOM_TRIGGER_EVENT_OPTIONS,
  CUSTOM_TRIGGER_ACTION_OPTIONS,
  CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS,
  CUSTOM_TRIGGER_STATUS_STACKING_RULE_OPTIONS,
  CUSTOM_TRIGGER_STATUS_BASIC_STAT_OPTIONS,
  CUSTOM_TRIGGER_STATUS_OPTIONS,
  CUSTOM_TRIGGER_TARGET_OPTIONS,
  MODIFIER_STAT_KEYS,
  getCustomTriggerOptionLabel,
  getCustomTriggerOptionDescription,
  triggerEventSupportsAlias,
}));
const commandListExpanded = ref(true);
const statusListExpanded = ref(true);
const enemyTimelineIconBrokenBySlot = ref<Record<string, boolean>>({});
const ENEMY_COMMAND_LABELS_ZH: Record<string, string> = {
  "Dummy Attack": "占位攻击",
  "Opening Attack": "开场攻击",
  "Phase Transition": "阶段切换",
  "Set To Target": "设为目标",
};

function getLocalizedEnemyCommandLabel(label: string) {
  return locale.value === "zh-CN"
    ? (ENEMY_COMMAND_LABELS_ZH[label] ?? label)
    : label;
}

const enemyCommandDefinitions = computed(() =>
  getEnemyCommandDefinitions(selectedEnemyEditorSlot.value?.enemyId ?? targetedEnemyId.value),
);
const enemyCommands = ref<EnemyCommandPlacement[]>([]);

function ensureEnemyCommandsForActiveContext(): EnemyCommandPlacement[] {
  if (!activeScheme.value.enemyCommandsBySlot) {
    activeScheme.value.enemyCommandsBySlot = {};
  }
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  const bySlot = activeScheme.value.enemyCommandsBySlot;

  const existing = bySlot[slotId];
  if (Array.isArray(existing)) {
    return existing;
  }

  const defaults = getDefaultEnemyCommandPlacements(selectedEnemyEditorSlot.value?.enemyId ?? targetedEnemyId.value);
  bySlot[slotId] = defaults.map((entry) => ({ ...entry }));
  return bySlot[slotId]!;
}

function syncEnemyCommandsFromLayouts() {
  enemyCommands.value = ensureEnemyCommandsForActiveContext().map((entry) => ({ ...entry }));
}

watch(
  [() => activeScheme.value.id, () => selectedEnemyEditorSlot.value?.slotId, () => selectedEnemyEditorSlot.value?.enemyId],
  () => {
    syncEnemyCommandsFromLayouts();
  },
  { immediate: true },
);

watch(
  [() => props.enemySlots, () => props.targetedEnemySlotId],
  () => {
    if (!getLogicalEnemySlots().some((slot) => slot.slotId === selectedEnemyEditorSlotId.value)) {
      selectedEnemyEditorSlotId.value = props.targetedEnemySlotId;
    }
  },
  { immediate: true, deep: true },
);

watch(
  enemyCommands,
  (value) => {
    const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
    if (!activeScheme.value.enemyCommandsBySlot) {
      activeScheme.value.enemyCommandsBySlot = {};
    }
    activeScheme.value.enemyCommandsBySlot[slotId] = value.map((entry) => ({ ...entry }));
  },
  { deep: true },
);

const enemyTimelineCommands = computed(() =>
  buildEnemyTimelineCommandsForSlot(selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId),
);

function getEnemyCommandsForSlot(slotId: string): EnemyCommandPlacement[] {
  if (slotId === props.targetedEnemySlotId) {
    return enemyCommands.value;
  }
  if (!activeScheme.value.enemyCommandsBySlot) {
    activeScheme.value.enemyCommandsBySlot = {};
  }
  const existing = activeScheme.value.enemyCommandsBySlot[slotId];
  if (Array.isArray(existing)) {
    return existing;
  }
  const slot = getLogicalEnemySlotById(slotId);
  const enemyId = slot?.enemyId ?? "";
  if (!enemyId) {
    activeScheme.value.enemyCommandsBySlot[slotId] = [];
    return activeScheme.value.enemyCommandsBySlot[slotId]!;
  }
  const defaults = getDefaultEnemyCommandPlacements(enemyId).map((entry) => ({ ...entry }));
  activeScheme.value.enemyCommandsBySlot[slotId] = defaults;
  return activeScheme.value.enemyCommandsBySlot[slotId]!;
}

function buildEnemyTimelineCommandsForSlot(slotId: string) {
  const slot = getLogicalEnemySlotById(slotId);
  const enemyId = slot?.enemyId ?? "";
  const definitions = getEnemyCommandDefinitions(enemyId);
  const definitionById = new Map(definitions.map((entry) => [entry.id, entry]));
  return getEnemyCommandsForSlot(slotId)
    .map((entry) => {
      const definition = definitionById.get(entry.commandId);
      if (!definition) {
        return null;
      }
      const startTime = roundToSnap(entry.startTime);
      return {
        ...entry,
        slotId,
        label: getLocalizedEnemyCommandLabel(definition.label),
        baseLabel: definition.label,
        startTime,
        endTime: startTime + definition.durationSeconds,
        interruptible: definition.interruptible !== false,
        interrupted: definition.interruptible === false ? false : entry.interrupted === true,
        interruptedSpGain:
          definition.interruptible === false || entry.interrupted !== true
            ? 0
            : Math.max(0, Number(entry.interruptedSpGain ?? 0)),
        interruptedStagger:
          definition.interruptible === false || entry.interrupted !== true
            ? 0
            : Math.max(0, Number(entry.interruptedStagger ?? 0)),
      };
    })
    .filter((entry): entry is {
      id: string;
      slotId: string;
      commandId: string;
      label: string;
      baseLabel: string;
      startTime: number;
      endTime: number;
      interruptible: boolean;
      interrupted: boolean;
      interruptedSpGain: number;
      interruptedStagger: number;
    } => entry != null)
    .sort((left, right) => left.startTime - right.startTime);
}

const selectedEnemyCommandSlotId = ref<string | null>(null);
const enemySetupExpanded = ref(false);

const enemyTimelineCommandsForAllSlots = computed(() =>
  Object.fromEntries(visibleEnemySlots.value.map((slot) => [slot.slotId, buildEnemyTimelineCommandsForSlot(slot.slotId)])),
);

watch(
  rotation,
  (value) => {
    const validStepIds = new Set(value.steps.map((step) => step.id));
    selectedStepIds.value = selectedStepIds.value.filter((stepId) => validStepIds.has(stepId));
    if (selectionAnchorId.value && !validStepIds.has(selectionAnchorId.value)) {
      selectionAnchorId.value = selectedStepIds.value[0] ?? null;
    }
  },
  { deep: true, immediate: true },
);

watch(
  enemyTimelineCommands,
  (value) => {
    if (!selectedEnemyCommandId.value) {
      return;
    }
    if (!value.some((entry) => entry.id === selectedEnemyCommandId.value)) {
      selectedEnemyCommandId.value = null;
      selectedEnemyCommandSlotId.value = null;
    }
  },
  { deep: true, immediate: true },
);

watch(
  [() => props.buildId, () => props.historyRevision],
  async () => {
    syncEnemyCommandsFromLayouts();
    setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
    selectionAnchorId.value = rotation.value.steps[0]?.id ?? null;
    selectedEnemyCommandId.value = null;
    selectedEnemyCommandSlotId.value = null;
    await nextTick();
    cursorTime.value = getPreferredInitialCursorTime();
    resetTimelineViewport();
  },
);

watch(
  () => activeScheme.value.id,
  async () => {
    syncEnemyCommandsFromLayouts();
    setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
    selectionAnchorId.value = rotation.value.steps[0]?.id ?? null;
    selectedEnemyCommandId.value = null;
    selectedEnemyCommandSlotId.value = null;
    await nextTick();
    cursorTime.value = getPreferredInitialCursorTime();
    resetTimelineViewport();
  },
);

const partySnapshots = computed(() =>
  slots.value
    .map((slot, index) => buildSnapshot(slot, index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null),
);
const partyVariantsBySlot = computed(() => {
  const out: Partial<Record<PartySlot, CharacterCombatSnapshot[]>> = {};
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

const partyBySlot = computed(() => new Map(partySnapshots.value.map((snapshot) => [snapshot.slot, snapshot])));
const consumableOptions = CONSUMABLES;

function getConsumableIconPath(consumableId: string | null | undefined): string {
  if (!consumableId) {
    return EMPTY_SELECTION_ICON_PATH;
  }
  return toAssetUrl(`/item-icons/usable/${consumableId}.webp`);
}

function selectConsumableForActiveSlot(consumableId: string | null) {
  if (isActiveSchemeRelayed.value) {
    consumablePickerOpen.value = false;
    return;
  }
  teamSpConfig.value.consumableBySlot[selectedLibrarySlot.value] = consumableId;
  consumablePickerOpen.value = false;
}

function getEnemyIconPath(enemyId: string): string {
  if (!enemyId) {
    return EMPTY_SELECTION_ICON_PATH;
  }
  return toAssetUrl(`/item-icons/enemies/${getEnemyIconId(enemyId)}.webp`);
}

function findEnemyById(enemyId: string): EnemyBase | null {
  return props.enemies.find((enemy) => enemy.id === enemyId) ?? null;
}

function getEnemyLocalizedName(enemy: EnemyBase): string {
  return getEnemyDisplayName(enemy.id, enemy.name, locale.value as "en" | "zh-CN");
}

function getEnemyLifecycleMarkerCaption(type: EnemyLifecycleTimelineEntry["type"]): string {
  if (locale.value === "zh-CN") {
    if (type === "spawned") return "敌人出现";
    if (type === "replaced") return "敌人替换";
    if (type === "transformed") return "敌人转变";
    return "敌人被击败";
  }
  if (type === "spawned") return "Enemy Spawned";
  if (type === "replaced") return "Enemy Replaced";
  if (type === "transformed") return "Enemy Transformed";
  return "Enemy Defeated";
}

function makeEnemySlotId(): string {
  for (let slotNumber = 1; slotNumber <= 10; slotNumber += 1) {
    const slotId = `enemy_slot_${slotNumber}`;
    if (!props.enemySlots.some((slot) => slot.slotId === slotId)) {
      return slotId;
    }
  }
  return "enemy_slot_10";
}

function getLogicalEnemySlots() {
  const simulationSlots = simulatedEnemySlots.value ?? [];
  return simulationSlots.length > 0 ? simulationSlots : props.enemySlots;
}

function getLogicalEnemySlotById(slotId: string) {
  return getLogicalEnemySlots().find((slot) => slot.slotId === slotId) ?? null;
}

function isConfiguredEnemySlot(slotId: string) {
  return props.enemySlots.some((slot) => slot.slotId === slotId);
}

function configureEnemySlot(slotId: string, patch: Partial<EnemySlotState> = {}) {
  const existing = props.enemySlots.find((slot) => slot.slotId === slotId);
  if (existing) {
    return existing;
  }
  const logical = getLogicalEnemySlotById(slotId);
  const defaultEnemy = props.enemies.find((enemy) => enemy.id === "rhodagn") ?? props.enemies[0] ?? null;
  const nextSlot: EnemySlotState = {
    slotId,
    enemyId: patch.enemyId ?? logical?.enemyId ?? defaultEnemy?.id ?? "",
    level: patch.level ?? logical?.level ?? 90,
    spawnTimeEnabled: patch.spawnTimeEnabled ?? logical?.spawnTimeEnabled ?? false,
    spawnTime: patch.spawnTime ?? logical?.spawnTime ?? 0,
    noDeath: patch.noDeath ?? logical?.noDeath ?? false,
  };
  emit("update:enemySlots", [...props.enemySlots, nextSlot]);
  return nextSlot;
}

function selectTargetedEnemySlot(slotId: string) {
  if (getLogicalEnemySlots().some((slot) => slot.slotId === slotId)) {
    emit("update:targetedEnemySlotId", slotId);
  }
}

function selectEnemyEditorSlot(slotId: string) {
  const slot = getLogicalEnemySlotById(slotId);
  if (!slot) {
    return;
  }
  selectedEnemyEditorSlotId.value = slotId;
}

function addEnemySlot() {
  if (getLogicalEnemySlots().length >= 10 && props.enemySlots.length >= 10) {
    return;
  }
  const defaultEnemy = props.enemies.find((enemy) => enemy.id === "rhodagn") ?? props.enemies[0];
  if (!defaultEnemy) {
    return;
  }
  const nextUnconfigured = getLogicalEnemySlots().find((slot) => !isConfiguredEnemySlot(slot.slotId));
  const nextSlot = nextUnconfigured ?? {
    slotId: makeEnemySlotId(),
    enemyId: "",
    level: 90,
    spawnTimeEnabled: false,
    spawnTime: 0,
    noDeath: false,
  };
  configureEnemySlot(nextSlot.slotId, {
    enemyId: defaultEnemy.id,
    level: nextSlot.level,
    spawnTimeEnabled: nextSlot.spawnTimeEnabled,
    spawnTime: nextSlot.spawnTime,
    noDeath: nextSlot.noDeath,
  });
  selectedEnemyEditorSlotId.value = nextSlot.slotId;
  sidebarMode.value = "enemy";
}

function updateEnemySlot(slotId: string, patch: Partial<EnemySlotState>) {
  if (!isConfiguredEnemySlot(slotId)) {
    configureEnemySlot(slotId, patch);
    return;
  }
  emit("update:enemySlots", props.enemySlots.map((slot) => (
    slot.slotId === slotId
      ? { ...slot, ...patch }
      : slot
  )));
}

function removeEnemySlot(slotId: string) {
  if (props.enemySlots.length <= 1) {
    return;
  }
  const currentIndex = props.enemySlots.findIndex((slot) => slot.slotId === slotId);
  if (currentIndex < 0) {
    return;
  }
  const nextSlots = props.enemySlots.filter((slot) => slot.slotId !== slotId);
  emit("update:enemySlots", nextSlots);
  if (props.targetedEnemySlotId === slotId) {
    const fallbackSlot = nextSlots[Math.max(0, currentIndex - 1)] ?? nextSlots[0];
    if (fallbackSlot) {
      emit("update:targetedEnemySlotId", fallbackSlot.slotId);
    }
  }
}

function selectEnemy(enemyId: string) {
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  if (!activeScheme.value.enemyCommandsBySlot) {
    activeScheme.value.enemyCommandsBySlot = {};
  }
  activeScheme.value.enemyCommandsBySlot[slotId] = getDefaultEnemyCommandPlacements(enemyId).map((entry) => ({ ...entry }));
  if (!isConfiguredEnemySlot(slotId)) {
    configureEnemySlot(slotId, { enemyId });
  } else {
    emit("update:enemySlots", props.enemySlots.map((slot) =>
      slot.slotId === slotId
        ? { ...slot, enemyId }
        : slot,
    ));
  }
  if (slotId === props.targetedEnemySlotId) {
    emit("update:selectedEnemyId", enemyId);
  }
  enemyPickerOpen.value = false;
}

const selectedEnemyEditorLevel = computed(() =>
  selectedEnemyEditorSlot.value?.level
  ?? props.enemySlots.find((slot) => slot.slotId === props.targetedEnemySlotId)?.level
  ?? props.enemyLevel,
);

const selectedEnemySpawnTimeEnabled = computed(() =>
  selectedEnemyEditorSlot.value?.spawnTimeEnabled === true,
);

const selectedEnemySpawnTime = computed(() =>
  selectedEnemyEditorSlot.value?.spawnTime ?? 0,
);

const selectedEnemyNoDeath = computed(() =>
  selectedEnemyEditorSlot.value?.noDeath === true,
);

function updateSelectedEnemyLevel(value: number) {
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  updateEnemySlot(slotId, {
    level: Math.max(1, Math.min(100, Math.round(value))),
  });
  if (slotId === props.targetedEnemySlotId) {
    emit("update:enemyLevel", Math.max(1, Math.min(100, Math.round(value))));
  }
}

function updateSelectedEnemySpawnTimeEnabled(enabled: boolean) {
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  updateEnemySlot(slotId, {
    spawnTimeEnabled: enabled,
    spawnTime: enabled ? Math.round((selectedEnemySpawnTime.value ?? 0) * 1000) / 1000 : 0,
  });
}

function updateSelectedEnemySpawnTime(value: number) {
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  updateEnemySlot(slotId, {
    spawnTimeEnabled: true,
    spawnTime: Math.round((Number.isFinite(value) ? value : 0) * 1000) / 1000,
  });
}

function updateSelectedEnemyNoDeath(enabled: boolean) {
  const slotId = selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId;
  updateEnemySlot(slotId, {
    noDeath: enabled,
  });
}

const libraryCharacter = computed(() => partyBySlot.value.get(selectedLibrarySlot.value) ?? null);
const visibleLibraryCommands = computed(() =>
  sidebarMode.value === "character"
    ? (libraryCharacter.value?.commands ?? []).filter((command) => !command.hiddenInLibrary)
    : [],
);
const selectedSidebarTitle = computed(() =>
  sidebarMode.value === "enemy"
    ? (currentEnemyData.value ? getEnemyLocalizedName(currentEnemyData.value) : t("enemy.noEnemy"))
    : getLocalizedCharacterName(libraryCharacter.value?.characterId, libraryCharacter.value?.characterName)
      || t("builder.slot", { index: selectedLibrarySlot.value + 1 }),
);
function getEnemyStateForSlot(slotId: string) {
  return getEnemyStateAtTime(simulation.value, cursorTime.value, slotId);
}

const currentEnemyState = computed(() =>
  getEnemyStateForSlot(selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId),
);
function getEnemyDataForSlot(slotId: string) {
  const state = getEnemyStateForSlot(slotId);
  return props.enemies.find((enemy) => enemy.id === state.enemyId)
    ?? props.enemies.find((enemy) => enemy.id === (getLogicalEnemySlotById(slotId)?.enemyId ?? ""))
    ?? null;
}

function getEnemyDisplayedMaxHpForSlot(slotId: string) {
  return Math.max(1, getEnemyStateForSlot(slotId).maxHp);
}

function getEnemyDisplayedHpForSlot(slotId: string) {
  return Math.max(0, getEnemyStateForSlot(slotId).currentHp);
}

function getEnemySpawnTimeForSlot(slotId: string) {
  const slot = getLogicalEnemySlotById(slotId);
  if (!slot || slot.spawnTimeEnabled !== true) {
    return null;
  }
  return slot.spawnTime ?? 0;
}

function hasEnemySpawnTimeForSlot(slotId: string) {
  return getEnemySpawnTimeForSlot(slotId) != null;
}

function isEnemyPresentForSlot(slotId: string) {
  return getEnemyStateForSlot(slotId).isPresent !== false;
}

function isEnemyDeadForSlot(slotId: string) {
  return getEnemyStateForSlot(slotId).isDead === true;
}

function isEnemyInactiveForSlot(slotId: string) {
  return !isEnemyPresentForSlot(slotId);
}

function getEnemyDeadTimeForSlot(slotId: string) {
  const deadAt = getEnemyStateForSlot(slotId).deadAt;
  return typeof deadAt === "number" && Number.isFinite(deadAt) ? deadAt : null;
}

function getEnemyLifecycleLabel(slotId: string) {
  const deadAt = getEnemyDeadTimeForSlot(slotId);
  if (deadAt != null) {
    return t("enemy.deadAt", { value: toDisplayedRealTime(deadAt).toFixed(1) });
  }
  const spawnTime = getEnemySpawnTimeForSlot(slotId);
  if (spawnTime != null && !isEnemyPresentForSlot(slotId)) {
    return t("enemy.spawnsAt", { value: spawnTime.toFixed(1) });
  }
  return "";
}

function getEnemyStaggerNodePercentsForSlot(slotId: string) {
  const state = getEnemyStateForSlot(slotId);
  const gauge = Math.max(1, state.staggerGauge);
  return (state.staggerNodes ?? [])
    .map((node) => (node > 0 && node <= 1 ? node : node / gauge))
    .filter((node) => node > 0 && node < 1)
    .sort((a, b) => a - b);
}

function getEnemyStaggerSectionsForSlot(slotId: string) {
  const state = getEnemyStateForSlot(slotId);
  const currentFraction = Math.max(0, Math.min(1, state.currentStagger / Math.max(1, state.staggerGauge)));
  const bounds = [0, ...getEnemyStaggerNodePercentsForSlot(slotId), 1];
  return bounds.slice(0, -1).map((start, index) => {
    const end = bounds[index + 1] ?? 1;
    const span = Math.max(0.0001, end - start);
    const fill = Math.max(0, Math.min(1, (currentFraction - start) / span));
    return {
      start,
      end,
      fill,
    };
  });
}

function isTargetedEnemySlot(slotId: string) {
  return props.targetedEnemySlotId === slotId;
}

const currentEnemyData = computed(() =>
  getEnemyDataForSlot(selectedEnemyEditorSlot.value?.slotId ?? props.targetedEnemySlotId)
  ?? selectedEnemyData.value,
);

type GroupedStatusDisplayItem = {
  id: string;
  label: string;
  details?: string;
  stackCount: number;
  shortestRemainingSeconds: number;
  modifierEntries: Array<{
    key: ModifierStatKey;
    label: string;
    value: number;
    isPercent: boolean;
  }>;
};

type RawStatusDisplayItem = {
  label: string;
  details?: string;
  remainingSeconds: number;
  modifierEntries?: Array<{
    key: ModifierStatKey;
    label: string;
    value: number;
    isPercent: boolean;
  }>;
};

function buildModifierEntriesFromEffects(effects: Partial<ModifierStats> | undefined) {
  if (!effects) {
    return [] as RawStatusDisplayItem["modifierEntries"];
  }
  return Object.entries(effects)
    .filter(([, value]) => typeof value === "number" && Math.abs(value) > 1e-9)
    .map(([key, value]) => ({
      key: key as ModifierStatKey,
      label: modifierLabel(key as ModifierStatKey),
      value: value as number,
      isPercent: key.endsWith("_PCT"),
    }));
}

function modifierLabel(key: ModifierStatKey) {
  void locale.value;
  const localized = t(`modifiers.${key}` as const);
  return localized.startsWith("modifiers.") ? (modifierLabels[key] ?? key) : localized;
}

function getTriggerStatusBasicStatLabel(key: "ATK" | "HP") {
  return key === "ATK"
    ? (locale.value === "zh-CN" ? "攻击力" : "ATK")
    : (locale.value === "zh-CN" ? "生命值" : "HP");
}

function groupStatusItems(items: RawStatusDisplayItem[]): GroupedStatusDisplayItem[] {
  const grouped = new Map<string, GroupedStatusDisplayItem>();

  for (const item of items) {
    const key = item.label;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        id: key,
        label: item.label,
        details: item.details,
        stackCount: 1,
        shortestRemainingSeconds: item.remainingSeconds,
        modifierEntries: [...(item.modifierEntries ?? [])],
      });
      continue;
    }

    existing.stackCount += 1;
    existing.shortestRemainingSeconds = Math.min(existing.shortestRemainingSeconds, item.remainingSeconds);

    if (item.details) {
      const detailSet = new Set(
        [existing.details, item.details]
          .filter((value): value is string => Boolean(value))
          .flatMap((value) => value.split(" · ").map((part) => part.trim()).filter(Boolean)),
      );
      existing.details = Array.from(detailSet).join(" · ");
    }

    if ((item.modifierEntries?.length ?? 0) > 0) {
      const byKey = new Map(existing.modifierEntries.map((entry) => [entry.key, entry]));
      for (const entry of item.modifierEntries ?? []) {
        const current = byKey.get(entry.key);
        if (!current) {
          byKey.set(entry.key, { ...entry });
          continue;
        }
        current.value += entry.value;
      }
      existing.modifierEntries = Array.from(byKey.values());
    }
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      modifierEntries: [...entry.modifierEntries].sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const libraryCharacterStatuses = computed<GroupedStatusDisplayItem[]>(() => {
  const cursorGameTime = cursorCombatState.value.cursorGameTime;
  if (sidebarMode.value === "enemy") {
    const items: RawStatusDisplayItem[] = [];
    for (const debuff of currentEnemyState.value.activeDebuffs) {
      const debuffName = localizeStatusOrBuffLabel(debuff.label) || modifierLabel(debuff.stat);
      const remainingSeconds = Math.max(
        0,
        debuff.expiresAt - (debuff.timeScale === "real" ? cursorTime.value : cursorGameTime),
      );
      items.push({
        label: debuffName,
        details: `${(debuff.value * 100).toFixed(1)}%`,
        remainingSeconds,
        modifierEntries: [{
          key: debuff.stat,
          label: modifierLabel(debuff.stat),
          value: debuff.value,
          isPercent: debuff.stat.endsWith("_PCT"),
        }],
      });
    }
    for (const status of currentEnemyState.value.activeStatuses) {
      if (status.hidden) {
        continue;
      }
      const remainingSeconds = Math.max(
        0,
        status.expiresAt - (status.timeScale === "real" ? cursorTime.value : cursorGameTime),
      );
      items.push({
        label: localizeStatusOrBuffLabel(status.label),
        details: typeof status.stacks === "number" ? t("rotation.stacks", { count: status.stacks }) : undefined,
        remainingSeconds,
      });
    }
    if (currentEnemyState.value.artsInfliction) {
      items.push({
        label: t("rotation.infliction", {
          element: getLocalizedInflictionElementLabel(currentEnemyState.value.artsInfliction.element),
        }),
        details: t("rotation.stacks", { count: currentEnemyState.value.artsInfliction.stacks }),
        remainingSeconds: Math.max(0, currentEnemyState.value.artsInfliction.expiresAtGameTime - cursorGameTime),
      });
    }

    const grouped = groupStatusItems(items);
    if (grouped.length === 0) {
      return [{
        id: "none",
        label: t("rotation.noActiveEnemyStatuses"),
        stackCount: 1,
        shortestRemainingSeconds: 0,
        modifierEntries: [],
      }];
    }

    return grouped;
  }

  const actor = libraryCharacter.value;
  if (!actor) {
    return [];
  }

  const items: RawStatusDisplayItem[] = [];
  const actorState = getActorStateAtTime(simulation.value, actor.slot, cursorTime.value);
  for (const buff of actorState.activeBuffs) {
    if (buff.hidden) {
      continue;
    }
    const remainingSeconds = Math.max(
      0,
      buff.expiresAt - (buff.timeScale === "real" ? cursorTime.value : cursorGameTime),
    );
    items.push({
      label: localizeStatusOrBuffLabel(buff.label),
      remainingSeconds,
      modifierEntries: buildModifierEntriesFromEffects(buff.effects),
    });
  }

  for (const status of actorState.activeTeamStatuses) {
    const remainingSeconds = Math.max(
      0,
      status.expiresAt - (status.timeScale === "real" ? cursorTime.value : cursorGameTime),
    );
    items.push({
      label: localizeStatusOrBuffLabel(status.label),
      remainingSeconds,
    });
  }

  for (const status of actorState.activeStatuses) {
    if (status.hidden) {
      continue;
    }
    const remainingSeconds = Math.max(
      0,
      status.expiresAt - (status.timeScale === "real" ? cursorTime.value : cursorGameTime),
    );
    items.push({
      label: localizeStatusOrBuffLabel(status.label),
      details: typeof status.stacks === "number" ? t("rotation.stacks", { count: status.stacks }) : undefined,
      remainingSeconds,
    });
  }

  if (actorState.meltingFlameStacks > 0) {
    items.push({
      label: t("rotation.meltingFlame"),
      details: actorState.meltingFlameStacks >= 4 ? t("rotation.full") : `${actorState.meltingFlameStacks}/4`,
      remainingSeconds: Number.POSITIVE_INFINITY,
    });
  }

  const grouped = groupStatusItems(items);
  if (grouped.length === 0) {
    return [{
      id: "none",
      label: t("rotation.noActiveBuffsOrStatuses"),
      stackCount: 1,
      shortestRemainingSeconds: 0,
      modifierEntries: [],
    }];
  }

  return grouped;
});

const selectedStatusDetails = ref<GroupedStatusDisplayItem | null>(null);

function openStatusDetails(item: GroupedStatusDisplayItem) {
  if (item.id === "none" || item.modifierEntries.length === 0) {
    return;
  }
  selectedStatusDetails.value = item;
}

function getCommandStateAtTime(
  slot: PartySlot,
  realTime: number,
  simulationResult: RotationSimulationResult = simulation.value,
): {
  activeBuffIds: string[];
  meltingFlameStacks: number;
  finisherAvailable: boolean;
  enemyStatusIds: string[];
  canUseFinisherTransform: boolean;
} {
  const actorState = getActorStateAtTime(simulationResult, slot, realTime);
  const targetedEnemySlotIdAtTime = getActiveTargetedEnemySlotAtRealTime(realTime, simulationResult);
  const enemyState = getEnemyStateAtTime(simulationResult, realTime, targetedEnemySlotIdAtTime);
  const controlState = getControlStateAtRealTime(realTime, simulationResult);
  const activeBuffIds = Array.from(new Set(
    actorState.activeBuffs.flatMap((buff) => {
      const baseId = buff.id.split(":")[0] ?? buff.id;
      return baseId === buff.id ? [buff.id] : [buff.id, baseId];
    }),
  ));
  return {
    activeBuffIds,
    meltingFlameStacks: actorState.meltingFlameStacks,
    finisherAvailable: getLogicalEnemySlots().some((enemySlot) =>
      getEnemyStateAtTime(simulationResult, realTime, enemySlot.slotId).activeStatuses.some(
        (status) => status.id === ENEMY_FINISHER_AVAILABLE_STATUS_ID,
      )),
    enemyStatusIds: Array.from(new Set(enemyState.activeStatuses.map((status) => status.id))),
    canUseFinisherTransform: controlState.controlledSlot === slot,
  };
}

const rotationGroups = computed(() => rotation.value.groups ?? []);

function getGroupById(groupId: string | undefined) {
  return groupId ? rotationGroups.value.find((group) => group.id === groupId) ?? null : null;
}

function getGroupedStepIds(stepId: string): string[] {
  const step = rotation.value.steps.find((entry) => entry.id === stepId);
  if (!step?.groupId) {
    return step ? [step.id] : [];
  }

  return rotation.value.steps
    .filter((entry) => entry.groupId === step.groupId)
    .map((entry) => entry.id);
}

function normalizeSelection(stepIds: string[]): string[] {
  return Array.from(new Set(stepIds.flatMap((stepId) => getGroupedStepIds(stepId))));
}

function setSelectedStepIds(stepIds: string[], anchorId: string | null = stepIds[0] ?? null) {
  selectedStepIds.value = normalizeSelection(stepIds);
  selectionAnchorId.value = anchorId;
  if (selectedStepIds.value.length > 0) {
    selectedEnemyCommandId.value = null;
    selectedEnemyCommandSlotId.value = null;
  }
}

const selectedSteps = computed(() =>
  rotation.value.steps.filter((step) => selectedStepIds.value.includes(step.id)),
);

const selectedStep = computed(() =>
  rotation.value.steps.find((step) => step.id === selectedStepIds.value[0]) ?? null,
);

const selectedGroup = computed(() => {
  const groupIds = Array.from(new Set(selectedSteps.value.map((step) => step.groupId).filter(Boolean)));
  return groupIds.length === 1 ? getGroupById(groupIds[0]) : null;
});
const selectedEnemyCommand = computed(() =>
  selectedEnemyCommandId.value
    ? buildEnemyTimelineCommandsForSlot(selectedEnemyCommandSlotId.value ?? props.targetedEnemySlotId)
      .find((entry) => entry.id === selectedEnemyCommandId.value) ?? null
    : null,
);
const hasSelectedEnemyCommand = computed(() => selectedEnemyCommand.value != null);
const hasAnySelectedCommand = computed(() => selectedSteps.value.length > 0 || hasSelectedEnemyCommand.value);

const selectedCommandsCount = computed(() => selectedSteps.value.length);
const hasMultiSelection = computed(() => selectedCommandsCount.value > 1);
const totalStepCount = computed(() => rotation.value.steps.length);

const selectedStepCommand = computed(() => {
  if (selectedCommandsCount.value !== 1) {
    return null;
  }
  const step = selectedStep.value;
  if (!step) {
    return null;
  }

  const actor = partyBySlot.value.get(step.slot);
  return actor?.commands.find((command) => command.id === step.commandId) ?? null;
});

const selectedStepVariantOptions = computed(() => {
  const step = selectedStep.value;
  const command = selectedStepCommand.value;
  if (!step || !command || selectedCommandsCount.value !== 1) {
    return [] as CharacterCombatSnapshot["commands"];
  }
  const variantIds = command.manualVariantCommandIds;
  if (!variantIds || variantIds.length <= 1) {
    return [] as CharacterCombatSnapshot["commands"];
  }
  const actor = partyBySlot.value.get(step.slot);
  if (!actor) {
    return [] as CharacterCombatSnapshot["commands"];
  }
  return variantIds
    .map((commandId) => actor.commands.find((entry) => entry.id === commandId) ?? null)
    .filter((entry): entry is CharacterCombatSnapshot["commands"][number] => entry != null);
});

const selectedStepAction = computed(() => {
  if (selectedCommandsCount.value !== 1) {
    return null;
  }
  const step = selectedStep.value;
  if (!step) {
    return null;
  }

  return simulation.value.actions.find((entry) => entry.stepId === step.id) ?? null;
});

const selectedStepValidation = computed(() =>
  selectedCommandsCount.value === 1 && selectedStep.value
    ? actionValidationByStep.value.get(selectedStep.value.id) ?? null
    : null,
);

const selectedStepCritRigRules = computed(() => {
  const stepId = selectedStep.value?.id;
  if (!stepId) {
    return [] as CritRiggingRule[];
  }
  return (rotation.value.critRiggingRules ?? []).filter((rule) => rule.stepId === stepId);
});

const selectedStepHitRigOptions = computed(() => {
  const command = selectedStepCommand.value;
  if (!command) {
    return [] as Array<{ hitIndex: number; repeatIndex: number; label: string; rigType?: "normal" | "reaction" | "execute"; executeCritRigId?: string }>;
  }
  const characterId = partyBySlot.value.get(
    (selectedStepAction.value?.slot ?? selectedStep.value?.slot ?? 0) as PartySlot,
  )?.characterId;
  const options: Array<{ hitIndex: number; repeatIndex: number; label: string; rigType?: "normal" | "reaction" | "execute"; executeCritRigId?: string }> = [];
  command.hits.forEach((hit, hitIndex) => {
    if (hit.damageType === "Healing" || hit.noCrit || (hit.multiplier <= 0 && hit.flatAmount <= 0)) {
      return;
    }
    const repeatTimes = Math.max(1, hit.times ?? 1);
    for (let repeatIndex = 0; repeatIndex < repeatTimes; repeatIndex += 1) {
      const rawLabel = repeatTimes > 1
        ? `${hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
        : (hit.name ?? `Hit ${hitIndex + 1}`);
      options.push({
        hitIndex,
        repeatIndex,
        label: getLocalizedHitName({
          hitName: rawLabel,
          hitIndex,
          damageType: hit.damageType,
          characterId,
        }),
        rigType: "normal",
      });
    }
  });
  if (command.reactionHits) {
    options.push({
      hitIndex: CRIT_RIG_HIT_INDEX_REACTION,
      repeatIndex: 0,
      label: t("rotation.reactionHits"),
      rigType: "reaction",
    });
  }
  if (command.executeHits && command.id === "zhuangfangyi_ultimate_battle_skill") {
    options.push({
      hitIndex: CRIT_RIG_HIT_INDEX_EXECUTE,
      repeatIndex: 0,
      label: t("rotation.executeHits"),
      rigType: "execute",
    });
  }
  if (command.executeHitCritRigOptions.length > 0) {
    for (const option of command.executeHitCritRigOptions) {
      options.push({
        hitIndex: CRIT_RIG_HIT_INDEX_EXECUTE,
        repeatIndex: 0,
        label: getLocalizedHitName({
          hitName: option.label,
          characterId,
        }),
        rigType: "execute",
        executeCritRigId: option.id,
      });
    }
  }
  return options;
});

const enemyMods = computed<ModifierStats>(() =>
  makeEnemyModifierSnapshot({
    resistances: {
      PHYSICAL_RESIST_PCT: props.enemyStats.resistances.Physical,
      HEAT_RESIST_PCT: props.enemyStats.resistances.Heat,
      CRYO_RESIST_PCT: props.enemyStats.resistances.Cryo,
      ELECTRIC_RESIST_PCT: props.enemyStats.resistances.Electric,
      NATURE_RESIST_PCT: props.enemyStats.resistances.Nature,
      AETHER_RESIST_PCT: props.enemyStats.resistances.Aether,
    },
  }),
);

function getTeamSpConfigForSchemeId(schemeId: string): TeamSpConfig {
  const scheme = rotationSchemes.value.schemes.find((entry) => entry.id === schemeId);
  if (!scheme?.teamSpConfig) {
    return makeDefaultTeamSpConfig();
  }
  return normalizeTeamSpConfig(scheme.teamSpConfig);
}

function getSchemeContingencyContracts(scheme: typeof activeScheme.value): ActiveContingencyContract[] {
  if (!resolveBuildStageSettings(schemeStageSettings(scheme)).contractsEnabled || scheme.simulationMode === "relay_from_previous") {
    return [];
  }
  return normalizeActiveContingencyContracts(scheme.activeContracts ?? []);
}

function getResolvedStageForScheme(scheme: typeof activeScheme.value) {
  return resolveBuildStageSettings(schemeStageSettings(scheme), customStages.value);
}

function getEnemyHpOverridesForStage(stage: ReturnType<typeof resolveBuildStageSettings>) {
  return Object.fromEntries(props.enemies.map((enemy) => [enemy.id, resolveEnemyBaseForStage(enemy, stage).baseHpLv1]));
}

function getSchemeCustomTriggers(scheme: typeof activeScheme.value): CustomCombatTrigger[] {
  if (scheme.simulationMode === "relay_from_previous") {
    return [];
  }
  return Array.isArray(scheme.triggers) ? scheme.triggers : [];
}

function getSchemeCustomTriggerVariables(scheme: typeof activeScheme.value): TriggerVariableDefinition[] {
  if (scheme.simulationMode === "relay_from_previous") {
    return [];
  }
  return normalizeCustomTriggerVariables(scheme.triggerVariables ?? []);
}

function getSchemeEnemyActionWindows(scheme: typeof activeScheme.value) {
  const slotIds = new Set([
    ...props.enemySlots.map((slot) => slot.slotId),
    ...Object.keys(scheme.enemyCommandsBySlot ?? {}),
  ]);
  return [...slotIds].flatMap((slotId) => {
    // Simulation inputs must not depend on simulatedEnemySlots: that output is
    // updated by the watcher below and would create a computed -> watcher ->
    // computed feedback loop. Virtual-slot commands use the shared command set.
    const slot = props.enemySlots.find((entry) => entry.slotId === slotId);
    const enemyId = slot?.enemyId ?? "";
    return buildEnemyActionWindows(
      enemyId,
      scheme.enemyCommandsBySlot?.[slotId]?.map((entry) => ({ ...entry }))
        ?? getDefaultEnemyCommandPlacements(enemyId).map((entry) => ({ ...entry })),
    ).map((window) => ({
      ...window,
      enemySlotId: slotId,
    }));
  });
}

function calculateSimulation(): RotationSimulationResult {
  const schemes = rotationSchemes.value.schemes;
  const activeIndex = activeSchemeIndex.value;
  const active = schemes[activeIndex];
  if (!active) {
    return getRotationSimulationCache("__fallback", "Rotation").simulate({
      rotation: rebaseRotationForSimulation(rotation.value, 0),
      party: partySnapshots.value,
      partyVariantsBySlot: partyVariantsBySlot.value,
      initialVariantIndex: activeVariantIndex.value,
      enemySlots: props.enemySlots,
      targetedEnemySlotId: props.targetedEnemySlotId,
      enemyId: props.selectedEnemyId,
      enemyLevel: props.enemyLevel,
      enemyStats: props.enemyStats,
      enemyMods: enemyMods.value,
      enemyStaggerGauge: props.enemyStaggerGauge,
      enemyStaggerNodes: props.enemyStaggerNodes,
      enemyStaggerRecoverySeconds: props.enemyStaggerRecoverySeconds,
      enemyFinisherMultiplier: props.enemyFinisherMultiplier,
      enemyFinisherSpGain: props.enemyFinisherSpGain,
      battleStartInitialSp: resolvedStageSettings.value.initialSp,
      battleStartSpRegenRate: resolvedStageSettings.value.spRegenRate,
      battleStartStartingEnergyPctBySlot: stageStartingEnergyBySlot.value,
      battleStartControlledOperatorSlot: teamSpConfig.value.controlledOperatorSlot,
      battleStartConsumableIdsBySlot: stageConsumableIdsBySlot.value,
      enemyActionWindows: rebaseEnemyActionWindowsForSimulation(getSchemeEnemyActionWindows(activeScheme.value), 0),
      contingencyContracts: activeContingencyContracts.value,
      enemyHpBaseOverrides: stageEnemyHpBaseOverrides.value,
      customTriggers: activeCustomTriggers.value,
      customTriggerVariables: activeCustomTriggerVariables.value,
    }).result;
  }

  if (active.simulationMode !== "relay_from_previous" || activeIndex <= 0) {
    return getRotationSimulationCache(active.id, active.name).simulate({
      rotation: rebaseRotationForSimulation(rotation.value, 0),
      party: partySnapshots.value,
      partyVariantsBySlot: partyVariantsBySlot.value,
      initialVariantIndex: activeVariantIndex.value,
      enemySlots: props.enemySlots,
      targetedEnemySlotId: props.targetedEnemySlotId,
      enemyId: props.selectedEnemyId,
      enemyLevel: props.enemyLevel,
      enemyStats: props.enemyStats,
      enemyMods: enemyMods.value,
      enemyStaggerGauge: props.enemyStaggerGauge,
      enemyStaggerNodes: props.enemyStaggerNodes,
      enemyStaggerRecoverySeconds: props.enemyStaggerRecoverySeconds,
      enemyFinisherMultiplier: props.enemyFinisherMultiplier,
      enemyFinisherSpGain: props.enemyFinisherSpGain,
      battleStartInitialSp: resolvedStageSettings.value.initialSp,
      battleStartSpRegenRate: resolvedStageSettings.value.spRegenRate,
      battleStartStartingEnergyPctBySlot: stageStartingEnergyBySlot.value,
      battleStartControlledOperatorSlot: teamSpConfig.value.controlledOperatorSlot,
      battleStartConsumableIdsBySlot: stageConsumableIdsBySlot.value,
      enemyActionWindows: rebaseEnemyActionWindowsForSimulation(getSchemeEnemyActionWindows(activeScheme.value), 0),
      contingencyContracts: activeContingencyContracts.value,
      enemyHpBaseOverrides: stageEnemyHpBaseOverrides.value,
      customTriggers: activeCustomTriggers.value,
      customTriggerVariables: activeCustomTriggerVariables.value,
    }).result;
  }

  let chainStartIndex = activeIndex;
  while (
    chainStartIndex > 0
    && schemes[chainStartIndex]?.simulationMode === "relay_from_previous"
  ) {
    chainStartIndex -= 1;
  }
  let previousResult: RotationSimulationResult | null = null;
  let effectiveContingencyContracts: ActiveContingencyContract[] = [];
  let effectiveCustomTriggers: CustomCombatTrigger[] = [];
  let effectiveCustomTriggerVariables: TriggerVariableDefinition[] = [];

  for (let index = chainStartIndex; index <= activeIndex; index += 1) {
    const scheme = schemes[index];
    if (!scheme) {
      continue;
    }
    const ownContingencyContracts = getSchemeContingencyContracts(scheme);
    const ownCustomTriggers = getSchemeCustomTriggers(scheme);
    const ownCustomTriggerVariables = getSchemeCustomTriggerVariables(scheme);
    const inheritedContingencyContracts = effectiveContingencyContracts;
    const inheritedCustomTriggers = effectiveCustomTriggers;
    const inheritedCustomTriggerVariables = effectiveCustomTriggerVariables;
    const schemeContingencyContracts =
      index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
        ? inheritedContingencyContracts
        : ownContingencyContracts;
    const schemeCustomTriggers =
      index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
        ? inheritedCustomTriggers
        : ownCustomTriggers;
    const schemeCustomTriggerVariables =
      index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
        ? inheritedCustomTriggerVariables
        : ownCustomTriggerVariables;
    const schemeStage = index > chainStartIndex && scheme.simulationMode === "relay_from_previous"
      ? getResolvedStageForScheme(schemes[chainStartIndex]!)
      : getResolvedStageForScheme(scheme);
    const baseArgs = {
      rotation: scheme.rotation,
      party: partySnapshots.value,
      partyVariantsBySlot: partyVariantsBySlot.value,
      initialVariantIndex: activeVariantIndex.value,
      enemySlots: props.enemySlots,
      targetedEnemySlotId: props.targetedEnemySlotId,
      enemyId: props.selectedEnemyId,
      enemyLevel: props.enemyLevel,
      enemyStats: props.enemyStats,
      enemyMods: enemyMods.value,
      enemyStaggerGauge: props.enemyStaggerGauge,
      enemyStaggerNodes: props.enemyStaggerNodes,
      enemyStaggerRecoverySeconds: props.enemyStaggerRecoverySeconds,
      enemyFinisherMultiplier: props.enemyFinisherMultiplier,
      enemyFinisherSpGain: props.enemyFinisherSpGain,
      battleStartInitialSp: schemeStage.initialSp,
      battleStartSpRegenRate: schemeStage.spRegenRate,
      battleStartStartingEnergyPctBySlot: schemeStage.lockInitialEnergy
        ? [0, 1, 2, 3].map(() => schemeStage.initialEnergyPct)
        : getTeamSpConfigForSchemeId(scheme.id).startingEnergyBySlot,
      battleStartControlledOperatorSlot: getTeamSpConfigForSchemeId(scheme.id).controlledOperatorSlot,
      battleStartConsumableIdsBySlot: schemeStage.disableConsumables
        ? [null, null, null, null]
        : getTeamSpConfigForSchemeId(scheme.id).consumableBySlot,
      enemyActionWindows: getSchemeEnemyActionWindows(scheme),
      contingencyContracts: schemeContingencyContracts,
      enemyHpBaseOverrides: getEnemyHpOverridesForStage(schemeStage),
      customTriggers: schemeCustomTriggers,
      customTriggerVariables: schemeCustomTriggerVariables,
    };

    const shouldRelay =
      index > 0
      && scheme.simulationMode === "relay_from_previous"
      && previousResult
      && (previousResult.simulationCheckpoints?.length ?? 0) > 0;

    if (!shouldRelay) {
      previousResult = getRotationSimulationCache(scheme.id, scheme.name).simulate(baseArgs).result;
      effectiveContingencyContracts = schemeContingencyContracts;
      effectiveCustomTriggers = schemeCustomTriggers;
      effectiveCustomTriggerVariables = schemeCustomTriggerVariables;
      continue;
    }

    if (shouldRelay) {
      const relayMarkers: RotationSimulationResult["relayTimeline"] = [...(previousResult!.relayTimeline ?? [])]
        .filter((entry) => entry.inherited !== true)
        .sort((left, right) => left.time - right.time);
      const relayMarker: RotationSimulationResult["relayTimeline"][number] | undefined = relayMarkers[0];
      const relayTime: number = relayMarker?.time ?? previousResult!.totalTime;
      const relayGameTime: number = relayMarker?.gameTime ?? previousResult!.totalGameTime;
      const relayDisplayTimeOffset: number = (previousResult!.displayTimeOffset ?? 0) + relayTime;
      const relayDisplayGameTimeOffset: number = (previousResult!.displayGameTimeOffset ?? 0) + relayGameTime;
      syncSchemeRelayDisplayOffset(scheme, relayDisplayTimeOffset, relayDisplayGameTimeOffset);
      const relayCheckpoints: NonNullable<RotationSimulationResult["simulationCheckpoints"]> = [...(previousResult!.simulationCheckpoints ?? [])]
        .filter((entry) => relayTime == null || entry.time <= relayTime + 0.0001)
        .sort((left, right) => left.time - right.time);
      const relayCheckpoint: NonNullable<RotationSimulationResult["simulationCheckpoints"]>[number] | undefined = relayCheckpoints[relayCheckpoints.length - 1];
      if (relayCheckpoint) {
        previousResult = getRotationSimulationCache(scheme.id, `${scheme.name} (relay)`).simulate({
          ...baseArgs,
          rotation: rebaseRotationForSimulation(baseArgs.rotation, relayDisplayTimeOffset),
          enemyActionWindows: rebaseEnemyActionWindowsForSimulation(baseArgs.enemyActionWindows, relayDisplayTimeOffset),
          battleStartConsumableIdsBySlot: makeDefaultTeamSpConfig().consumableBySlot,
          contingencyContracts: inheritedContingencyContracts,
          enemyHpBaseOverrides: getEnemyHpOverridesForStage(schemeStage),
          customTriggers: inheritedCustomTriggers,
          customTriggerVariables: inheritedCustomTriggerVariables,
          initialState: buildInitialStateFromCheckpoint(
            relayCheckpoint,
            relayTime,
            relayGameTime,
            relayDisplayTimeOffset,
            relayDisplayGameTimeOffset,
          ),
          resumeOutputPrefix: buildRelayCumulativeOutputPrefix(previousResult!, relayCheckpoint),
          relayStartTime: 0,
          relayStartGameTime: 0,
          emitRotationRelayedEvent: true,
        }).result;
        effectiveContingencyContracts = inheritedContingencyContracts;
        effectiveCustomTriggers = inheritedCustomTriggers;
        effectiveCustomTriggerVariables = inheritedCustomTriggerVariables;
        continue;
      }
    }

    previousResult = getRotationSimulationCache(scheme.id, scheme.name).simulate(baseArgs).result;
    effectiveContingencyContracts = schemeContingencyContracts;
    effectiveCustomTriggers = schemeCustomTriggers;
    effectiveCustomTriggerVariables = schemeCustomTriggerVariables;
  }
  return previousResult!;
}

simulation.value = calculateSimulation();

let simulationReloadGeneration = 0;
let simulationReloadFrame: number | null = null;
let simulationReloadTimer: ReturnType<typeof setTimeout> | null = null;
let simulationRefreshRunning = false;
let commandExpansionBatchDepth = 0;

function scheduleSimulationReload() {
  if (simulationRefreshRunning || commandExpansionBatchDepth > 0) {
    return;
  }
  const generation = ++simulationReloadGeneration;
  simulationLoading.value = true;
  if (simulationReloadFrame != null && typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(simulationReloadFrame);
  }
  if (simulationReloadTimer != null) {
    clearTimeout(simulationReloadTimer);
  }

  void nextTick(() => {
    const queueReload = () => {
      simulationReloadTimer = setTimeout(() => {
        if (generation !== simulationReloadGeneration) {
          return;
        }
        simulationRefreshRunning = true;
        try {
          simulation.value = calculateSimulation();
        } finally {
          simulationRefreshRunning = false;
          simulationLoading.value = false;
          simulationReloadTimer = null;
        }
      }, 0);
    };
    if (typeof requestAnimationFrame === "function") {
      simulationReloadFrame = requestAnimationFrame(() => {
        simulationReloadFrame = null;
        queueReload();
      });
    } else {
      queueReload();
    }
  });
}

watch(
  () => [
    rotationSchemes.value,
    partySnapshots.value,
    partyVariantsBySlot.value,
    activeVariantIndex.value,
    props.enemySlots,
    props.targetedEnemySlotId,
    props.selectedEnemyId,
    props.enemyLevel,
    props.enemyStats,
    props.enemyStaggerGauge,
    props.enemyStaggerNodes,
    props.enemyStaggerRecoverySeconds,
    props.enemyFinisherMultiplier,
    props.enemyFinisherSpGain,
    props.stageInitialSp,
    props.stageSpRegenRate,
    props.stageSettings,
  ],
  scheduleSimulationReload,
  { deep: true, flush: "sync" },
);

watch(
  () => simulation.value.enemySlots,
  (value) => {
    simulatedEnemySlots.value = value ?? null;
  },
  { immediate: true, deep: true },
);

const visibleEnemySlots = computed(() => {
  const logicalSlots = getLogicalEnemySlots();
  if (logicalSlots.length <= 0) {
    return [];
  }
  const slotIndexById = new Map(logicalSlots.map((slot, index) => [slot.slotId, index]));
  let highestVisibleIndex = Math.max(0, props.enemySlots.length - 1);

  for (const entry of simulation.value.enemyLifecycleTimeline ?? []) {
    const index = slotIndexById.get(entry.enemySlotId);
    if (index != null) {
      highestVisibleIndex = Math.max(highestVisibleIndex, index);
    }
  }

  for (const entry of simulation.value.enemyStateTimeline ?? []) {
    if (!entry.enemyId || !entry.enemySlotId) {
      continue;
    }
    const index = slotIndexById.get(entry.enemySlotId);
    if (index != null) {
      highestVisibleIndex = Math.max(highestVisibleIndex, index);
    }
  }

  for (const slotId of Object.keys(activeScheme.value.enemyCommandsBySlot ?? {})) {
    const index = slotIndexById.get(slotId);
    if (index != null) {
      highestVisibleIndex = Math.max(highestVisibleIndex, index);
    }
  }

  const targetedIndex = slotIndexById.get(props.targetedEnemySlotId);
  if (targetedIndex != null) {
    highestVisibleIndex = Math.max(highestVisibleIndex, targetedIndex);
  }

  return logicalSlots.slice(0, Math.min(logicalSlots.length, highestVisibleIndex + 1));
});

const localTallyEnabled = ref(props.damageTallyTiming?.enabled === true);
const localTallyStartTime = ref(props.damageTallyTiming?.startTime ?? 0);
const localTallyEndTime = ref(props.damageTallyTiming?.endTime ?? 60);

watch(
  () => props.damageTallyTiming,
  (next) => {
    localTallyEnabled.value = next?.enabled === true;
    localTallyStartTime.value = next?.startTime ?? 0;
    localTallyEndTime.value = next?.endTime ?? 60;
  },
  { immediate: true, deep: true },
);

function emitDamageTallyTimingUpdate() {
  emit("update:damageTallyTiming", {
    enabled: localTallyEnabled.value,
    startTime: Number.isFinite(localTallyStartTime.value) ? localTallyStartTime.value : 0,
    endTime: Number.isFinite(localTallyEndTime.value) ? localTallyEndTime.value : 60,
  });
}

const autoTallyStartTime = computed(() => {
  if ((simulation.value.displayTimeOffset ?? 0) > 0) {
    return -(simulation.value.displayTimeOffset ?? 0);
  }
  if (simulation.value.actions.length <= 0) {
    return 0;
  }
  const firstActionStart = simulation.value.actions.reduce(
    (min, action) => Math.min(min, action.realStartTime),
    Number.POSITIVE_INFINITY,
  );
  if (!Number.isFinite(firstActionStart)) {
    return 0;
  }
  return Math.max(0, firstActionStart);
});

const autoTallyEndTime = computed(() => {
  return Math.max(0, simulation.value.totalTime ?? 0);
});

const displayedTallyStartTime = computed(() =>
  toDisplayedRealTime(localTallyEnabled.value ? localTallyStartTime.value : autoTallyStartTime.value),
);
const displayedTallyEndTime = computed(() =>
  toDisplayedRealTime(localTallyEnabled.value ? localTallyEndTime.value : autoTallyEndTime.value),
);

function getLocalTallyTimeFromDisplayed(value: number): number {
  const displayOffset = simulationDisplayTimeOffset.value;
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value - displayOffset;
}

const tallyWindowSummary = computed(() => {
  if (!localTallyEnabled.value) {
    const start = autoTallyStartTime.value;
    const end = autoTallyEndTime.value;
    const duration = Math.max(0, end - start);
    const totalDamage = simulation.value.totalDamage;
    return {
      totalDamage,
      dps: duration > 0 ? totalDamage / duration : 0,
      start,
      end,
    };
  }

  const start = Math.min(localTallyStartTime.value, localTallyEndTime.value);
  const end = Math.max(localTallyStartTime.value, localTallyEndTime.value);
  const duration = Math.max(0, end - start);
  const totalDamage = simulation.value.timeline
    .filter((entry) => entry.time >= start - 0.0001 && entry.time <= end + 0.0001)
    .reduce((sum, entry) => sum + entry.damage, 0);

  return {
    totalDamage,
    dps: duration > 0 ? totalDamage / duration : 0,
    start,
    end,
  };
});

function floorToSnap(value: number): number {
  return Math.floor(value / AXIS_SNAP_SECONDS) * AXIS_SNAP_SECONDS;
}

function roundToPrecision(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function coerceFiniteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function safeArrayLength(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(10000, Math.floor(value)));
}

const timelineStart = computed(() => {
  if (isActiveSchemeRelayed.value) {
    return -5;
  }
  const preBattleStartRealTime = coerceFiniteNumber(
    toRealTimeFromExtensions(-PRE_BATTLE_SECONDS, simulation.value.timeExtensions),
    -PRE_BATTLE_SECONDS,
  );
  return Math.min(-PRE_BATTLE_SECONDS, floorToSnap(roundToPrecision(preBattleStartRealTime)));
});
const timelineDuration = computed(() =>
  Math.max(12, Math.ceil(coerceFiniteNumber(simulation.value.totalTime, 10) + 2)),
);
const timelineWidth = computed(() => (timelineDuration.value - timelineStart.value) * axisScale.value);

const realSeconds = computed(() =>
  Array.from(
    {
      length: safeArrayLength(
        Math.floor(coerceFiniteNumber(timelineDuration.value, 12))
          - Math.ceil(coerceFiniteNumber(timelineStart.value, -PRE_BATTLE_SECONDS))
          + 1,
      ),
    },
    (_, index) => Math.ceil(coerceFiniteNumber(timelineStart.value, -PRE_BATTLE_SECONDS)) + index,
  ),
);

const gameTimelineDuration = computed(() => {
  const latestCursorGameTime = coerceFiniteNumber(
    toGameTimeFromExtensions(cursorTime.value, simulation.value.timeExtensions),
    0,
  );
  return Math.ceil(Math.max(coerceFiniteNumber(simulation.value.totalGameTime, 0), latestCursorGameTime));
});

const gameSeconds = computed(() =>
  (() => {
    const gameStart = Math.ceil(coerceFiniteNumber(
      toGameTimeFromExtensions(timelineStart.value, simulation.value.timeExtensions),
      0,
    ));
    const gameEnd = Math.floor(coerceFiniteNumber(gameTimelineDuration.value, 0));
    return Array.from(
      { length: safeArrayLength(gameEnd - gameStart + 1) },
      (_, index) => gameStart + index,
    ).map((value) => ({
      value,
      realTime: coerceFiniteNumber(toRealTimeFromExtensions(value, simulation.value.timeExtensions), timelineStart.value),
    })).filter((entry) => entry.realTime >= timelineStart.value - 0.0001 && entry.realTime <= timelineDuration.value + 0.0001);
  })(),
);
const preBattleBandStyle = computed(() => ({
  left: "0px",
  width: `${Math.max(0, timeToPx(0))}px`,
}));
const relayInheritedBandStyle = computed(() => {
  if (!isActiveSchemeRelayed.value) {
    return { left: "0px", width: "0px" };
  }
  return {
    left: "0px",
    width: `${Math.max(0, Math.min(timelineWidth.value, timeToPx(0)))}px`,
  };
});

function getEnemyInvulnerabilityWindowsForSlot(slotId: string) {
  return simulation.value.enemyActionWindows
    .filter((window) => window.enemySlotId === slotId)
    .filter((window) => window.invulnerable && window.endTime > timelineStart.value && window.startTime < timelineDuration.value)
    .map((window) => ({
      ...window,
      start: Math.max(timelineStart.value, window.startTime),
      end: Math.min(timelineDuration.value, window.endTime),
      color: window.tintColor ?? "rgba(215, 64, 64, 0.25)",
    }))
    .filter((window) => window.end > window.start);
}

function getEnemyPhaseTransitionWindowsForSlot(slotId: string) {
  const actionWindows = simulation.value.enemyActionWindows
    .filter((window) => window.enemySlotId === slotId)
    .filter((window) => window.commandId === "phase_transition" && window.endTime > timelineStart.value && window.startTime < timelineDuration.value)
    .map((window) => ({
      id: window.id,
      commandId: window.commandId,
      label: window.label,
      startTime: window.startTime,
      endTime: window.endTime,
      start: Math.max(timelineStart.value, window.startTime),
      end: Math.min(timelineDuration.value, window.endTime),
      color: "rgba(140, 72, 194, 0.16)",
      borderColor: "rgba(116, 62, 162, 0.48)",
    }));
  const listenerWindows = (simulation.value.enemyTransitionTimeline ?? [])
    .filter((window) => window.enemySlotId === slotId)
    .filter((window) => window.endTime > timelineStart.value && window.time < timelineDuration.value)
    .map((window) => ({
      id: `listener:${window.enemySlotId}:${window.time}:${window.endTime}`,
      commandId: window.commandId,
      label: window.label,
      startTime: window.time,
      endTime: window.endTime,
      start: Math.max(timelineStart.value, window.time),
      end: Math.min(timelineDuration.value, window.endTime),
      color: "rgba(140, 72, 194, 0.16)",
      borderColor: "rgba(116, 62, 162, 0.48)",
    }));
  return [...actionWindows, ...listenerWindows].filter((window) => window.end > window.start);
}

const enemyInvulnerabilityWindows = computed(() =>
  getEnemyInvulnerabilityWindowsForSlot(props.targetedEnemySlotId),
);

const enemyPhaseTransitionWindows = computed(() =>
  getEnemyPhaseTransitionWindowsForSlot(props.targetedEnemySlotId),
);

const allHits = computed(() =>
  [...simulation.value.timeline].sort((a, b) => a.time - b.time),
);
const allEvents = computed(() =>
  [...simulation.value.events].sort((a, b) => a.time - b.time),
);
const allComboTriggerDebug = computed(() =>
  [...(simulation.value.comboTriggerDebug ?? [])].sort((a, b) => a.time - b.time),
);
const allPassiveListenerDebug = computed(() =>
  [...(simulation.value.passiveListenerDebug ?? [])].sort((a, b) => a.time - b.time),
);
const linkEnhancedStepIdSet = computed(() => new Set(simulation.value.linkEnhancedStepIds));

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];
const damageContributions = computed(() => {
  if (!localTallyEnabled.value) {
    const totalDamage = simulation.value.totalDamage;
    return simulation.value.damageBySlot.map((entry, index) => ({
      ...entry,
      color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
      percent: totalDamage > 0 ? (entry.damage / totalDamage) * 100 : 0,
      localizedCharacterName: getLocalizedCharacterName(
        partyBySlot.value.get(entry.slot)?.characterId,
        entry.characterName,
      ),
    }));
  }
  const start = tallyWindowSummary.value.start;
  const end = tallyWindowSummary.value.end;
  const damageBySlotInWindow = new Map<PartySlot, number>();
  for (const hit of simulation.value.timeline) {
    if (hit.time < start - 0.0001 || hit.time > end + 0.0001) {
      continue;
    }
    damageBySlotInWindow.set(hit.slot, (damageBySlotInWindow.get(hit.slot) ?? 0) + hit.damage);
  }
  const totalDamage = tallyWindowSummary.value.totalDamage;
  return simulation.value.damageBySlot.map((entry, index) => ({
    ...entry,
    damage: damageBySlotInWindow.get(entry.slot) ?? 0,
    color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
    percent: totalDamage > 0 ? ((damageBySlotInWindow.get(entry.slot) ?? 0) / totalDamage) * 100 : 0,
    localizedCharacterName: getLocalizedCharacterName(
      partyBySlot.value.get(entry.slot)?.characterId,
      entry.characterName,
    ),
  }));
});

const riggedCritChance = computed(() => {
  const riggedCritHits = simulation.value.timeline.filter((entry) => entry.critRigMode === "force_crit");
  if (riggedCritHits.length === 0) {
    return null;
  }
  let chance = 1;
  for (const entry of riggedCritHits) {
    const critRate = Math.max(0, Math.min(1, entry.calculationContext?.attackerMods.CRIT_RATE_PCT ?? 0));
    chance *= critRate;
  }
  return chance;
});

const hitTimelineExpanded = ref(false);
type DebugTraceKind = "events" | "combo" | "passive";
const DEBUG_TRACE_PAGE_SIZE = 20;
const debugTracePopupKind = ref<DebugTraceKind | null>(null);
const debugTracePage = ref(1);
const debugTraceTotalRows = computed(() => {
  if (debugTracePopupKind.value === "events") return allEvents.value.length;
  if (debugTracePopupKind.value === "combo") return allComboTriggerDebug.value.length;
  if (debugTracePopupKind.value === "passive") return allPassiveListenerDebug.value.length;
  return 0;
});
const debugTracePageCount = computed(() => Math.max(1, Math.ceil(debugTraceTotalRows.value / DEBUG_TRACE_PAGE_SIZE)));
const debugTracePageStart = computed(() => (Math.min(debugTracePage.value, debugTracePageCount.value) - 1) * DEBUG_TRACE_PAGE_SIZE);
const pagedDebugEvents = computed(() => allEvents.value.slice(debugTracePageStart.value, debugTracePageStart.value + DEBUG_TRACE_PAGE_SIZE));
const pagedComboTriggerDebug = computed(() => allComboTriggerDebug.value.slice(debugTracePageStart.value, debugTracePageStart.value + DEBUG_TRACE_PAGE_SIZE));
const pagedPassiveListenerDebug = computed(() => allPassiveListenerDebug.value.slice(debugTracePageStart.value, debugTracePageStart.value + DEBUG_TRACE_PAGE_SIZE));
function openDebugTracePopup(kind: DebugTraceKind) {
  debugTracePopupKind.value = kind;
  debugTracePage.value = 1;
}
function closeDebugTracePopup() {
  debugTracePopupKind.value = null;
  debugTracePage.value = 1;
}
function setDebugTracePage(page: number) {
  debugTracePage.value = Math.max(1, Math.min(debugTracePageCount.value, page));
}
watch(debugTracePageCount, (pageCount) => {
  if (debugTracePage.value > pageCount) debugTracePage.value = pageCount;
});
const liveModifiersExpanded = ref(false);
const selectedHitForDetails = ref<RotationSimulationResult["timeline"][number] | null>(null);
const defaultModifierStats = makeBaseModifierStats();
const bonusEnemyInterruptedSpEvents = computed(() =>
  simulation.value.events
    .filter(
      (event) =>
        event.type === "ENEMY_COMMAND_INTERRUPTED"
        && (event.amount ?? 0) > 0,
    )
    .map((event) => ({
      time: event.time,
      amount: event.amount ?? 0,
    })),
);
const bonusSpReturnedEvents = computed(() =>
  simulation.value.events
    .filter(
      (event) =>
        event.type === "SP_RETURNED"
        && (event.amount ?? 0) > 0,
    )
    .map((event) => ({
      time: event.time,
      amount: event.amount ?? 0,
    })),
);
const bonusSpGeneratedEvents = computed(() =>
  simulation.value.events
    .filter(
      (event) =>
        event.type === "SP_GENERATED"
        && (event.amount ?? 0) > 0,
    )
    .map((event) => ({
      time: event.time,
      amount: event.amount ?? 0,
    })),
);

const selectedCharacterLiveState = computed(() => {
  if (sidebarMode.value !== "character") {
    return null;
  }
  const baseActor = partyBySlot.value.get(selectedLibrarySlot.value);
  if (!baseActor) {
    return null;
  }

  const actorState = getActorStateAtTime(simulation.value, baseActor.slot, cursorTime.value);
  const runtimeVariant = Math.max(0, Math.min(3, actorState.activeBuildVariant ?? activeVariantIndex.value));
  const runtimeActor = partyVariantsBySlot.value[selectedLibrarySlot.value]?.[runtimeVariant] ?? baseActor;
  const liveMods: ModifierStats = { ...runtimeActor.mods };
  const applyModifierDelta = (delta: Partial<ModifierStats>) => {
    for (const [key, value] of Object.entries(delta)) {
      if (value == null || value === 0) {
        continue;
      }
      const statKey = key as ModifierStatKey;
      liveMods[statKey] += value;
    }
  };

  const isUniqueTalentEnabledForActor = (key: string) =>
    runtimeActor.uniqueTalentToggles[key] === true || runtimeActor.uniqueTalentDefaults?.[key] === true;

  const activeEnemyStatusIds = new Set(currentEnemyState.value.activeStatuses.map((status) => status.id));
  const enemyInflictionElement = currentEnemyState.value.artsInfliction?.element;

  for (const buff of actorState.activeBuffs) {
    if (!buff.effects) {
      continue;
    }
    applyModifierDelta(buff.effects);
  }

  for (const conditional of runtimeActor.conditionalModifiers ?? []) {
    const requiresEnabled = conditional.condition.requiresUniqueTalentsEnabled ?? [];
    if (requiresEnabled.some((key) => !isUniqueTalentEnabledForActor(key))) {
      continue;
    }

    const requiresDisabled = conditional.condition.requiresUniqueTalentsDisabled ?? [];
    if (requiresDisabled.some((key) => isUniqueTalentEnabledForActor(key))) {
      continue;
    }

    const enemyStatusIdsAny = conditional.condition.enemyStatusIdsAny ?? [];
    if (enemyStatusIdsAny.length > 0 && !enemyStatusIdsAny.some((statusId) => activeEnemyStatusIds.has(statusId))) {
      continue;
    }

    const enemyInflictionElementsAny = conditional.condition.enemyInflictionElementsAny ?? [];
    if (enemyInflictionElementsAny.length > 0) {
      if (!enemyInflictionElement || !enemyInflictionElementsAny.includes(enemyInflictionElement)) {
        continue;
      }
    }

    applyModifierDelta(conditional.effects);
  }

  const liveAttrs = {
    STR: runtimeActor.attrs.STR,
    AGI: runtimeActor.attrs.AGI,
    INT: runtimeActor.attrs.INT,
    WIL: runtimeActor.attrs.WIL,
  };
  const character = CHARACTERS.find((entry) => entry.id === runtimeActor.characterId);
  const applyAttrPct = (attr: keyof typeof liveAttrs, pct: number) => {
    if (!pct) return;
    const delta = liveAttrs[attr] * pct;
    liveAttrs[attr] += delta >= 0 ? Math.ceil(delta) : Math.floor(delta);
  };
  const attrKeys: Array<keyof typeof liveAttrs> = ["STR", "AGI", "INT", "WIL"];
  for (const key of attrKeys) {
    const perAttrMul = key === "STR"
      ? 1 + liveMods.STR_PCT
      : key === "AGI"
        ? 1 + liveMods.AGI_PCT
        : key === "INT"
          ? 1 + liveMods.INT_PCT
          : 1 + liveMods.WIL_PCT;
    const mainSecondaryMul = key === character?.mainAttr
      ? 1 + liveMods.MAIN_ATTR_PCT
      : key === character?.secondaryAttr
        ? 1 + liveMods.SECONDARY_ATTR_PCT
        : 1;
    const totalMul = (1 + liveMods.ALL_ATTR_PCT) * perAttrMul * mainSecondaryMul;
    applyAttrPct(key, totalMul - 1);
  }

  const liveAttributeBonus = (liveAttrs.STR * (runtimeActor.attributeScaling.STR ?? 0))
    + (liveAttrs.AGI * (runtimeActor.attributeScaling.AGI ?? 0))
    + (liveAttrs.INT * (runtimeActor.attributeScaling.INT ?? 0))
    + (liveAttrs.WIL * (runtimeActor.attributeScaling.WIL ?? 0));

  const rawAtk = runtimeActor.baseAtk + runtimeActor.weaponAtk;
  const modAtk = Math.round(rawAtk * liveMods.ATK_PCT);
  const liveAtk = Math.floor((rawAtk + modAtk + liveMods.FLAT_ATK) * (1 + liveAttributeBonus));
  const liveHp = Math.round((runtimeActor.baseHp + liveAttrs.STR * 5) * (1 + liveMods.HP_PCT) + liveMods.FLAT_HP);

  const changedModifiers = MODIFIER_STAT_KEYS
    .filter((key) => Math.abs(liveMods[key] - defaultModifierStats[key]) > 1e-9)
    .map((key) => ({
      key,
      label: modifierLabel(key),
      value: liveMods[key],
      isPercent: key.endsWith("_PCT"),
    }));

  return {
    actor: runtimeActor,
    liveMods,
    attrs: liveAttrs,
    atk: liveAtk,
    hp: liveHp,
    def: runtimeActor.finalDef,
    activeBuildVariant: runtimeVariant,
    changedModifiers,
  };
});

function formatModifierValue(value: number, key: ModifierStatKey, isPercent: boolean): string {
  const isResistance =
    key === "PHYSICAL_RESIST_PCT"
    || key === "HEAT_RESIST_PCT"
    || key === "CRYO_RESIST_PCT"
    || key === "ELECTRIC_RESIST_PCT"
    || key === "NATURE_RESIST_PCT"
    || key === "AETHER_RESIST_PCT";

  if (isResistance) {
    return `${Math.round(value * 100)}`;
  }

  if (isPercent) {
    const formatted = `${(value * 100).toFixed(1)}%`;
    const isAbsolutePercentStat =
      key === "CRIT_RATE_PCT"
      || key === "CRIT_DMG_PCT"
      || key === "ULT_GAIN_PCT";
    return isAbsolutePercentStat ? formatted : `${value >= 0 ? "+" : ""}${formatted}`;
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

const selectedHitDetails = computed(() => {
  const hit = selectedHitForDetails.value;
  if (!hit?.calculationContext) {
    return null;
  }
  const ctx = hit.calculationContext;

  const getDamageAmpBonus = (damageType: string, mods: ModifierStats): number => {
    switch (damageType) {
      case "Physical":
        return mods.DMG_AMP_PCT + mods.PHYSICAL_DMG_AMP_PCT;
      case "Heat":
        return mods.DMG_AMP_PCT + mods.HEAT_DMG_AMP_PCT;
      case "Cryo":
        return mods.DMG_AMP_PCT + mods.CRYO_DMG_AMP_PCT;
      case "Electric":
        return mods.DMG_AMP_PCT + mods.ELECTRIC_DMG_AMP_PCT;
      case "Nature":
        return mods.DMG_AMP_PCT + mods.NATURE_DMG_AMP_PCT;
      case "Aether":
        return mods.DMG_AMP_PCT + mods.AETHER_DMG_AMP_PCT;
      default:
        return 0;
    }
  };
  const getDamageTakenBonus = (damageType: string, mods: ModifierStats): number => {
    switch (damageType) {
      case "Physical":
        return mods.DMG_TAKEN_PCT + mods.PHYSICAL_DMG_TAKEN_PCT;
      case "Heat":
        return mods.DMG_TAKEN_PCT + mods.ARTS_DMG_TAKEN_PCT + mods.HEAT_DMG_TAKEN_PCT;
      case "Cryo":
        return mods.DMG_TAKEN_PCT + mods.ARTS_DMG_TAKEN_PCT + mods.CRYO_DMG_TAKEN_PCT;
      case "Electric":
        return mods.DMG_TAKEN_PCT + mods.ARTS_DMG_TAKEN_PCT + mods.ELECTRIC_DMG_TAKEN_PCT;
      case "Nature":
        return mods.DMG_TAKEN_PCT + mods.ARTS_DMG_TAKEN_PCT + mods.NATURE_DMG_TAKEN_PCT;
      case "Aether":
        return mods.DMG_TAKEN_PCT + mods.ARTS_DMG_TAKEN_PCT + mods.AETHER_DMG_TAKEN_PCT;
      default:
        return mods.DMG_TAKEN_PCT;
    }
  };
  const getEnemyRes = (damageType: string, mods: ModifierStats): number => {
    switch (damageType) {
      case "Physical": return mods.PHYSICAL_RESIST_PCT;
      case "Heat": return mods.HEAT_RESIST_PCT;
      case "Cryo": return mods.CRYO_RESIST_PCT;
      case "Electric": return mods.ELECTRIC_RESIST_PCT;
      case "Nature": return mods.NATURE_RESIST_PCT;
      case "Aether": return mods.AETHER_RESIST_PCT;
      default: return 0;
    }
  };
  const getResIgnore = (damageType: string, mods: ModifierStats): number => {
    switch (damageType) {
      case "Physical": return mods.PHYSICAL_RESIST_IGNORE_PCT;
      case "Heat": return mods.HEAT_RESIST_IGNORE_PCT;
      case "Cryo": return mods.CRYO_RESIST_IGNORE_PCT;
      case "Electric": return mods.ELECTRIC_RESIST_IGNORE_PCT;
      case "Nature": return mods.NATURE_RESIST_IGNORE_PCT;
      case "Aether": return mods.AETHER_RESIST_IGNORE_PCT;
      default: return 0;
    }
  };
  const getSus = (damageType: string, enemyMods: ModifierStats, attackerMods: ModifierStats): number => {
    const genericSus = enemyMods.SUS_PCT * (1 + attackerMods.SUS_ENHANCE_PCT);
    switch (damageType) {
      case "Physical":
        return genericSus + enemyMods.PHYSICAL_SUS_PCT * (1 + attackerMods.PHYSICAL_SUS_ENHANCE_PCT);
      case "Heat":
        return genericSus + (
          enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
          + enemyMods.HEAT_SUS_PCT * (1 + attackerMods.HEAT_SUS_ENHANCE_PCT)
        );
      case "Cryo":
        return genericSus + (
          enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
          + enemyMods.CRYO_SUS_PCT * (1 + attackerMods.CRYO_SUS_ENHANCE_PCT)
        );
      case "Electric":
        return genericSus + (
          enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
          + enemyMods.ELECTRIC_SUS_PCT * (1 + attackerMods.ELECTRIC_SUS_ENHANCE_PCT)
        );
      case "Nature":
        return genericSus + (
          enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
          + enemyMods.NATURE_SUS_PCT * (1 + attackerMods.NATURE_SUS_ENHANCE_PCT)
        );
      case "Aether":
        return genericSus + (
          enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
          + enemyMods.AETHER_SUS_PCT * (1 + attackerMods.AETHER_SUS_ENHANCE_PCT)
        );
      default:
        return genericSus;
    }
  };
  const defenseMultiplier = (() => {
    const defense = ctx.enemyDef;
    if (hit.damageType === "Healing") {
      return 1;
    }
    if (defense > 0) return 1 - defense / (defense + 100);
    if (defense < 0) return 1 + (1 - Math.pow(0.99, -defense));
    return 1;
  })();
  const totalDamageBonus = getTotalDamageBonus(ctx.attackType, hit.damageType, ctx.attackerMods);
  const dmgAmpMultiplier = 1 + getDamageAmpBonus(hit.damageType, ctx.attackerMods);
  const damageTakenMultiplier = 1 + getDamageTakenBonus(hit.damageType, ctx.enemyMods);
  const superArmorMultiplier = Math.max(0, 1 - (ctx.enemyMods.SUPER_ARMOR_PCT ?? 0));
  const effectiveResistance = getEnemyRes(hit.damageType, ctx.enemyMods) - getResIgnore(hit.damageType, ctx.attackerMods);
  const resistanceMultiplier = 1 - effectiveResistance;
  const susceptibilityMultiplier = 1 + getSus(hit.damageType, ctx.enemyMods, ctx.attackerMods);
  const critAverageMultiplier = getAverageCritMultiplier(ctx.attackerMods);
  const artsIntensity = Math.max(0, ctx.attackerMods.ARTS_INTENSITY);
  const levelMultiplier = ctx.attackType === "REACTION"
    ? 1 + ((Math.max(1, ctx.applierLevel ?? 1) - 1) / (ctx.isPhysicalReaction ? 392 : 196))
    : 1;
  const artsIntensityMultiplier = ctx.attackType === "REACTION"
    ? 1 + artsIntensity / 100
    : 1;
  const contractDamageMultiplier = Math.max(0, ctx.contractDamageMultiplier ?? 1);
  const contractFlatModifier = ctx.contractFlatModifier ?? 0;
  const staggeredMultiplier = Math.max(0, ctx.staggeredMultiplier ?? 1);
  const finisherBonusMultiplier = Math.max(0, ctx.finisherBonusMultiplier ?? 1);
  const totalEnemyMultiplier = Math.max(0, ctx.totalEnemyMultiplier ?? (staggeredMultiplier * finisherBonusMultiplier));

  return {
    hit,
    ctx,
    totalDamageBonus,
    dmgAmpMultiplier,
    damageTakenMultiplier,
    superArmorMultiplier,
    effectiveResistance,
    resistanceMultiplier,
    susceptibilityMultiplier,
    defenseMultiplier,
    critAverageMultiplier,
    levelMultiplier,
    artsIntensityMultiplier,
    artsIntensity,
    contractDamageMultiplier,
    contractFlatModifier,
    staggeredMultiplier,
    finisherBonusMultiplier,
    totalEnemyMultiplier,
    isReaction: ctx.attackType === "REACTION",
  };
});

function formatEventType(type: RotationCombatEvent["type"]): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEventDetailEntries(event: RotationCombatEvent): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];

  entries.push({ key: "Type", value: event.type });
  entries.push({ key: "Label", value: event.label });
  entries.push({ key: "Real Time", value: `${formatDisplayedRealTime(event.time)}s` });
  entries.push({ key: "Game Time", value: `${formatDisplayedGameTime(event.gameTime)}s` });

  if (event.stepId) {
    entries.push({ key: "Step ID", value: event.stepId });
  }
  if (event.slot != null) {
    entries.push({ key: "Slot", value: String(event.slot + 1) });
  }
  if (event.sourceSlot != null) {
    entries.push({ key: "Source Slot", value: String(event.sourceSlot + 1) });
  }
  if (event.target) {
    entries.push({ key: "Target", value: event.target });
  }
  if (event.triggeredSlot != null) {
    entries.push({ key: "Triggered Slot", value: String(event.triggeredSlot + 1) });
  }
  if (event.buffId) {
    entries.push({ key: "Buff ID", value: event.buffId });
  }
  if (event.debuffStat) {
    entries.push({ key: "Debuff Stat", value: event.debuffStat });
  }
  if (event.durationSeconds != null) {
    entries.push({ key: "Duration", value: `${event.durationSeconds.toFixed(3)}s` });
  }
  if (event.timeScale) {
    entries.push({ key: "Time Scale", value: event.timeScale });
  }
  if (event.stackDelta != null) {
    entries.push({ key: "Stack Delta", value: String(event.stackDelta) });
  }
  if (event.spReturn != null) {
    entries.push({ key: "SP Return", value: String(event.spReturn) });
  }
  if (event.amount != null) {
    entries.push({ key: "Amount", value: String(event.amount) });
  }
  if (event.commandAttackType) {
    entries.push({ key: "Command Attack Type", value: event.commandAttackType });
  }
  if (event.damageType) {
    entries.push({ key: "Damage Type", value: event.damageType });
  }
  if (event.expectedCritCount != null) {
    entries.push({ key: "Expected Crit Count", value: event.expectedCritCount.toFixed(4) });
  }
  if (event.consumedElement) {
    entries.push({ key: "Consumed Element", value: event.consumedElement });
  }
  if (event.healedAmount != null) {
    entries.push({ key: "Healed Amount", value: event.healedAmount.toFixed(3) });
  }

  return entries;
}

function formatComboDebugBlockReason(reason: RotationSimulationResult["comboTriggerDebug"][number]["blockReason"]): string {
  switch (reason) {
    case "MISSING_ACTOR_OR_COMBO_COMMAND":
      return t("rotation.comboDebugReasonMissingActorOrCombo");
    case "ACTIVE_COMBO_WINDOW_EXISTS":
      return t("rotation.comboDebugReasonActiveWindowExists");
    case "COMBO_ON_COOLDOWN":
      return t("rotation.comboDebugReasonComboOnCooldown");
    default:
      return t("rotation.comboDebugReasonUnknown");
  }
}

function getComboDebugDetailEntries(
  entry: RotationSimulationResult["comboTriggerDebug"][number],
): Array<{ key: string; value: string }> {
  const rows: Array<{ key: string; value: string }> = [
    { key: t("rotation.comboDebugTriggered"), value: entry.triggered ? t("rotation.yes") : t("rotation.no") },
    { key: t("rotation.comboDebugSlot"), value: String(entry.slot + 1) },
    { key: t("rotation.comboDebugCharacter"), value: entry.characterName ?? entry.characterId ?? "-" },
    { key: t("rotation.comboDebugSourceEventType"), value: entry.sourceEventType },
    { key: t("rotation.comboDebugSourceStep"), value: entry.sourceStepId || "-" },
    { key: t("rotation.comboDebugComboCommand"), value: entry.comboCommandId ?? "-" },
    { key: t("rotation.comboDebugCooldownOwner"), value: entry.cooldownOwnerCommandId ?? "-" },
    { key: t("rotation.comboDebugComboTimeScale"), value: entry.comboTimeScale },
    { key: t("rotation.comboDebugCurrentTime"), value: formatDisplayedRealTime(entry.currentTime) },
    { key: t("rotation.comboDebugCooldownUntil"), value: formatDisplayedRealTime(entry.cooldownUntil) },
    { key: t("rotation.comboDebugHasActiveWindow"), value: entry.hasActiveComboWindow ? t("rotation.yes") : t("rotation.no") },
    { key: t("rotation.comboDebugHasPendingCooldown"), value: entry.hasPendingCooldown ? t("rotation.yes") : t("rotation.no") },
  ];
  if (entry.readyAt != null) {
    rows.push({ key: t("rotation.comboDebugReadyAt"), value: formatDisplayedGameTime(entry.readyAt) });
  }
  if (entry.expiresAt != null) {
    rows.push({ key: t("rotation.comboDebugExpiresAt"), value: formatDisplayedGameTime(entry.expiresAt) });
  }
  if (entry.blockReason) {
    rows.push({ key: t("rotation.comboDebugBlockReason"), value: formatComboDebugBlockReason(entry.blockReason) });
  }
  return rows;
}

function formatPassiveListenerKind(
  kind: RotationSimulationResult["passiveListenerDebug"][number]["listenerKind"],
): string {
  switch (kind) {
    case "COMBAT_HOOK":
      return t("rotation.listenerKindCombatHook");
    case "GEAR_SET":
      return t("rotation.listenerKindGearSet");
    case "WEAPON":
      return t("rotation.listenerKindWeapon");
    case "CUSTOM_TRIGGER":
      return t("rotation.listenerKindCustomTrigger");
    default:
      return kind;
  }
}

function getPassiveListenerDebugDetailEntries(
  entry: RotationSimulationResult["passiveListenerDebug"][number],
): Array<{ key: string; value: string }> {
  return [
    { key: t("rotation.passiveDebugEventType"), value: entry.eventType },
    { key: t("rotation.passiveDebugEventLabel"), value: entry.eventLabel },
    { key: t("rotation.passiveDebugEventCommandAttackType"), value: entry.eventCommandAttackType ?? "-" },
    { key: t("rotation.passiveDebugListenerKind"), value: formatPassiveListenerKind(entry.listenerKind) },
    { key: t("rotation.passiveDebugListenerPresent"), value: entry.listenerPresent ? t("rotation.yes") : t("rotation.no") },
    { key: t("rotation.passiveDebugSlot"), value: entry.slot == null ? "-" : String(entry.slot + 1) },
    { key: t("rotation.passiveDebugCharacter"), value: entry.characterName && entry.characterId ? `${entry.characterName} (${entry.characterId})` : "-" },
    { key: t("rotation.passiveDebugTrigger"), value: entry.triggerName && entry.triggerId ? `${entry.triggerName} (${entry.triggerId})` : "-" },
    { key: t("rotation.passiveDebugRealTime"), value: `${formatDisplayedRealTime(entry.time)}s` },
    { key: t("rotation.passiveDebugGameTime"), value: `${formatDisplayedGameTime(entry.gameTime)}s` },
    { key: t("rotation.passiveDebugStepId"), value: entry.eventStepId ?? "-" },
    { key: t("rotation.passiveDebugCommandId"), value: entry.eventCommandId ?? "-" },
  ];
}

type DragState = {
  stepIds: string[];
  originClientX: number;
  originStartTimes: Record<string, number>;
};

type CursorDragState = {
  laneLeft: number;
};

type LibraryDragState =
  | {
    kind: "party";
    slot: PartySlot;
    commandId: string;
  }
  | {
    kind: "enemy";
    commandId: string;
  };

type EnemyCommandDragState = {
  commandIds: string[];
  originClientX: number;
  originStartTimes: Record<string, number>;
};

type MarqueeSelectionState = {
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
};

type PendingLongPressDrag = {
  kind: "step" | "enemy";
  id: string;
  touchId: number;
  startClientX: number;
  startClientY: number;
  timerId: number;
  activated: boolean;
};

const MOBILE_LONG_PRESS_MS = 220;
const MOBILE_DRAG_CANCEL_MOVE_PX = 8;

const dragState = ref<DragState | null>(null);
const enemyCommandDragState = ref<EnemyCommandDragState | null>(null);
const stepDragPreviewStartById = shallowRef(new Map<string, number>());
const enemyDragPreviewStartById = shallowRef(new Map<string, number>());
const cursorDragState = ref<CursorDragState | null>(null);
const libraryDragState = ref<LibraryDragState | null>(null);
const marqueeSelectionState = ref<MarqueeSelectionState | null>(null);
const pendingLongPressDrag = ref<PendingLongPressDrag | null>(null);
const suppressTapUntilMs = ref(0);
const actionElementByStepId = new Map<string, HTMLElement>();
const timelineViewportEl = ref<HTMLElement | null>(null);

const partyDisplay = computed(() =>
  [0, 1, 2, 3].map((index) => {
    const slot = toPartySlot(index);
    const actor = partyBySlot.value.get(slot) ?? null;
    const ultimate = actor?.commands.find(
      (command) => command.attackType === "ULTIMATE" && command.hiddenInLibrary !== true,
    ) ?? actor?.commands.find((command) => command.attackType === "ULTIMATE") ?? null;
    const combo = actor?.commands.find(
      (command) =>
        command.attackType === "COMBO_SKILL"
        && command.hiddenInLibrary !== true
        && (command.comboCooldownOwnerCommandId == null || command.comboCooldownOwnerCommandId === command.id),
    ) ?? actor?.commands.find(
      (command) =>
        command.attackType === "COMBO_SKILL"
        && (command.comboCooldownOwnerCommandId == null || command.comboCooldownOwnerCommandId === command.id),
    ) ?? actor?.commands.find((command) => command.attackType === "COMBO_SKILL") ?? null;
    return {
      slot,
      label: slots.value[index]?.label ?? `Character ${index + 1}`,
      actor,
      ultimateMaxEnergy: ultimate?.energyCost ?? 0,
      comboCommandId: combo?.id ?? null,
    };
  }),
);

function getLocalizedCharacterName(characterId: string | undefined, fallbackName?: string) {
  return getCharacterDisplayName({ id: characterId, fallbackName: fallbackName ?? "" }) || fallbackName || "";
}

function getCharacterSkillKeyFromCommand(command: CharacterCombatSnapshot["commands"][number] | null | undefined): CharacterSkillKey | null {
  if (!command) {
    return null;
  }
  switch (command.attackType) {
    case "BASIC_ATTACK":
      return "basic";
    case "BATTLE_SKILL":
      return "battleSkill";
    case "COMBO_SKILL":
      return "comboSkill";
    case "ULTIMATE":
      return "ultimate";
    default:
      return null;
  }
}

function getLocalizedCommandName(
  command: CharacterCombatSnapshot["commands"][number] | null | undefined,
  characterId: string | undefined,
  fallbackName?: string,
) {
  if (!command) {
    return fallbackName ?? "";
  }
  if (command.id === "alesh_combo_skill_rare_fin") {
    return currentLocale() === "zh-CN"
      ? "（珍鳞）凿孔底钓术"
      : "(Rare Fin) Auger Angling";
  }
  const skillKey = getCharacterSkillKeyFromCommand(command);
  if (skillKey) {
    if (skillKey === "basic") {
      if (currentLocale() === "zh-CN") {
        switch (command.basicAttackVariant) {
          case "dive_attack":
            return "下落攻击";
          case "final_strike":
            return "重击";
          case "finisher":
            return "处决技";
          default:
            return "普攻序列";
        }
      }
      switch (command.basicAttackVariant) {
        case "dive_attack":
          return t("rotation.diveAttack");
        case "final_strike":
          return t("rotation.finalStrike");
        case "finisher":
          return t("rotation.finisher");
        default:
          return t("rotation.basicAttackSequence");
      }
    }
    const actor = characterId
      ? (CHARACTERS.find((character) => character.id === characterId) ?? null)
      : null;
    return getCharacterSkillDisplayName({
      character: actor,
      skillKey,
      fallbackName: fallbackName ?? command.name,
    });
  }
  if (command.attackType === "GENERIC") {
    switch (command.genericActionType) {
      case "switch":
        return t("rotation.switch");
      case "switch_build":
        return t("rotation.swapBuild");
      case "dodge":
        return t("rotation.dodge");
      case "jump":
        return t("rotation.jump");
      default:
        break;
    }
  }
  return fallbackName ?? command.name;
}

function getLocalizedCommandBelongsType(command: CharacterCombatSnapshot["commands"][number] | null | undefined) {
  if (!command) {
    return t("rotation.generic");
  }

  switch (command.attackType) {
    case "BASIC_ATTACK":
      return t("builder.basicAttack");
    case "BATTLE_SKILL":
      return t("builder.battleSkill");
    case "COMBO_SKILL":
      return t("builder.comboSkill");
    case "ULTIMATE":
      return t("builder.ultimate");
    default:
      return t("rotation.generic");
  }
}

function currentLocale(): "en" | "zh-CN" {
  return locale.value === "zh-CN" ? "zh-CN" : "en";
}

function localizeStatusOrBuffLabel(label: string | null | undefined): string {
  return getLocalizedStatusBuffLabel(label, currentLocale());
}

const currentControlState = computed(() => getControlStateAtRealTime(cursorTime.value));

const selectedCharacterIsControlled = computed(() =>
  selectedLibrarySlot.value === currentControlState.value.controlledSlot,
);

const selectedCharacterSwitchLockRemaining = computed(() => {
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(selectedLibrarySlot.value) ?? NO_SWITCH_LOCK_UNTIL;
  const switchClock = cursorTime.value;
  return Math.max(0, lockedUntil - switchClock);
});

function getPrimaryCommandForSlot(
  slot: PartySlot,
  attackType: CharacterCombatSnapshot["commands"][number]["attackType"],
): CharacterCombatSnapshot["commands"][number] | null {
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return null;
  }
  const visible = actor.commands.filter((command) => command.attackType === attackType && !command.hiddenInLibrary);
  const all = actor.commands.filter((command) => command.attackType === attackType);
  const candidates = visible.length > 0 ? visible : all;
  if (candidates.length <= 0) {
    return null;
  }
  if (attackType === "BASIC_ATTACK") {
    return candidates.find((command) => command.basicAttackVariant === "sequence") ?? candidates[0] ?? null;
  }
  if (attackType === "COMBO_SKILL") {
    return candidates.find((command) => (command.comboCooldownOwnerCommandId ?? command.id) === command.id) ?? candidates[0] ?? null;
  }
  return candidates[0] ?? null;
}

function getComboTriggerLineageIds(
  actor: CharacterCombatSnapshot | null | undefined,
  comboCommandId: string | null | undefined,
): Set<string> {
  if (!actor || !comboCommandId) {
    return new Set();
  }
  const matchedCommand = actor.commands.find((command) => command.id === comboCommandId && command.attackType === "COMBO_SKILL");
  const comboTriggerId = matchedCommand?.comboTriggerId ?? matchedCommand?.id ?? comboCommandId;
  return new Set(
    actor.commands
      .filter((command) => command.attackType === "COMBO_SKILL")
      .filter((command) => (command.comboTriggerId ?? command.id) === comboTriggerId || command.id === comboTriggerId)
      .map((command) => command.id),
  );
}

function getActiveTriggeredComboWindowForSlot(slot: PartySlot, atTime: number) {
  const atGameTime = toGameTimeFromExtensions(atTime, simulation.value.timeExtensions);
  return [...simulation.value.comboWindows]
    .filter((window) => {
      if (window.slot !== slot || window.readyAt > atGameTime + 0.001) {
        return false;
      }
      const activeUntil = window.consumedAt != null
        ? Math.min(window.expiresAt, window.consumedAt)
        : window.expiresAt;
      return atGameTime < activeUntil - 0.001;
    })
    .sort((a, b) => b.readyAt - a.readyAt)[0] ?? null;
}

function addStepForSlot(slot: PartySlot, commandId: string) {
  return addStep(slot, commandId);
}

function getInsertionSlotForCommand(baseSlot: PartySlot, commandId: string, startTime = cursorTime.value): PartySlot {
  const actor = partyBySlot.value.get(baseSlot);
  const commandState = getCommandStateAtTime(baseSlot, startTime);
  const command = actor
    ? resolveCommandTransform(actor.commands, commandId, commandState)
      ?? actor.commands.find((entry) => entry.id === commandId)
      ?? null
    : null;
  if (!command) {
    return baseSlot;
  }
  if (command.genericActionType === "switch") {
    return baseSlot;
  }
  if (command.attackType === "BASIC_ATTACK" || command.requiresControlledOperator) {
    return currentControlState.value.controlledSlot;
  }
  return baseSlot;
}

function executeControlledBasicAttack() {
  const slot = currentControlState.value.controlledSlot;
  const command = getPrimaryCommandForSlot(slot, "BASIC_ATTACK");
  if (!command) {
    return;
  }
  addStepForSlot(slot, command.id);
}

function executeControlledDiveAttack() {
  const slot = currentControlState.value.controlledSlot;
  const actor = partyBySlot.value.get(slot);
  const command = actor?.commands.find((entry) =>
    entry.attackType === "BASIC_ATTACK" && entry.basicAttackVariant === "dive_attack");
  if (!command) {
    return;
  }
  addStepForSlot(slot, command.id);
}

function executeControlledGeneric(commandId: "__dodge" | "__jump") {
  if (commandId === "__dodge" && dodgeDisabledByContracts.value) {
    return;
  }
  addStepForSlot(currentControlState.value.controlledSlot, commandId);
}

function executeSwitchToSlot(slot: PartySlot) {
  const controlled = currentControlState.value.controlledSlot;
  if (slot === controlled) {
    return;
  }
  const placeSwitchAndFocus = () => {
    const createdStepId = addStepForSlot(slot, "__switch");
    if (!createdStepId) {
      return;
    }
    void nextTick(() => {
      const resolvedAction = simulation.value.actions.find((entry) => entry.stepId === createdStepId);
      if (resolvedAction) {
        cursorTime.value = clampCursorTime(resolvedAction.realStartTime);
        return;
      }
      const rawStep = rotation.value.steps.find((entry) => entry.id === createdStepId);
      if (rawStep?.startTime != null) {
        cursorTime.value = clampCursorTime(getLocalTimelineTimeFromStored(rawStep.startTime));
      }
    });
  };
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(slot) ?? NO_SWITCH_LOCK_UNTIL;
  const switchClock = cursorTime.value;
  if (lockedUntil > switchClock + 0.0001) {
    return;
  }
  placeSwitchAndFocus();
}

function getSwitchCooldownRemaining(slot: PartySlot): number {
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(slot) ?? NO_SWITCH_LOCK_UNTIL;
  const switchClock = cursorTime.value;
  return Math.max(0, lockedUntil - switchClock);
}

function executePrimarySkillForSlot(
  slot: PartySlot,
  attackType: "BATTLE_SKILL" | "ULTIMATE",
) {
  const command = getPrimaryCommandForSlot(slot, attackType);
  if (!command) {
    return;
  }
  addStepForSlot(slot, command.id);
}

function getSimpleComboCommandForSlot(slot: PartySlot): CharacterCombatSnapshot["commands"][number] | null {
  const triggeredWindow = getActiveTriggeredComboWindowForSlot(slot, cursorTime.value);
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return null;
  }
  if (triggeredWindow) {
    return actor.commands.find((command) => command.id === triggeredWindow.commandId) ?? null;
  }
  return getPrimaryCommandForSlot(slot, "COMBO_SKILL");
}

function executeComboForSlot(slot: PartySlot) {
  const command = getSimpleComboCommandForSlot(slot);
  if (!command) {
    return;
  }
  const createdStepId = addStepForSlot(slot, command.id);
  if (!createdStepId) {
    return;
  }
  // Overlap resolution may move the command away from the requested cursor
  // time. Refocus on its live cast boundary so the button immediately reads
  // the consumed combo window/cooldown state instead of the pre-cast state.
  void nextTick(() => {
    const resolvedAction = simulation.value.actions.find((entry) => entry.stepId === createdStepId);
    if (resolvedAction) {
      cursorTime.value = clampCursorTime(resolvedAction.realStartTime);
      return;
    }
    const rawStep = rotation.value.steps.find((entry) => entry.id === createdStepId);
    if (rawStep?.startTime != null) {
      cursorTime.value = clampCursorTime(getLocalTimelineTimeFromStored(rawStep.startTime));
    }
  });
}

function getSimpleComboState(slot: PartySlot) {
  return cursorCombatState.value.comboBySlot.get(slot) ?? { readyRatio: 1, label: t("rotation.ready"), mode: "normal" as const };
}

function isSimpleComboOnCooldown(slot: PartySlot): boolean {
  const state = getSimpleComboState(slot);
  return state.mode === "normal" && state.readyRatio < 0.999;
}

function getSimpleComboCooldownLabel(slot: PartySlot): string {
  return getSimpleComboState(slot).label;
}

function getSimpleUltimateEnergyRatio(slot: PartySlot): number {
  const display = partyDisplay.value.find((entry) => entry.slot === slot);
  if (!display || display.ultimateMaxEnergy <= 0) {
    return 0;
  }
  const current = cursorCombatState.value.energyBySlot.get(slot) ?? 0;
  return Math.max(0, Math.min(1, current / display.ultimateMaxEnergy));
}

function isSimpleUltimateReady(slot: PartySlot): boolean {
  const display = partyDisplay.value.find((entry) => entry.slot === slot);
  if (!display || display.ultimateMaxEnergy <= 0) {
    return false;
  }
  const current = cursorCombatState.value.energyBySlot.get(slot) ?? 0;
  return current >= display.ultimateMaxEnergy - 0.001;
}

const controlTimeline = computed(() => {
  const segments: ControlTimelineSegment[] = [];
  const markers: ControlSwitchMarker[] = [];
  let controlledSlot: PartySlot = getInitialControlledOperatorSlotForSimulation(simulation.value);
  let segmentStart = timelineStart.value;
  const switchBackLockedUntilBySlot = getInitialSwitchBackLockedUntilBySlotForSimulation(simulation.value);

  for (const action of getAuthoredSwitchActions()) {
    if (action.slot === controlledSlot) {
      continue;
    }

    const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? NO_SWITCH_LOCK_UNTIL;
    if (action.realStartTime < lockedUntil - 0.001) {
      continue;
    }

    segments.push({
      slot: controlledSlot,
      startTime: segmentStart,
      endTime: action.realStartTime,
    });

    markers.push({
      stepId: action.stepId,
      slot: action.slot,
      previousSlot: controlledSlot,
      time: action.realStartTime,
    });

    const previousControlledSlot = controlledSlot;
    controlledSlot = action.slot;
    segmentStart = action.realStartTime;
    switchBackLockedUntilBySlot.set(previousControlledSlot, action.realStartTime + SWITCH_BACK_COOLDOWN_SECONDS);
  }

  segments.push({
    slot: controlledSlot,
    startTime: segmentStart,
    endTime: timelineDuration.value,
  });

  return { segments, markers };
});

const targetEnemyTimeline = computed(() => {
  const targetChanges = (simulation.value.enemyTargetTimeline ?? [])
    .filter((entry) => entry.succeeded)
    .sort((a, b) => a.time - b.time);

  const segments: TargetEnemyTimelineSegment[] = [];
  const markers: TargetEnemyMarker[] = [];
  let activeSlotId = props.targetedEnemySlotId;
  let segmentStart = timelineStart.value;

  for (const change of targetChanges) {
    if (change.enemySlotId === activeSlotId) {
      continue;
    }
    segments.push({
      slotId: activeSlotId,
      startTime: segmentStart,
      endTime: change.time,
    });
    markers.push({
      commandPlacementId: change.sourceId ?? `auto_target:${change.reason}:${change.time}:${change.enemySlotId}`,
      slotId: change.enemySlotId,
      previousSlotId: activeSlotId,
      time: change.time,
    });
    activeSlotId = change.enemySlotId;
    segmentStart = change.time;
  }

  segments.push({
    slotId: activeSlotId,
    startTime: segmentStart,
    endTime: timelineDuration.value,
  });

  return { segments, markers };
});

type EnemyLifecycleMarkerDisplay = {
  enemySlotId: string;
  time: number;
  enemyId: string;
  type: EnemyLifecycleTimelineEntry["type"];
};

const countdownTimelineMarkers = computed<CountdownTimelineEntry[]>(() =>
  [...(simulation.value.countdownTimeline ?? [])].sort((left, right) =>
    left.time !== right.time ? left.time - right.time : left.value - right.value,
  ),
);

const relayTimelineMarkers = computed(() => {
  const nextScheme = rotationSchemes.value.schemes[activeSchemeIndex.value + 1] ?? null;
  return [...(simulation.value.relayTimeline ?? [])]
    .sort((left, right) => left.time - right.time)
    .map((entry) => ({
      ...entry,
      nextRotationName: nextScheme ? getLocalizedRotationSchemeName(nextScheme) : "",
    }));
});

const enemyLifecycleMarkersBySlot = computed<Record<string, EnemyLifecycleMarkerDisplay[]>>(() => {
  const grouped = new Map<string, EnemyLifecycleTimelineEntry[]>();
  for (const entry of simulation.value.enemyLifecycleTimeline ?? []) {
    const key = `${entry.enemySlotId}:${entry.time.toFixed(4)}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(entry);
    grouped.set(key, bucket);
  }

  const result: Record<string, EnemyLifecycleMarkerDisplay[]> = {};
  for (const entries of grouped.values()) {
    const first = entries[0];
    if (!first) {
      continue;
    }
    const spawned = entries.filter((entry) => entry.type === "spawned");
    const replaced = entries.filter((entry) => entry.type === "replaced");
    const transformed = entries.filter((entry) => entry.type === "transformed");
    const defeated = entries.filter((entry) => entry.type === "defeated");
    const chosen = spawned[spawned.length - 1]
      ?? replaced[replaced.length - 1]
      ?? transformed[transformed.length - 1]
      ?? defeated[defeated.length - 1];
    if (!chosen) {
      continue;
    }
    (result[first.enemySlotId] ??= []).push({
      enemySlotId: first.enemySlotId,
      time: first.time,
      enemyId: chosen.enemyId,
      type: chosen.type,
    });
  }

  for (const markers of Object.values(result)) {
    markers.sort((left, right) => left.time - right.time);
  }
  return result;
});

type TeamSpState = {
  generated: number;
  returned: number;
};

type ControlStateSnapshot = {
  controlledSlot: PartySlot;
  switchBackLockedUntilBySlot: Map<PartySlot, number>;
};

type ControlTimelineSegment = {
  slot: PartySlot;
  startTime: number;
  endTime: number;
};

type ControlSwitchMarker = {
  stepId: string;
  slot: PartySlot;
  previousSlot: PartySlot;
  time: number;
};

type TargetEnemyTimelineSegment = {
  slotId: string;
  startTime: number;
  endTime: number;
};

type TargetEnemyMarker = {
  commandPlacementId: string;
  slotId: string;
  previousSlotId: string;
  time: number;
};

type AuthoredSwitchAction = {
  stepId: string;
  slot: PartySlot;
  realStartTime: number;
};

function getRawCommandForAction(action: { slot: PartySlot; commandId: string }) {
  return partyBySlot.value.get(action.slot)?.commands.find((entry) => entry.id === action.commandId) ?? null;
}

function getAuthoredSwitchActions(): AuthoredSwitchAction[] {
  const currentRealTimeBySlot = new Map<PartySlot, number>();
  const usedSwitchFrames = new Set<number>();
  const switchActions: AuthoredSwitchAction[] = [];

  for (const step of rotation.value.steps) {
    const command = getRawCommandForAction({ slot: step.slot, commandId: step.commandId });
    if (command?.genericActionType !== "switch") {
      continue;
    }

    const slotCursor = currentRealTimeBySlot.get(step.slot) ?? 0;
    let realStartTime = getLocalTimelineTimeFromStored(step.startTime ?? slotCursor);
    let frame = Math.round(realStartTime * 60);
    while (usedSwitchFrames.has(frame)) {
      frame += 1;
    }
    usedSwitchFrames.add(frame);
    realStartTime = frame / 60;

    switchActions.push({
      stepId: step.id,
      slot: step.slot,
      realStartTime,
    });
    currentRealTimeBySlot.set(step.slot, roundToSnap(Math.max(slotCursor, realStartTime) + command.durationFrames / 60));
  }

  return switchActions.sort((a, b) => a.realStartTime - b.realStartTime);
}

function getCommandForAction(action: RotationSimulationResult["actions"][number]) {
  const actor = partyBySlot.value.get(action.slot);
  if (!actor) {
    return null;
  }
  const commandState = getCommandStateAtTime(action.slot, action.realStartTime);
  return resolveCommandTransform(actor.commands, action.commandId, commandState)
    ?? getRawCommandForAction(action)
    ?? null;
}

function getActiveTargetedEnemySlotAtRealTime(
  targetTime: number,
  simulationResult: RotationSimulationResult = simulation.value,
): string {
  let activeTargetSlotId = props.targetedEnemySlotId;
  for (const change of simulationResult.enemyTargetTimeline ?? []) {
    if (change.time > targetTime + 0.0001) {
      break;
    }
    if (change.succeeded) {
      activeTargetSlotId = change.enemySlotId;
    }
  }
  return activeTargetSlotId;
}

function getControlStateAtRealTime(
  targetTime: number,
  simulationResult: RotationSimulationResult = simulation.value,
): ControlStateSnapshot {
  const switchActions = getAuthoredSwitchActions()
    .filter((action) => action.realStartTime <= targetTime);

  let controlledSlot: PartySlot = getInitialControlledOperatorSlotForSimulation(simulationResult);
  const switchBackLockedUntilBySlot = getInitialSwitchBackLockedUntilBySlotForSimulation(simulationResult);

  for (const action of switchActions) {
    if (action.slot === controlledSlot) {
      continue;
    }

    const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? NO_SWITCH_LOCK_UNTIL;
    if (action.realStartTime < lockedUntil - 0.001) {
      continue;
    }

    const previousControlledSlot = controlledSlot;
    controlledSlot = action.slot;
    switchBackLockedUntilBySlot.set(previousControlledSlot, action.realStartTime + SWITCH_BACK_COOLDOWN_SECONDS);
  }

  return {
    controlledSlot,
    switchBackLockedUntilBySlot,
  };
}

function addReturnedSp(state: TeamSpState, amount: number) {
  if (amount <= 0) return;
  const space = TEAM_SP_MAX - (state.generated + state.returned);
  state.returned += Math.min(space, amount);
}

function addGeneratedSp(state: TeamSpState, amount: number, cap = TEAM_SP_MAX) {
  if (amount <= 0) return;

  const directSpace = Math.max(0, cap - (state.generated + state.returned));
  const directAdded = Math.min(directSpace, amount);
  state.generated += directAdded;
  let remaining = amount - directAdded;

  if (remaining > 0 && state.returned > 0) {
    const converted = Math.min(state.returned, remaining);
    state.returned -= converted;
    state.generated += converted;
    remaining -= converted;
  }
}

function getSpRulesAtGameTime(time: number): { cap: number; regen: number } {
  if (time < 0) {
    return { cap: PRE_BATTLE_SP_MAX, regen: PRE_BATTLE_SP_REGEN_RATE };
  }
  return { cap: TEAM_SP_MAX, regen: simulation.value.initialResources.spRegenRate };
}

function hasTeamEncumberedAtTime(time: number, simulationResult = simulation.value): boolean {
  const actorState = getActorStateAtTime(simulationResult, 0, time);
  const activeTeamStatusIds = new Set(actorState.activeTeamStatuses.map((status) => status.id));
  return activeTeamStatusIds.has("team_encumbered") && !activeTeamStatusIds.has("team_encumbered_suppression");
}

function addPassiveSpRegenSegment(
  state: TeamSpState,
  fromTime: number,
  toTime: number,
  simulationResult = simulation.value,
) {
  const start = Math.min(fromTime, toTime);
  const end = Math.max(fromTime, toTime);
  if (end <= start) {
    return;
  }

  const slotZeroStates = simulationResult.actorStateTimeline.filter((state) => state.slot === 0 && state.time <= end);
  const statusExpiryTimes = slotZeroStates.flatMap((state) => state.activeTeamStatuses
    .filter((status) => status.id === "team_encumbered" || status.id === "team_encumbered_suppression")
    .map((status) => status.timeScale === "real"
      ? status.expiresAt
      : toRealTimeFromExtensions(status.expiresAt, simulationResult.timeExtensions))
    .filter((time) => Number.isFinite(time) && time > start + 0.0001 && time < end - 0.0001));
  const boundaries = [...new Set([
    start,
    ...slotZeroStates
      .filter((state) => state.time > start + 0.0001 && state.time < end - 0.0001)
      .map((state) => state.time),
    ...statusExpiryTimes,
    end,
  ])].sort((left, right) => left - right);

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]!;
    const segmentEnd = boundaries[index + 1]!;
    if (segmentEnd <= segmentStart + 0.0001) {
      continue;
    }
    if (hasTeamEncumberedAtTime(segmentStart, simulationResult)) {
      continue;
    }

    // Passive SP regen should follow game-time progression, so it pauses during time freeze.
    const startGameTime = toGameTimeFromExtensions(segmentStart, simulationResult.timeExtensions);
    const endGameTime = toGameTimeFromExtensions(segmentEnd, simulationResult.timeExtensions);
    if (endGameTime <= startGameTime) {
      continue;
    }

    if (startGameTime < 0 && endGameTime > 0) {
      addGeneratedSp(state, (0 - startGameTime) * PRE_BATTLE_SP_REGEN_RATE, PRE_BATTLE_SP_MAX);
      addGeneratedSp(state, endGameTime * simulationResult.initialResources.spRegenRate, TEAM_SP_MAX);
      continue;
    }

    const rules = getSpRulesAtGameTime(startGameTime);
    addGeneratedSp(state, (endGameTime - startGameTime) * rules.regen, rules.cap);
  }
}

function consumeTeamSp(state: TeamSpState, amount: number): number {
  let remaining = Math.max(0, amount);
  const consumedReturned = Math.min(state.returned, remaining);
  state.returned -= consumedReturned;
  remaining -= consumedReturned;

  const consumedGenerated = Math.min(state.generated, remaining);
  state.generated -= consumedGenerated;
  return consumedGenerated;
}

function hasNoEnergyGainBuffAtTime(args: {
  slot: PartySlot;
  time: number;
  actorStates: ActorCombatStateSnapshot[];
}): boolean {
  const latest = [...args.actorStates]
    .filter((state) => state.slot === args.slot && state.time <= args.time + 0.0001)
    .sort((a, b) => b.time - a.time)[0];
  if (!latest) {
    return false;
  }
  return latest.activeBuffs.some((buff) => buff.id === "no_energy_gain");
}

function canGainEnergyFromSource(args: {
  targetSlot: PartySlot;
  sourceType: "command" | "other";
  sourceSlot?: PartySlot;
  sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
}): boolean {
  const actor = partyBySlot.value.get(args.targetSlot);
  if (!actor?.restrictEnergyGainToOwnBattleOrComboCommands) {
    return true;
  }
  if (args.sourceType !== "command") {
    return false;
  }
  if (args.sourceSlot !== args.targetSlot) {
    return false;
  }
  return args.sourceCommandAttackType === "BATTLE_SKILL" || args.sourceCommandAttackType === "COMBO_SKILL";
}

function getUltEnergyGainMultiplierAtTime(slot: PartySlot, time: number, simulationResult = simulation.value): number {
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return 1;
  }
  const actorState = getActorStateAtTime(simulationResult, slot, time);
  let multiplier = actor.mods.ULT_GAIN_PCT ?? 1;
  for (const buff of actorState.activeBuffs) {
    multiplier += buff.effects?.ULT_GAIN_PCT ?? 0;
  }
  return Math.max(0, multiplier);
}

function applyUltimateEnergyGain(args: {
  energyBySlot: Map<PartySlot, number>;
  energyMaxBySlot: Map<PartySlot, number>;
  actorStates: ActorCombatStateSnapshot[];
  targetSlot: PartySlot;
  time: number;
  rawAmount: number;
  sourceType: "command" | "other";
  sourceSlot?: PartySlot;
  sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
  ignoreUltimateGainEfficiency?: boolean;
  simulationResult?: RotationSimulationResult;
}) {
  if (args.rawAmount <= 0) {
    return;
  }
  const simulationResult = args.simulationResult ?? simulation.value;
  const gameTime = toGameTimeFromExtensions(args.time, simulationResult.timeExtensions);
  if (gameTime < 0) {
    return;
  }
  if (hasNoEnergyGainBuffAtTime({
    slot: args.targetSlot,
    time: args.time,
    actorStates: args.actorStates,
  })) {
    return;
  }
  if (!canGainEnergyFromSource({
    targetSlot: args.targetSlot,
    sourceType: args.sourceType,
    sourceSlot: args.sourceSlot,
    sourceCommandAttackType: args.sourceCommandAttackType,
  })) {
    return;
  }
  const gainMultiplier = args.ignoreUltimateGainEfficiency
    ? 1
    : getUltEnergyGainMultiplierAtTime(args.targetSlot, args.time, simulationResult);
  const gained = args.rawAmount * gainMultiplier;
  if (gained <= 0) {
    return;
  }
  const energyMax = args.energyMaxBySlot.get(args.targetSlot) ?? 0;
  const currentEnergy = args.energyBySlot.get(args.targetSlot) ?? 0;
  args.energyBySlot.set(args.targetSlot, Math.min(energyMax, currentEnergy + gained));
}

function getBonusEnemyInterruptedSpEventsForSimulation(simulationResult: RotationSimulationResult) {
  return simulationResult.events
    .filter((event) => event.type === "ENEMY_COMMAND_INTERRUPTED" && (event.amount ?? 0) > 0)
    .map((event) => ({ time: event.time, amount: event.amount ?? 0 }));
}

function getBonusSpReturnedEventsForSimulation(simulationResult: RotationSimulationResult) {
  return simulationResult.events
    .filter((event) => event.type === "SP_RETURNED" && (event.amount ?? 0) > 0)
    .map((event) => ({ time: event.time, amount: event.amount ?? 0 }));
}

function getBonusSpGeneratedEventsForSimulation(simulationResult: RotationSimulationResult) {
  return simulationResult.events
    .filter((event) => event.type === "SP_GENERATED" && (event.amount ?? 0) > 0)
    .map((event) => ({ time: event.time, amount: event.amount ?? 0 }));
}

type CursorResourceEvent =
  | {
    time: number;
    type: "action-start";
    slot: PartySlot;
    spCost: number;
    energyCost: number;
    commandAttackType: CharacterCombatSnapshot["commands"][number]["attackType"];
    isSwitch: boolean;
  }
  | {
    time: number;
    type: "action-end";
    slot: PartySlot;
    energyGain: number;
    spGeneratedOnEnd: number;
    spReturnedOnEnd: number;
    commandAttackType: CharacterCombatSnapshot["commands"][number]["attackType"];
  }
  | {
    time: number;
    type: "hit";
    slot: PartySlot;
    spGenerated: number;
    spReturned: number;
    energyReturn: number;
    ignoreUltimateGainEfficiency?: boolean;
    requiresControlledOperator: boolean;
    sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
  }
  | { time: number; type: "bonus-return"; amount: number }
  | { time: number; type: "bonus-generated"; amount: number }
  | { time: number; type: "skill-return"; amount: number };

const compiledCursorResourceEvents = computed<CursorResourceEvent[]>(() => {
  const events: CursorResourceEvent[] = [];
  for (const action of simulation.value.actions) {
    const command = getRawCommandForAction(action);
    if (!command || action.nullified) continue;
    events.push({
      time: action.realStartTime,
      type: "action-start",
      slot: action.slot,
      spCost: command.spCost,
      energyCost: command.energyCost,
      commandAttackType: command.attackType,
      isSwitch: command.genericActionType === "switch",
    });
    if (!action.interrupted) {
      events.push({
        time: action.realEndTime,
        type: "action-end",
        slot: action.slot,
        energyGain: command.energyGain,
        spGeneratedOnEnd: command.spGeneratedOnEnd,
        spReturnedOnEnd: command.spReturnedOnEnd,
        commandAttackType: command.attackType,
      });
    }
  }
  for (const hit of simulation.value.timeline) {
    events.push({
      time: hit.time,
      type: "hit",
      slot: hit.slot,
      spGenerated: hit.spGenerated,
      spReturned: hit.spReturned,
      energyReturn: hit.energyReturn,
      ignoreUltimateGainEfficiency: hit.ignoreUltimateGainEfficiency,
      requiresControlledOperator: hit.requiresControlledOperator,
      sourceCommandAttackType: hit.calculationContext?.attackType,
    });
  }
  for (const event of getBonusEnemyInterruptedSpEventsForSimulation(simulation.value)) {
    events.push({ time: event.time, type: "bonus-return", amount: event.amount });
  }
  for (const event of getBonusSpReturnedEventsForSimulation(simulation.value)) {
    events.push({ time: event.time, type: "skill-return", amount: event.amount });
  }
  for (const event of getBonusSpGeneratedEventsForSimulation(simulation.value)) {
    events.push({ time: event.time, type: "bonus-generated", amount: event.amount });
  }
  const order = { "action-start": 0, "bonus-return": 1, "bonus-generated": 1, "skill-return": 1, hit: 2, "action-end": 3 } as const;
  return events.sort((left, right) => left.time - right.time || order[left.type] - order[right.type]);
});

const compiledCursorDamageTimeline = computed(() => {
  let total = 0;
  return simulation.value.timeline.map((entry) => ({
    time: entry.time,
    total: (total += entry.damage),
  }));
});

function upperBoundByTime<T extends { time: number }>(entries: T[], targetTime: number): number {
  let low = 0;
  let high = entries.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (entries[middle]!.time <= targetTime + 0.0001) low = middle + 1;
    else high = middle;
  }
  return low;
}

function buildSimulationResourceStateAtTime(simulationResult: RotationSimulationResult, targetTime: number) {
  const initialResources = simulationResult.initialResources;
  const checkpoints = simulationResult.simulationCheckpoints ?? [];
  const checkpointIndex = upperBoundByTime(checkpoints, targetTime) - 1;
  const checkpointCandidate = checkpointIndex >= 0 ? checkpoints[checkpointIndex] : undefined;
  const resourceCheckpoint = checkpointCandidate
    && (checkpointCandidate.time > 0.0001 || simulationResult.displayTimeOffset !== 0)
    ? checkpointCandidate
    : undefined;
  const energyBySlot = new Map(resourceCheckpoint?.runtime.energyBySlot ?? initialResources.energyBySlot);
  const energyMaxBySlot = new Map(initialResources.energyMaxBySlot);
  const teamSp: TeamSpState = {
    generated: resourceCheckpoint?.runtime.teamSpGenerated ?? initialResources.teamSpGenerated,
    returned: resourceCheckpoint?.runtime.teamSpReturned ?? initialResources.teamSpReturned,
  };
  let controlledSlot: PartySlot = resourceCheckpoint?.runtime.controlledOperatorSlot
    ?? getInitialControlledOperatorSlotForSimulation(simulationResult);
  const spEvents = compiledCursorResourceEvents.value;
  const baseTime = resourceCheckpoint?.time ?? Math.min(targetTime, 0);
  let lastSpTime = baseTime;
  const startIndex = upperBoundByTime(spEvents, baseTime);
  const endIndex = upperBoundByTime(spEvents, targetTime);
  for (let eventIndex = startIndex; eventIndex < endIndex; eventIndex += 1) {
    const event = spEvents[eventIndex]!;
    const clampedTime = Math.min(event.time, targetTime);
    addPassiveSpRegenSegment(teamSp, lastSpTime, clampedTime, simulationResult);

    if (event.type === "action-start") {
      if (event.energyCost > 0) {
        const currentEnergy = energyBySlot.get(event.slot) ?? 0;
        energyBySlot.set(event.slot, Math.max(0, currentEnergy - event.energyCost));
      }

      const generatedConsumed = consumeTeamSp(teamSp, event.spCost);
      if (generatedConsumed > 0) {
        for (const slot of energyMaxBySlot.keys()) {
          applyUltimateEnergyGain({
            energyBySlot,
            energyMaxBySlot,
            actorStates: simulationResult.actorStateTimeline,
            targetSlot: slot,
            time: event.time,
            rawAmount: generatedConsumed * GENERATED_SP_TEAM_ENERGY_RATE,
            sourceType: "command",
            sourceSlot: event.slot,
            sourceCommandAttackType: event.commandAttackType,
            simulationResult,
          });
        }
      }

      if (event.isSwitch) {
        controlledSlot = event.slot;
      }
    }

    if (event.type === "action-end") {
      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulationResult.actorStateTimeline,
        targetSlot: event.slot,
        time: event.time,
        rawAmount: event.energyGain,
        sourceType: "command",
        sourceSlot: event.slot,
        sourceCommandAttackType: event.commandAttackType,
        simulationResult,
      });
      addGeneratedSp(teamSp, event.spGeneratedOnEnd);
      addReturnedSp(teamSp, event.spReturnedOnEnd);
    }

    if (event.type === "bonus-return") {
      addReturnedSp(teamSp, event.amount);
    }
    if (event.type === "skill-return") {
      addReturnedSp(teamSp, event.amount);
    }
    if (event.type === "bonus-generated") {
      addGeneratedSp(teamSp, event.amount);
    }

    if (event.type === "hit") {
      if (!event.requiresControlledOperator || event.slot === controlledSlot) {
        addGeneratedSp(teamSp, event.spGenerated);
      }
      addReturnedSp(teamSp, event.spReturned);
      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulationResult.actorStateTimeline,
        targetSlot: event.slot,
        time: event.time,
        rawAmount: event.energyReturn,
        sourceType: "command",
        sourceSlot: event.slot,
        sourceCommandAttackType: event.sourceCommandAttackType,
        ignoreUltimateGainEfficiency: event.ignoreUltimateGainEfficiency,
        simulationResult,
      });
    }

    lastSpTime = clampedTime;
  }

  if (targetTime > lastSpTime) {
    addPassiveSpRegenSegment(teamSp, lastSpTime, targetTime, simulationResult);
  }

  return {
    teamSpGenerated: teamSp.generated,
    teamSpReturned: teamSp.returned,
    spRegenRate: simulationResult.initialResources.spRegenRate,
    energyBySlot,
    energyMaxBySlot,
  };
}

function getComboCooldownStartTimes(args: {
  slot: PartySlot;
  command: CharacterCombatSnapshot["commands"][number];
  action: RotationSimulationResult["actions"][number];
}): { real: number; game: number } {
  if (args.command.comboCooldownStartsAt !== "end") {
    return {
      real: args.action.realStartTime,
      game: args.action.startTime,
    };
  }

  let startReal = args.action.realEndTime;
  const relatedWindows = simulation.value.comboWindows.filter(
    (window) => window.slot === args.slot && window.sourceStepId === args.action.stepId,
  );
  for (const window of relatedWindows) {
    const activeUntil = window.consumedAt != null
      ? Math.min(window.expiresAt, window.consumedAt)
      : window.expiresAt;
    const activeUntilReal = toRealTimeFromExtensions(activeUntil, simulation.value.timeExtensions);
    if (activeUntilReal > startReal) {
      startReal = activeUntilReal;
    }
  }

  return {
    real: startReal,
    game: toGameTimeFromExtensions(startReal, simulation.value.timeExtensions),
  };
}

function getInitialComboRuntimeState() {
  return simulation.value.simulationCheckpoints?.[0]?.runtime ?? null;
}

function getInheritedActiveComboWindowAtTime(slot: PartySlot, targetGameTime: number) {
  const runtime = getInitialComboRuntimeState();
  const window = runtime?.activeComboWindowBySlot?.get(slot);
  if (!window) {
    return null;
  }
  const activeUntil = window.consumedAt != null
    ? Math.min(window.expiresAt, window.consumedAt)
    : window.expiresAt;
  if (window.readyAt > targetGameTime + 0.001 || targetGameTime >= activeUntil - 0.001) {
    return null;
  }
  return window;
}

function getInheritedComboCooldownStateAtTime(args: {
  slot: PartySlot;
  comboCommand: CharacterCombatSnapshot["commands"][number] | null | undefined;
  targetTime: number;
  currentGameTime: number;
}) {
  const runtime = getInitialComboRuntimeState();
  if (!runtime || !args.comboCommand) {
    return null;
  }
  const cooldownOwnerId = args.comboCommand.comboCooldownOwnerCommandId ?? args.comboCommand.id;
  if (args.comboCommand.id !== cooldownOwnerId) {
    return null;
  }
  const pendingCooldown = runtime.pendingComboCooldownBySlot?.get(args.slot);
  const cooldownUntilEntry = runtime.comboCooldownUntilBySlot?.get(args.slot);
  if (pendingCooldown == null && cooldownUntilEntry == null) {
    return null;
  }
  const currentTime = args.comboCommand.comboCooldownTimeScale === "real"
    ? args.targetTime
    : args.currentGameTime;
  const cooldownUntil = cooldownUntilEntry ?? 0;
  if (pendingCooldown == null && currentTime >= cooldownUntil - 0.0001) {
    return null;
  }
  return {
    pendingCooldown,
    cooldownUntil,
    currentTime,
  };
}

const cursorCombatState = computed(() => {
  const targetTime = cursorTime.value;
  const currentGameTime = toGameTimeFromExtensions(targetTime, simulation.value.timeExtensions);
  const resourceState = buildSimulationResourceStateAtTime(simulation.value, targetTime);
  const energyBySlot = resourceState.energyBySlot;
  const energyMaxBySlot = resourceState.energyMaxBySlot;
  const comboBySlot = new Map<PartySlot, { readyRatio: number; label: string; mode?: "normal" | "triggered" | "perfect_window" | "executing" }>();
  for (const display of partyDisplay.value) {
    comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.ready"), mode: "normal" });
  }

  const damageIndex = upperBoundByTime(compiledCursorDamageTimeline.value, targetTime) - 1;
  const totalDamage = damageIndex >= 0
    ? compiledCursorDamageTimeline.value[damageIndex]!.total
    : 0;

  for (const display of partyDisplay.value) {
    if (!display.comboCommandId) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.noCombo"), mode: "normal" });
      continue;
    }
    const comboLineageIds = getComboTriggerLineageIds(display.actor, display.comboCommandId);
    const comboCommand = display.actor?.commands.find((command) =>
      command.id === display.comboCommandId || (comboLineageIds.has(command.id) && (command.comboCooldownOwnerCommandId ?? command.id) === command.id),
    );

    const activeWindow = [...simulation.value.comboWindows]
      .filter((window) => {
        if (window.slot !== display.slot || window.readyAt > currentGameTime + 0.001) {
          return false;
        }

        const activeUntil = window.consumedAt != null
          ? Math.min(window.expiresAt, window.consumedAt)
          : window.expiresAt;
        return currentGameTime < activeUntil - 0.001;
      })
      .sort((a, b) => b.readyAt - a.readyAt)[0];

    const inheritedWindow = activeWindow ? null : getInheritedActiveComboWindowAtTime(display.slot, currentGameTime);
    const resolvedWindow = activeWindow ?? inheritedWindow;

    if (resolvedWindow) {
      const window = resolvedWindow;
      const isPerfectWindow = window.perfectTimingStartAt != null
        && window.perfectTimingEndAt != null
        && currentGameTime >= window.perfectTimingStartAt
        && currentGameTime <= window.perfectTimingEndAt;
      comboBySlot.set(
        display.slot,
        isPerfectWindow
          ? { readyRatio: 1, label: t("rotation.perfectWindow"), mode: "perfect_window" }
          : { readyRatio: 1, label: t("rotation.ready"), mode: "triggered" },
      );
      continue;
    }

    const comboAction = [...simulation.value.actions]
      .filter(
        (action) =>
          action.slot === display.slot &&
          comboLineageIds.has(action.commandId) &&
          action.realStartTime <= targetTime + 0.001,
      )
      .sort((a, b) => b.realStartTime - a.realStartTime)[0];

    if (!comboAction) {
      const inheritedCooldownState = getInheritedComboCooldownStateAtTime({
        slot: display.slot,
        comboCommand,
        targetTime,
        currentGameTime,
      });
      if (inheritedCooldownState) {
        const remaining = inheritedCooldownState.pendingCooldown != null
          ? Math.max(0, inheritedCooldownState.pendingCooldown.durationSeconds)
          : Math.max(0, inheritedCooldownState.cooldownUntil - inheritedCooldownState.currentTime);
        const totalDuration = inheritedCooldownState.pendingCooldown?.durationSeconds
          ?? comboCommand?.comboCooldownSeconds
          ?? 0;
        const progress = totalDuration > 0
          ? Math.min(1, Math.max(0, 1 - remaining / totalDuration))
          : 0;
        comboBySlot.set(display.slot, {
          readyRatio: progress,
          label: t("timeline.readyWithCountdown", { value: remaining.toFixed(1) }),
          mode: "normal",
        });
        continue;
      }
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.notTriggered"), mode: "normal" });
      continue;
    }

    if (
      comboCommand?.comboCooldownStartsAt === "end"
      && comboAction.realStartTime <= targetTime
      && targetTime < comboAction.realEndTime
      && !comboAction.interrupted
    ) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.executing"), mode: "executing" });
      continue;
    }

    const cooldown = comboAction.resolvedComboCooldownSeconds
      ?? comboCommand?.comboCooldownSeconds
      ?? 0;
    const cooldownTimeScale = comboCommand?.comboCooldownTimeScale ?? "real";
    const cooldownStartTimes = comboCommand
      ? getComboCooldownStartTimes({
        slot: display.slot,
        command: comboCommand,
        action: comboAction,
      })
      : { real: comboAction.realStartTime, game: comboAction.startTime };
    const cooldownStart = cooldownTimeScale === "real" ? cooldownStartTimes.real : cooldownStartTimes.game;
    const cooldownNow = cooldownTimeScale === "real" ? targetTime : currentGameTime;

    if (cooldown <= 0 || cooldownNow >= cooldownStart + cooldown) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.notTriggered"), mode: "normal" });
      continue;
    }

    const remaining = Math.max(0, cooldownStart + cooldown - cooldownNow);
    const progress = Math.min(1, Math.max(0, 1 - remaining / cooldown));
    comboBySlot.set(display.slot, {
      readyRatio: progress,
      label: t("timeline.readyWithCountdown", { value: Math.max(0, remaining).toFixed(1) }),
      mode: "normal",
    });
  }

  return {
    cursorTime: targetTime,
    cursorGameTime: currentGameTime,
    teamSpTotal: resourceState.teamSpGenerated + resourceState.teamSpReturned,
    teamSpGenerated: resourceState.teamSpGenerated,
    teamSpReturned: resourceState.teamSpReturned,
    totalDamage,
    stagger: currentEnemyState.value.currentStagger,
    energyBySlot,
    comboBySlot,
  };
});

const actionValidationByStep = computed(() => {
  const validations = new Map<string, string>();
  const initialResources = simulation.value.initialResources;
  const energyBySlot = new Map(initialResources.energyBySlot);
  const energyMaxBySlot = new Map(initialResources.energyMaxBySlot);
  let controlledSlot: PartySlot = getInitialControlledOperatorSlotForSimulation(simulation.value);
  const switchBackLockedUntilBySlot = getInitialSwitchBackLockedUntilBySlotForSimulation(simulation.value);
  const teamSp: TeamSpState = {
    generated: initialResources.teamSpGenerated,
    returned: initialResources.teamSpReturned,
  };

  const validationEvents: Array<
    | { time: number; type: "action-start"; action: RotationSimulationResult["actions"][number] }
    | { time: number; type: "action-end"; action: RotationSimulationResult["actions"][number] }
    | { time: number; type: "hit"; hit: RotationSimulationResult["timeline"][number] }
    | { time: number; type: "bonus-return"; amount: number }
    | { time: number; type: "bonus-generated"; amount: number }
    | { time: number; type: "skill-return"; amount: number }
  > = [];

  for (const action of simulation.value.actions) {
    if (!action.nullified) {
      validationEvents.push({ time: action.realStartTime, type: "action-start", action });
    }
    if (!action.nullified && !action.interrupted) {
      validationEvents.push({ time: action.realEndTime, type: "action-end", action });
    }
  }

  for (const hit of simulation.value.timeline) {
    validationEvents.push({ time: hit.time, type: "hit", hit });
  }
  for (const event of bonusEnemyInterruptedSpEvents.value) {
    validationEvents.push({ time: event.time, type: "bonus-return", amount: event.amount });
  }
  for (const event of bonusSpReturnedEvents.value) {
    validationEvents.push({ time: event.time, type: "skill-return", amount: event.amount });
  }
  for (const event of bonusSpGeneratedEvents.value) {
    validationEvents.push({ time: event.time, type: "bonus-generated", amount: event.amount });
  }

  validationEvents.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    const order = { "action-start": 0, "bonus-return": 1, "bonus-generated": 1, "skill-return": 1, hit: 2, "action-end": 3 } as const;
    return order[a.type] - order[b.type];
  });

  // Relayed initial resources are already checkpointed at local time zero.
  // The negative stage-begin marker belongs to the preceding rotation and must
  // not be integrated again by this rotation's action validator.
  let lastSpTime = simulation.value.displayTimeOffset !== 0
    ? 0
    : Math.min(0, timelineStart.value);
  const validationEndTime = validationEvents[validationEvents.length - 1]?.time ?? lastSpTime;
  const slotZeroStates = simulation.value.actorStateTimeline
    .filter((state) => state.slot === 0 && state.time <= validationEndTime + 0.0001)
    .sort((left, right) => left.time - right.time);
  const validationBoundaryTimes = [...new Set([
    lastSpTime,
    ...slotZeroStates.flatMap((state) => [
      state.time,
      ...state.activeTeamStatuses
        .filter((status) => status.id === "team_encumbered" || status.id === "team_encumbered_suppression")
        .map((status) => status.timeScale === "real"
          ? status.expiresAt
          : toRealTimeFromExtensions(status.expiresAt, simulation.value.timeExtensions)),
    ]),
    validationEndTime,
  ])]
    .filter((time) => Number.isFinite(time) && time >= lastSpTime - 0.0001 && time <= validationEndTime + 0.0001)
    .sort((left, right) => left - right);
  const validationSpSegments: Array<{ start: number; end: number; blocked: boolean }> = [];
  let validationStateIndex = -1;
  for (let index = 0; index < validationBoundaryTimes.length - 1; index += 1) {
    const start = validationBoundaryTimes[index]!;
    const end = validationBoundaryTimes[index + 1]!;
    if (end <= start + 0.0001) {
      continue;
    }
    while (
      validationStateIndex + 1 < slotZeroStates.length
      && slotZeroStates[validationStateIndex + 1]!.time <= start + 0.0001
    ) {
      validationStateIndex += 1;
    }
    const state = slotZeroStates[validationStateIndex];
    const gameTime = toGameTimeFromExtensions(start, simulation.value.timeExtensions);
    const activeStatusIds = new Set((state?.activeTeamStatuses ?? [])
      .filter((status) => status.timeScale === "real" ? status.expiresAt > start : status.expiresAt > gameTime)
      .map((status) => status.id));
    validationSpSegments.push({
      start,
      end,
      blocked: activeStatusIds.has("team_encumbered") && !activeStatusIds.has("team_encumbered_suppression"),
    });
  }
  let validationSpSegmentIndex = 0;
  const consumedComboWindowByKey = new Map<string, RotationSimulationResult["comboWindows"][number]>();
  for (const window of simulation.value.comboWindows) {
    if (window.consumedAt == null) {
      continue;
    }
    consumedComboWindowByKey.set(`${window.slot}:${window.commandId}:${window.consumedAt.toFixed(3)}`, window);
  }
  const previousComboActionByKey = new Map<string, RotationSimulationResult["actions"][number]>();
  const addValidationPassiveSp = (fromTime: number, toTime: number) => {
    while (
      validationSpSegmentIndex < validationSpSegments.length
      && validationSpSegments[validationSpSegmentIndex]!.end <= fromTime + 0.0001
    ) {
      validationSpSegmentIndex += 1;
    }
    let index = validationSpSegmentIndex;
    while (index < validationSpSegments.length) {
      const segment = validationSpSegments[index]!;
      if (segment.start >= toTime - 0.0001) {
        break;
      }
      const start = Math.max(fromTime, segment.start);
      const end = Math.min(toTime, segment.end);
      if (!segment.blocked && end > start + 0.0001) {
        const startGameTime = toGameTimeFromExtensions(start, simulation.value.timeExtensions);
        const endGameTime = toGameTimeFromExtensions(end, simulation.value.timeExtensions);
        if (startGameTime < 0 && endGameTime > 0) {
          addGeneratedSp(teamSp, -startGameTime * PRE_BATTLE_SP_REGEN_RATE, PRE_BATTLE_SP_MAX);
          addGeneratedSp(teamSp, endGameTime * simulation.value.initialResources.spRegenRate, TEAM_SP_MAX);
        } else if (endGameTime > startGameTime) {
          const rules = startGameTime < 0
            ? { cap: PRE_BATTLE_SP_MAX, regen: PRE_BATTLE_SP_REGEN_RATE }
            : { cap: TEAM_SP_MAX, regen: simulation.value.initialResources.spRegenRate };
          addGeneratedSp(teamSp, (endGameTime - startGameTime) * rules.regen, rules.cap);
        }
      }
      if (segment.end <= toTime + 0.0001) {
        index += 1;
      } else {
        break;
      }
    }
    validationSpSegmentIndex = index;
  };

  for (const event of validationEvents) {
    addValidationPassiveSp(lastSpTime, event.time);
    lastSpTime = event.time;

    if (event.type === "bonus-return") {
      addReturnedSp(teamSp, event.amount);
      continue;
    }
    if (event.type === "skill-return") {
      addReturnedSp(teamSp, event.amount);
      continue;
    }
    if (event.type === "bonus-generated") {
      addGeneratedSp(teamSp, event.amount);
      continue;
    }

    if (event.type === "hit") {
      const hit = event.hit;
      if (!hit.requiresControlledOperator || hit.slot === controlledSlot) {
        addGeneratedSp(teamSp, hit.spGenerated);
      }
      addReturnedSp(teamSp, hit.spReturned);

      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulation.value.actorStateTimeline,
        targetSlot: hit.slot,
        time: event.time,
        rawAmount: hit.energyReturn,
        sourceType: "command",
        sourceSlot: hit.slot,
        sourceCommandAttackType: hit.calculationContext?.attackType,
        ignoreUltimateGainEfficiency: hit.ignoreUltimateGainEfficiency,
        simulationResult: simulation.value,
      });
      continue;
    }

    const action = event.action;
    const command = getCommandForAction(action);
    if (!command) {
      continue;
    }

    if (event.type === "action-end") {
      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulation.value.actorStateTimeline,
        targetSlot: action.slot,
        time: event.time,
        rawAmount: command.energyGain,
        sourceType: "command",
        sourceSlot: action.slot,
        sourceCommandAttackType: command.attackType,
        simulationResult: simulation.value,
      });
      addGeneratedSp(teamSp, command.spGeneratedOnEnd);
      addReturnedSp(teamSp, command.spReturnedOnEnd);
      continue;
    }

    const reasons: string[] = [];
    const currentEnergy = energyBySlot.get(action.slot) ?? 0;
    const currentTeamSp = teamSp.generated + teamSp.returned;

    if (command.energyCost > currentEnergy + 0.001) {
      reasons.push(t("rotation.notEnoughEnergy"));
    }

    if (command.spCost > currentTeamSp + 0.001) {
      reasons.push(t("rotation.notEnoughSp"));
    }

    if (command.requiresControlledOperator && action.slot !== controlledSlot) {
      reasons.push(t("rotation.controlledOperatorOnly"));
    }

    if (command.targets === "finisher") {
      const hasFinisherTarget = (simulation.value.enemySlots ?? props.enemySlots).some((enemySlot) => {
        const enemyState = getEnemyStateAtTime(simulation.value, action.realStartTime, enemySlot.slotId);
        return enemyState.isPresent !== false
          && enemyState.isDead !== true
          && enemyState.activeStatuses.some((status) => status.id === ENEMY_FINISHER_AVAILABLE_STATUS_ID);
      });
      if (!hasFinisherTarget) {
        reasons.unshift(t("rotation.finisherNotAvailable"));
      }
    }

    if (command.genericActionType === "switch") {
      if (action.slot === controlledSlot) {
        reasons.push(t("rotation.alreadyControlled"));
      }

      const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? NO_SWITCH_LOCK_UNTIL;
      if (action.realStartTime < lockedUntil - 0.001) {
        reasons.push(t("rotation.switchOnCooldown"));
      }
    }

    if (command.attackType === "COMBO_SKILL") {
      const comboLineageIds = getComboTriggerLineageIds(partyBySlot.value.get(action.slot), command.id);
      let matchingWindow: RotationSimulationResult["comboWindows"][number] | undefined;
      for (const lineageId of comboLineageIds) {
        const candidate = consumedComboWindowByKey.get(`${action.slot}:${lineageId}:${action.startTime.toFixed(3)}`);
        const activeUntil = candidate?.consumedAt != null
          ? Math.min(candidate.expiresAt, candidate.consumedAt)
          : candidate?.expiresAt;
        if (
          candidate
          && candidate.readyAt <= action.startTime
          && activeUntil != null
          && action.startTime <= activeUntil + 0.001
        ) {
          matchingWindow = candidate;
          break;
        }
      }
      const inheritedWindow = !matchingWindow
        ? getInheritedActiveComboWindowAtTime(action.slot, action.startTime)
        : null;

      if (!matchingWindow && !inheritedWindow) {
        let previousComboAction: RotationSimulationResult["actions"][number] | undefined;
        for (const lineageId of comboLineageIds) {
          const candidate = previousComboActionByKey.get(`${action.slot}:${lineageId}`);
          if (!previousComboAction || (candidate && candidate.realStartTime > previousComboAction.realStartTime)) {
            previousComboAction = candidate;
          }
        }

        const cooldownTimeScale = command.comboCooldownTimeScale ?? "real";
        const cooldown = previousComboAction?.resolvedComboCooldownSeconds
          ?? command.comboCooldownSeconds
          ?? 0;
        const cooldownStartTimes = previousComboAction
          ? getComboCooldownStartTimes({
            slot: action.slot,
            command,
            action: previousComboAction,
          })
          : null;
        const cooldownStart = cooldownStartTimes
          ? (cooldownTimeScale === "real" ? cooldownStartTimes.real : cooldownStartTimes.game)
          : null;
        const cooldownNow = cooldownTimeScale === "real" ? action.realStartTime : action.startTime;
        const inheritedCooldownState = getInheritedComboCooldownStateAtTime({
          slot: action.slot,
          comboCommand: command,
          targetTime: action.realStartTime,
          currentGameTime: action.startTime,
        });

        if (
          inheritedCooldownState != null
          || (cooldownStart != null && cooldownNow < cooldownStart + cooldown - 0.001)
        ) {
          reasons.push(t("rotation.comboSkillCooldown"));
        } else {
          reasons.push(t("rotation.comboSkillNotTriggered"));
        }
      }
    }

    if (reasons.length > 0) {
      validations.set(action.stepId, reasons[0]!);
    }

    if (command.energyCost > 0) {
      energyBySlot.set(action.slot, Math.max(0, currentEnergy - command.energyCost));
    }

    const generatedConsumed = consumeTeamSp(teamSp, command.spCost);
    if (generatedConsumed > 0) {
      for (const display of partyDisplay.value) {
        applyUltimateEnergyGain({
          energyBySlot,
          energyMaxBySlot,
          actorStates: simulation.value.actorStateTimeline,
          targetSlot: display.slot,
          time: event.time,
          rawAmount: generatedConsumed * GENERATED_SP_TEAM_ENERGY_RATE,
          sourceType: "command",
          sourceSlot: action.slot,
          sourceCommandAttackType: command.attackType,
          simulationResult: simulation.value,
        });
      }
    }

    if (command.genericActionType === "switch" && action.slot !== controlledSlot) {
      const previousControlledSlot = controlledSlot;
      controlledSlot = action.slot;
      switchBackLockedUntilBySlot.set(previousControlledSlot, action.realStartTime + SWITCH_BACK_COOLDOWN_SECONDS);
    }
    if (command.attackType === "COMBO_SKILL") {
      for (const lineageId of getComboTriggerLineageIds(partyBySlot.value.get(action.slot), command.id)) {
        previousComboActionByKey.set(`${action.slot}:${lineageId}`, action);
      }
    }
  }

  return validations;
});

const enemyCommandValidationById = computed(() => {
  const validations = new Map<string, string>();

  for (const enemySlot of visibleEnemySlots.value) {
    const slotEnemyId = enemySlot.enemyId;
    for (const command of enemyTimelineCommandsForAllSlots.value[enemySlot.slotId] ?? []) {
      const key = `${enemySlot.slotId}:${command.id}`;
      if (slotEnemyId === "rhodagn" && command.commandId === "phase_transition") {
        const stateBefore = getEnemyStateAtTime(
          simulation.value,
          Math.max(0, command.startTime - 0.0001),
          enemySlot.slotId,
        );
        const currentHp = Math.max(0, stateBefore.currentHp);
        const maxHp = Math.max(1, stateBefore.maxHp);
        if (currentHp >= maxHp * 0.7 - 0.001) {
          validations.set(key, t("rotation.conditionNotFulfilled"));
        }
      }
      if (slotEnemyId === "nefarith_bonekrusher" && command.commandId === "phase_transition") {
        const stateBefore = getEnemyStateAtTime(
          simulation.value,
          Math.max(0, command.startTime - 0.0001),
          enemySlot.slotId,
        );
        if (stateBefore.currentHp > 0.001) {
          validations.set(key, t("rotation.conditionNotFulfilled"));
        }
      }
      if (command.commandId === "set_target") {
        const attempt = (simulation.value.enemyTargetTimeline ?? []).find((entry) =>
          entry.reason === "set_target"
          && entry.sourceId === command.id
        );
        if (attempt?.succeeded === false) {
          validations.set(key, t("rotation.conditionNotFulfilled"));
        }
      }
    }
  }

  return validations;
});

function addStep(slot: PartySlot, commandId: string) {
  return addStepAtTime(slot, commandId, cursorTime.value);
}

function getEnemyCommandValidation(commandPlacementId: string, slotId = props.targetedEnemySlotId): string | null {
  return enemyCommandValidationById.value.get(`${slotId}:${commandPlacementId}`) ?? null;
}

function addStepAtTime(slot: PartySlot, commandId: string, startTime: number): string | null {
  const actor = partyBySlot.value.get(slot);
  const requestedStartTime = clampCursorTime(roundToSnap(startTime));
  const commandState = getCommandStateAtTime(slot, requestedStartTime);
  const command = actor
    ? resolveCommandTransform(actor.commands, commandId, commandState)
    : null;
  if (!actor || !command) {
    return null;
  }
  if (command.genericActionType && disabledGenericActions.value.has(command.genericActionType)) {
    return null;
  }
  const snappedStartTime = clampCursorTime(
    clampStartTimeForFreezeWindow(requestedStartTime, command),
  );
  return addExpandedSteps(slot, command, snappedStartTime);
}

function addExpandedSteps(
  slot: PartySlot,
  command: CharacterCombatSnapshot["commands"][number],
  startTime: number,
): string | null {
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return null;
  }

  let currentStart = startTime;
  let firstCreatedStepId: string | null = null;
  let expandedCount = 0;
  let expansionSimulation = simulation.value;
  const requiresProgressiveSimulation = command.expandsToCommandIds.length > 0;
  const createdStepIds = new Set<string>();
  let capacityExceeded = false;

  const ensureStepCapacity = () => {
    if (rotation.value.steps.length < MAX_STEPS_PER_ROTATION) {
      return true;
    }
    capacityExceeded = true;
    return false;
  };

  const appendResolvedCommand = (
    commandId: string,
    atStart: number,
    depth: number,
  ): number => {
    if (capacityExceeded || depth > 64 || expandedCount > 256) {
      return atStart;
    }
    const snappedStart = clampCursorTime(roundToSnap(atStart));
    const commandState = getCommandStateAtTime(slot, snappedStart, expansionSimulation);
    const resolved = resolveCommandTransform(actor.commands, commandId, commandState)
      ?? actor.commands.find((entry) => entry.id === commandId)
      ?? null;
    if (!resolved) {
      return atStart;
    }

    if (resolved.expandsToCommandIds.length > 0) {
      let nextStart = atStart;
      for (const nestedCommandId of resolved.expandsToCommandIds) {
        nextStart = appendResolvedCommand(nestedCommandId, nextStart, depth + 1);
      }
      return nextStart;
    }

    if (!ensureStepCapacity()) {
      return atStart;
    }

    const nextStep: RotationStep = {
      id: makeStepId(),
      slot,
      commandId: resolved.id,
      startTime: getStoredRotationTimeFromLocal(
        clampCursorTime(clampStartTimeForFreezeWindow(snappedStart, resolved)),
      ),
      buildSwapMap: resolved.id === "__switch_build" ? [1, 2, 3, 0] : undefined,
    };
    rotation.value.steps.push(nextStep);
    createdStepIds.add(nextStep.id);
    firstCreatedStepId ??= nextStep.id;
    expandedCount += 1;
    // Recursive command transforms can depend on effects produced by the
    // command that was just appended (for example Yvonne's Crit stacks).
    // Advance a private snapshot between leaves without publishing every
    // intermediate simulation through Vue.
    if (requiresProgressiveSimulation) {
      expansionSimulation = calculateSimulation();
    }
    return roundToSnap(getLocalTimelineTimeFromStored(nextStep.startTime ?? 0) + resolved.durationFrames / 60);
  };

  if (requiresProgressiveSimulation) {
    commandExpansionBatchDepth += 1;
  }
  try {
    currentStart = appendResolvedCommand(command.id, currentStart, 0);
  } finally {
    if (capacityExceeded) {
      rotation.value.steps = rotation.value.steps.filter((step) => !createdStepIds.has(step.id));
      firstCreatedStepId = null;
    }
    if (requiresProgressiveSimulation) {
      commandExpansionBatchDepth -= 1;
    }
    if (capacityExceeded) {
      if (typeof window !== "undefined") {
        window.alert(t("rotation.maximumStepsReached"));
      }
    }
    if (requiresProgressiveSimulation) {
      scheduleSimulationReload();
    }
  }

  setSelectedStepIds(firstCreatedStepId ? [firstCreatedStepId] : []);
  return firstCreatedStepId;
}

function addGenericStep(commandId: "__switch" | "__dodge" | "__jump" | "__switch_build") {
  if (commandId === "__dodge" && dodgeDisabledByContracts.value) {
    return;
  }
  if (commandId === "__switch") {
    executeSwitchToSlot(selectedLibrarySlot.value);
    return;
  }
  if (commandId === "__dodge" || commandId === "__jump") {
    if (selectedCharacterIsControlled.value) {
      addStep(selectedLibrarySlot.value, commandId);
      return;
    }
    executeControlledGeneric(commandId);
    return;
  }
  addStep(selectedLibrarySlot.value, commandId);
}

function removeSelectedStep() {
  if (selectedSteps.value.length === 0) {
    return;
  }

  const selectedIds = new Set(selectedStepIds.value);
  rotation.value.steps = rotation.value.steps.filter((step) => !selectedIds.has(step.id));
  const remainingStepIds = new Set(rotation.value.steps.map((step) => step.id));
  rotation.value.critRiggingRules = (rotation.value.critRiggingRules ?? []).filter((rule) => remainingStepIds.has(rule.stepId));
  cleanupGroups();
  setSelectedStepIds([]);
}

function removeSelectedCommand() {
  if (selectedEnemyCommandId.value) {
    removeEnemyCommand(selectedEnemyCommandId.value);
    return;
  }
  removeSelectedStep();
}

function clearRotation() {
  rotation.value = { steps: [], groups: [], critRiggingRules: [] };
  setSelectedStepIds([]);
}

function updateSelectedStepCritRigging(args: {
  hitIndex: number;
  repeatIndex: number;
  executeCritRigId?: string;
  mode: "none" | "force_crit" | "force_non_crit";
}) {
  const stepId = selectedStep.value?.id;
  if (!stepId) {
    return;
  }
  const rules = [...(rotation.value.critRiggingRules ?? [])];
  const existingIndex = rules.findIndex((rule) =>
    rule.stepId === stepId
    && rule.hitIndex === args.hitIndex
    && rule.repeatIndex === args.repeatIndex
    && rule.executeCritRigId === args.executeCritRigId,
  );
  if (args.mode === "none") {
    if (existingIndex >= 0) {
      rules.splice(existingIndex, 1);
    }
  } else {
    const nextRule: CritRiggingRule = {
      id: existingIndex >= 0 ? rules[existingIndex]!.id : `crit_rig_${Math.random().toString(36).slice(2, 10)}`,
      stepId,
      hitIndex: args.hitIndex,
      repeatIndex: args.repeatIndex,
      executeCritRigId: args.executeCritRigId,
      mode: args.mode,
      enabled: true,
    };
    if (existingIndex >= 0) {
      rules[existingIndex] = nextRule;
    } else {
      rules.push(nextRule);
    }
  }
  rotation.value.critRiggingRules = rules;
}

function createRotationScheme() {
  const created = addScheme();
  if (!created) {
    if (typeof window !== "undefined") {
      window.alert("maximum rotations reached");
    }
    return;
  }
  sidebarMode.value = "character";
  selectedLibrarySlot.value = 0;
}

function renameCurrentRotationScheme() {
  rotationNameDraft.value = getLocalizedRotationSchemeName(activeScheme.value);
  rotationDescriptionDraft.value = getLocalizedRotationSchemeDescription(activeScheme.value);
  rotationMetadataEditorOpen.value = true;
}

function closeRotationMetadataEditor() {
  rotationMetadataEditorOpen.value = false;
  rotationNameDraft.value = "";
  rotationDescriptionDraft.value = "";
}

function submitRotationMetadataEdit() {
  const trimmedName = rotationNameDraft.value.trim();
  if (!trimmedName) {
    closeRotationMetadataEditor();
    return;
  }
  updateActiveSchemeLocalizedMetadata({
    locale: currentRotationLocale.value,
    name: trimmedName,
    description: rotationDescriptionDraft.value.trim(),
  });
  closeRotationMetadataEditor();
}

function removeCurrentRotationScheme() {
  removeActiveScheme();
  setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
}

function updateSelectedStep(patch: Partial<RotationStep>) {
  if (!selectedStep.value || selectedCommandsCount.value !== 1) {
    return;
  }

  Object.assign(selectedStep.value, patch);
}

function getStepById(stepId: string): RotationStep | null {
  return rotation.value.steps.find((step) => step.id === stepId) ?? null;
}

function cleanupGroups() {
  const groups = rotation.value.groups ?? [];
  const usedGroupIds = new Set(rotation.value.steps.map((step) => step.groupId).filter(Boolean));
  rotation.value.groups = groups.filter((group) => usedGroupIds.has(group.id));
}

function createGroupId(): string {
  return `group_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultGroupName(): string {
  return t("rotation.groupDefaultName", { index: (rotation.value.groups?.length ?? 0) + 1 });
}

function groupSelectedSteps() {
  if (selectedSteps.value.length < 2) {
    return;
  }

  const groupId = createGroupId();
  const groupName = createDefaultGroupName();
  for (const step of selectedSteps.value) {
    step.groupId = groupId;
  }
  rotation.value.groups = [...(rotation.value.groups ?? []), { id: groupId, name: groupName }];
  cleanupGroups();
  setSelectedStepIds(selectedStepIds.value);
}

function ungroupSelectedSteps() {
  const groupIds = Array.from(new Set(selectedSteps.value.map((step) => step.groupId).filter(Boolean)));
  if (groupIds.length === 0) {
    return;
  }

  for (const step of rotation.value.steps) {
    if (step.groupId && groupIds.includes(step.groupId)) {
      delete step.groupId;
    }
  }
  cleanupGroups();
  setSelectedStepIds(selectedStepIds.value.filter((stepId) => rotation.value.steps.some((step) => step.id === stepId)));
}

function renameSelectedGroup(name: string) {
  if (!selectedGroup.value) {
    return;
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }

  const group = rotation.value.groups?.find((entry) => entry.id === selectedGroup.value?.id);
  if (group) {
    group.name = trimmed;
  }
}

function roundToSnap(value: number): number {
  return Math.round(value / AXIS_SNAP_SECONDS) * AXIS_SNAP_SECONDS;
}

function getPreferredInitialCursorTime(): number {
  if (isActiveSchemeRelayed.value) {
    return 0;
  }
  return 0;
}

function clampCursorTime(value: number): number {
  return Math.max(timelineStart.value, Math.min(timelineDuration.value, roundToSnap(value)));
}

function clampStartTimeForFreezeWindow(
  startTime: number,
  command: CharacterCombatSnapshot["commands"][number] | null | undefined,
): number {
  const freezeSeconds = Math.max(0, command?.timeFreezeSeconds ?? 0);
  if (freezeSeconds <= 0) {
    return startTime;
  }
  if (startTime < 0 && startTime + freezeSeconds > 0) {
    const leftOption = -freezeSeconds - 0.05;
    const rightOption = 0;
    return Math.abs(startTime - leftOption) <= Math.abs(startTime - rightOption)
      ? leftOption
      : rightOption;
  }
  return startTime;
}

function startBlockDrag(event: MouseEvent, stepId: string) {
  const action = simulation.value.actions.find((entry) => entry.stepId === stepId);
  if (!action) {
    return;
  }

  if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (!selectedStepIds.value.includes(stepId)) {
    selectStep(stepId, "replace");
  }

  beginStepDrag(stepId, event.clientX);
}

function beginStepDrag(stepId: string, originClientX: number) {
  emit("historyTransientStart");
  const dragStepIds = normalizeSelection(selectedStepIds.value.includes(stepId) ? selectedStepIds.value : [stepId]);
  dragState.value = {
    stepIds: dragStepIds,
    originClientX,
    originStartTimes: Object.fromEntries(
      rotation.value.steps
        .filter((entry) => dragStepIds.includes(entry.id))
        .map((entry) => [entry.id, getLocalTimelineTimeFromStored(entry.startTime ?? 0)]),
    ),
  };
  stepDragPreviewStartById.value = new Map();
}

function handleClientPointerMove(clientX: number, clientY: number) {
  if (marqueeSelectionState.value) {
    marqueeSelectionState.value.currentClientX = clientX;
    marqueeSelectionState.value.currentClientY = clientY;

    const left = Math.min(marqueeSelectionState.value.startClientX, marqueeSelectionState.value.currentClientX);
    const right = Math.max(marqueeSelectionState.value.startClientX, marqueeSelectionState.value.currentClientX);
    const top = Math.min(marqueeSelectionState.value.startClientY, marqueeSelectionState.value.currentClientY);
    const bottom = Math.max(marqueeSelectionState.value.startClientY, marqueeSelectionState.value.currentClientY);

    const intersectingStepIds = Array.from(actionElementByStepId.entries())
      .filter(([, element]) => {
        const rect = element.getBoundingClientRect();
        return rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom;
      })
      .map(([stepId]) => stepId);

    setSelectedStepIds(intersectingStepIds, intersectingStepIds[0] ?? selectionAnchorId.value);
    return;
  }

  if (cursorDragState.value) {
    const nextTime = clampCursorTime((clientX - cursorDragState.value.laneLeft) / axisScale.value + timelineStart.value);
    cursorTime.value = nextTime;
    return;
  }

  const activeEnemyDrag = enemyCommandDragState.value;
  if (activeEnemyDrag) {
    const movingCommands = enemyCommands.value.filter((entry) => activeEnemyDrag.commandIds.includes(entry.id));
    if (movingCommands.length === 0) {
      enemyCommandDragState.value = null;
      enemyDragPreviewStartById.value = new Map();
      return;
    }

    const deltaSeconds = (clientX - activeEnemyDrag.originClientX) / axisScale.value;
    const nextPreview = new Map<string, number>();
    for (const command of movingCommands) {
      const origin = activeEnemyDrag.originStartTimes[command.id] ?? 0;
      nextPreview.set(
        command.id,
        getStoredRotationTimeFromLocal(Math.max(timelineStart.value, roundToSnap(origin + deltaSeconds))),
      );
    }
    enemyDragPreviewStartById.value = nextPreview;
    return;
  }

  const activeDrag = dragState.value;
  if (!activeDrag) {
    return;
  }

  const movingSteps = rotation.value.steps.filter((entry) => activeDrag.stepIds.includes(entry.id));
  if (movingSteps.length === 0) {
    dragState.value = null;
    stepDragPreviewStartById.value = new Map();
    return;
  }

  const deltaSeconds = (clientX - activeDrag.originClientX) / axisScale.value;
  const nextPreview = new Map<string, number>();
  for (const step of movingSteps) {
    const origin = activeDrag.originStartTimes[step.id] ?? 0;
    const actor = partyBySlot.value.get(step.slot);
    const command = actor?.commands.find((entry) => entry.id === step.commandId) ?? null;
    const nextStart = clampStartTimeForFreezeWindow(roundToSnap(origin + deltaSeconds), command);
    nextPreview.set(step.id, Math.max(timelineStart.value, nextStart));
  }
  stepDragPreviewStartById.value = nextPreview;
}

function handlePointerMove(event: MouseEvent) {
  handleClientPointerMove(event.clientX, event.clientY);
}

function stopBlockDrag() {
  const activeStepDrag = dragState.value;
  const activeEnemyDrag = enemyCommandDragState.value;
  const shouldCommitHistory = Boolean(activeStepDrag || activeEnemyDrag);
  const displayTimeOffset = simulationDisplayTimeOffset.value;
  const relayed = isActiveSchemeRelayed.value;
  const toStoredTime = (localTime: number) => relayed ? localTime + displayTimeOffset : localTime;
  const committedStepIds = new Set(stepDragPreviewStartById.value.keys());
  if (activeStepDrag) {
    const affectedStartBySlot = new Map<PartySlot, number>();
    for (const step of rotation.value.steps) {
      const previewStart = stepDragPreviewStartById.value.get(step.id);
      if (previewStart != null) {
        step.startTime = toStoredTime(previewStart);
        affectedStartBySlot.set(
          step.slot,
          Math.min(affectedStartBySlot.get(step.slot) ?? Number.POSITIVE_INFINITY, previewStart),
        );
      }
    }
    if (committedStepIds.size > 0) {
      const compiled = compileRotationTimeline({
        rotation: rebaseRotationForSimulation(rotation.value, displayTimeOffset),
        party: partySnapshots.value,
      });
      const authoredStartByStepId = new Map(
        rotation.value.steps.map((step) => [
          step.id,
          step.startTime == null ? null : getLocalTimelineTimeFromStored(step.startTime),
        ]),
      );
      const resolvedStartByStepId = new Map(
        compiled.actions
          .filter((action) => {
            if (committedStepIds.has(action.stepId)) {
              return true;
            }
            const affectedStart = affectedStartBySlot.get(action.slot);
            if (affectedStart == null) {
              return false;
            }
            const authoredStart = authoredStartByStepId.get(action.stepId);
            return authoredStart != null && authoredStart >= affectedStart - 0.001;
          })
          .map((action) => [action.stepId, action.realStartTime]),
      );
      for (const step of rotation.value.steps) {
        const resolvedStart = resolvedStartByStepId.get(step.id);
        if (resolvedStart != null) {
          step.startTime = toStoredTime(resolvedStart);
        }
      }
    }
  }
  if (activeEnemyDrag) {
    for (const command of enemyCommands.value) {
      const previewStart = enemyDragPreviewStartById.value.get(command.id);
      if (previewStart != null) {
        command.startTime = previewStart;
      }
    }
  }
  dragState.value = null;
  enemyCommandDragState.value = null;
  stepDragPreviewStartById.value = new Map();
  enemyDragPreviewStartById.value = new Map();
  cursorDragState.value = null;
  marqueeSelectionState.value = null;
  if (shouldCommitHistory) {
    emit("historyTransientCommit");
  }
}

function setCursorFromLane(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }

  cursorTime.value = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / axisScale.value + timelineStart.value);
}

function startLibraryCommandDrag(slot: PartySlot, commandId: string) {
  libraryDragState.value = { kind: "party", slot, commandId };
}

function startLibraryEnemyCommandDrag(commandId: string) {
  libraryDragState.value = { kind: "enemy", commandId };
}

function clearLibraryCommandDrag() {
  libraryDragState.value = null;
}

function handleLaneDrop(event: DragEvent, slot: PartySlot) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !libraryDragState.value || libraryDragState.value.kind !== "party") {
    clearLibraryCommandDrag();
    return;
  }

  const dropTime = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / axisScale.value + timelineStart.value);
  addStepAtTime(slot, libraryDragState.value.commandId, dropTime);
  selectedLibrarySlot.value = libraryDragState.value.slot;
  clearLibraryCommandDrag();
}

function makeEnemyCommandPlacementId(): string {
  return `enemy_cmd_${Math.random().toString(36).slice(2, 10)}`;
}

function addEnemyCommandAtTime(commandId: string, startTime: number) {
  enemyCommands.value.push({
    id: makeEnemyCommandPlacementId(),
    commandId,
    startTime: getStoredRotationTimeFromLocal(Math.max(timelineStart.value, roundToSnap(startTime))),
    interrupted: false,
    interruptedSpGain: 0,
    interruptedStagger: 0,
  });
}

function addEnemyCommand(commandId: string) {
  addEnemyCommandAtTime(commandId, cursorTime.value);
}

function addEnemyCommandAtTimeForSlot(slotId: string, commandId: string, startTime: number) {
  const targetCommands = getEnemyCommandsForSlot(slotId);
  targetCommands.push({
    id: makeEnemyCommandPlacementId(),
    commandId,
    startTime: getStoredRotationTimeFromLocal(Math.max(timelineStart.value, roundToSnap(startTime))),
    interrupted: false,
    interruptedSpGain: 0,
    interruptedStagger: 0,
  });
}

function removeEnemyCommand(commandPlacementId: string, slotId = selectedEnemyCommandSlotId.value ?? props.targetedEnemySlotId) {
  const targetCommands = getEnemyCommandsForSlot(slotId);
  const index = targetCommands.findIndex((entry) => entry.id === commandPlacementId);
  if (index >= 0) {
    targetCommands.splice(index, 1);
  }
  if (selectedEnemyCommandId.value === commandPlacementId && selectedEnemyCommandSlotId.value === slotId) {
    selectedEnemyCommandId.value = null;
    selectedEnemyCommandSlotId.value = null;
  }
}

function clearEnemyCommands() {
  enemyCommands.value.splice(0, enemyCommands.value.length);
  selectedEnemyCommandId.value = null;
  selectedEnemyCommandSlotId.value = null;
}

function resetEnemyCommandsToDefault() {
  const defaults = getDefaultEnemyCommandPlacements(targetedEnemyId.value);
  enemyCommands.value.splice(0, enemyCommands.value.length, ...defaults.map((entry) => ({ ...entry })));
  if (selectedEnemyCommandId.value) {
    const existsAfterReset = enemyCommands.value.some((entry) => entry.id === selectedEnemyCommandId.value);
    if (!existsAfterReset) {
      selectedEnemyCommandId.value = null;
      selectedEnemyCommandSlotId.value = null;
    }
  }
}

function handleEnemyLaneDrop(event: DragEvent, slotId = props.targetedEnemySlotId) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !libraryDragState.value || libraryDragState.value.kind !== "enemy") {
    clearLibraryCommandDrag();
    return;
  }
  const dropTime = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / axisScale.value + timelineStart.value);
  selectTargetedEnemySlot(slotId);
  addEnemyCommandAtTimeForSlot(slotId, libraryDragState.value.commandId, dropTime);
  clearLibraryCommandDrag();
}

function startEnemyCommandBlockDrag(event: MouseEvent, commandPlacementId: string, slotId = props.targetedEnemySlotId) {
  if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey) {
    return;
  }
  if (slotId !== props.targetedEnemySlotId) {
    selectTargetedEnemySlot(slotId);
    return;
  }
  beginEnemyCommandDrag(commandPlacementId, event.clientX);
}

function beginEnemyCommandDrag(commandPlacementId: string, originClientX: number) {
  emit("historyTransientStart");
  selectedEnemyCommandId.value = commandPlacementId;
  selectedEnemyCommandSlotId.value = props.targetedEnemySlotId;
  selectedStepIds.value = [];
  selectionAnchorId.value = null;
  const dragIds = [commandPlacementId];
  enemyCommandDragState.value = {
    commandIds: dragIds,
    originClientX,
    originStartTimes: Object.fromEntries(
      enemyCommands.value
        .filter((entry) => dragIds.includes(entry.id))
        .map((entry) => [entry.id, getLocalTimelineTimeFromStored(entry.startTime ?? 0)]),
    ),
  };
  enemyDragPreviewStartById.value = new Map();
}

function clearPendingLongPressDrag() {
  const pending = pendingLongPressDrag.value;
  if (!pending) {
    return;
  }
  window.clearTimeout(pending.timerId);
  pendingLongPressDrag.value = null;
}

function startStepTouchPress(event: TouchEvent, stepId: string) {
  if (event.touches.length !== 1) {
    clearPendingLongPressDrag();
    return;
  }
  const touch = event.touches[0];
  if (!touch) {
    return;
  }
  clearPendingLongPressDrag();
  const timerId = window.setTimeout(() => {
    if (!pendingLongPressDrag.value || pendingLongPressDrag.value.id !== stepId) {
      return;
    }
    pendingLongPressDrag.value.activated = true;
    if (!selectedStepIds.value.includes(stepId)) {
      selectStep(stepId, "replace");
    }
    beginStepDrag(stepId, touch.clientX);
  }, MOBILE_LONG_PRESS_MS);
  pendingLongPressDrag.value = {
    kind: "step",
    id: stepId,
    touchId: touch.identifier,
    startClientX: touch.clientX,
    startClientY: touch.clientY,
    timerId,
    activated: false,
  };
}

function startEnemyTouchPress(event: TouchEvent, commandPlacementId: string, slotId = props.targetedEnemySlotId) {
  if (event.touches.length !== 1) {
    clearPendingLongPressDrag();
    return;
  }
  if (slotId !== props.targetedEnemySlotId) {
    selectTargetedEnemySlot(slotId);
    return;
  }
  const touch = event.touches[0];
  if (!touch) {
    return;
  }
  clearPendingLongPressDrag();
  const timerId = window.setTimeout(() => {
    if (!pendingLongPressDrag.value || pendingLongPressDrag.value.id !== commandPlacementId) {
      return;
    }
    pendingLongPressDrag.value.activated = true;
    beginEnemyCommandDrag(commandPlacementId, touch.clientX);
  }, MOBILE_LONG_PRESS_MS);
  pendingLongPressDrag.value = {
    kind: "enemy",
    id: commandPlacementId,
    touchId: touch.identifier,
    startClientX: touch.clientX,
    startClientY: touch.clientY,
    timerId,
    activated: false,
  };
}

function handleTouchMove(event: TouchEvent) {
  const pending = pendingLongPressDrag.value;
  if (pending) {
    const touch = Array.from(event.touches).find((entry) => entry.identifier === pending.touchId);
    if (!touch) {
      clearPendingLongPressDrag();
    } else {
      const movedX = Math.abs(touch.clientX - pending.startClientX);
      const movedY = Math.abs(touch.clientY - pending.startClientY);
      if (!pending.activated && (movedX > MOBILE_DRAG_CANCEL_MOVE_PX || movedY > MOBILE_DRAG_CANCEL_MOVE_PX)) {
        clearPendingLongPressDrag();
      }
      if (pending.activated) {
        event.preventDefault();
      }
    }
  }

  if (dragState.value || enemyCommandDragState.value || cursorDragState.value || marqueeSelectionState.value) {
    const activeTouch = event.touches[0];
    if (!activeTouch) {
      return;
    }
    event.preventDefault();
    handleClientPointerMove(activeTouch.clientX, activeTouch.clientY);
  }
}

function handleTouchEndOrCancel() {
  const wasActivated = pendingLongPressDrag.value?.activated === true;
  clearPendingLongPressDrag();
  if (wasActivated) {
    suppressTapUntilMs.value = Date.now() + 250;
  }
  stopBlockDrag();
}

function updateEnemyCommandPlacement(
  commandPlacementId: string,
  patch: Partial<EnemyCommandPlacement>,
) {
  const command = enemyCommands.value.find((entry) => entry.id === commandPlacementId);
  if (!command) {
    return;
  }
  Object.assign(command, patch);
}

function startCursorDrag(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  const lane = target?.parentElement;
  if (!target || !lane) {
    return;
  }

  cursorDragState.value = {
    laneLeft: lane.getBoundingClientRect().left,
  };
  cursorTime.value = clampCursorTime((event.clientX - lane.getBoundingClientRect().left) / axisScale.value + timelineStart.value);
}

function startMarqueeSelection(event: MouseEvent) {
  marqueeSelectionState.value = {
    startClientX: event.clientX,
    startClientY: event.clientY,
    currentClientX: event.clientX,
    currentClientY: event.clientY,
  };
}

function handleActionClick(event: MouseEvent, stepId: string) {
  if (Date.now() < suppressTapUntilMs.value) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    selectStep(stepId, "toggle");
    return;
  }

  selectStep(stepId, "replace");
}

function selectEnemyCommand(commandPlacementId: string) {
  if (Date.now() < suppressTapUntilMs.value) {
    return;
  }
  selectedEnemyCommandId.value = commandPlacementId;
  selectedEnemyCommandSlotId.value = props.targetedEnemySlotId;
  selectedStepIds.value = [];
  selectionAnchorId.value = null;
}

function selectEnemyCommandForSlot(commandPlacementId: string, slotId: string) {
  if (slotId !== props.targetedEnemySlotId) {
    selectTargetedEnemySlot(slotId);
  }
  if (Date.now() < suppressTapUntilMs.value) {
    return;
  }
  selectedEnemyCommandId.value = commandPlacementId;
  selectedEnemyCommandSlotId.value = slotId;
  selectedStepIds.value = [];
  selectionAnchorId.value = null;
}

function isEnemyCommandSelected(commandPlacementId: string, slotId = props.targetedEnemySlotId): boolean {
  return selectedEnemyCommandId.value === commandPlacementId && selectedEnemyCommandSlotId.value === slotId;
}

function parseDebugFlag(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => parseDebugFlag(entry));
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes";
  }
  return value === true;
}

function resolveDebugFlagFromUrlFallback(): boolean {
  const searchValue = new URLSearchParams(window.location.search).get("debug");
  if (parseDebugFlag(searchValue)) {
    return true;
  }
  const hash = window.location.hash ?? "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) {
    return false;
  }
  const hashQuery = hash.slice(queryIndex + 1);
  return parseDebugFlag(new URLSearchParams(hashQuery).get("debug"));
}

watch(
  () => route.query.debug,
  (value) => {
    const enabled = (props.debugMode ?? false) || parseDebugFlag(value) || resolveDebugFlagFromUrlFallback();
    debugMode.value = enabled;
    // Debug traces can contain thousands of listener/event records on long
    // rotations. Keep them collapsed until explicitly requested so enabling
    // debug mode does not synchronously mount every trace row.
    if (!enabled) closeDebugTracePopup();
  },
  { immediate: true },
);

watch(
  () => props.debugMode,
  (value) => {
    const enabled = (value ?? false) || parseDebugFlag(route.query.debug) || resolveDebugFlagFromUrlFallback();
    debugMode.value = enabled;
    if (!enabled) closeDebugTracePopup();
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("mouseup", stopBlockDrag);
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleTouchEndOrCancel);
  window.addEventListener("touchcancel", handleTouchEndOrCancel);
  nextTick(() => {
    resetTimelineViewport();
  });
});

onBeforeUnmount(() => {
  simulationReloadGeneration += 1;
  if (simulationReloadFrame != null && typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(simulationReloadFrame);
  }
  if (simulationReloadTimer != null) {
    clearTimeout(simulationReloadTimer);
  }
  window.removeEventListener("mousemove", handlePointerMove);
  window.removeEventListener("mouseup", stopBlockDrag);
  window.removeEventListener("touchmove", handleTouchMove);
  window.removeEventListener("touchend", handleTouchEndOrCancel);
  window.removeEventListener("touchcancel", handleTouchEndOrCancel);
  clearPendingLongPressDrag();
  clearLibraryCommandDrag();
});

watch(
  timelineDuration,
  (value) => {
    cursorTime.value = clampCursorTime(Math.min(cursorTime.value, value));
  },
  { immediate: true },
);

function formatDamage(value: number): string {
  const numberLocale = locale.value === "zh-CN" ? "zh-CN" : "en-US";
  return Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(value);
}

function formatTime(value: number): string {
  return value.toFixed(2);
}

function formatDisplayedRealTime(value: number): string {
  return toDisplayedRealTime(value).toFixed(2);
}

function formatDisplayedGameTime(value: number): string {
  return toDisplayedGameTime(value).toFixed(2);
}

function timeToPx(time: number): number {
  return (time - timelineStart.value) * axisScale.value;
}

function resetTimelineViewport() {
  const viewport = timelineViewportEl.value;
  if (!viewport) {
    return;
  }
  const anchorTime = Math.max(timelineStart.value, getPreferredInitialCursorTime() - 1);
  viewport.scrollLeft = Math.max(0, timeToPx(anchorTime));
}

function setTimelineScalePercent(value: number) {
  const nextPercent = Math.max(
    MIN_TIMELINE_SCALE_PERCENT,
    Math.min(MAX_TIMELINE_SCALE_PERCENT, Number.isFinite(value) ? value : 100),
  );
  const viewport = timelineViewportEl.value;
  const anchorClientX = viewport ? viewport.clientWidth / 2 : 0;
  const anchorTime = viewport
    ? timelineStart.value + (viewport.scrollLeft + anchorClientX - TRACK_LABEL_WIDTH) / axisScale.value
    : cursorTime.value;
  axisScale.value = DEFAULT_AXIS_SCALE * nextPercent / 100;
  void nextTick(() => {
    if (!viewport) return;
    viewport.scrollLeft = Math.max(
      0,
      (anchorTime - timelineStart.value) * axisScale.value + TRACK_LABEL_WIDTH - anchorClientX,
    );
  });
}

function formatAttackTypeLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function getCommandVariantLabel(command: CharacterCombatSnapshot["commands"][number] | null | undefined): string | null {
  if (!command?.variant) {
    return null;
  }

  switch (command.variant) {
    case "enhanced_battle_skill":
      return t("rotation.enhancedBattleSkill");
    case "enhanced_basic_attack":
      return t("rotation.enhancedBasicAttack");
    default:
      return null;
  }
}

function formatSkillTypeLabel(attackType: string, commandName?: string): string {
  switch (attackType) {
    case "ULTIMATE":
      return t("builder.ultimate");
    case "COMBO_SKILL":
      return t("builder.comboSkill");
    case "BATTLE_SKILL":
      return t("builder.battleSkill");
    case "TALENT":
      return "Talent";
    case "GENERIC":
      return commandName ?? t("rotation.generic");
    default:
      return formatAttackTypeLabel(attackType);
  }
}

function getActionCommand(action: { slot: PartySlot; commandId: string; realStartTime?: number }) {
  const actor = partyBySlot.value.get(action.slot);
  if (!actor) {
    return null;
  }
  if (typeof action.realStartTime === "number") {
    const commandState = getCommandStateAtTime(action.slot, action.realStartTime);
    return resolveCommandTransform(actor.commands, action.commandId, commandState)
      ?? getRawCommandForAction(action)
      ?? null;
  }
  return getRawCommandForAction(action);
}

function toRomanNumeral(value: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[value - 1] ?? String(value);
}

function getTimelineCommandTypeLabel(entry: {
  slot: PartySlot;
  commandId: string;
  commandName: string;
}) {
  const command = getActionCommand({ slot: entry.slot, commandId: entry.commandId });
  if (!command) {
    return entry.commandName;
  }

  if (command.showNameInTimeline) {
    return getLocalizedCommandName(
      command,
      partyBySlot.value.get(entry.slot)?.characterId,
      command.name,
    );
  }

  if (command.showNameInHitTimeline) {
    return getLocalizedCommandName(
      command,
      partyBySlot.value.get(entry.slot)?.characterId,
      command.name,
    );
  }

  if (command.attackType === "BASIC_ATTACK") {
    if (command.basicAttackVariant === "dive_attack") {
      return t("rotation.diveAttack");
    }
    if (command.basicAttackVariant === "finisher") {
      return getLocalizedCommandName(
        command,
        partyBySlot.value.get(entry.slot)?.characterId,
        command.name,
      );
    }
    if (command.basicAttackVariant === "final_strike") {
      return t("rotation.finalStrike");
    }
    if (command.basicAttackVariant === "sequence_segment") {
      if (
        command.sequenceSegmentIndex != null
        && command.sequenceSegmentTotal != null
        && command.sequenceSegmentIndex === command.sequenceSegmentTotal
      ) {
        return t("rotation.finalStrike");
      }
      const segmentNumber = command.sequenceSegmentIndex ?? 1;
      return `${t("rotation.basicAttackSequence")} ${toRomanNumeral(segmentNumber)}`;
    }
    return t("rotation.basicAttackSequence");
  }

  if (command.attackType === "BATTLE_SKILL") {
    return t("builder.battleSkill");
  }
  if (command.attackType === "COMBO_SKILL") {
    return t("builder.comboSkill");
  }
  if (command.attackType === "ULTIMATE") {
    return t("builder.ultimate");
  }
  if (command.attackType === "TALENT") {
    return "Talent";
  }
  if (command.attackType === "GENERIC") {
    switch (command.genericActionType) {
      case "switch":
        return t("rotation.switch");
      case "switch_build":
        return getLocalizedCommandName(
          command,
          partyBySlot.value.get(entry.slot)?.characterId,
          command.name,
        );
      case "dodge":
        return t("rotation.dodge");
      case "jump":
        return t("rotation.jump");
      default:
        return t("rotation.generic");
    }
  }

  return formatSkillTypeLabel(command.attackType, command.name);
}

function getCommandDisplayType(command: CharacterCombatSnapshot["commands"][number] | null | undefined): string {
  if (!command) {
    return t("builder.battleSkill");
  }

  const enhancedPrefix = command.enhanced ? "*" : "";

  if (command.attackType === "BASIC_ATTACK") {
    switch (command.basicAttackVariant) {
      case "final_strike":
        return `${enhancedPrefix}${t("rotation.finalStrike")}`;
      case "sequence_segment":
        return command.sequenceSegmentIndex === command.sequenceSegmentTotal
          ? `${enhancedPrefix}${t("rotation.finalStrike")}`
          : `${enhancedPrefix}A${command.sequenceSegmentIndex ?? ""}`;
      case "finisher":
        return `${enhancedPrefix}${t("rotation.finisher")}`;
      case "dive_attack":
        return `${enhancedPrefix}${t("rotation.diveAttack")}`;
      default:
        return `${enhancedPrefix}${t("rotation.basicAttackSequence")}`;
    }
  }

  if (command.attackType === "GENERIC") {
    if (command.showNameInTimeline) {
      return getLocalizedCommandName(command, undefined, command.name);
    }
    switch (command.genericActionType) {
      case "switch":
        return t("rotation.switch");
      case "switch_build":
        return getLocalizedCommandName(command, undefined, command.name);
      case "dodge":
        return t("rotation.dodge");
      case "jump":
        return t("rotation.jump");
      default:
        return t("rotation.generic");
    }
  }

  if (command.attackType === "TALENT") {
    return "Talent";
  }

  return `${enhancedPrefix}${formatSkillTypeLabel(command.attackType, command.name)}`;
}

function isActionLinkEnhanced(stepId: string): boolean {
  return linkEnhancedStepIdSet.value.has(stepId);
}

function isActionMissed(stepId: string): boolean {
  const action = simulation.value.actions.find((entry) => entry.stepId === stepId);
  if (!action) {
    return getStepById(stepId)?.missed === true;
  }
  return isActionDisplayMissed(action);
}

function isActionInterrupted(stepId: string): boolean {
  return getStepById(stepId)?.interrupted === true;
}

function isActionAutoNullified(action: RotationSimulationResult["actions"][number]): boolean {
  const step = getStepById(action.stepId);
  if (!step || step.missed === true || step.interrupted === true) {
    return false;
  }

  const command = getActionCommand(action);
  if (!command || command.hits.length <= 0) {
    return false;
  }

  return !simulation.value.timeline.some((entry) => entry.stepId === action.stepId);
}

function isActionDisplayMissed(action: RotationSimulationResult["actions"][number]): boolean {
  return getStepById(action.stepId)?.missed === true || action.nullified === true || isActionAutoNullified(action);
}

function isActionTransient(action: { slot: PartySlot; commandId: string }): boolean {
  const command = getActionCommand(action);
  return command?.overlapMode === "transient";
}

function getActionCardWidth(action: { realStartTime: number; realEndTime: number }): number {
  return Math.max(28, (action.realEndTime - action.realStartTime) * axisScale.value);
}

function isStepBeingDragged(stepId: string): boolean {
  return dragState.value?.stepIds.includes(stepId) === true;
}

function isPartyLaneBeingDragged(slot: PartySlot): boolean {
  const draggedStepIds = dragState.value?.stepIds;
  return draggedStepIds?.some((stepId) => getStepById(stepId)?.slot === slot) === true;
}

function getActionCardDisplayWidth(action: { stepId: string; realStartTime: number; realEndTime: number }): number {
  return getActionCardWidth(action);
}

function getActionDisplayStartTime(action: { stepId: string; realStartTime: number }): number {
  return stepDragPreviewStartById.value.get(action.stepId) ?? action.realStartTime;
}

function getHitOwningStepId(hit: { stepId: string }): string {
  return hit.stepId.split(":")[0] ?? hit.stepId;
}

const displayedTimelineHitsBySlot = computed(() => {
  const hitsBySlot = new Map<PartySlot, RotationSimulationResult["timeline"]>();
  for (const hit of simulation.value.timeline) {
    if (stepDragPreviewStartById.value.has(getHitOwningStepId(hit))) {
      continue;
    }
    const slotHits = hitsBySlot.get(hit.slot) ?? [];
    slotHits.push(hit);
    hitsBySlot.set(hit.slot, slotHits);
  }
  return hitsBySlot;
});

const enemyTimelineHitsBySlot = computed(() => {
  const hitsBySlot = new Map<string, RotationSimulationResult["enemyTimelineHits"]>();
  for (const hit of simulation.value.enemyTimelineHits) {
    const slotHits = hitsBySlot.get(hit.sourceEnemySlotId) ?? [];
    slotHits.push(hit);
    hitsBySlot.set(hit.sourceEnemySlotId, slotHits);
  }
  return hitsBySlot;
});

const enemyStaggerMarkersBySlot = computed(() => {
  const markersBySlot = new Map<string, RotationCombatEvent[]>();
  for (const event of simulation.value.events) {
    if (event.type !== "ENEMY_STAGGERED" || !event.enemySlotId) {
      continue;
    }
    const slotMarkers = markersBySlot.get(event.enemySlotId) ?? [];
    slotMarkers.push(event);
    markersBySlot.set(event.enemySlotId, slotMarkers);
  }
  return markersBySlot;
});

function getEnemyCommandDisplayStartTime(command: { id: string; startTime: number }): number {
  return enemyDragPreviewStartById.value.get(command.id) ?? command.startTime;
}

function getActionCardZIndex(action: { stepId: string; slot: PartySlot; commandId: string }): number {
  if (isStepBeingDragged(action.stepId)) {
    return 80;
  }
  const base = isActionTransient(action) ? 6 : 4;
  return isStepSelected(action.stepId) ? base + 1 : base;
}

function getTickLabelStyle(position: number): Record<string, string> {
  if (position <= 0) {
    return {
      left: "0px",
      transform: "translateY(-50%)",
    };
  }

  if (position >= timelineWidth.value) {
    return {
      left: `${timelineWidth.value}px`,
      transform: "translate(-100%, -50%)",
    };
  }

  return {
    left: `${position}px`,
    transform: "translate(-50%, -50%)",
  };
}

function getActionSkillTypeLabel(action: { slot: PartySlot; commandId: string }): string {
  const command = getActionCommand(action);
  return getCommandDisplayType(command);
}

function shouldShowActionName(action: { slot: PartySlot; commandId: string; realStartTime: number; realEndTime: number }): boolean {
  const command = getActionCommand(action);
  if (!command) {
    return false;
  }

  const isNamedSkill =
    command.attackType === "ULTIMATE" ||
    command.attackType === "COMBO_SKILL" ||
    command.attackType === "BATTLE_SKILL";

  return isNamedSkill && getActionCardWidth(action) >= 150;
}

function shouldShowActionTiming(action: { realStartTime: number; realEndTime: number }): boolean {
  return getActionCardWidth(action) >= 170;
}

function getActionValidation(action: { stepId: string }): string | null {
  return actionValidationByStep.value.get(action.stepId) ?? null;
}

function getStepGroup(stepId: string) {
  const step = rotation.value.steps.find((entry) => entry.id === stepId);
  return getGroupById(step?.groupId);
}

function isStepSelected(stepId: string): boolean {
  return selectedStepIds.value.includes(stepId);
}

function selectStep(stepId: string, mode: "replace" | "toggle" = "replace") {
  if (mode === "toggle") {
    const groupedIds = getGroupedStepIds(stepId);
    const next = new Set(selectedStepIds.value);
    const allSelected = groupedIds.every((id) => next.has(id));
    for (const id of groupedIds) {
      if (allSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
    }
    setSelectedStepIds([...next], stepId);
    return;
  }

  setSelectedStepIds([stepId], stepId);
}

function laneActions(slot: PartySlot) {
  return simulation.value.actions.filter((action) => action.slot === slot);
}

function setActionElement(stepId: string, element: unknown) {
  if (element instanceof HTMLElement) {
    actionElementByStepId.set(stepId, element);
  } else {
    actionElementByStepId.delete(stepId);
  }
}

function getMarqueeStyle(): Record<string, string> {
  const marquee = marqueeSelectionState.value;
  if (!marquee) {
    return {};
  }

  const left = Math.min(marquee.startClientX, marquee.currentClientX);
  const top = Math.min(marquee.startClientY, marquee.currentClientY);
  const width = Math.abs(marquee.currentClientX - marquee.startClientX);
  const height = Math.abs(marquee.currentClientY - marquee.startClientY);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
}

function laneControlSegments(slot: PartySlot) {
  return controlTimeline.value.segments.filter(
    (segment) => segment.slot === slot && segment.endTime > segment.startTime,
  );
}

function laneSwitchMarkers(slot: PartySlot) {
  return controlTimeline.value.markers.filter((marker) => marker.slot === slot);
}

function laneTargetEnemySegments(slotId: string) {
  return targetEnemyTimeline.value.segments.filter(
    (segment) => segment.slotId === slotId && segment.endTime > segment.startTime,
  );
}

function laneTargetEnemyMarkers(slotId: string) {
  return targetEnemyTimeline.value.markers.filter((marker) => marker.slotId === slotId);
}

function getSwitchConnectorStyle(marker: ControlSwitchMarker): Record<string, string> {
  const deltaSlots = marker.slot - marker.previousSlot;
  const absSlots = Math.abs(deltaSlots);

  return {
    left: `${timeToPx(marker.time) + 11}px`,
    top:
      deltaSlots >= 0
        ? `${CONTROL_TRACK_OFFSET - absSlots * TIMELINE_ROW_HEIGHT}px`
        : `${CONTROL_TRACK_OFFSET}px`,
    height: `${absSlots * TIMELINE_ROW_HEIGHT}px`,
  };
}

function getAvatarInitials(name: string | undefined): string {
  if (!name) {
    return "--";
  }

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function getCharacterAvatarPath(characterId: string | undefined): string | null {
  if (!characterId) {
    return null;
  }
  const character = CHARACTERS.find((entry) => entry.id === characterId);
  return getCharacterImagePath(character ?? null);
}

function getCharacterById(characterId: string | undefined) {
  if (!characterId) {
    return null;
  }
  return CHARACTERS.find((character) => character.id === characterId) ?? null;
}

function getSimpleSkillIconPath(
  characterId: string | undefined,
  skillType: "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE",
): string | null {
  const character = getCharacterById(characterId);
  if (!character?.skillIconPaths) {
    return getCharacterAvatarPath(characterId);
  }
  const iconPath = skillType === "BATTLE_SKILL"
    ? character.skillIconPaths.battleSkill
    : skillType === "COMBO_SKILL"
      ? character.skillIconPaths.comboSkill
      : character.skillIconPaths.ultimate;
  return iconPath ? toAssetUrl(iconPath) : getCharacterAvatarPath(characterId);
}

function getSimpleSkillButtonStyle(
  command: CharacterCombatSnapshot["commands"][number] | null,
  options?: { includeBorderColor?: boolean },
): Record<string, string> {
  const damageType = command?.damageType ?? "Physical";
  const tint =
    damageType === "Heat" ? "rgba(224, 66, 58, 0.42)"
      : damageType === "Cryo" ? "rgba(66, 224, 235, 0.42)"
        : damageType === "Electric" ? "rgba(250, 188, 40, 0.42)"
          : damageType === "Nature" ? "rgba(164, 214, 30, 0.42)"
            : "rgba(205, 205, 205, 0.42)";
  const border =
    damageType === "Heat" ? "#e6aea4"
      : damageType === "Cryo" ? "#a6c9ef"
        : damageType === "Electric" ? "#e7c88d"
          : damageType === "Nature" ? "#abd8a2"
            : "#d2d2d2";
  const style: Record<string, string> = {
    backgroundColor: tint,
  };
  if (options?.includeBorderColor !== false) {
    style.borderColor = border;
  }
  return style;
}

function toGameTimeFromExtensions(realTime: number, timeExtensions: RotationTimeExtension[]): number {
  if (realTime >= 0) {
    let cumulativeFreezeBefore = 0;
    for (const ext of timeExtensions) {
      const freezeStart = ext.time;
      const freezeEnd = ext.time + ext.amount;
      if (freezeEnd <= 0 || freezeStart >= realTime) {
        continue;
      }
      const overlapStart = Math.max(0, freezeStart);
      const overlapEnd = Math.min(realTime, freezeEnd);
      if (overlapEnd > overlapStart) {
        cumulativeFreezeBefore += overlapEnd - overlapStart;
      }
    }
    return realTime - cumulativeFreezeBefore;
  }

  let cumulativeFreezeAfter = 0;
  for (const ext of timeExtensions) {
    const freezeStart = ext.time;
    const freezeEnd = ext.time + ext.amount;
    if (freezeEnd <= realTime || freezeStart >= 0) {
      continue;
    }
    const overlapStart = Math.max(realTime, freezeStart);
    const overlapEnd = Math.min(0, freezeEnd);
    if (overlapEnd > overlapStart) {
      cumulativeFreezeAfter += overlapEnd - overlapStart;
    }
  }
  return realTime + cumulativeFreezeAfter;
}

function toRealTimeFromExtensions(gameTime: number, timeExtensions: RotationTimeExtension[]): number {
  const totalFreeze = timeExtensions.reduce((sum, ext) => sum + Math.max(0, ext.amount), 0);
  let low = gameTime - totalFreeze - 10;
  let high = gameTime + totalFreeze + 10;

  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    const midGameTime = toGameTimeFromExtensions(mid, timeExtensions);
    if (midGameTime < gameTime) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}
</script>

<template>
  <section class="grid min-h-[calc(100vh-180px)] grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
    <aside class="flex min-h-0 flex-col rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-[#777]">{{ t("rotation.controlPanel") }}</div>
            <div class="mt-1 text-lg font-semibold">{{ selectedSidebarTitle }}</div>
          </div>
          <div class="inline-flex rounded-full border border-[#d9d9d9] bg-white p-1">
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="controlPanelMode === 'simple' ? 'bg-[#ece81a] text-[#1b1b1b]' : 'text-[#666] hover:bg-[#f3f3f3]'"
              @click="controlPanelMode = 'simple'"
            >
              Simple
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="controlPanelMode === 'detailed' ? 'bg-[#ece81a] text-[#1b1b1b]' : 'text-[#666] hover:bg-[#f3f3f3]'"
              @click="controlPanelMode = 'detailed'"
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      <div v-if="sidebarMode === 'character'" class="border-b border-[#ececec] px-5 py-4">
        <label v-if="!resolvedStageSettings.lockInitialEnergy" class="block">
          <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
            <span class="mb-3 text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.startingEnergy") }}</span>
            <span>{{ displayTeamSpConfig.startingEnergyBySlot[selectedLibrarySlot] ?? 0 }}%</span>
          </div>
          <input
            :value="displayTeamSpConfig.startingEnergyBySlot[selectedLibrarySlot] ?? 0"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full accent-[#c8d13c]"
            :disabled="isActiveSchemeRelayed"
            @input="teamSpConfig.startingEnergyBySlot[selectedLibrarySlot] = Number(($event.target as HTMLInputElement).value)"
          >
        </label>
        <div
          v-else
          class="rounded-lg border border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-3 py-2 text-xs text-[#777]"
          :title="locale === 'zh-CN' ? '已在关卡设置中设定' : 'set in stage setting'"
        >
          {{ t("rotation.startingEnergy") }}: {{ resolvedStageSettings.initialEnergyPct }}%
        </div>
        <label v-if="!resolvedStageSettings.disableConsumables" class="mt-4 block">
          <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
            <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("builder.consumable") }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-11 min-w-0 flex-1 rounded-xl border border-[#d4d4d4] bg-white px-3 text-left text-sm outline-none transition hover:border-[#c8d13c]"
              :disabled="isActiveSchemeRelayed"
              @click="!isActiveSchemeRelayed && (consumablePickerOpen = true)"
            >
              <span class="block truncate">{{ selectedConsumableLabel }}</span>
            </button>
            <img
              :src="selectedConsumableIconPath"
              :alt="t('builder.consumable')"
              class="h-11 w-11 shrink-0 rounded-lg border border-[#d4d4d4] bg-white object-contain p-1"
              @error="(($event.target as HTMLImageElement).src = EMPTY_SELECTION_ICON_PATH)"
            >
          </div>
        </label>
        <div
          v-else
          class="mt-4 rounded-lg border border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-3 py-2 text-xs text-[#777]"
          :title="locale === 'zh-CN' ? '因关卡设置而禁用' : 'disabled due to stage setting'"
        >
          {{ t("builder.consumable") }}: {{ locale === 'zh-CN' ? '已禁用' : 'Disabled' }}
        </div>
      </div>

      <div
        v-if="consumablePickerOpen"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4"
      >
        <div class="flex max-h-[80vh] w-full max-w-[760px] flex-col rounded-2xl border border-[#d6d6d6] bg-white shadow-xl">
          <div class="flex items-center justify-between border-b border-[#ececec] px-5 py-3">
            <h3 class="text-base font-semibold text-[#1b1b1b]">{{ t("builder.consumable") }}</h3>
            <button
              type="button"
              class="rounded-lg border border-[#d4d4d4] px-3 py-1.5 text-xs font-medium text-[#444] transition hover:border-[#bcbcbc] hover:text-[#222]"
              @click="consumablePickerOpen = false"
            >
              {{ t("ui.close") }}
            </button>
          </div>
          <div class="overflow-y-auto p-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                class="group flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-[#d8d8d8] bg-[#fafafa] p-3 text-center transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="selectConsumableForActiveSlot(null)"
              >
                <img
                  :src="EMPTY_SELECTION_ICON_PATH"
                  :alt="t('builder.selectedNone')"
                  class="h-14 w-14 rounded-md object-contain"
                >
                <div class="mt-2 text-sm font-medium text-[#333]">{{ t("builder.selectedNone") }}</div>
              </button>

              <button
                v-for="item in consumableOptions"
                :key="item.id"
                type="button"
                class="group flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-[#d8d8d8] bg-[#fafafa] p-3 text-center transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="selectConsumableForActiveSlot(item.id)"
              >
                <img
                  :src="getConsumableIconPath(item.id)"
                  :alt="getConsumableDisplayName(item, locale as 'en' | 'zh-CN')"
                  class="h-14 w-14 rounded-md object-contain"
                  @error="(($event.target as HTMLImageElement).src = EMPTY_SELECTION_ICON_PATH)"
                >
                <div class="mt-2 line-clamp-2 text-sm font-medium text-[#333]">
                  {{ getConsumableDisplayName(item, locale as "en" | "zh-CN") }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div v-if="sidebarMode === 'character' && !libraryCharacter" class="rounded-xl border border-dashed border-[#d6d6d6] bg-[#fafafa] p-4 text-sm text-[#666]">
          {{ t("rotation.configureBuilderFirst") }}
        </div>

        <div v-else class="space-y-4">
          <section v-if="sidebarMode === 'enemy'" class="space-y-4">
            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left"
                @click="enemySetupExpanded = !enemySetupExpanded"
              >
                <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.enemySetup") }}</span>
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[#666]">
                  <svg class="h-4 w-4 transition" :class="enemySetupExpanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>
              <div v-if="enemySetupExpanded" class="space-y-4 border-t border-[#ececec] px-4 py-4">
              <div class="mb-4">
                <div class="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
                  <span>{{ t("enemy.title") }}</span>
                  <span>{{ visibleEnemySlots.length }}/10</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <div
                    v-for="(slot, index) in visibleEnemySlots"
                    :key="slot.slotId"
                    class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition"
                    :class="slot.slotId === selectedEnemyEditorSlot?.slotId
                      ? 'border-[#c8d13c] bg-[#fffde2] text-[#1b1b1b]'
                      : 'border-[#d4d4d4] bg-white text-[#444]'"
                    :style="isEnemyInactiveForSlot(slot.slotId) ? 'filter: grayscale(1); opacity: 0.6;' : ''"
                  >
                    <button
                      type="button"
                      class="flex min-w-0 items-center gap-2 text-left"
                      @click="selectEnemyEditorSlot(slot.slotId)"
                    >
                      <img
                        :src="getEnemyIconPath(slot.enemyId)"
                        :alt="findEnemyById(slot.enemyId)?.name ?? `Enemy ${index + 1}`"
                        class="h-8 w-8 rounded-md border border-[#dcdcdc] bg-white object-contain p-0.5"
                        @error="(($event.target as HTMLImageElement).src = EMPTY_SELECTION_ICON_PATH)"
                      >
                      <div class="min-w-0">
                        <div class="truncate text-xs font-medium">
                          {{ locale === "zh-CN" ? `敌人 ${index + 1}` : `Enemy ${index + 1}` }}
                        </div>
                        <div class="truncate text-[11px] text-[#666]">
                          {{ findEnemyById(slot.enemyId) ? getEnemyLocalizedName(findEnemyById(slot.enemyId)!) : t("enemy.noEnemy") }}
                        </div>
                        <div
                          v-if="getEnemyLifecycleLabel(slot.slotId)"
                          class="truncate text-[11px] text-[#c23f3f]"
                        >
                          {{ getEnemyLifecycleLabel(slot.slotId) }}
                        </div>
                      </div>
                    </button>
                    <button
                      v-if="isConfiguredEnemySlot(slot.slotId) && props.enemySlots.length > 1"
                      type="button"
                      class="ml-1 h-6 w-6 shrink-0 rounded-full border border-[#d8d8d8] text-xs text-[#666] transition hover:border-[#d16b6b] hover:text-[#9a3131]"
                      @click.stop="removeEnemySlot(slot.slotId)"
                    >
                      ×
                    </button>
                  </div>
                  <button
                    type="button"
                    class="flex h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-dashed border-[#cfcfcf] bg-white text-xl text-[#666] transition hover:border-[#c8d13c] hover:text-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-45"
                    :disabled="visibleEnemySlots.length >= 10"
                    @click="addEnemySlot"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="mb-4">
                <button
                  type="button"
                  class="w-full rounded-xl border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#333] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="addEnemyCommandAtTimeForSlot(selectedEnemyEditorSlot?.slotId ?? props.targetedEnemySlotId, 'set_target', cursorTime)"
                >
                  {{ getLocalizedEnemyCommandLabel("Set To Target") }}
                </button>
              </div>
              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("enemy.title") }}</div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="h-11 min-w-0 flex-1 rounded-xl border border-[#d4d4d4] bg-white px-3 text-left text-sm outline-none transition hover:border-[#c8d13c]"
                    @click="enemyPickerOpen = true"
                  >
                    <span class="block truncate">{{ selectedEnemyData ? getEnemyLocalizedName(selectedEnemyData) : t("enemy.noEnemy") }}</span>
                  </button>
                  <img
                    :src="selectedEnemyIconPath"
                    :alt="selectedEnemyData ? getEnemyLocalizedName(selectedEnemyData) : t('enemy.noEnemy')"
                    class="h-11 w-11 shrink-0 rounded-lg border border-[#d4d4d4] bg-white object-contain p-1"
                    @error="(($event.target as HTMLImageElement).src = EMPTY_SELECTION_ICON_PATH)"
                  >
                </div>
              </label>

              <label class="mt-4 block">
                <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
                  <span>{{ t("enemy.level") }}</span>
                  <span>{{ selectedEnemyEditorLevel }}</span>
                </div>
                <input
                  :value="selectedEnemyEditorLevel"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  class="w-full accent-[#c8d13c]"
                  @input="updateSelectedEnemyLevel(Number(($event.target as HTMLInputElement).value))"
                >
              </label>

              <div class="mt-4 rounded-xl border border-[#e4e4e4] bg-white p-3">
                <label class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-medium text-[#1b1b1b]">{{ t("enemy.spawnTime") }}</div>
                    <div class="text-xs text-[#6b6b6b]">
                      {{ selectedEnemySpawnTimeEnabled ? t("enemy.spawnTimeEnabled") : t("enemy.spawnTimeDisabled") }}
                    </div>
                  </div>
                  <input
                    :checked="selectedEnemySpawnTimeEnabled"
                    type="checkbox"
                    class="h-4 w-4 accent-[#c8d13c]"
                    @change="updateSelectedEnemySpawnTimeEnabled(($event.target as HTMLInputElement).checked)"
                  >
                </label>
                <label class="mt-3 block" :class="selectedEnemySpawnTimeEnabled ? '' : 'opacity-50'">
                  <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
                    <span>{{ t("rotation.realTime") }}</span>
                    <span>{{ selectedEnemySpawnTime.toFixed(1) }}{{ t("enemy.seconds") }}</span>
                  </div>
                  <input
                    :value="selectedEnemySpawnTime"
                    type="number"
                    step="0.1"
                    class="w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#1b1b1b] outline-none transition focus:border-[#c8d13c]"
                    :disabled="!selectedEnemySpawnTimeEnabled"
                    @input="updateSelectedEnemySpawnTime(Number(($event.target as HTMLInputElement).value))"
                  >
                </label>
              </div>

              <div class="rounded-xl border border-[#e4e4e4] bg-white p-3">
                <label class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-medium text-[#1b1b1b]">{{ t("enemy.noDeath") }}</div>
                    <div class="text-xs text-[#6b6b6b]">{{ t("enemy.noDeathHint") }}</div>
                  </div>
                  <input
                    :checked="selectedEnemyNoDeath"
                    type="checkbox"
                    class="h-4 w-4 accent-[#c8d13c]"
                    @change="updateSelectedEnemyNoDeath(($event.target as HTMLInputElement).checked)"
                  >
                </label>
              </div>
              </div>
            </section>

            <div
              v-if="enemyPickerOpen"
              class="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4"
            >
              <div class="flex max-h-[80vh] w-full max-w-[760px] flex-col rounded-2xl border border-[#d6d6d6] bg-white shadow-xl">
                <div class="flex items-center justify-between border-b border-[#ececec] px-5 py-3">
                  <h3 class="text-base font-semibold text-[#1b1b1b]">{{ t("enemy.title") }}</h3>
                  <button
                    type="button"
                    class="rounded-lg border border-[#d4d4d4] px-3 py-1.5 text-xs font-medium text-[#444] transition hover:border-[#bcbcbc] hover:text-[#222]"
                    @click="enemyPickerOpen = false"
                  >
                    {{ t("ui.close") }}
                  </button>
                </div>
                <div class="overflow-y-auto p-4">
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <button
                      v-for="enemy in props.enemies"
                      :key="enemy.id"
                      type="button"
                      class="group flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-[#d8d8d8] bg-[#fafafa] p-3 text-center transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                      @click="selectEnemy(enemy.id)"
                    >
                      <img
                        :src="getEnemyIconPath(enemy.id)"
                        :alt="getEnemyLocalizedName(enemy)"
                        class="h-14 w-14 rounded-md object-contain"
                        @error="(($event.target as HTMLImageElement).src = EMPTY_SELECTION_ICON_PATH)"
                      >
                      <div class="mt-2 line-clamp-2 text-sm font-medium text-[#333]">
                        {{ getEnemyLocalizedName(enemy) }}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.enemyCommands") }}</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-xs text-[#444] transition hover:bg-[#f7f7f7]"
                    @click="resetEnemyCommandsToDefault"
                  >
                    {{ t("ui.reset") }}
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-[#ecd0d0] bg-[#fff5f5] px-2 py-1 text-xs text-[#9a3131] transition hover:bg-[#ffecec]"
                    @click="clearEnemyCommands"
                  >
                    {{ t("ui.clear") }}
                  </button>
                </div>
              </div>
              <div class="space-y-2 border-t border-[#ececec] px-4 py-3">
                <button
                  v-for="command in enemyCommandDefinitions.filter((entry) => entry.id !== 'set_target')"
                  :key="command.id"
                  type="button"
                  draggable="true"
                  class="block w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-left text-sm transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="addEnemyCommand(command.id)"
                  @dragstart="startLibraryEnemyCommandDrag(command.id)"
                  @dragend="clearLibraryCommandDrag"
                >
                  <div class="font-medium text-[#1b1b1b]">{{ getLocalizedEnemyCommandLabel(command.label) }}</div>
                  <div class="text-xs text-[#777]">{{ command.durationSeconds.toFixed(1) }}s</div>
                </button>
                <div class="rounded-lg border border-dashed border-[#d8d8d8] bg-white px-3 py-2 text-xs text-[#666]">
                  {{ t("rotation.selectEnemyCommandHint") }}
                </div>
              </div>
            </section>
          </section>

          <section v-if="sidebarMode === 'character' && controlPanelMode === 'detailed'" class="grid grid-cols-2 gap-2">
            <template v-if="selectedCharacterIsControlled">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
                :disabled="dodgeDisabledByContracts"
                @click="addGenericStep('__dodge')"
              >
                {{ t("rotation.dodge") }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="addGenericStep('__jump')"
              >
                {{ t("rotation.jump") }}
              </button>
            </template>
            <button
              v-else
              type="button"
              class="col-span-2 inline-flex items-center justify-between rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
              :disabled="selectedCharacterSwitchLockRemaining > 0"
              @click="addGenericStep('__switch')"
            >
              <span>{{ t("rotation.switch") }}</span>
              <span class="text-xs text-[#6b6b6b]">
                {{
                  selectedCharacterSwitchLockRemaining > 0
                    ? `${selectedCharacterSwitchLockRemaining.toFixed(1)}s`
                    : t("rotation.ready")
                }}
              </span>
            </button>
            <button
              type="button"
              class="col-span-2 inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
              @click="addGenericStep('__switch_build')"
            >
              {{ t("rotation.swapBuild") }}
            </button>
          </section>

          <section v-if="sidebarMode === 'character' && controlPanelMode === 'simple'" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-3">
            <div class="space-y-3">
              <div class="grid grid-cols-4 grid-rows-2 gap-2">
                <button
                  type="button"
                  class="col-span-2 row-span-2 h-24 rounded-xl border border-[#dcdcdc] bg-white px-3 text-sm font-semibold text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="executeControlledBasicAttack"
                >
                  {{ t("rotation.basicAttackSequence") }}
                </button>
                <button
                  type="button"
                  class="col-span-1 row-span-2 h-24 rounded-xl border border-[#dcdcdc] bg-white px-1 text-xs font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
                  :disabled="selectedCharacterIsControlled || selectedCharacterSwitchLockRemaining > 0"
                  @click="executeSwitchToSlot(selectedLibrarySlot)"
                >
                  <div class="flex h-full flex-col items-center justify-center gap-1">
                    <span class="uppercase tracking-[0.08em]">{{ t("rotation.switch") }}</span>
                    <span v-if="selectedCharacterIsControlled" class="rounded bg-[#ece81a] px-1.5 py-0.5 text-[10px] font-semibold text-[#1b1b1b]">
                      Active
                    </span>
                    <span v-if="selectedCharacterSwitchLockRemaining > 0" class="text-[10px] text-[#6b6b6b]">
                      {{ selectedCharacterSwitchLockRemaining.toFixed(1) }}s
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  class="col-span-1 row-span-1 h-11 rounded-xl border border-[#dcdcdc] bg-white text-xs font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
                  :disabled="dodgeDisabledByContracts"
                  @click="executeControlledGeneric('__dodge')"
                >
                  {{ t("rotation.dodge") }}
                </button>
                <button
                  type="button"
                  class="col-span-1 row-span-1 h-11 rounded-xl border border-[#dcdcdc] bg-white text-xs font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="executeControlledDiveAttack"
                >
                  {{ t("rotation.diveAttack") }}
                </button>
              </div>
              <button
                type="button"
                class="w-full rounded-xl border border-[#dcdcdc] bg-white px-3 py-2 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="addGenericStep('__switch_build')"
              >
                {{ t("rotation.swapBuild") }}
              </button>

              <div class="space-y-1">
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-switch-${slotView.slot}`"
                    type="button"
                    class="relative h-14 w-14 overflow-hidden rounded-full border-2 bg-white transition"
                    :class="[
                      selectedLibrarySlot === slotView.slot ? 'border-4 border-[#ece81a]' : 'border-[#d8d8d8]',
                      getSwitchCooldownRemaining(slotView.slot) > 0 ? 'opacity-45' : 'hover:scale-105',
                    ]"
                    @click="selectedLibrarySlot = slotView.slot"
                  >
                    <img
                      v-if="getCharacterAvatarPath(slotView.actor?.characterId)"
                      :src="getCharacterAvatarPath(slotView.actor?.characterId)!"
                      :alt="getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)"
                      class="h-full w-full object-cover"
                    >
                    <span v-else class="text-[10px] font-semibold text-[#1b1b1b]">
                      {{ getAvatarInitials(getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)) }}
                    </span>
                    <span
                      v-if="getSwitchCooldownRemaining(slotView.slot) > 0"
                      class="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#1b1b1b]"
                    >
                      {{ getSwitchCooldownRemaining(slotView.slot).toFixed(1) }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">{{ t("builder.battleSkill") }}</div>
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-bs-${slotView.slot}`"
                    type="button"
                    class="h-14 w-14 overflow-hidden rounded-full border-2 border-[#d8d8d8] transition hover:scale-105"
                    :style="getSimpleSkillButtonStyle(getPrimaryCommandForSlot(slotView.slot, 'BATTLE_SKILL'), { includeBorderColor: false })"
                    @click="executePrimarySkillForSlot(slotView.slot, 'BATTLE_SKILL')"
                  >
                    <img
                      v-if="getSimpleSkillIconPath(slotView.actor?.characterId, 'BATTLE_SKILL')"
                      :src="getSimpleSkillIconPath(slotView.actor?.characterId, 'BATTLE_SKILL')!"
                      :alt="getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)"
                      class="h-full w-full object-cover"
                    >
                    <span v-else class="text-[10px] font-semibold text-[#1b1b1b]">
                      {{ getAvatarInitials(getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)) }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">{{ t("builder.comboSkill") }}</div>
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-combo-${slotView.slot}`"
                    type="button"
                    class="relative h-14 w-14 overflow-hidden rounded-full border-2 transition hover:scale-105"
                    :class="[
                      getActiveTriggeredComboWindowForSlot(slotView.slot, cursorTime) ? 'border-4 border-[#ece81a]' : 'border-[#d8d8d8]',
                      isSimpleComboOnCooldown(slotView.slot) ? 'opacity-45' : '',
                    ]"
                    :style="getSimpleSkillButtonStyle(getSimpleComboCommandForSlot(slotView.slot), { includeBorderColor: false })"
                    @click="executeComboForSlot(slotView.slot)"
                  >
                    <img
                      v-if="getSimpleSkillIconPath(slotView.actor?.characterId, 'COMBO_SKILL')"
                      :src="getSimpleSkillIconPath(slotView.actor?.characterId, 'COMBO_SKILL')!"
                      :alt="getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)"
                      class="h-full w-full object-cover"
                    >
                    <span v-else class="text-[10px] font-semibold text-[#1b1b1b]">
                      {{ getAvatarInitials(getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)) }}
                    </span>
                    <span
                      v-if="isSimpleComboOnCooldown(slotView.slot)"
                      class="absolute inset-0 flex items-center justify-center bg-black/20 text-[10px] font-semibold text-[#1b1b1b]"
                    >
                      {{ getSimpleComboCooldownLabel(slotView.slot) }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">{{ t("builder.ultimate") }}</div>
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-ult-${slotView.slot}`"
                    type="button"
                    class="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#d8d8d8] transition hover:scale-105"
                    :class="isSimpleUltimateReady(slotView.slot) ? '' : 'opacity-45'"
                    :style="getSimpleSkillButtonStyle(getPrimaryCommandForSlot(slotView.slot, 'ULTIMATE'), { includeBorderColor: false })"
                    @click="executePrimarySkillForSlot(slotView.slot, 'ULTIMATE')"
                  >
                    <img
                      v-if="getSimpleSkillIconPath(slotView.actor?.characterId, 'ULTIMATE')"
                      :src="getSimpleSkillIconPath(slotView.actor?.characterId, 'ULTIMATE')!"
                      :alt="getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)"
                      class="h-full w-full object-cover"
                    >
                    <span v-else class="text-[10px] font-semibold text-[#1b1b1b]">
                      {{ getAvatarInitials(getLocalizedCharacterName(slotView.actor?.characterId, slotView.actor?.characterName)) }}
                    </span>
                    <svg viewBox="0 0 36 36" class="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#ece81a"
                        stroke-width="2.8"
                        stroke-linecap="round"
                        :stroke-dasharray="`${getSimpleUltimateEnergyRatio(slotView.slot) * 97.4} 97.4`"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left"
              @click="statusListExpanded = !statusListExpanded"
            >
              <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.buffsAndStatuses") }}</span>
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[#666]">
                <svg class="h-4 w-4 transition" :class="statusListExpanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
            <div v-if="statusListExpanded" class="space-y-2 border-t border-[#ececec] px-4 py-3">
              <button
                v-for="item in libraryCharacterStatuses"
                :key="item.id"
                type="button"
                class="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-left text-xs text-[#444] transition"
                :class="item.modifierEntries.length > 0 ? 'hover:border-[#c8d13c] hover:bg-[#fffde2]' : ''"
                @click="openStatusDetails(item)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate font-medium text-[#2b2b2b]">{{ item.label }}</div>
                    <div v-if="item.details" class="truncate text-[11px] text-[#6b6b6b]">{{ item.details }}</div>
                    <div v-if="item.modifierEntries.length > 0" class="mt-0.5 text-[11px] text-[#75801f]">
                      {{ t("rotation.clickToViewBuffs") }}
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-1 text-[11px] text-[#666]">
                    <span v-if="item.stackCount > 1" class="rounded bg-[#efefef] px-1.5 py-0.5 font-medium text-[#444]">
                      x{{ item.stackCount }}
                    </span>
                    <span v-if="item.id !== 'none' && Number.isFinite(item.shortestRemainingSeconds)">
                      {{ item.shortestRemainingSeconds.toFixed(1) }}s
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section v-if="sidebarMode === 'character' && selectedCharacterLiveState" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left"
              @click="liveModifiersExpanded = !liveModifiersExpanded"
            >
              <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("summary.finalStats") }}</span>
              <span class="text-xs text-[#666]">
                {{ liveModifiersExpanded ? t("ui.collapse") : t("ui.expand") }}
              </span>
            </button>
            <div class="border-t border-[#ececec] px-4 py-3">
              <div class="grid grid-cols-2 gap-1 text-[11px] text-[#333]">
                <div>{{ t("stats.STR") }}: {{ selectedCharacterLiveState.attrs.STR }}</div>
                <div>{{ t("stats.AGI") }}: {{ selectedCharacterLiveState.attrs.AGI }}</div>
                <div>{{ t("stats.INT") }}: {{ selectedCharacterLiveState.attrs.INT }}</div>
                <div>{{ t("stats.WIL") }}: {{ selectedCharacterLiveState.attrs.WIL }}</div>
                <div>{{ t("stats.ATK") }}: {{ selectedCharacterLiveState.atk }}</div>
                <div>{{ t("stats.HP") }}: {{ selectedCharacterLiveState.hp }}</div>
                <div>{{ t("stats.DEF") }}: {{ selectedCharacterLiveState.def }}</div>
              </div>
              <div v-if="liveModifiersExpanded" class="mt-2 max-h-40 overflow-y-auto rounded-md border border-[#ededed] bg-white p-2">
                <div
                  v-for="entry in selectedCharacterLiveState.changedModifiers"
                  :key="entry.key"
                  class="flex items-center justify-between gap-2 py-0.5 text-[11px] text-[#444]"
                >
                  <span class="truncate">{{ entry.label }}</span>
                  <span class="shrink-0 font-medium">{{ formatModifierValue(entry.value, entry.key, entry.isPercent) }}</span>
                </div>
                <div v-if="selectedCharacterLiveState.changedModifiers.length === 0" class="text-[11px] text-[#777]">
                  {{ t("rotation.noActiveBuffsOrStatuses") }}
                </div>
              </div>
            </div>
          </section>

          <section v-if="sidebarMode === 'character' && controlPanelMode === 'detailed'" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left"
              @click="commandListExpanded = !commandListExpanded"
            >
              <span class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.commandList") }}</span>
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[#666]">
                <svg class="h-4 w-4 transition" :class="commandListExpanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
            <div v-if="commandListExpanded && libraryCharacter" class="space-y-3 border-t border-[#ececec] px-4 py-3">
              <button
                v-for="command in visibleLibraryCommands"
                :key="command.id"
                type="button"
                draggable="true"
                class="block w-full rounded-xl border border-[#e4e4e4] bg-white p-3 text-left transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
                :disabled="Boolean(command.genericActionType && disabledGenericActions.has(command.genericActionType))"
                @click="addStep(getInsertionSlotForCommand(libraryCharacter!.slot, command.id), command.id)"
                @dragstart="command.genericActionType && disabledGenericActions.has(command.genericActionType) ? undefined : startLibraryCommandDrag(getInsertionSlotForCommand(libraryCharacter!.slot, command.id), command.id)"
                @dragend="clearLibraryCommandDrag"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-medium text-[#1b1b1b]">{{ getLocalizedCommandName(command, libraryCharacter?.characterId, command.name) }}</div>
                    <div class="mt-1 text-xs uppercase tracking-[0.18em] text-[#7d7d7d]">
                      {{ getCommandVariantLabel(command) ?? getLocalizedCommandBelongsType(command) }}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </aside>

    <main class="min-w-0 rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#ececec] px-5 py-4">
        <div>
          <div class="text-xs uppercase tracking-[0.24em] text-[#777]">{{ t("rotation.axisWorkspace") }}</div>
          <div class="mt-1 flex items-center gap-3">
            <div class="text-lg font-semibold">{{ t("rotation.combatRotation") }}</div>
            <span class="rounded-md border border-[#dddddd] bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#666]">{{ rotationCountLabel }}</span>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              v-for="scheme in rotationSchemes.schemes"
              :key="scheme.id"
              type="button"
              class="rounded-full border px-3 py-1.5 text-sm transition"
              :class="scheme.id === activeScheme.id
                ? 'border-[#c8d13c] bg-[#fff8bf] text-[#1b1b1b]'
                : 'border-[#d8d8d8] bg-white text-[#555] hover:bg-[#f6f6f6]'"
              @click="setActiveScheme(scheme.id)"
            >
              {{ getLocalizedRotationSchemeName(scheme) }}
            </button>
            <div
              v-if="activeSchemeCanRelay"
              class="inline-flex items-center overflow-hidden rounded-full border border-[#d8d8d8] bg-white"
            >
              <button
                type="button"
                class="px-3 py-1.5 text-sm transition"
                :class="!isActiveSchemeRelayed ? 'bg-[#fff8bf] text-[#1b1b1b]' : 'text-[#666] hover:bg-[#f6f6f6]'"
                @click="setCurrentRotationSimulationMode('independent')"
              >
                {{ locale === 'zh-CN' ? '独立' : 'Independent' }}
              </button>
              <button
                type="button"
                class="border-l border-[#d8d8d8] px-3 py-1.5 text-sm transition"
                :class="isActiveSchemeRelayed ? 'bg-[#fff8bf] text-[#1b1b1b]' : 'text-[#666] hover:bg-[#f6f6f6]'"
                @click="setCurrentRotationSimulationMode('relay_from_previous')"
              >
                {{ locale === 'zh-CN' ? '接力' : 'Relay' }}
              </button>
            </div>
            <button
              v-if="canCreateRotationScheme"
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[#555] transition hover:bg-[#f6f6f6]"
              @click="createRotationScheme"
              :aria-label="t('rotation.addRotation')"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[#555] transition hover:bg-[#f6f6f6]"
              @click="renameCurrentRotationScheme"
              :aria-label="t('rotation.renameRotationAria')"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 13.5V16h2.5L14.4 8.1l-2.5-2.5L4 13.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M10.9 6l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f0d0d0] bg-[#fff5f5] text-[#9a3131] transition hover:bg-[#ffeaea]"
              @click="removeCurrentRotationScheme"
              :aria-label="t('rotation.deleteRotation')"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5.5 6.5h9M8 6.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M7 8.5V14M10 8.5V14M13 8.5V14M6.5 6.5l.5 9a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div v-if="isActiveSchemeRelayed" class="mt-2 text-xs text-[#7a7a7a]">
            {{ relayModeSummary }}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-[#d4d4d4] bg-[#f7f7f7] px-3 py-2 text-sm text-[#333] transition hover:bg-[#efefef]"
            @click="removeSelectedStep"
          >
            {{ t("ui.remove") }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#f0d0d0] bg-[#fff5f5] px-3 py-2 text-sm text-[#9a3131] transition hover:bg-[#ffeaea]"
            @click="clearRotation"
          >
            {{ t("ui.clear") }}
          </button>
        </div>
      </div>
      <div v-if="stageWorkspacePopupOpen" class="fixed inset-0 z-[145] flex items-center justify-center bg-black/35 px-4 py-8" @click.self="stageWorkspacePopupOpen = false">
        <div class="relative flex h-[88vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[#505050] bg-[#d5d5d5] text-[#1b1b1b] shadow-2xl">
          <div class="flex shrink-0 items-center justify-between border-b border-[#aaa] px-4 py-3">
            <div class="flex items-center gap-2">
              <button v-for="tab in (resolvedStageSettings.contractsEnabled ? ['stage', 'triggers', 'contracts'] : ['stage', 'triggers'])" :key="tab" type="button" class="rounded-md px-4 py-2 text-sm font-semibold capitalize" :class="stageWorkspaceTab === tab ? 'bg-[#ece81a] text-[#222]' : 'bg-white/60 text-[#555]'" @click="selectStageWorkspaceTab(tab)">{{ tab }}</button>
            </div>
            <button type="button" class="rounded-md border border-[#bbb] bg-white px-3 py-1.5 text-sm" @click="stageWorkspacePopupOpen = false">{{ t("ui.close") }}</button>
          </div>
          <div class="min-h-0 flex-1 overflow-hidden p-4">
            <RotationStageSettingsPanel v-if="stageWorkspaceTab === 'stage'" :vm="stageSettingsVm" />
            <RotationTriggersPopup v-else-if="stageWorkspaceTab === 'triggers'" embedded open :vm="triggersPopupVm" :enemies="props.enemies" @close="stageWorkspacePopupOpen = false" />
            <RotationContingencyContractsPopup v-else-if="resolvedStageSettings.contractsEnabled" embedded open :vm="contractsPopupVm" @close="stageWorkspacePopupOpen = false" @toggle="toggleContractVariant" @highlight="highlightContractVariant" />
          </div>
        </div>
      </div>

      <div class="relative">
        <div ref="timelineViewportEl" class="max-h-[calc(72vh+200px)] select-none overflow-auto pt-5">
        <div class="min-w-full" :style="{ width: `${TRACK_LABEL_WIDTH + timelineWidth}px` }">
          <div class="grid grid-cols-[160px_minmax(0,1fr)]">
            <div class="sticky left-0 z-[30] border-b border-r border-[#ececec] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#5d5d5d]">
              {{ t("rotation.realTime") }}
            </div>

            <div
              class="relative overflow-hidden border-b border-[#ececec] bg-[#fafafa]"
              :style="{ width: `${timelineWidth}px` }"
              @click="setCursorFromLane"
            >
              <div
                class="relative h-[49px]"
                :style="{
                  backgroundImage: `repeating-linear-gradient(to right, rgba(27,27,27,0.06) 0, rgba(27,27,27,0.06) 1px, transparent 1px, transparent ${axisScale}px)`,
                }"
              >
                <div class="pointer-events-none absolute inset-y-0 z-[1] bg-[#8fc3ff]/20" :style="preBattleBandStyle" />
                <div v-if="isActiveSchemeRelayed" class="pointer-events-none absolute inset-y-0 z-[1] bg-[#9a9a9a]/18" :style="relayInheritedBandStyle" />
                <div
                  v-for="second in realSeconds"
                  :key="`real-${second}`"
                  class="absolute top-1/2 text-[11px] text-[#7d7d7d]"
                  :style="getTickLabelStyle(timeToPx(second))"
                >
                  {{ formatDisplayedRealTime(second) }}
                </div>
              </div>
            </div>

            <div class="sticky left-0 z-[30] border-b border-r border-[#e8e8e8] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#5d5d5d]">
              {{ t("rotation.gameTime") }}
            </div>

            <div
              class="relative overflow-hidden border-b border-[#e8e8e8] bg-[#fafafa]"
              :style="{ width: `${timelineWidth}px` }"
              @click="setCursorFromLane"
            >
              <div
                class="relative h-[49px]"
                :style="{
                  backgroundImage: `repeating-linear-gradient(to right, rgba(27,27,27,0.04) 0, rgba(27,27,27,0.04) 1px, transparent 1px, transparent ${axisScale}px)`,
                }"
              >
                <div class="pointer-events-none absolute inset-y-0 z-[1] bg-[#8fc3ff]/20" :style="preBattleBandStyle" />
                <div v-if="isActiveSchemeRelayed" class="pointer-events-none absolute inset-y-0 z-[1] bg-[#9a9a9a]/18" :style="relayInheritedBandStyle" />
                <div
                  v-for="second in gameSeconds"
                  :key="`game-line-${second.value}`"
                  class="absolute inset-y-0 w-px bg-[#1b1b1b]/10"
                  :style="{ left: `${timeToPx(second.realTime)}px` }"
                />
                <div
                  v-for="second in gameSeconds"
                  :key="`game-${second.value}`"
                  class="absolute top-1/2 text-[11px] text-[#7d7d7d]"
                  :style="getTickLabelStyle(timeToPx(second.realTime))"
                >
                  {{ formatDisplayedGameTime(second.value) }}
                </div>
              </div>

              <div
                class="absolute top-0 h-full w-0.5 bg-[#1b1b1b] z-10"
                :style="{ left: `${timeToPx(cursorTime)}px` }"
                @mousedown.stop="startCursorDrag"
              >
                <div class="absolute left-2 top-2 rounded bg-[#1b1b1b] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
                  {{ t("rotation.cursorRealTime", { value: formatDisplayedRealTime(cursorTime) }) }}
                </div>
                <div class="absolute left-2 top-8 rounded bg-[#3d3d3d] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
                  {{ t("rotation.cursorGameTime", { value: formatDisplayedGameTime(cursorCombatState.cursorGameTime) }) }}
                </div>
              </div>
            </div>

            <template v-for="slotIndex in 4" :key="slotIndex">
              <button
                type="button"
                class="sticky left-0 border-b border-r border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
                :class="[
                  hasBlockingPopupOpen ? 'z-[30]' : 'z-[90]',
                  sidebarMode === 'character' && selectedLibrarySlot === ((slotIndex - 1) as PartySlot)
                    ? 'bg-[#fff8bf]'
                    : 'bg-white',
                ]"
                @click="
                  sidebarMode = 'character';
                  selectedLibrarySlot = (slotIndex - 1) as PartySlot
                "
              >
                <div class="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#ece81a] text-xs font-semibold text-[#1b1b1b]">
                    <img
                      v-if="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)"
                      :src="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)!"
                      :alt="getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName) || t('rotation.avatar')"
                      class="h-full w-full object-cover"
                    >
                    <span v-else>
                      {{ getAvatarInitials(getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName)) }}
                    </span>
                  </div>
                  <div class="min-w-0 self-center">
                    <div class="truncate text-sm font-medium text-[#1b1b1b]">
                      {{ getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName) || slots[slotIndex - 1]?.label }}
                    </div>
                  </div>

                  <div class="flex items-center justify-center">
                    <div class="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d8d8] bg-[#fafafa]">
                      <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                        <path
                          d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31"
                          fill="none"
                          stroke="#e8e8e8"
                          stroke-width="3"
                        />
                        <path
                          d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31"
                          fill="none"
                          stroke="#ece81a"
                          stroke-width="3"
                          stroke-linecap="round"
                          :stroke-dasharray="`${((partyDisplay[slotIndex - 1]?.ultimateMaxEnergy ?? 0) > 0
                            ? ((cursorCombatState.energyBySlot.get((slotIndex - 1) as PartySlot) ?? 0) / (partyDisplay[slotIndex - 1]?.ultimateMaxEnergy ?? 1)) * 97
                            : 0)} 97`"
                        />
                      </svg>
                      <span class="relative z-10 text-[10px] font-semibold text-[#1b1b1b]">
                        {{ (cursorCombatState.energyBySlot.get((slotIndex - 1) as PartySlot) ?? 0).toFixed(0) }}
                      </span>
                    </div>
                  </div>

                  <div class="min-w-0 self-center">
                    <div class="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.1em] text-[#7a7a7a]">
                      <span>{{ t("builder.comboSkill") }}</span>
                      <span
                        :class="cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.mode === 'perfect_window'
                          ? 'text-[#c2a012]'
                          : ''"
                      >
                        {{ cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.label }}
                      </span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                      <div
                        class="h-full"
                        :style="{
                          width: `${(cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.readyRatio ?? 0) * 100}%`,
                          backgroundColor:
                            cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.mode === 'perfect_window'
                              ? '#ece81a'
                              : cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.mode === 'triggered'
                                || cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.mode === 'executing'
                                ? '#73b45d'
                                : '#c8d13c',
                        }"
                      />
                    </div>
                  </div>
                </div>
              </button>

              <div
                class="relative h-28 border-b border-[#efefef]"
                :class="isPartyLaneBeingDragged((slotIndex - 1) as PartySlot) ? 'z-40 overflow-visible' : 'overflow-hidden'"
                :style="{
                  width: `${timelineWidth}px`,
                  backgroundImage: `repeating-linear-gradient(to right, rgba(27,27,27,0.05) 0, rgba(27,27,27,0.05) 1px, transparent 1px, transparent ${axisScale}px)`,
                }"
                @mousedown.self="startMarqueeSelection"
                @click="setCursorFromLane"
                @dragover.prevent
                @drop="handleLaneDrop($event, (slotIndex - 1) as PartySlot)"
              >
                <div class="pointer-events-none absolute inset-y-0 z-[1] bg-[#8fc3ff]/20" :style="preBattleBandStyle" />
                <div v-if="isActiveSchemeRelayed" class="pointer-events-none absolute inset-y-0 z-[1] bg-[#9a9a9a]/18" :style="relayInheritedBandStyle" />
                <div
                  v-for="marker in countdownTimelineMarkers"
                  :key="`party-countdown-${slotIndex}-${marker.triggerId}-${marker.instanceId}-${marker.time}-${marker.value}`"
                  class="pointer-events-none absolute top-1 z-[6] flex -translate-x-1/2 flex-col items-center"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#fff7b8] text-[11px] font-bold text-[#4f4712] shadow-sm">
                    {{ marker.value }}
                  </div>
                </div>
                <div
                  v-for="marker in relayTimelineMarkers"
                  :key="`party-relay-${slotIndex}-${marker.triggerId}-${marker.instanceId}-${marker.time}`"
                  class="pointer-events-none absolute inset-y-0 z-[7]"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div class="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 rounded-full bg-[#4d8ac7]/70" />
                  <div
                    v-if="marker.nextRotationName"
                    class="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-white bg-[#4d8ac7] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                  >
                    {{ locale === 'zh-CN' ? `前往${marker.nextRotationName}` : `To ${marker.nextRotationName}` }}
                  </div>
                </div>
                <div class="absolute inset-x-0 top-0 h-7 border-b border-[#f1f1f1] bg-white/85">
                  <div
                    v-for="segment in laneControlSegments((slotIndex - 1) as PartySlot)"
                    :key="`${slotIndex}-${segment.startTime}-${segment.endTime}`"
                    class="absolute top-4 h-1 rounded-full bg-[#73b45d]"
                    :style="{
                      left: `${timeToPx(segment.startTime)}px`,
                      width: `${Math.max(6, (segment.endTime - segment.startTime) * axisScale)}px`,
                    }"
                  />

                  <div
                    v-for="marker in laneSwitchMarkers((slotIndex - 1) as PartySlot)"
                    :key="marker.stepId"
                    class="absolute top-1 z-[7]"
                    :style="{ left: `${timeToPx(marker.time)}px` }"
                  >
                    <div
                      v-if="marker.previousSlot !== marker.slot"
                      class="absolute w-0.5 bg-[#73b45d]/70"
                      :style="getSwitchConnectorStyle(marker)"
                    />
                    <div
                      class="absolute left-1/2 top-7 z-[6] w-1.5 -translate-x-1/2 rounded-full bg-[#73b45d]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.75)]"
                      style="height: 5rem"
                    />
                    <button
                      type="button"
                      class="relative z-[8] flex h-7 w-7 -translate-x-1/2 select-none items-center justify-center overflow-hidden rounded-full border-2 border-[#73b45d] bg-white shadow-sm transition hover:scale-105"
                      :class="isStepSelected(marker.stepId) ? 'ring-2 ring-[#c8d13c] ring-offset-1' : ''"
                      @click.stop="selectStep(marker.stepId, ($event.shiftKey || $event.ctrlKey || $event.metaKey) ? 'toggle' : 'replace')"
                      @dragstart.prevent
                    >
                      <img
                        v-if="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)"
                        :src="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)!"
                        :alt="getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName) || t('rotation.switch')"
                        class="h-full w-full select-none object-cover"
                        draggable="false"
                      >
                      <span v-else class="text-[9px] font-semibold text-[#1b1b1b]">
                        {{ getAvatarInitials(getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName)) }}
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  v-for="extension in simulation.timeExtensions"
                  :key="extension.sourceStepId"
                  class="absolute top-0 h-full border-x border-[#efe77c] bg-[#f7f2a7]/45"
                  :style="{
                    left: `${timeToPx(extension.time)}px`,
                    width: `${Math.max(6, extension.amount * axisScale)}px`,
                  }"
                />
                <div
                  v-for="window in enemyInvulnerabilityWindows"
                  :key="`${slotIndex}-${window.id}-${window.start}-${window.end}`"
                  class="absolute inset-y-0 border-x border-[#c74d4d]/50"
                  :style="{
                    left: `${timeToPx(window.start)}px`,
                    width: `${Math.max(1, (window.end - window.start) * axisScale)}px`,
                    backgroundColor: window.color,
                  }"
                />
                <div
                  v-for="window in enemyPhaseTransitionWindows"
                  :key="`${slotIndex}-phase-${window.id}-${window.start}-${window.end}`"
                  class="absolute inset-y-0 z-[2] border-x"
                  :style="{
                    left: `${timeToPx(window.start)}px`,
                    width: `${Math.max(1, (window.end - window.start) * axisScale)}px`,
                    backgroundColor: window.color,
                    borderColor: window.borderColor,
                  }"
                />

                <button
                  v-for="action in laneActions((slotIndex - 1) as PartySlot)"
                  :key="action.stepId"
                  type="button"
                  :ref="(element) => setActionElement(action.stepId, element)"
                  class="absolute select-none overflow-hidden rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-[left,width,height,transform,box-shadow] duration-150 active:cursor-grabbing"
                  :class="
                    [
                      isStepBeingDragged(action.stepId)
                        ? isActionTransient(action)
                          ? 'top-8 h-[5.775rem] shadow-xl ring-2 ring-[#c8d13c]/70 opacity-95 cursor-grabbing'
                          : 'top-8 h-[4.95rem] shadow-xl ring-2 ring-[#c8d13c]/70 opacity-95 cursor-grabbing'
                        : isActionTransient(action)
                          ? 'top-8 h-[5.25rem] opacity-70'
                          : 'top-8 h-[4.5rem]',
                      isActionDisplayMissed(action)
                      ? isStepSelected(action.stepId)
                        ? 'border-[#bcbcbc] bg-[#e8e8e8] cursor-grab'
                        : 'border-[#cfcfcf] bg-[#f0f0f0] hover:border-[#bcbcbc] cursor-grab'
                      : getActionValidation(action)
                      ? isStepSelected(action.stepId)
                        ? 'border-[#d85b5b] bg-[#fff1f1] cursor-grab'
                        : 'border-[#e5b2b2] bg-[#fff7f7] hover:border-[#d98d8d] cursor-grab'
                      : getStepGroup(action.stepId)
                        ? isStepSelected(action.stepId)
                          ? 'border-[#e4cc52] bg-[#fff8cc] cursor-grab'
                          : 'border-[#e4cc52] bg-white hover:border-[#d4bb3f] cursor-grab'
                        : isStepSelected(action.stepId)
                          ? 'border-[#c8d13c] bg-[#eef38d] cursor-grab'
                          : 'border-[#dadada] bg-white hover:border-[#cacaca] cursor-grab',
                    ]
                  "
                  :style="{
                    left: `${timeToPx(getActionDisplayStartTime(action))}px`,
                    width: `${getActionCardDisplayWidth(action)}px`,
                    zIndex: `${getActionCardZIndex(action)}`,
                  }"
                  @click.stop.prevent="handleActionClick($event, action.stepId)"
                  @mousedown.stop="startBlockDrag($event, action.stepId)"
                  @touchstart.stop="startStepTouchPress($event, action.stepId)"
                  @dragstart.prevent
                >
                  <div
                    v-if="getStepGroup(action.stepId)"
                    class="absolute left-2 top-1 rounded bg-[#e4cc52] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#5f5500]"
                  >
                    {{ getStepGroup(action.stepId)?.name }}
                  </div>
                  <div
                    class="truncate text-[13px] font-semibold uppercase tracking-[0.08em]"
                    :class="[
                      getStepGroup(action.stepId) ? 'mt-3' : '',
                      isActionDisplayMissed(action)
                        ? 'text-[#6f6f6f]'
                        : getActionValidation(action)
                          ? 'text-[#8b2d2d]'
                          : 'text-[#3d3d3d]',
                    ]"
                  >
                    {{ getActionSkillTypeLabel(action) }}
                    <span
                      v-if="shouldShowActionName(action)"
                      class="ml-1.5 text-[11px] font-medium normal-case tracking-normal"
                      :class="
                        isActionDisplayMissed(action)
                          ? 'text-[#8a8a8a]'
                          : getActionValidation(action)
                            ? 'text-[#a14b4b]'
                            : 'text-[#626262]'
                      "
                    >
                      {{ getLocalizedCommandName(getActionCommand(action), partyBySlot.get(action.slot)?.characterId, action.commandName) }}
                    </span>
                  </div>

                  <div
                    v-if="getActionValidation(action)"
                    class="mt-1 truncate text-[10px] font-medium text-[#c23f3f]"
                  >
                    {{ getActionValidation(action) }}
                  </div>

                  <div
                    v-if="shouldShowActionTiming(action)"
                    class="flex items-end justify-between gap-4 text-[11px] leading-tight"
                    :class="
                      isActionDisplayMissed(action)
                        ? 'mt-2 text-[#7a7a7a]'
                        : getActionValidation(action)
                          ? 'mt-1 text-[#7a5858]'
                          : 'mt-2 text-[#595959]'
                    "
                  >
                    <div class="min-w-0 truncate">
                      {{ t("rotation.startTiming", { game: formatDisplayedGameTime(action.startTime), real: formatDisplayedRealTime(getActionDisplayStartTime(action)) }) }}
                    </div>
                    <div class="min-w-0 truncate text-right">
                      {{
                        t("rotation.durationTiming", {
                          game: (action.endTime - action.startTime).toFixed(1),
                          real: (action.realEndTime - action.realStartTime).toFixed(1),
                        })
                      }}
                    </div>
                  </div>

                  <div
                    v-if="isActionInterrupted(action.stepId)"
                    class="absolute bottom-1 left-2 rounded bg-[#f2bf87] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6a3d0f]"
                  >
                    Interrupted
                  </div>
                  <div
                    v-else-if="isActionLinkEnhanced(action.stepId)"
                    class="absolute bottom-1 left-2 rounded bg-[#ece81a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#5f5500]"
                  >
                    {{ t("rotation.link") }}
                  </div>
                </button>

                <div
                  v-for="(entry, entryIndex) in displayedTimelineHitsBySlot.get((slotIndex - 1) as PartySlot) ?? []"
                  :key="`${entry.slot}-${entry.stepId}-${entry.commandId}-${entry.hitIndex}-${entry.hitName ?? ''}-${entry.registerTime}-${entry.time}-${entry.targetEnemySlotId ?? 'none'}-${entry.damage}-${entryIndex}`"
                  class="absolute top-2 z-[12] h-24 w-0.5 bg-[#1b1b1b]/25"
                  :style="{ left: `${timeToPx(entry.time)}px` }"
                >
                  <div
                    v-if="entry.registerTime < entry.time - 0.001"
                    class="absolute top-[1.8rem] h-0.5 bg-[#1b1b1b]/35"
                    :style="{
                      left: `${(entry.registerTime - entry.time) * axisScale}px`,
                      width: `${Math.max(4, (entry.time - entry.registerTime) * axisScale)}px`,
                    }"
                  />
                  <div
                    v-if="entry.registerTime < entry.time - 0.001"
                    class="absolute top-6 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white bg-[#8f8f8f]"
                    :style="{ left: `${(entry.registerTime - entry.time) * axisScale}px` }"
                  />
                  <div class="absolute -left-1.5 top-6 h-3 w-3 rounded-full border border-white bg-[#1b1b1b]/75" />
                  <div
                    v-if="entry.triggeredComboSlots.length > 0"
                    class="absolute left-1.5 top-3 flex flex-col gap-1"
                  >
                    <div
                      v-for="triggerSlot in entry.triggeredComboSlots"
                      :key="`${entry.stepId}-${entry.hitIndex}-${triggerSlot}`"
                      class="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-[#ece81a] text-[9px] font-semibold text-[#1b1b1b] shadow-sm"
                    >
                      <img
                        v-if="getCharacterAvatarPath(partyBySlot.get(triggerSlot)?.characterId)"
                        :src="getCharacterAvatarPath(partyBySlot.get(triggerSlot)?.characterId)!"
                        :alt="getLocalizedCharacterName(partyBySlot.get(triggerSlot)?.characterId, partyBySlot.get(triggerSlot)?.characterName) || t('rotation.triggeredCombo')"
                        class="h-full w-full object-cover"
                      >
                      <span v-else>
                        {{ getAvatarInitials(getLocalizedCharacterName(partyBySlot.get(triggerSlot)?.characterId, partyBySlot.get(triggerSlot)?.characterName)) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="absolute top-0 h-full w-0.5 bg-[#1b1b1b] z-[8]"
                  :style="{ left: `${timeToPx(cursorTime)}px` }"
                  @mousedown.stop="startCursorDrag"
                />
              </div>
            </template>

            <template v-for="enemySlot in visibleEnemySlots" :key="enemySlot.slotId">
              <button
                type="button"
                class="sticky left-0 z-[30] border-b border-r border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
                :class="[
                  sidebarMode === 'enemy' && selectedEnemyEditorSlot?.slotId === enemySlot.slotId ? 'bg-[#fff8bf]' : 'bg-white',
                  selectedEnemyEditorSlot?.slotId === enemySlot.slotId ? 'ring-1 ring-inset ring-[#c8d13c]' : '',
                ]"
                :style="isEnemyInactiveForSlot(enemySlot.slotId) ? 'filter: grayscale(1); opacity: 0.6;' : ''"
                @click="
                  sidebarMode = 'enemy';
                  selectEnemyEditorSlot(enemySlot.slotId);
                "
              >
                <div class="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2">
                  <div class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1b1b1b] text-xs font-semibold text-white">
                    <img
                      v-if="!enemyTimelineIconBrokenBySlot[enemySlot.slotId]"
                      :src="getEnemyIconPath(getEnemyDataForSlot(enemySlot.slotId)?.id ?? enemySlot.enemyId)"
                      :alt="getEnemyDataForSlot(enemySlot.slotId) ? getEnemyLocalizedName(getEnemyDataForSlot(enemySlot.slotId)!) : t('enemy.noEnemy')"
                      class="h-full w-full object-cover"
                      @error="enemyTimelineIconBrokenBySlot[enemySlot.slotId] = true"
                    >
                    <span v-else class="absolute inset-0 flex items-center justify-center">
                      {{ getAvatarInitials(getEnemyDataForSlot(enemySlot.slotId) ? getEnemyLocalizedName(getEnemyDataForSlot(enemySlot.slotId)!) : t("enemy.noEnemy")) }}
                    </span>
                  </div>
                  <div class="min-w-0 self-center">
                    <div class="truncate text-sm font-medium text-[#1b1b1b]">
                      {{ getEnemyDataForSlot(enemySlot.slotId) ? getEnemyLocalizedName(getEnemyDataForSlot(enemySlot.slotId)!) : t("enemy.noEnemy") }}
                    </div>
                    <div
                      v-if="getEnemyLifecycleLabel(enemySlot.slotId)"
                      class="truncate text-[11px] text-[#c23f3f]"
                    >
                      {{ getEnemyLifecycleLabel(enemySlot.slotId) }}
                    </div>
                  </div>

                  <div class="col-span-2 min-w-0">
                    <div class="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.1em] text-[#7a7a7a]">
                      <span>{{ t("enemy.hp") }}</span>
                      <span>{{ getEnemyDisplayedHpForSlot(enemySlot.slotId).toFixed(0) }} / {{ getEnemyDisplayedMaxHpForSlot(enemySlot.slotId).toFixed(0) }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                      <div
                        class="h-full bg-[#d86c6c]"
                        :style="{ width: `${Math.max(0, getEnemyDisplayedHpForSlot(enemySlot.slotId) / Math.max(1, getEnemyDisplayedMaxHpForSlot(enemySlot.slotId))) * 100}%` }"
                      />
                    </div>
                  </div>

                  <div class="col-span-2 min-w-0">
                    <div class="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.1em] text-[#7a7a7a]">
                      <span>{{ t("enemy.staggerGauge") }}</span>
                      <span>{{ getEnemyStateForSlot(enemySlot.slotId).currentStagger.toFixed(1) }} / {{ getEnemyStateForSlot(enemySlot.slotId).staggerGauge.toFixed(1) }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                      <div class="relative h-full w-full">
                        <div
                          v-for="(section, sectionIndex) in getEnemyStaggerSectionsForSlot(enemySlot.slotId)"
                          :key="`${enemySlot.slotId}-enemy-stagger-section-${sectionIndex}`"
                          class="absolute inset-y-0"
                          :style="{
                            left: `${section.start * 100}%`,
                            width: `${(section.end - section.start) * 100}%`,
                          }"
                        >
                          <div
                            class="h-full"
                            :class="getEnemyStateForSlot(enemySlot.slotId).isStaggered ? 'bg-[#ece81a]' : 'bg-[#c8d13c]'"
                            :style="{ width: `${section.fill * 100}%` }"
                          />
                        </div>
                        <div
                          v-for="(nodePercent, nodeIndex) in getEnemyStaggerNodePercentsForSlot(enemySlot.slotId)"
                          :key="`${enemySlot.slotId}-enemy-stagger-node-${nodeIndex}`"
                          class="absolute inset-y-0 w-px bg-[#1b1b1b]/25"
                          :style="{ left: `${nodePercent * 100}%` }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <div
                class="relative h-28 overflow-hidden border-b border-[#efefef]"
                :class="isTargetedEnemySlot(enemySlot.slotId) ? 'bg-[#fffef6]' : ''"
                :style="{
                  width: `${timelineWidth}px`,
                  backgroundImage: `repeating-linear-gradient(to right, rgba(27,27,27,0.05) 0, rgba(27,27,27,0.05) 1px, transparent 1px, transparent ${axisScale}px)`,
                }"
                @click="
                  setCursorFromLane($event);
                "
                @dragover.prevent
                @drop="handleEnemyLaneDrop($event, enemySlot.slotId)"
              >
                <div
                  v-if="hasEnemySpawnTimeForSlot(enemySlot.slotId)"
                  class="pointer-events-none absolute inset-y-0 left-0 z-[2] border-r border-[#6d7a8f]/25 bg-[#aab5c7]/18"
                  :style="{
                    width: `${Math.max(0, Math.min(timelineWidth, timeToPx(getEnemySpawnTimeForSlot(enemySlot.slotId) ?? 0)))}px`,
                  }"
                />
                <div class="pointer-events-none absolute inset-y-0 z-[1] bg-[#8fc3ff]/20" :style="preBattleBandStyle" />
                <div v-if="isActiveSchemeRelayed" class="pointer-events-none absolute inset-y-0 z-[1] bg-[#9a9a9a]/18" :style="relayInheritedBandStyle" />
                <div
                  v-for="marker in countdownTimelineMarkers"
                  :key="`${enemySlot.slotId}-countdown-${marker.triggerId}-${marker.instanceId}-${marker.time}-${marker.value}`"
                  class="pointer-events-none absolute top-1 z-[6] flex -translate-x-1/2 flex-col items-center"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#fff7b8] text-[11px] font-bold text-[#4f4712] shadow-sm">
                    {{ marker.value }}
                  </div>
                </div>
                <div
                  v-for="marker in relayTimelineMarkers"
                  :key="`${enemySlot.slotId}-relay-${marker.triggerId}-${marker.instanceId}-${marker.time}`"
                  class="pointer-events-none absolute inset-y-0 z-[7]"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div class="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 rounded-full bg-[#4d8ac7]/70" />
                  <div
                    v-if="marker.nextRotationName"
                    class="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-white bg-[#4d8ac7] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                  >
                    {{ locale === 'zh-CN' ? `前往${marker.nextRotationName}` : `To ${marker.nextRotationName}` }}
                  </div>
                </div>
                <div
                  v-for="segment in laneTargetEnemySegments(enemySlot.slotId)"
                  :key="`${enemySlot.slotId}-target-segment-${segment.startTime}-${segment.endTime}`"
                  class="pointer-events-none absolute top-4 z-[4] h-1 rounded-full bg-[#dd8f2c]"
                  :style="{
                    left: `${timeToPx(segment.startTime)}px`,
                    width: `${Math.max(6, (segment.endTime - segment.startTime) * axisScale)}px`,
                  }"
                />
                <div
                  v-for="marker in laneTargetEnemyMarkers(enemySlot.slotId)"
                  :key="`${enemySlot.slotId}-target-marker-${marker.commandPlacementId}`"
                  class="pointer-events-none absolute top-1 z-[5]"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div
                    class="absolute left-1/2 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-[#dd8f2c] shadow-sm"
                  />
                </div>
                <div
                  v-for="marker in enemyLifecycleMarkersBySlot[enemySlot.slotId] ?? []"
                  :key="`${enemySlot.slotId}-enemy-lifecycle-${marker.time}-${marker.type}-${marker.enemyId}`"
                  class="pointer-events-none absolute top-1 z-[5] flex -translate-x-1/2 flex-col items-center gap-1"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                >
                  <div class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white bg-[#1b1b1b] shadow-sm">
                    <img
                      :src="getEnemyIconPath(marker.enemyId)"
                      :alt="findEnemyById(marker.enemyId) ? getEnemyLocalizedName(findEnemyById(marker.enemyId)!) : marker.enemyId"
                      class="h-full w-full object-cover"
                    >
                  </div>
                  <div class="whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#7a2e2e] shadow-sm">
                    {{ getEnemyLifecycleMarkerCaption(marker.type) }}
                  </div>
                </div>
                <div
                  v-for="window in getEnemyInvulnerabilityWindowsForSlot(enemySlot.slotId)"
                  :key="`${enemySlot.slotId}-enemy-${window.id}-${window.start}-${window.end}`"
                  class="pointer-events-none absolute inset-y-0 border-x border-[#c74d4d]/50"
                  :style="{
                    left: `${timeToPx(window.start)}px`,
                    width: `${Math.max(1, (window.end - window.start) * axisScale)}px`,
                    backgroundColor: window.color,
                  }"
                />
                <div
                  v-for="window in getEnemyPhaseTransitionWindowsForSlot(enemySlot.slotId)"
                  :key="`${enemySlot.slotId}-enemy-phase-${window.id}-${window.start}-${window.end}`"
                  class="pointer-events-none absolute inset-y-0 z-[2] border-x"
                  :style="{
                    left: `${timeToPx(window.start)}px`,
                    width: `${Math.max(1, (window.end - window.start) * axisScale)}px`,
                    backgroundColor: window.color,
                    borderColor: window.borderColor,
                  }"
                />
                <div
                  v-for="hit in enemyTimelineHitsBySlot.get(enemySlot.slotId) ?? []"
                  :key="hit.stepId"
                  class="pointer-events-none absolute top-2 z-[12] h-24 w-0.5 bg-[#58a86b]/40"
                  :style="{ left: `${timeToPx(hit.time)}px` }"
                  :title="`${hit.hitName}: +${hit.amount.toFixed(0)}`"
                >
                  <div class="absolute -left-1.5 top-6 h-3 w-3 rounded-full border border-white bg-[#58a86b] shadow-sm" />
                  <div class="absolute left-2 top-4 whitespace-nowrap rounded bg-[#e7f6e9]/95 px-1.5 py-0.5 text-[9px] font-semibold text-[#28713a] shadow-sm">
                    +{{ hit.amount.toFixed(0) }}
                  </div>
                </div>
                <div
                  v-for="marker in enemyStaggerMarkersBySlot.get(enemySlot.slotId) ?? []"
                  :key="`${enemySlot.slotId}-staggered-${marker.stepId}-${marker.time}`"
                  class="pointer-events-none absolute top-2 z-[13] h-24 w-0.5 bg-[#d6bd16]/55"
                  :style="{ left: `${timeToPx(marker.time)}px` }"
                  :title="getLocalizedStatusBuffLabel('Staggered', locale as 'en' | 'zh-CN')"
                >
                  <div class="absolute -left-1.5 top-6 h-3 w-3 rounded-full border border-white bg-[#e2c91d] shadow-sm" />
                  <div class="absolute left-2 top-4 whitespace-nowrap rounded bg-[#fff4a8]/95 px-1.5 py-0.5 text-[9px] font-semibold text-[#665700] shadow-sm">
                    {{ getLocalizedStatusBuffLabel('Staggered', locale as 'en' | 'zh-CN') }}
                  </div>
                </div>
                <button
                  v-for="command in enemyTimelineCommandsForAllSlots[enemySlot.slotId] ?? []"
                  :key="`${enemySlot.slotId}-enemy-cmd-${command.id}`"
                  type="button"
                  class="absolute z-[6] select-none overflow-hidden rounded-2xl border px-3 py-2 text-left shadow-sm transition active:cursor-grabbing"
                  :class="[
                    command.commandId === 'phase_transition' ? 'top-0 z-[9] h-full' : 'top-8 h-[4.5rem]',
                    isEnemyCommandSelected(command.id, enemySlot.slotId)
                      ? 'border-[#c8d13c] bg-[#eef38d]'
                      : getEnemyCommandValidation(command.id, enemySlot.slotId)
                      ? 'border-[#e5b2b2] bg-[#fff1f1] hover:border-[#d98d8d]'
                      : command.interrupted
                        ? 'border-[#dfc3a5] bg-[#fff3e8] hover:border-[#d6a67a]'
                        : 'border-[#d1d1d1] bg-white hover:border-[#c8d13c]',
                  ]"
                  :style="{
                    left: `${timeToPx(getEnemyCommandDisplayStartTime(command))}px`,
                    width: `${Math.max(44, (command.endTime - command.startTime) * axisScale)}px`,
                  }"
                  @mousedown.stop="startEnemyCommandBlockDrag($event, command.id, enemySlot.slotId)"
                  @touchstart.stop="startEnemyTouchPress($event, command.id, enemySlot.slotId)"
                  @click.stop="
                    selectEnemyCommandForSlot(command.id, enemySlot.slotId);
                    cursorTime = clampCursorTime(command.startTime);
                  "
                  @dragstart.prevent
                >
                  <div
                    class="truncate text-[12px] font-semibold uppercase tracking-[0.06em]"
                    :class="
                      getEnemyCommandValidation(command.id, enemySlot.slotId)
                        ? 'text-[#8b2d2d]'
                        : command.interrupted
                          ? 'text-[#7f4b1f]'
                          : 'text-[#3d3d3d]'
                    "
                  >
                    {{ command.label }}
                  </div>
                  <div class="mt-1 text-[11px]" :class="getEnemyCommandValidation(command.id, enemySlot.slotId) ? 'text-[#7a5858]' : 'text-[#666]'">
                    {{ formatDisplayedRealTime(getEnemyCommandDisplayStartTime(command)) }}s
                  </div>
                  <div
                    v-if="command.interrupted"
                    class="mt-1 inline-flex rounded bg-[#f2bf87] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6a3d0f]"
                  >
                    Interrupted
                  </div>
                  <div v-if="getEnemyCommandValidation(command.id, enemySlot.slotId)" class="truncate text-[10px] text-[#b14545]">
                    {{ getEnemyCommandValidation(command.id, enemySlot.slotId) }}
                  </div>
                </button>
                <div
                  class="absolute top-0 z-[8] h-full w-0.5 bg-[#1b1b1b]"
                  :style="{ left: `${timeToPx(cursorTime)}px` }"
                  @mousedown.stop="startCursorDrag"
                />
              </div>
            </template>

            <button
              v-if="visibleEnemySlots.length < 10"
              type="button"
              class="sticky left-0 z-[30] flex items-center justify-center border-b border-r border-[#efefef] bg-white px-3 py-3 text-[#777] transition hover:bg-[#fffef2] hover:text-[#333]"
              @click="addEnemySlot"
            >
              <div class="flex h-full min-h-[5rem] w-full items-center justify-center rounded-xl border-2 border-dashed border-[#d8d8d8] bg-[#fafafa]">
                <span class="text-3xl leading-none">+</span>
              </div>
            </button>
            <div
              v-if="visibleEnemySlots.length < 10"
              class="relative flex h-28 items-center justify-center overflow-hidden border-b border-[#efefef] bg-[#fbfbfb]"
              :style="{ width: `${timelineWidth}px` }"
            >
              <button
                type="button"
                class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#d2d2d2] bg-white text-3xl text-[#777] transition hover:border-[#c8d13c] hover:bg-[#fffef2] hover:text-[#333]"
                @click="addEnemySlot"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div class="sticky bottom-0 left-0 z-[45] flex h-9 w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-tr-xl border-r border-t border-[#d8d8d8] bg-white/95 px-3 text-[11px] text-[#555] shadow-[2px_-2px_8px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <label class="flex items-center gap-2 whitespace-nowrap">
            <span class="font-semibold uppercase tracking-[0.08em] text-[#777]">{{ locale === 'zh-CN' ? '缩放' : 'Scale' }}</span>
            <input
              :value="timelineScalePercent"
              type="range"
              :min="MIN_TIMELINE_SCALE_PERCENT"
              :max="MAX_TIMELINE_SCALE_PERCENT"
              step="5"
              class="h-1.5 w-24 cursor-pointer accent-[#9aa522]"
              @input="setTimelineScalePercent(Number(($event.target as HTMLInputElement).value))"
            >
            <span class="w-9 text-right font-medium text-[#333]">{{ timelineScalePercent }}%</span>
          </label>
          <span class="h-4 w-px bg-[#ddd]" />
          <div class="flex items-center gap-4 whitespace-nowrap">
            <span class="uppercase tracking-[0.08em] text-[#777]">{{ t("rotation.teamSp") }}</span>
            <span class="font-semibold text-[#222]">{{ cursorCombatState.teamSpTotal.toFixed(1) }} / {{ TEAM_SP_MAX }}</span>
            <div class="relative -ml-2 h-2.5 w-28 overflow-hidden rounded-sm border border-[#d4d4d4] bg-[#f1f1f1]" :title="`${t('rotation.returned', { value: cursorCombatState.teamSpReturned.toFixed(1) })} · ${t('rotation.generated', { value: cursorCombatState.teamSpGenerated.toFixed(1) })}`">
              <div
                class="absolute inset-y-0 left-0 bg-[#d9cf57]"
                :style="{ width: `${(cursorCombatState.teamSpReturned / TEAM_SP_MAX) * 100}%` }"
              />
              <div
                class="absolute inset-y-0 bg-[#73b45d]"
                :style="{
                  left: `${(cursorCombatState.teamSpReturned / TEAM_SP_MAX) * 100}%`,
                  width: `${(cursorCombatState.teamSpGenerated / TEAM_SP_MAX) * 100}%`,
                }"
              />
              <div class="absolute inset-y-0 left-1/3 w-px bg-black/20" />
              <div class="absolute inset-y-0 left-2/3 w-px bg-black/20" />
            </div>
          </div>
          <span class="h-4 w-px bg-[#ddd]" />
          <div class="flex items-center gap-4 whitespace-nowrap">
            <span class="uppercase tracking-[0.08em] text-[#777]">{{ t("rotation.currentTotalDamage") }}</span>
            <span class="font-semibold text-[#222]">{{ formatDamage(cursorCombatState.totalDamage) }}</span>
          </div>
        </div>
        </div>
        <div
          v-if="simulationLoading"
          class="absolute inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-3 rounded-xl border border-white/50 bg-white/90 px-4 py-3 text-sm font-medium text-[#333] shadow-lg">
            <svg class="h-5 w-5 animate-spin text-[#929a18]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
              <path class="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            <span>{{ t("ui.loading") }}</span>
          </div>
        </div>
      </div>

      <div class="border-t border-[#ececec] px-5 py-4">
        <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.hitTimeline") }}</div>
              <div class="text-xs text-[#6a6a6a]">{{ t("rotation.hitTimelineDesc") }}</div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#333] transition hover:bg-[#f5f5f5]"
              @click="hitTimelineExpanded = !hitTimelineExpanded"
            >
              {{ hitTimelineExpanded ? t("ui.collapse") : t("ui.expand") }}
            </button>
          </div>

          <div v-if="allHits.length === 0" class="text-sm text-[#6a6a6a]">
            {{ t("rotation.noResolvedHits") }}
          </div>

          <div v-else-if="!hitTimelineExpanded" class="text-sm text-[#8a8a8a]">
            {{ t("rotation.hitListHidden") }}
          </div>

          <div
            v-else
            class="overflow-y-auto pr-1"
            :class="hitTimelineExpanded ? 'max-h-[60vh]' : 'max-h-72'"
          >
            <div
              class="sticky top-0 z-10 mb-2 grid grid-cols-[minmax(0,1fr)_72px_270px] items-center gap-3 rounded-lg border border-[#e6e6e6] bg-[#f5f5f5] px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-[#5a5a5a]"
            >
              <div>{{ t("rotation.commandHit") }}</div>
              <div>{{ t("rotation.timestamp") }}</div>
              <div class="text-right">{{ t("rotation.noCritCritAvg") }}</div>
            </div>

            <div
              v-for="(entry, entryIndex) in allHits"
              :key="`${entry.stepId}-${entry.commandId}-${entry.hitIndex}-${entry.time}-${entryIndex}`"
              class="mb-2 grid cursor-pointer grid-cols-[minmax(0,1fr)_72px_270px] items-center gap-3 rounded-lg border border-[#ededed] bg-white px-3 py-2 transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
              :class="entry.critRigMode === 'force_crit' ? '!border-[#f2b15e] !bg-[#fff4e7]' : ''"
              @click="selectedHitForDetails = entry"
            >
              <div class="flex min-w-0 items-center gap-2">
                <div class="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-[#d9d9d9] bg-[#f2f2f2]">
                  <img
                    v-if="getCharacterAvatarPath(partyBySlot.get(entry.slot)?.characterId)"
                    :src="getCharacterAvatarPath(partyBySlot.get(entry.slot)?.characterId) ?? undefined"
                    :alt="getLocalizedCharacterName(partyBySlot.get(entry.slot)?.characterId, entry.characterName)"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-[#666]"
                  >
                    {{ getAvatarInitials(getLocalizedCharacterName(partyBySlot.get(entry.slot)?.characterId, entry.characterName)) }}
                  </div>
                </div>
                <div class="truncate text-sm font-medium text-[#1b1b1b]">
                  {{ getTimelineCommandTypeLabel(entry) }} / {{
                    getLocalizedHitName({
                      hitName: entry.hitName,
                      hitIndex: entry.hitIndex,
                      damageType: entry.damageType,
                      characterId: partyBySlot.get(entry.slot)?.characterId,
                    })
                  }}
                </div>
              </div>
              <div class="text-xs font-medium text-[#666]">{{ formatDisplayedRealTime(entry.time) }}s</div>
              <div class="grid grid-cols-3 items-center gap-2 text-right">
                <div
                  class="font-medium"
                  :class="entry.critRigMode === 'force_non_crit' ? 'text-sm font-semibold text-[#1b1b1b]' : 'text-xs text-[#5f5f5f]'"
                >
                  {{ formatDamage(entry.noCritDamage) }}
                </div>
                <div
                  class="font-medium"
                  :class="entry.critRigMode === 'force_crit' ? 'text-sm font-semibold text-[#1b1b1b]' : 'text-xs text-[#5f5f5f]'"
                >
                  {{ formatDamage(entry.critDamage) }}
                </div>
                <div
                  class="font-medium"
                  :class="entry.critRigMode ? 'text-xs text-[#5f5f5f]' : 'text-sm font-semibold text-[#1b1b1b]'"
                >
                  {{ formatDamage(entry.averageDamage) }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="debugMode" class="mt-4 rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.debugPanelTitle") }}</div>
          <div class="mt-1 text-xs text-[#6a6a6a]">{{ t("rotation.debugPanelDesc") }}</div>
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              v-for="trace in [
                { kind: 'events' as const, title: t('rotation.debugEventLogTitle'), count: allEvents.length },
                { kind: 'combo' as const, title: t('rotation.comboTriggerDebugTitle'), count: allComboTriggerDebug.length },
                { kind: 'passive' as const, title: t('rotation.passiveListenerDebugTitle'), count: allPassiveListenerDebug.length },
              ]"
              :key="trace.kind"
              type="button"
              class="rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-left transition hover:bg-[#f5f5f5]"
              @click="openDebugTracePopup(trace.kind)"
            >
              <div class="text-sm font-medium text-[#333]">{{ trace.title }}</div>
              <div class="mt-1 text-xs text-[#777]">{{ t("rotation.debugRows", { count: trace.count }) }}</div>
            </button>
          </div>
        </section>
      </div>
    </main>

    <aside class="rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="text-xs uppercase tracking-[0.24em] text-[#777]">{{ t("rotation.rotationSummary") }}</div>
        <div class="mt-1 flex items-center justify-between gap-3">
          <div class="text-lg font-semibold">{{ t("rotation.outputAndStep") }}</div>
          <div class="text-xs font-medium text-[#666]">
            {{ t("rotation.totalSteps", { count: totalStepCount, max: MAX_STEPS_PER_ROTATION }) }}
          </div>
        </div>
      </div>

      <div class="space-y-6 px-5 py-4">
        <section class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.totalDamage") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(tallyWindowSummary.totalDamage) }}
            </div>
            <div v-if="riggedCritChance != null" class="mt-1 text-xs text-[#8b5b23]">
              {{ t("rotation.riggedCritChance") }}: {{ (riggedCritChance * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.dps") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(tallyWindowSummary.dps) }}
            </div>
          </div>
          <div class="col-span-2 text-xs text-[#777]">
            {{ enemyName }} {{ t("enemy.level") }} {{ enemyLevel }} · {{ t("rotation.realTime") }} {{ formatDisplayedRealTime(simulation.totalTime) }}s · {{ t("rotation.gameTime") }} {{ formatDisplayedGameTime(simulation.totalGameTime) }}s
          </div>
          <div
            v-if="simulation.warnings && simulation.warnings.length > 0"
            class="col-span-2 rounded-lg border border-[#f0b1b1] bg-[#fff2f2] px-3 py-2 text-sm font-medium text-[#a52a2a]"
          >
            {{ simulation.warnings.join(" · ") }}
          </div>
          <div class="col-span-2 rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="mb-2 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.damageTallyTiming") }}</div>
            <label class="mb-2 flex items-center gap-2 text-sm text-[#333]">
              <input
                type="checkbox"
                :checked="localTallyEnabled"
                @change="localTallyEnabled = ($event.target as HTMLInputElement).checked; emitDamageTallyTimingUpdate()"
              >
              <span>{{ t("rotation.customTiming") }}</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="text-xs text-[#666]">
                {{ t("rotation.startSeconds") }}
                <input
                  type="number"
                  step="0.1"
                  class="mt-1 w-full rounded border border-[#d6d6d6] bg-white px-2 py-1 text-sm text-[#1b1b1b]"
                  :disabled="!localTallyEnabled"
                  :value="displayedTallyStartTime"
                  @change="localTallyStartTime = getLocalTallyTimeFromDisplayed(Number(($event.target as HTMLInputElement).value)); emitDamageTallyTimingUpdate()"
                >
              </label>
              <label class="text-xs text-[#666]">
                {{ t("rotation.endSeconds") }}
                <input
                  type="number"
                  step="0.1"
                  class="mt-1 w-full rounded border border-[#d6d6d6] bg-white px-2 py-1 text-sm text-[#1b1b1b]"
                  :disabled="!localTallyEnabled"
                  :value="displayedTallyEndTime"
                  @change="localTallyEndTime = getLocalTallyTimeFromDisplayed(Number(($event.target as HTMLInputElement).value)); emitDamageTallyTimingUpdate()"
                >
              </label>
            </div>
          </div>
        </section>

        <section v-if="damageContributions.length > 0" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-1 text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.damageContribution") }}</div>
          <div class="text-xs text-[#6a6a6a]">{{ t("rotation.damageContributionHint") }}</div>
          <div class="mt-3 h-4 overflow-hidden rounded-md border border-[#dadada] bg-[#f1f1f1]">
            <div class="flex h-full w-full">
              <div
                v-for="entry in damageContributions"
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
              v-for="entry in damageContributions"
              :key="`rotation-contribution-${entry.slot}`"
              class="flex items-center justify-between gap-3 text-sm"
            >
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
                <span class="text-[#1b1b1b]">{{ entry.localizedCharacterName }}</span>
              </div>
              <div class="text-[#555]">
                {{ formatDamage(entry.damage) }} ({{ entry.percent.toFixed(1) }}%)
              </div>
            </div>
          </div>
        </section>

        <RotationSelectedCommandPanel
          :has-multi-selection="hasMultiSelection"
          :selected-commands-count="selectedCommandsCount"
          :has-any-selected-command="hasAnySelectedCommand"
          :selected-group="selectedGroup"
          :selected-enemy-command="selectedEnemyCommand"
          :selected-step="selectedStep"
          :selected-step-action="selectedStepAction"
          :selected-step-command="selectedStepCommand"
          :selected-step-variant-options="selectedStepVariantOptions"
          :selected-step-validation="selectedStepValidation"
          :selected-step-crit-rig-rules="selectedStepCritRigRules"
          :selected-step-hit-rig-options="selectedStepHitRigOptions"
          :time-extensions="simulation.timeExtensions"
          :get-enemy-command-validation="getEnemyCommandValidation"
          :get-localized-command-belongs-type="getLocalizedCommandBelongsType"
          :get-localized-command-name="getLocalizedCommandName"
          :get-character-id-by-slot="(slot) => partyBySlot.get(slot as PartySlot)?.characterId"
          :to-game-time-from-extensions="toGameTimeFromExtensions"
          :on-remove-selected-command="removeSelectedCommand"
          :on-group-selected-steps="groupSelectedSteps"
          :on-ungroup-selected-steps="ungroupSelectedSteps"
          :on-rename-selected-group="renameSelectedGroup"
          :on-update-enemy-command-placement="updateEnemyCommandPlacement"
          :on-update-selected-step="updateSelectedStep"
          :on-update-selected-step-crit-rigging="updateSelectedStepCritRigging"
        />

      </div>
    </aside>

    <div
      v-if="marqueeSelectionState"
      class="pointer-events-none fixed z-[60] rounded-md border border-[#c8d13c] bg-[#ece81a]/15"
      :style="getMarqueeStyle()"
    />

    <div
      v-if="debugTracePopupKind"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      @click.self="closeDebugTracePopup"
    >
      <div class="flex max-h-[86vh] w-full max-w-4xl flex-col rounded-2xl border border-[#d6d6d6] bg-white shadow-xl">
        <div class="flex items-start justify-between gap-4 border-b border-[#e8e8e8] px-5 py-4">
          <div>
            <div class="text-base font-semibold text-[#1b1b1b]">
              {{ debugTracePopupKind === "events"
                ? t("rotation.debugEventLogTitle")
                : debugTracePopupKind === "combo"
                  ? t("rotation.comboTriggerDebugTitle")
                  : t("rotation.passiveListenerDebugTitle") }}
            </div>
            <div class="mt-1 text-xs text-[#666]">
              {{ t("rotation.debugRows", { count: debugTraceTotalRows }) }} ·
              {{ t("rotation.debugPage", { page: debugTracePage, pages: debugTracePageCount }) }}
            </div>
          </div>
          <button
            type="button"
            class="rounded-md border border-[#d7d7d7] px-3 py-1.5 text-sm text-[#444] transition hover:bg-[#f5f5f5]"
            @click="closeDebugTracePopup"
          >
            {{ t("ui.close") }}
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          <template v-if="debugTracePopupKind === 'events'">
            <div v-if="pagedDebugEvents.length === 0" class="text-sm text-[#777]">{{ t("rotation.noEventsEmitted") }}</div>
            <details
              v-for="(event, eventIndex) in pagedDebugEvents"
              :key="`${event.stepId ?? 'no-step'}-${event.type}-${event.time}-${debugTracePageStart + eventIndex}`"
              class="rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <summary class="cursor-pointer list-none">
                <div class="grid grid-cols-[minmax(0,1fr)_68px] items-center gap-2">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">{{ formatEventType(event.type) }} · {{ event.label }}</div>
                  <div class="text-right text-xs font-medium text-[#666]">{{ formatDisplayedRealTime(event.time) }}s</div>
                </div>
              </summary>
              <div class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div
                  v-for="detail in getEventDetailEntries(event)"
                  :key="`${eventIndex}-${detail.key}`"
                  class="flex items-start justify-between gap-2 rounded border border-[#f0f0f0] bg-[#fcfcfc] px-2 py-1.5 text-xs"
                >
                  <span class="text-[#666]">{{ detail.key }}</span>
                  <span class="break-all text-right font-medium text-[#1b1b1b]">{{ detail.value }}</span>
                </div>
              </div>
            </details>
          </template>

          <template v-else-if="debugTracePopupKind === 'combo'">
            <div v-if="pagedComboTriggerDebug.length === 0" class="text-sm text-[#777]">{{ t("rotation.noComboTriggerAttempts") }}</div>
            <details
              v-for="(entry, entryIndex) in pagedComboTriggerDebug"
              :key="`${entry.sourceStepId}-${entry.sourceEventType}-${entry.time}-${debugTracePageStart + entryIndex}`"
              class="rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <summary class="cursor-pointer list-none">
                <div class="grid grid-cols-[minmax(0,1fr)_68px] items-center gap-2">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">
                    {{ entry.triggered ? t("rotation.triggeredShort") : t("rotation.blockedShort") }} · {{ entry.characterName ?? entry.characterId ?? `Slot ${entry.slot + 1}` }} · {{ entry.sourceEventType }}
                  </div>
                  <div class="text-right text-xs font-medium text-[#666]">{{ formatDisplayedRealTime(entry.time) }}s</div>
                </div>
              </summary>
              <div class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div
                  v-for="detail in getComboDebugDetailEntries(entry)"
                  :key="`${entryIndex}-${detail.key}`"
                  class="flex items-start justify-between gap-2 rounded border border-[#f0f0f0] bg-[#fcfcfc] px-2 py-1.5 text-xs"
                >
                  <span class="text-[#666]">{{ detail.key }}</span>
                  <span class="break-all text-right font-medium text-[#1b1b1b]">{{ detail.value }}</span>
                </div>
              </div>
            </details>
          </template>

          <template v-else>
            <div v-if="pagedPassiveListenerDebug.length === 0" class="text-sm text-[#777]">{{ t("rotation.noPassiveListenerDispatches") }}</div>
            <details
              v-for="(entry, entryIndex) in pagedPassiveListenerDebug"
              :key="`${entry.eventStepId ?? 'no-step'}-${entry.listenerKind}-${entry.slot}-${entry.time}-${debugTracePageStart + entryIndex}`"
              class="rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <summary class="cursor-pointer list-none">
                <div class="grid grid-cols-[minmax(0,1fr)_68px] items-center gap-2">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">
                    {{ formatPassiveListenerKind(entry.listenerKind) }} · {{ entry.triggerName ?? entry.characterName ?? "-" }} · {{ formatEventType(entry.eventType) }} · {{ entry.listenerPresent ? t("rotation.presentShort") : t("rotation.missingShort") }}
                  </div>
                  <div class="text-right text-xs font-medium text-[#666]">{{ formatDisplayedRealTime(entry.time) }}s</div>
                </div>
              </summary>
              <div class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div
                  v-for="detail in getPassiveListenerDebugDetailEntries(entry)"
                  :key="`${entryIndex}-${detail.key}`"
                  class="flex items-start justify-between gap-2 rounded border border-[#f0f0f0] bg-[#fcfcfc] px-2 py-1.5 text-xs"
                >
                  <span class="text-[#666]">{{ detail.key }}</span>
                  <span class="break-all text-right font-medium text-[#1b1b1b]">{{ detail.value }}</span>
                </div>
              </div>
            </details>
          </template>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-[#e8e8e8] px-5 py-3">
          <button
            type="button"
            class="rounded-md border border-[#d4d4d4] px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="debugTracePage <= 1"
            @click="setDebugTracePage(debugTracePage - 1)"
          >
            {{ t("ui.previous") }}
          </button>
          <div class="text-xs text-[#666]">{{ debugTraceTotalRows === 0 ? 0 : debugTracePageStart + 1 }}–{{ Math.min(debugTracePageStart + DEBUG_TRACE_PAGE_SIZE, debugTraceTotalRows) }} / {{ debugTraceTotalRows }}</div>
          <button
            type="button"
            class="rounded-md border border-[#d4d4d4] px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="debugTracePage >= debugTracePageCount"
            @click="setDebugTracePage(debugTracePage + 1)"
          >
            {{ t("ui.next") }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedStatusDetails"
      class="fixed inset-0 z-[75] flex items-center justify-center bg-black/35 px-4"
      @click.self="selectedStatusDetails = null"
    >
      <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d6d6d6] bg-white p-4 shadow-xl">
        <div class="mb-3 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.statusBuffDetails") }}</div>
            <div class="text-xs text-[#666]">{{ selectedStatusDetails.label }}</div>
          </div>
          <button
            type="button"
            class="rounded-md border border-[#d7d7d7] px-2 py-1 text-xs text-[#444] transition hover:bg-[#f5f5f5]"
            @click="selectedStatusDetails = null"
          >
            {{ t("ui.close") }}
          </button>
        </div>
        <div class="space-y-1 rounded-lg border border-[#ececec] bg-[#fafafa] p-3 text-xs text-[#333]">
          <div
            v-for="entry in selectedStatusDetails.modifierEntries"
            :key="`status-detail-${entry.key}`"
            class="flex items-center justify-between gap-2"
          >
            <span class="truncate">{{ entry.label }}</span>
            <span class="shrink-0 font-medium">{{ formatModifierValue(entry.value, entry.key, entry.isPercent) }}</span>
          </div>
          <div v-if="selectedStatusDetails.modifierEntries.length === 0" class="text-[#777]">
            No numeric buff entries.
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="rotationMetadataEditorOpen"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-2xl rounded-xl border border-[#d9d9d9] bg-white p-5 shadow-lg">
        <div class="text-base font-semibold text-[#1b1b1b]">{{ t("rotation.editRotationTitle") }}</div>
        <form class="mt-4 space-y-4" @submit.prevent="submitRotationMetadataEdit">
          <label class="block">
            <div class="mb-1 text-sm font-medium text-[#444]">{{ t("buildList.nameLabel") }}</div>
            <input
              v-model="rotationNameDraft"
              type="text"
              maxlength="48"
              class="w-full rounded-md border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#1b1b1b] outline-none focus:border-[#b1b1b1]"
              autofocus
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm font-medium text-[#444]">{{ t("buildList.descriptionLabel") }}</div>
            <textarea
              v-model="rotationDescriptionDraft"
              rows="5"
              maxlength="1000"
              class="w-full rounded-md border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#1b1b1b] outline-none focus:border-[#b1b1b1]"
            />
          </label>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f3f3f3]"
              @click="closeRotationMetadataEditor"
            >
              {{ t("ui.cancel") }}
            </button>
            <button
              type="submit"
              class="rounded border border-[#cecece] bg-[#f7f7f7] px-3 py-1.5 text-sm text-[#444] hover:bg-[#efefef]"
            >
              {{ t("ui.save") }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <RotationHitDetailsModal
      :selected-hit-for-details="selectedHitForDetails"
      :selected-hit-details="selectedHitDetails"
      :modifier-stat-keys="MODIFIER_STAT_KEYS"
      :default-modifier-stats="defaultModifierStats"
      :modifier-labels="modifierLabels"
      :get-timeline-command-type-label="getTimelineCommandTypeLabel"
      :format-damage="formatDamage"
      :format-modifier-value="formatModifierValue"
      :on-close="() => { selectedHitForDetails = null; }"
    />
  </section>
</template>

<style scoped>
.contracts-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #c7cf3a #f1f1f1;
}

.contracts-scrollbar::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.contracts-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 999px;
}

.contracts-scrollbar::-webkit-scrollbar-thumb {
  background: #c7cf3a;
  border-radius: 999px;
  border: 2px solid #f1f1f1;
}
</style>
