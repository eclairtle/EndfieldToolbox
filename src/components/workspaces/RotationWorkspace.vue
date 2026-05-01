<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

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
  CritRiggingRule,
  PartySlot,
  Rotation,
  RotationCombatEvent,
  RotationSimulationResult,
  RotationStep,
  RotationTimeExtension,
} from "@/lib/combat/rotation";
import { buildCombatSnapshot } from "@/lib/combat/buildSnapshots";
import { useRotationSchemes } from "@/lib/combat/rotationSchemes";
import {
  getActorStateAtTime,
  getEnemyStateAtTime,
  simulateRotation,
  makeEnemyModifierSnapshot,
} from "@/lib/combat/simulateRotation";
import { modifierLabels } from "@/lib/modifierDisplay";
import { getAverageCritMultiplier, getTotalDamageBonus } from "@/lib/combat/combatDamage";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import {
  buildEnemyActionWindows,
  getDefaultEnemyCommandPlacements,
  getEnemyCommandDefinitions,
  type EnemyCommandPlacement,
} from "@/lib/enemy/enemyActionWindows";
import { ROTATION_ENEMY_COMMANDS_STORAGE_KEY, ROTATION_SP_STORAGE_KEY } from "@/lib/storageKeys";
import { CONSUMABLES } from "@/data/consumables";
import { useLocale } from "@/i18n/useLocale";
import type { CharacterSkillKey } from "@/lib/build/characterSkills";
import { getCharacterDisplayName } from "@/i18n/domain/displayNames";
import { getCharacterSkillDisplayName } from "@/i18n/domain/skillNames";
import RotationSelectedCommandPanel from "@/components/workspaces/rotation/RotationSelectedCommandPanel.vue";
import RotationHitDetailsModal from "@/components/workspaces/rotation/RotationHitDetailsModal.vue";

const props = defineProps<{
  buildId?: string;
  enemies: EnemyBase[];
  selectedEnemyId: string;
  enemyName: string;
  enemyLevel: number;
  enemyStats: EnemyResolvedStats;
  enemyStaggerGauge: number;
  enemyStaggerNodes?: number[];
  enemyStaggerRecoverySeconds: number;
  enemyFinisherMultiplier: number;
  enemyFinisherSpGain: number;
}>();

const emit = defineEmits<{
  (e: "update:selectedEnemyId", value: string): void;
  (e: "update:enemyLevel", value: number): void;
}>();

const buildStore = useBuildStore();
const { slots } = storeToRefs(buildStore);
const { t, locale } = useLocale();

const AXIS_SCALE = 116;
const AXIS_SNAP_SECONDS = 0.1;
const TRACK_LABEL_WIDTH = 160;
const TEAM_SP_MAX = 300;
const GENERATED_SP_TEAM_ENERGY_RATE = 0.065;
const SWITCH_BACK_COOLDOWN_SECONDS = 2;
const TIMELINE_ROW_HEIGHT = 112;
const CONTROL_TRACK_OFFSET = 16;
const ENEMY_FINISHER_AVAILABLE_STATUS_ID = "enemy_finisher_available";

function makeStepId(): string {
  return `step_${Math.random().toString(36).slice(2, 10)}`;
}

function toPartySlot(index: number): PartySlot {
  return Math.max(0, Math.min(3, index)) as PartySlot;
}

function buildSnapshot(slot: CharacterBuildSlot, index: number): CharacterCombatSnapshot | null {
  return buildCombatSnapshot(slot, index);
}

type TeamSpConfig = {
  initialSp: number;
  spRegenRate: number;
  startingEnergyBySlot: number[];
  consumableBySlot: (string | null)[];
};

type EnemyCommandLayoutsByScheme = Record<string, Record<string, EnemyCommandPlacement[]>>;

function makeDefaultTeamSpConfig(): TeamSpConfig {
  return { initialSp: 200, spRegenRate: 8, startingEnergyBySlot: [0, 0, 0, 0], consumableBySlot: [null, null, null, null] };
}

const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";

function getBuildStorageScopeId(): string {
  return props.buildId && props.buildId.length > 0
    ? props.buildId
    : BUILD_STORAGE_SCOPE_DEFAULT;
}

function normalizeTeamSpConfig(value: Partial<TeamSpConfig> | null | undefined): TeamSpConfig {
  return {
    initialSp: value?.initialSp ?? 200,
    spRegenRate: value?.spRegenRate ?? 8,
    startingEnergyBySlot: Array.isArray(value?.startingEnergyBySlot)
      ? [0, 1, 2, 3].map((index) => Math.max(0, Math.min(100, value?.startingEnergyBySlot?.[index] ?? 0)))
      : [0, 0, 0, 0],
    consumableBySlot: Array.isArray(value?.consumableBySlot)
      ? [0, 1, 2, 3].map((index) => {
        const id = value?.consumableBySlot?.[index];
        return typeof id === "string" && id.length > 0 ? id : null;
      })
      : [null, null, null, null],
  };
}

function loadTeamSpConfigByScheme(): Record<string, TeamSpConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as
      | Partial<TeamSpConfig>
      | { byScheme?: Record<string, Partial<TeamSpConfig>> }
      | { byBuild?: Record<string, { byScheme?: Record<string, Partial<TeamSpConfig>> }> }
      | null;

    if (parsed && typeof parsed === "object" && "byBuild" in parsed && parsed.byBuild) {
      const buildScope = parsed.byBuild[getBuildStorageScopeId()];
      if (buildScope?.byScheme) {
        return Object.fromEntries(
          Object.entries(buildScope.byScheme).map(([schemeId, config]) => [schemeId, normalizeTeamSpConfig(config)]),
        );
      }
      return {};
    }

    if (parsed && typeof parsed === "object" && "byScheme" in parsed && parsed.byScheme) {
      return Object.fromEntries(
        Object.entries(parsed.byScheme).map(([schemeId, config]) => [schemeId, normalizeTeamSpConfig(config)]),
      );
    }

    return {
      __legacy__: normalizeTeamSpConfig(parsed as Partial<TeamSpConfig>),
    };
  } catch (error) {
    console.warn("Failed to load rotation SP config from localStorage", error);
    return {};
  }
}

function normalizeEnemyCommandPlacement(value: Partial<EnemyCommandPlacement> | null | undefined): EnemyCommandPlacement | null {
  if (!value || typeof value.id !== "string" || typeof value.commandId !== "string") {
    return null;
  }
  return {
    id: value.id,
    commandId: value.commandId,
    startTime: Math.max(0, Number(value.startTime ?? 0)),
    interrupted: value.interrupted === true,
    interruptedSpGain: Math.max(0, Number(value.interruptedSpGain ?? 0)),
    interruptedStagger: Math.max(0, Number(value.interruptedStagger ?? 0)),
  };
}

function loadEnemyCommandLayoutsByScheme(): EnemyCommandLayoutsByScheme {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const parsedRecord = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    const byBuild = parsedRecord?.byBuild && typeof parsedRecord.byBuild === "object"
      ? parsedRecord.byBuild as Record<string, { byScheme?: Record<string, Record<string, Partial<EnemyCommandPlacement>[]>> }>
      : null;
    const scoped = byBuild?.[getBuildStorageScopeId()];
    const byScheme = scoped?.byScheme
      ?? ((parsedRecord?.byScheme && typeof parsedRecord.byScheme === "object")
        ? parsedRecord.byScheme as Record<string, Record<string, Partial<EnemyCommandPlacement>[]>>
        : {});

    const result: EnemyCommandLayoutsByScheme = {};
    for (const [schemeId, byEnemy] of Object.entries(byScheme)) {
      const nextByEnemy: Record<string, EnemyCommandPlacement[]> = {};
      for (const [enemyId, placements] of Object.entries(byEnemy ?? {})) {
        nextByEnemy[enemyId] = (placements ?? [])
          .map((placement: Partial<EnemyCommandPlacement>) => normalizeEnemyCommandPlacement(placement))
          .filter((placement: EnemyCommandPlacement | null): placement is EnemyCommandPlacement => placement != null);
      }
      result[schemeId] = nextByEnemy;
    }

    return result;
  } catch (error) {
    console.warn("Failed to load enemy command layout from localStorage", error);
    return {};
  }
}

const { rotationSchemes, activeScheme, activeRotation: rotation, setActiveScheme, addScheme, renameActiveScheme, removeActiveScheme } = useRotationSchemes();
const selectedLibrarySlot = ref<PartySlot>(0);
const sidebarMode = ref<"character" | "enemy">("character");
const controlPanelMode = ref<"simple" | "detailed">("simple");
const selectedStepIds = ref<string[]>(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
const selectionAnchorId = ref<string | null>(rotation.value.steps[0]?.id ?? null);
const selectedEnemyCommandId = ref<string | null>(null);
const cursorTime = ref(0);
const teamSpConfigByScheme = ref<Record<string, TeamSpConfig>>(loadTeamSpConfigByScheme());
const enemyCommandLayoutsByScheme = ref<EnemyCommandLayoutsByScheme>(loadEnemyCommandLayoutsByScheme());
const teamSpConfig = computed<TeamSpConfig>(() => {
  const schemeId = activeScheme.value.id;
  const existing = teamSpConfigByScheme.value[schemeId];
  if (existing) {
    return existing;
  }

  const legacy = teamSpConfigByScheme.value.__legacy__;
  const next = legacy ? { ...legacy } : makeDefaultTeamSpConfig();
  if (legacy) {
    delete teamSpConfigByScheme.value.__legacy__;
  }
  teamSpConfigByScheme.value[schemeId] = next;
  return next;
});
const commandListExpanded = ref(true);
const statusListExpanded = ref(true);
const enemyCommandDefinitions = computed(() => getEnemyCommandDefinitions(props.selectedEnemyId));
const enemyCommands = computed<EnemyCommandPlacement[]>(() => {
  const schemeId = activeScheme.value.id;
  const enemyId = props.selectedEnemyId;
  const byEnemy = enemyCommandLayoutsByScheme.value[schemeId] ?? {};
  if (!enemyCommandLayoutsByScheme.value[schemeId]) {
    enemyCommandLayoutsByScheme.value[schemeId] = byEnemy;
  }

  const existing = byEnemy[enemyId];
  if (existing) {
    return existing;
  }

  const defaults = getDefaultEnemyCommandPlacements(enemyId);
  byEnemy[enemyId] = defaults.map((entry) => ({ ...entry }));
  return byEnemy[enemyId];
});
const enemyTimelineCommands = computed(() => {
  const definitionById = new Map(enemyCommandDefinitions.value.map((entry) => [entry.id, entry]));
  return enemyCommands.value
    .map((entry) => {
      const definition = definitionById.get(entry.commandId);
      if (!definition) {
        return null;
      }
      const startTime = Math.max(0, roundToSnap(entry.startTime));
      return {
        ...entry,
        label: definition.label,
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
      commandId: string;
      label: string;
      startTime: number;
      endTime: number;
      interruptible: boolean;
      interrupted: boolean;
      interruptedSpGain: number;
      interruptedStagger: number;
    } => entry != null)
    .sort((left, right) => left.startTime - right.startTime);
});

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
    }
  },
  { deep: true, immediate: true },
);

watch(
  teamSpConfigByScheme,
  (value) => {
    const raw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
    let parsed: { byBuild?: Record<string, { byScheme?: Record<string, TeamSpConfig> }> } = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = {};
      }
    }
    if (!parsed.byBuild) {
      parsed.byBuild = {};
    }
    parsed.byBuild[getBuildStorageScopeId()] = { byScheme: value };
    window.localStorage.setItem(ROTATION_SP_STORAGE_KEY, JSON.stringify(parsed));
  },
  { deep: true },
);

watch(
  enemyCommandLayoutsByScheme,
  (value) => {
    const raw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
    let parsed: { byBuild?: Record<string, { byScheme?: EnemyCommandLayoutsByScheme }> } = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = {};
      }
    }
    if (!parsed.byBuild) {
      parsed.byBuild = {};
    }
    parsed.byBuild[getBuildStorageScopeId()] = { byScheme: value };
    window.localStorage.setItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY, JSON.stringify(parsed));
  },
  { deep: true },
);

watch(
  () => props.buildId,
  () => {
    teamSpConfigByScheme.value = loadTeamSpConfigByScheme();
    enemyCommandLayoutsByScheme.value = loadEnemyCommandLayoutsByScheme();
    setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
    selectionAnchorId.value = rotation.value.steps[0]?.id ?? null;
    selectedEnemyCommandId.value = null;
    cursorTime.value = 0;
  },
);

watch(
  () => activeScheme.value.id,
  () => {
    setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
    selectionAnchorId.value = rotation.value.steps[0]?.id ?? null;
    selectedEnemyCommandId.value = null;
    cursorTime.value = 0;
  },
);

const partySnapshots = computed(() =>
  slots.value
    .map((slot, index) => buildSnapshot(slot, index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null),
);

const partyBySlot = computed(() => new Map(partySnapshots.value.map((snapshot) => [snapshot.slot, snapshot])));
const consumableOptions = CONSUMABLES;

const libraryCharacter = computed(() => partyBySlot.value.get(selectedLibrarySlot.value) ?? null);
const visibleLibraryCommands = computed(() =>
  sidebarMode.value === "character"
    ? (libraryCharacter.value?.commands ?? []).filter((command) => !command.hiddenInLibrary)
    : [],
);
const selectedSidebarTitle = computed(() =>
  sidebarMode.value === "enemy"
    ? props.enemyName
    : getLocalizedCharacterName(libraryCharacter.value?.characterId, libraryCharacter.value?.characterName)
      || t("builder.slot", { index: selectedLibrarySlot.value + 1 }),
);
const currentEnemyState = computed(() => getEnemyStateAtTime(simulation.value, cursorTime.value));
const enemyStaggerNodePercents = computed(() => {
  const gauge = Math.max(1, props.enemyStaggerGauge);
  return (props.enemyStaggerNodes ?? [])
    .map((node) => (node > 0 && node <= 1 ? node : node / gauge))
    .filter((node) => node > 0 && node < 1)
    .sort((a, b) => a - b);
});
const enemyStaggerSections = computed(() => {
  const currentFraction = Math.max(0, Math.min(1, currentEnemyState.value.currentStagger / Math.max(1, props.enemyStaggerGauge)));
  const bounds = [0, ...enemyStaggerNodePercents.value, 1];
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
});

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
      label: modifierLabels[key as ModifierStatKey] ?? key,
      value: value as number,
      isPercent: key.endsWith("_PCT"),
    }));
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
      const debuffName = debuff.label ?? modifierLabels[debuff.stat] ?? debuff.stat;
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
          label: modifierLabels[debuff.stat] ?? debuff.stat,
          value: debuff.value,
          isPercent: debuff.stat.endsWith("_PCT"),
        }],
      });
    }
    for (const status of currentEnemyState.value.activeStatuses) {
      const remainingSeconds = Math.max(
        0,
        status.expiresAt - (status.timeScale === "real" ? cursorTime.value : cursorGameTime),
      );
      items.push({
        label: status.label,
        details: typeof status.stacks === "number" ? t("rotation.stacks", { count: status.stacks }) : undefined,
        remainingSeconds,
      });
    }
    if (currentEnemyState.value.artsInfliction) {
      items.push({
        label: t("rotation.infliction", { element: currentEnemyState.value.artsInfliction.element }),
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
      label: buff.label,
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
      label: status.label,
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

function getCommandStateAtTime(slot: PartySlot, realTime: number): {
  activeBuffIds: string[];
  meltingFlameStacks: number;
  finisherAvailable: boolean;
  enemyStatusIds: string[];
  canUseFinisherTransform: boolean;
} {
  const actorState = getActorStateAtTime(simulation.value, slot, realTime);
  const enemyState = getEnemyStateAtTime(simulation.value, realTime);
  const controlState = getControlStateAtRealTime(realTime);
  const activeBuffIds = Array.from(new Set(
    actorState.activeBuffs.flatMap((buff) => {
      const baseId = buff.id.split(":")[0] ?? buff.id;
      return baseId === buff.id ? [buff.id] : [buff.id, baseId];
    }),
  ));
  return {
    activeBuffIds,
    meltingFlameStacks: actorState.meltingFlameStacks,
    finisherAvailable: enemyState.activeStatuses.some((status) => status.id === ENEMY_FINISHER_AVAILABLE_STATUS_ID),
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
  enemyTimelineCommands.value.find((entry) => entry.id === selectedEnemyCommandId.value) ?? null,
);
const hasSelectedEnemyCommand = computed(() => selectedEnemyCommand.value != null);
const hasAnySelectedCommand = computed(() => selectedSteps.value.length > 0 || hasSelectedEnemyCommand.value);

const selectedCommandsCount = computed(() => selectedSteps.value.length);
const hasMultiSelection = computed(() => selectedCommandsCount.value > 1);

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
    return [] as Array<{ hitIndex: number; repeatIndex: number; label: string }>;
  }
  const options: Array<{ hitIndex: number; repeatIndex: number; label: string }> = [];
  command.hits.forEach((hit, hitIndex) => {
    const repeatTimes = Math.max(1, hit.times ?? 1);
    for (let repeatIndex = 0; repeatIndex < repeatTimes; repeatIndex += 1) {
      options.push({
        hitIndex,
        repeatIndex,
        label: repeatTimes > 1
          ? `${hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
          : (hit.name ?? `Hit ${hitIndex + 1}`),
      });
    }
  });
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

const simulation = computed(() =>
  simulateRotation({
    rotation: rotation.value,
    party: partySnapshots.value,
    enemyStats: props.enemyStats,
    enemyMods: enemyMods.value,
    enemyStaggerGauge: props.enemyStaggerGauge,
    enemyStaggerNodes: props.enemyStaggerNodes,
    enemyStaggerRecoverySeconds: props.enemyStaggerRecoverySeconds,
    enemyFinisherMultiplier: props.enemyFinisherMultiplier,
    enemyFinisherSpGain: props.enemyFinisherSpGain,
    battleStartConsumableIdsBySlot: teamSpConfig.value.consumableBySlot,
    enemyActionWindows: buildEnemyActionWindows(props.selectedEnemyId, enemyCommands.value),
  }),
);

const timelineDuration = computed(() => Math.max(12, Math.ceil(simulation.value.totalTime + 2)));
const timelineWidth = computed(() => timelineDuration.value * AXIS_SCALE);

const realSeconds = computed(() =>
  Array.from({ length: timelineDuration.value + 1 }, (_, index) => index),
);

const gameTimelineDuration = computed(() => {
  const latestCursorGameTime = toGameTimeFromExtensions(cursorTime.value, simulation.value.timeExtensions);
  return Math.max(0, Math.ceil(Math.max(simulation.value.totalGameTime, latestCursorGameTime)));
});

const gameSeconds = computed(() =>
  Array.from({ length: gameTimelineDuration.value + 1 }, (_, index) => ({
    value: index,
    realTime: toRealTimeFromExtensions(index, simulation.value.timeExtensions),
  })).filter((entry) => entry.realTime <= timelineDuration.value),
);

const enemyInvulnerabilityWindows = computed(() =>
  simulation.value.enemyActionWindows
    .filter((window) => window.invulnerable && window.endTime > 0 && window.startTime < timelineDuration.value)
    .map((window) => ({
      ...window,
      start: Math.max(0, window.startTime),
      end: Math.min(timelineDuration.value, window.endTime),
      color: window.tintColor ?? "rgba(215, 64, 64, 0.25)",
    }))
    .filter((window) => window.end > window.start),
);

const enemyPhaseTransitionWindows = computed(() =>
  simulation.value.enemyActionWindows
    .filter((window) => window.commandId === "phase_transition" && window.endTime > 0 && window.startTime < timelineDuration.value)
    .map((window) => ({
      ...window,
      start: Math.max(0, window.startTime),
      end: Math.min(timelineDuration.value, window.endTime),
      color: "rgba(140, 72, 194, 0.16)",
      borderColor: "rgba(116, 62, 162, 0.48)",
    }))
    .filter((window) => window.end > window.start),
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
const linkEnhancedStepIdSet = computed(() => new Set(simulation.value.linkEnhancedStepIds));

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];
const damageContributions = computed(() => {
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
const eventLogExpanded = ref(false);
const comboTriggerDebugExpanded = ref(false);
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

const selectedCharacterLiveState = computed(() => {
  if (sidebarMode.value !== "character") {
    return null;
  }
  const actor = partyBySlot.value.get(selectedLibrarySlot.value);
  if (!actor) {
    return null;
  }

  const actorState = getActorStateAtTime(simulation.value, actor.slot, cursorTime.value);
  const liveMods: ModifierStats = { ...actor.mods };
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
    actor.uniqueTalentToggles[key] === true || actor.uniqueTalentDefaults?.[key] === true;

  const activeEnemyStatusIds = new Set(currentEnemyState.value.activeStatuses.map((status) => status.id));
  const enemyInflictionElement = currentEnemyState.value.artsInfliction?.element;

  for (const buff of actorState.activeBuffs) {
    if (!buff.effects) {
      continue;
    }
    applyModifierDelta(buff.effects);
  }

  for (const conditional of actor.conditionalModifiers ?? []) {
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

  const rawAtk = actor.baseAtk + actor.weaponAtk;
  const modAtk = Math.round(rawAtk * liveMods.ATK_PCT);
  const liveAtk = Math.floor((rawAtk + modAtk + liveMods.FLAT_ATK) * (1 + actor.attributeBonus));
  const liveHp = Math.round((actor.baseHp + actor.attrs.STR * 5) * (1 + liveMods.HP_PCT) + liveMods.FLAT_HP);

  const changedModifiers = MODIFIER_STAT_KEYS
    .filter((key) => Math.abs(liveMods[key] - defaultModifierStats[key]) > 1e-9)
    .map((key) => ({
      key,
      label: modifierLabels[key] ?? key,
      value: liveMods[key],
      isPercent: key.endsWith("_PCT"),
    }));

  return {
    actor,
    liveMods,
    attrs: actor.attrs,
    atk: liveAtk,
    hp: liveHp,
    def: actor.finalDef,
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
  const getSus = (damageType: string, mods: ModifierStats): number => {
    switch (damageType) {
      case "Physical": return mods.PHYSICAL_SUS_PCT;
      case "Heat": return mods.ARTS_SUS_PCT + mods.HEAT_SUS_PCT;
      case "Cryo": return mods.ARTS_SUS_PCT + mods.CRYO_SUS_PCT;
      case "Electric": return mods.ARTS_SUS_PCT + mods.ELECTRIC_SUS_PCT;
      case "Nature": return mods.ARTS_SUS_PCT + mods.NATURE_SUS_PCT;
      case "Aether": return mods.ARTS_SUS_PCT + mods.AETHER_SUS_PCT;
      default: return 0;
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
  const effectiveResistance = getEnemyRes(hit.damageType, ctx.enemyMods) - getResIgnore(hit.damageType, ctx.attackerMods);
  const resistanceMultiplier = 1 - effectiveResistance;
  const susceptibilityMultiplier = 1 + getSus(hit.damageType, ctx.enemyMods);
  const critAverageMultiplier = getAverageCritMultiplier(ctx.attackerMods);
  const artsIntensity = Math.max(0, ctx.attackerMods.ARTS_INTENSITY);
  const levelMultiplier = ctx.attackType === "REACTION"
    ? 1 + ((Math.max(1, ctx.applierLevel ?? 1) - 1) / (ctx.isPhysicalReaction ? 392 : 196))
    : 1;
  const artsIntensityMultiplier = ctx.attackType === "REACTION"
    ? 1 + artsIntensity / 100
    : 1;
  const staggeredMultiplier = Math.max(0, ctx.staggeredMultiplier ?? 1);
  const finisherBonusMultiplier = Math.max(0, ctx.finisherBonusMultiplier ?? 1);
  const totalEnemyMultiplier = Math.max(0, ctx.totalEnemyMultiplier ?? (staggeredMultiplier * finisherBonusMultiplier));

  return {
    hit,
    ctx,
    totalDamageBonus,
    dmgAmpMultiplier,
    damageTakenMultiplier,
    effectiveResistance,
    resistanceMultiplier,
    susceptibilityMultiplier,
    defenseMultiplier,
    critAverageMultiplier,
    levelMultiplier,
    artsIntensityMultiplier,
    artsIntensity,
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
  entries.push({ key: "Real Time", value: `${event.time.toFixed(3)}s` });
  entries.push({ key: "Game Time", value: `${event.gameTime.toFixed(3)}s` });

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
      return "Missing actor/combo command";
    case "ACTIVE_COMBO_WINDOW_EXISTS":
      return "Active combo window already exists";
    case "COMBO_ON_COOLDOWN":
      return "Combo on cooldown";
    default:
      return "Unknown";
  }
}

function getComboDebugDetailEntries(
  entry: RotationSimulationResult["comboTriggerDebug"][number],
): Array<{ key: string; value: string }> {
  const rows: Array<{ key: string; value: string }> = [
    { key: "Triggered", value: entry.triggered ? "yes" : "no" },
    { key: "Slot", value: String(entry.slot + 1) },
    { key: "Character", value: entry.characterName ?? entry.characterId ?? "-" },
    { key: "Source Event Type", value: entry.sourceEventType },
    { key: "Source Step", value: entry.sourceStepId || "-" },
    { key: "Combo Command", value: entry.comboCommandId ?? "-" },
    { key: "Cooldown Owner", value: entry.cooldownOwnerCommandId ?? "-" },
    { key: "Combo Time Scale", value: entry.comboTimeScale },
    { key: "Current Time", value: entry.currentTime.toFixed(3) },
    { key: "Cooldown Until", value: entry.cooldownUntil.toFixed(3) },
    { key: "Has Active Window", value: entry.hasActiveComboWindow ? "yes" : "no" },
    { key: "Has Pending Cooldown", value: entry.hasPendingCooldown ? "yes" : "no" },
  ];
  if (entry.readyAt != null) {
    rows.push({ key: "Ready At", value: entry.readyAt.toFixed(3) });
  }
  if (entry.expiresAt != null) {
    rows.push({ key: "Expires At", value: entry.expiresAt.toFixed(3) });
  }
  if (entry.blockReason) {
    rows.push({ key: "Block Reason", value: formatComboDebugBlockReason(entry.blockReason) });
  }
  return rows;
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

const dragState = ref<DragState | null>(null);
const enemyCommandDragState = ref<EnemyCommandDragState | null>(null);
const cursorDragState = ref<CursorDragState | null>(null);
const libraryDragState = ref<LibraryDragState | null>(null);
const marqueeSelectionState = ref<MarqueeSelectionState | null>(null);
const actionElementByStepId = new Map<string, HTMLElement>();

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

const currentControlState = computed(() => getControlStateAtRealTime(cursorTime.value));

const selectedCharacterIsControlled = computed(() =>
  selectedLibrarySlot.value === currentControlState.value.controlledSlot,
);

const selectedCharacterSwitchLockRemaining = computed(() => {
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(selectedLibrarySlot.value) ?? 0;
  return Math.max(0, lockedUntil - cursorTime.value);
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

function getActiveTriggeredComboWindowForSlot(slot: PartySlot, atTime: number) {
  return [...simulation.value.comboWindows]
    .filter((window) => {
      if (window.slot !== slot || window.readyAt > atTime) {
        return false;
      }
      const activeUntil = window.consumedAt != null
        ? Math.min(window.expiresAt, window.consumedAt)
        : window.expiresAt;
      return atTime < activeUntil;
    })
    .sort((a, b) => b.readyAt - a.readyAt)[0] ?? null;
}

function addStepForSlot(slot: PartySlot, commandId: string) {
  addStep(slot, commandId);
}

function executeControlledBasicAttack() {
  const slot = currentControlState.value.controlledSlot;
  const command = getPrimaryCommandForSlot(slot, "BASIC_ATTACK");
  if (!command) {
    return;
  }
  addStepForSlot(slot, command.id);
}

function executeControlledGeneric(commandId: "__dodge" | "__jump") {
  addStepForSlot(currentControlState.value.controlledSlot, commandId);
}

function executeSwitchToSlot(slot: PartySlot) {
  const controlled = currentControlState.value.controlledSlot;
  if (slot === controlled) {
    return;
  }
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(slot) ?? 0;
  if (lockedUntil > cursorTime.value + 0.0001) {
    return;
  }
  addStepForSlot(slot, "__switch");
}

function getSwitchCooldownRemaining(slot: PartySlot): number {
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(slot) ?? 0;
  return Math.max(0, lockedUntil - cursorTime.value);
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
  addStepForSlot(slot, command.id);
}

const controlTimeline = computed(() => {
  const switchActions = [...simulation.value.actions]
    .map((action) => ({
      action,
      command: getCommandForAction(action),
    }))
    .filter((entry) => entry.command?.genericActionType === "switch")
    .sort((a, b) => a.action.realStartTime - b.action.realStartTime);

  const segments: ControlTimelineSegment[] = [];
  const markers: ControlSwitchMarker[] = [];
  let controlledSlot: PartySlot = 0;
  let segmentStart = 0;
  const switchBackLockedUntilBySlot = new Map<PartySlot, number>();

  for (const { action } of switchActions) {
    if (action.slot === controlledSlot) {
      continue;
    }

    const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? 0;
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

function getCommandForAction(action: RotationSimulationResult["actions"][number]) {
  return partyBySlot.value.get(action.slot)?.commands.find((entry) => entry.id === action.commandId) ?? null;
}

function getControlStateAtRealTime(targetTime: number): ControlStateSnapshot {
  const switchActions = [...simulation.value.actions]
    .filter((action) => action.realStartTime <= targetTime)
    .sort((a, b) => a.realStartTime - b.realStartTime);

  let controlledSlot: PartySlot = 0;
  const switchBackLockedUntilBySlot = new Map<PartySlot, number>();

  for (const action of switchActions) {
    const command = getCommandForAction(action);
    if (command?.genericActionType !== "switch") {
      continue;
    }

    if (action.slot === controlledSlot) {
      continue;
    }

    const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? 0;
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

function addGeneratedSp(state: TeamSpState, amount: number) {
  if (amount <= 0) return;

  const directSpace = TEAM_SP_MAX - (state.generated + state.returned);
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

function getUltEnergyGainMultiplierAtTime(slot: PartySlot, time: number): number {
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return 1;
  }
  const actorState = getActorStateAtTime(simulation.value, slot, time);
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
}) {
  if (args.rawAmount <= 0) {
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
  const gainMultiplier = getUltEnergyGainMultiplierAtTime(args.targetSlot, args.time);
  const gained = args.rawAmount * gainMultiplier;
  if (gained <= 0) {
    return;
  }
  const energyMax = args.energyMaxBySlot.get(args.targetSlot) ?? 0;
  const currentEnergy = args.energyBySlot.get(args.targetSlot) ?? 0;
  args.energyBySlot.set(args.targetSlot, Math.min(energyMax, currentEnergy + gained));
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
    if (activeUntil > startReal) {
      startReal = activeUntil;
    }
  }

  return {
    real: startReal,
    game: toGameTimeFromExtensions(startReal, simulation.value.timeExtensions),
  };
}

const cursorCombatState = computed(() => {
  const targetTime = cursorTime.value;
  const currentGameTime = toGameTimeFromExtensions(targetTime, simulation.value.timeExtensions);

  const energyBySlot = new Map<PartySlot, number>();
  const energyMaxBySlot = new Map<PartySlot, number>();
  const comboBySlot = new Map<PartySlot, { readyRatio: number; label: string; mode?: "normal" | "triggered" | "perfect_window" | "executing" }>();
  const teamSp: TeamSpState = {
    generated: Math.max(0, Math.min(TEAM_SP_MAX, teamSpConfig.value.initialSp)),
    returned: 0,
  };

  for (const display of partyDisplay.value) {
    const startingEnergy =
      display.ultimateMaxEnergy > 0
        ? display.ultimateMaxEnergy * ((teamSpConfig.value.startingEnergyBySlot[display.slot] ?? 0) / 100)
        : 0;

    energyBySlot.set(display.slot, startingEnergy);
    energyMaxBySlot.set(display.slot, display.ultimateMaxEnergy);
    comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.ready"), mode: "normal" });
  }

  const spEvents: Array<
    | {
      time: number;
      type: "action-start";
      slot: PartySlot;
      spCost: number;
      energyCost: number;
      commandAttackType: CharacterCombatSnapshot["commands"][number]["attackType"];
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
      requiresControlledOperator: boolean;
      sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
    }
    | { time: number; type: "bonus-return"; amount: number }
    | { time: number; type: "skill-return"; amount: number }
  > = [];

  for (const action of simulation.value.actions) {
    const actor = partyBySlot.value.get(action.slot);
    const command = actor?.commands.find((entry) => entry.id === action.commandId);
    if (!command) {
      continue;
    }

    if (action.realStartTime <= targetTime) {
      spEvents.push({
        time: action.realStartTime,
        type: "action-start",
        slot: action.slot,
        spCost: command.spCost,
        energyCost: command.energyCost,
        commandAttackType: command.attackType,
      });
    }

    if (!action.interrupted && action.realEndTime <= targetTime) {
      spEvents.push({
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
    if (hit.time > targetTime) {
      break;
    }

    spEvents.push({
      time: hit.time,
      type: "hit",
      slot: hit.slot,
      spGenerated: hit.spGenerated,
      spReturned: hit.spReturned,
      energyReturn: hit.energyReturn,
      requiresControlledOperator: hit.requiresControlledOperator,
      sourceCommandAttackType: hit.calculationContext?.attackType,
    });
  }
  for (const event of bonusEnemyInterruptedSpEvents.value) {
    if (event.time <= targetTime) {
      spEvents.push({
        time: event.time,
        type: "bonus-return",
        amount: event.amount,
      });
    }
  }
  for (const event of bonusSpReturnedEvents.value) {
    if (event.time <= targetTime) {
      spEvents.push({
        time: event.time,
        type: "skill-return",
        amount: event.amount,
      });
    }
  }

  spEvents.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    const order = { "action-start": 0, "bonus-return": 1, "skill-return": 1, hit: 2, "action-end": 3 } as const;
    return order[a.type] - order[b.type];
  });
  let lastSpTime = 0;
  for (const event of spEvents) {
    const clampedTime = Math.min(event.time, targetTime);
    const elapsed = Math.max(0, clampedTime - lastSpTime);
    addGeneratedSp(teamSp, elapsed * teamSpConfig.value.spRegenRate);

    if (event.type === "action-start") {
      if (event.energyCost > 0) {
        const currentEnergy = energyBySlot.get(event.slot) ?? 0;
        energyBySlot.set(event.slot, Math.max(0, currentEnergy - event.energyCost));
      }

      const generatedConsumed = consumeTeamSp(teamSp, event.spCost);
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
            sourceSlot: event.slot,
            sourceCommandAttackType: event.commandAttackType,
          });
        }
      }
    }

    if (event.type === "action-end") {
      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulation.value.actorStateTimeline,
        targetSlot: event.slot,
        time: event.time,
        rawAmount: event.energyGain,
        sourceType: "command",
        sourceSlot: event.slot,
        sourceCommandAttackType: event.commandAttackType,
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

    if (event.type === "hit") {
      if (!event.requiresControlledOperator || event.slot === 0) {
        addGeneratedSp(teamSp, event.spGenerated);
      }
      addReturnedSp(teamSp, event.spReturned);

      applyUltimateEnergyGain({
        energyBySlot,
        energyMaxBySlot,
        actorStates: simulation.value.actorStateTimeline,
        targetSlot: event.slot,
        time: event.time,
        rawAmount: event.energyReturn,
        sourceType: "command",
        sourceSlot: event.slot,
        sourceCommandAttackType: event.sourceCommandAttackType,
      });
    }

    lastSpTime = clampedTime;
  }
  if (targetTime > lastSpTime) {
    addGeneratedSp(teamSp, (targetTime - lastSpTime) * teamSpConfig.value.spRegenRate);
  }

  const totalDamage = simulation.value.timeline
    .filter((entry) => entry.time <= targetTime)
    .reduce((sum, entry) => sum + entry.damage, 0);

  for (const display of partyDisplay.value) {
    if (!display.comboCommandId) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.noCombo"), mode: "normal" });
      continue;
    }

    const activeWindow = [...simulation.value.comboWindows]
      .filter((window) => {
        if (window.slot !== display.slot || window.readyAt > targetTime) {
          return false;
        }

        const activeUntil = window.consumedAt != null
          ? Math.min(window.expiresAt, window.consumedAt)
          : window.expiresAt;
        return targetTime < activeUntil;
      })
      .sort((a, b) => b.readyAt - a.readyAt)[0];

    if (activeWindow) {
      const isPerfectWindow = activeWindow.perfectTimingStartAt != null
        && activeWindow.perfectTimingEndAt != null
        && targetTime >= activeWindow.perfectTimingStartAt
        && targetTime <= activeWindow.perfectTimingEndAt;
      comboBySlot.set(
        display.slot,
        isPerfectWindow
          ? { readyRatio: 1, label: t("rotation.perfectWindow"), mode: "perfect_window" }
          : { readyRatio: 1, label: t("rotation.triggered"), mode: "triggered" },
      );
      continue;
    }

    const comboAction = [...simulation.value.actions]
      .filter(
        (action) =>
          action.slot === display.slot &&
          action.commandId === display.comboCommandId &&
          action.realStartTime <= targetTime,
      )
      .sort((a, b) => b.realStartTime - a.realStartTime)[0];

    if (!comboAction) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.notTriggered"), mode: "normal" });
      continue;
    }

    const comboCommand = display.actor?.commands.find((command) => command.id === display.comboCommandId);
    if (
      comboCommand?.comboCooldownStartsAt === "end"
      && comboAction.realStartTime <= targetTime
      && targetTime < comboAction.realEndTime
      && !comboAction.interrupted
    ) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: t("rotation.executing"), mode: "executing" });
      continue;
    }

    const cooldown = comboCommand?.comboCooldownSeconds ?? 0;
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
    teamSpTotal: teamSp.generated + teamSp.returned,
    teamSpGenerated: teamSp.generated,
    teamSpReturned: teamSp.returned,
    totalDamage,
    stagger: currentEnemyState.value.currentStagger,
    energyBySlot,
    comboBySlot,
  };
});

const actionValidationByStep = computed(() => {
  const validations = new Map<string, string>();
  const energyBySlot = new Map<PartySlot, number>();
  const energyMaxBySlot = new Map<PartySlot, number>();
  let controlledSlot: PartySlot = 0;
  const switchBackLockedUntilBySlot = new Map<PartySlot, number>();
  const teamSp: TeamSpState = {
    generated: Math.max(0, Math.min(TEAM_SP_MAX, teamSpConfig.value.initialSp)),
    returned: 0,
  };

  for (const display of partyDisplay.value) {
    const startingEnergy =
      display.ultimateMaxEnergy > 0
        ? display.ultimateMaxEnergy * ((teamSpConfig.value.startingEnergyBySlot[display.slot] ?? 0) / 100)
        : 0;

    energyBySlot.set(display.slot, startingEnergy);
    energyMaxBySlot.set(display.slot, display.ultimateMaxEnergy);
  }

  const validationEvents: Array<
    | { time: number; type: "action-start"; action: RotationSimulationResult["actions"][number] }
    | { time: number; type: "action-end"; action: RotationSimulationResult["actions"][number] }
    | { time: number; type: "hit"; hit: RotationSimulationResult["timeline"][number] }
    | { time: number; type: "bonus-return"; amount: number }
    | { time: number; type: "skill-return"; amount: number }
  > = [];

  for (const action of simulation.value.actions) {
    validationEvents.push({ time: action.realStartTime, type: "action-start", action });
    if (!action.interrupted) {
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

  validationEvents.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    const order = { "action-start": 0, "bonus-return": 1, "skill-return": 1, hit: 2, "action-end": 3 } as const;
    return order[a.type] - order[b.type];
  });

  let lastSpTime = 0;

  for (const event of validationEvents) {
    const elapsed = Math.max(0, event.time - lastSpTime);
    addGeneratedSp(teamSp, elapsed * teamSpConfig.value.spRegenRate);
    lastSpTime = event.time;

    if (event.type === "bonus-return") {
      addReturnedSp(teamSp, event.amount);
      continue;
    }
    if (event.type === "skill-return") {
      addReturnedSp(teamSp, event.amount);
      continue;
    }

    if (event.type === "hit") {
      const hit = event.hit;
      if (!hit.requiresControlledOperator || hit.slot === 0) {
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
      });
      continue;
    }

    const action = event.action;
    const actor = partyBySlot.value.get(action.slot);
    const command = actor?.commands.find((entry) => entry.id === action.commandId);
    if (!actor || !command) {
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

    if (command.genericActionType === "switch") {
      if (action.slot === controlledSlot) {
        reasons.push(t("rotation.alreadyControlled"));
      }

      const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? 0;
      if (action.realStartTime < lockedUntil - 0.001) {
        reasons.push(t("rotation.switchOnCooldown"));
      }
    }

    if (command.attackType === "COMBO_SKILL") {
      const matchingWindow = simulation.value.comboWindows.find((window) => {
        const activeUntil = window.consumedAt != null
          ? Math.min(window.expiresAt, window.consumedAt)
          : window.expiresAt;
        return (
          window.slot === action.slot &&
          window.commandId === action.commandId &&
          Math.abs((window.consumedAt ?? -999) - action.realStartTime) < 0.001 &&
          window.readyAt <= action.realStartTime &&
          action.realStartTime <= activeUntil + 0.001
        );
      });

      if (!matchingWindow) {
        const previousComboAction = [...simulation.value.actions]
          .filter(
            (entry) =>
              entry.slot === action.slot &&
              entry.commandId === action.commandId &&
              entry.realStartTime < action.realStartTime,
          )
          .sort((a, b) => b.realStartTime - a.realStartTime)[0];

        const cooldownTimeScale = command.comboCooldownTimeScale ?? "real";
        const cooldown = command.comboCooldownSeconds ?? 0;
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

        if (cooldownStart != null && cooldownNow < cooldownStart + cooldown - 0.001) {
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
        });
      }
    }

    if (command.genericActionType === "switch" && action.slot !== controlledSlot) {
      const previousControlledSlot = controlledSlot;
      controlledSlot = action.slot;
      switchBackLockedUntilBySlot.set(previousControlledSlot, action.realStartTime + SWITCH_BACK_COOLDOWN_SECONDS);
    }
  }

  return validations;
});

const enemyCommandValidationById = computed(() => {
  const validations = new Map<string, string>();
  const maxHp = Math.max(1, props.enemyStats.hp);

  for (const command of enemyTimelineCommands.value) {
    if (props.selectedEnemyId === "rhodagn" && command.commandId === "phase_transition") {
      const stateBefore = getEnemyStateAtTime(simulation.value, Math.max(0, command.startTime - 0.0001));
      const currentHp = Math.max(0, maxHp - stateBefore.currentDamageTaken);
      if (currentHp >= maxHp * 0.7 - 0.001) {
        validations.set(command.id, t("rotation.conditionNotFulfilled"));
      }
    }
  }

  return validations;
});

function addStep(slot: PartySlot, commandId: string) {
  addStepAtTime(slot, commandId, cursorTime.value);
}

function getEnemyCommandValidation(commandPlacementId: string): string | null {
  return enemyCommandValidationById.value.get(commandPlacementId) ?? null;
}

function addStepAtTime(slot: PartySlot, commandId: string, startTime: number) {
  const actor = partyBySlot.value.get(slot);
  const commandState = getCommandStateAtTime(slot, Math.max(0, roundToSnap(startTime)));
  const command = actor
    ? resolveCommandTransform(actor.commands, commandId, commandState)
    : null;
  if (!actor || !command) {
    return;
  }
  addExpandedSteps(slot, command, Math.max(0, roundToSnap(startTime)));
}

function addExpandedSteps(
  slot: PartySlot,
  command: CharacterCombatSnapshot["commands"][number],
  startTime: number,
) {
  const actor = partyBySlot.value.get(slot);
  if (!actor) {
    return;
  }

  let currentStart = startTime;
  let firstCreatedStepId: string | null = null;
  let expandedCount = 0;

  const appendResolvedCommand = (
    commandId: string,
    atStart: number,
    depth: number,
  ): number => {
    if (depth > 64 || expandedCount > 256) {
      return atStart;
    }
    const commandState = getCommandStateAtTime(slot, Math.max(0, roundToSnap(atStart)));
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

    const nextStep: RotationStep = {
      id: makeStepId(),
      slot,
      commandId: resolved.id,
      startTime: Math.max(0, roundToSnap(atStart)),
    };
    rotation.value.steps.push(nextStep);
    firstCreatedStepId ??= nextStep.id;
    expandedCount += 1;
    return roundToSnap((nextStep.startTime ?? 0) + resolved.durationFrames / 60);
  };

  currentStart = appendResolvedCommand(command.id, currentStart, 0);

  setSelectedStepIds(firstCreatedStepId ? [firstCreatedStepId] : []);
}

function addGenericStep(commandId: "__switch" | "__dodge" | "__jump") {
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
  mode: "none" | "force_crit" | "force_non_crit";
}) {
  const stepId = selectedStep.value?.id;
  if (!stepId) {
    return;
  }
  const rules = [...(rotation.value.critRiggingRules ?? [])];
  const existingIndex = rules.findIndex((rule) =>
    rule.stepId === stepId && rule.hitIndex === args.hitIndex && rule.repeatIndex === args.repeatIndex,
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
  addScheme();
  sidebarMode.value = "character";
  selectedLibrarySlot.value = 0;
}

function renameCurrentRotationScheme() {
  if (typeof window === "undefined") {
    return;
  }

  const nextName = window.prompt(t("rotation.renameRotation"), activeScheme.value.name);
  if (nextName == null) {
    return;
  }

  renameActiveScheme(nextName);
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

function clampCursorTime(value: number): number {
  return Math.max(0, Math.min(timelineDuration.value, roundToSnap(value)));
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

  const dragStepIds = normalizeSelection(selectedStepIds.value.includes(stepId) ? selectedStepIds.value : [stepId]);
  dragState.value = {
    stepIds: dragStepIds,
    originClientX: event.clientX,
    originStartTimes: Object.fromEntries(
      rotation.value.steps
        .filter((entry) => dragStepIds.includes(entry.id))
        .map((entry) => [entry.id, entry.startTime ?? 0]),
    ),
  };
}

function handlePointerMove(event: MouseEvent) {
  if (marqueeSelectionState.value) {
    marqueeSelectionState.value.currentClientX = event.clientX;
    marqueeSelectionState.value.currentClientY = event.clientY;

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
    const nextTime = clampCursorTime((event.clientX - cursorDragState.value.laneLeft) / AXIS_SCALE);
    cursorTime.value = nextTime;
    return;
  }

  const activeEnemyDrag = enemyCommandDragState.value;
  if (activeEnemyDrag) {
    const movingCommands = enemyCommands.value.filter((entry) => activeEnemyDrag.commandIds.includes(entry.id));
    if (movingCommands.length === 0) {
      enemyCommandDragState.value = null;
      return;
    }

    const deltaSeconds = (event.clientX - activeEnemyDrag.originClientX) / AXIS_SCALE;
    for (const command of movingCommands) {
      const origin = activeEnemyDrag.originStartTimes[command.id] ?? 0;
      command.startTime = Math.max(0, roundToSnap(origin + deltaSeconds));
    }
    return;
  }

  const activeDrag = dragState.value;
  if (!activeDrag) {
    return;
  }

  const movingSteps = rotation.value.steps.filter((entry) => activeDrag.stepIds.includes(entry.id));
  if (movingSteps.length === 0) {
    dragState.value = null;
    return;
  }

  const deltaSeconds = (event.clientX - activeDrag.originClientX) / AXIS_SCALE;
  for (const step of movingSteps) {
    const origin = activeDrag.originStartTimes[step.id] ?? 0;
    step.startTime = Math.max(0, roundToSnap(origin + deltaSeconds));
  }
}

function stopBlockDrag() {
  dragState.value = null;
  enemyCommandDragState.value = null;
  cursorDragState.value = null;
  marqueeSelectionState.value = null;
}

function setCursorFromLane(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }

  cursorTime.value = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / AXIS_SCALE);
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

  const dropTime = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / AXIS_SCALE);
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
    startTime: Math.max(0, roundToSnap(startTime)),
    interrupted: false,
    interruptedSpGain: 0,
    interruptedStagger: 0,
  });
}

function addEnemyCommand(commandId: string) {
  addEnemyCommandAtTime(commandId, cursorTime.value);
}

function removeEnemyCommand(commandPlacementId: string) {
  const index = enemyCommands.value.findIndex((entry) => entry.id === commandPlacementId);
  if (index >= 0) {
    enemyCommands.value.splice(index, 1);
  }
  if (selectedEnemyCommandId.value === commandPlacementId) {
    selectedEnemyCommandId.value = null;
  }
}

function clearEnemyCommands() {
  enemyCommands.value.splice(0, enemyCommands.value.length);
  selectedEnemyCommandId.value = null;
}

function resetEnemyCommandsToDefault() {
  const defaults = getDefaultEnemyCommandPlacements(props.selectedEnemyId);
  enemyCommands.value.splice(0, enemyCommands.value.length, ...defaults.map((entry) => ({ ...entry })));
  if (selectedEnemyCommandId.value) {
    const existsAfterReset = enemyCommands.value.some((entry) => entry.id === selectedEnemyCommandId.value);
    if (!existsAfterReset) {
      selectedEnemyCommandId.value = null;
    }
  }
}

function handleEnemyLaneDrop(event: DragEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !libraryDragState.value || libraryDragState.value.kind !== "enemy") {
    clearLibraryCommandDrag();
    return;
  }
  const dropTime = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / AXIS_SCALE);
  addEnemyCommandAtTime(libraryDragState.value.commandId, dropTime);
  clearLibraryCommandDrag();
}

function startEnemyCommandBlockDrag(event: MouseEvent, commandPlacementId: string) {
  if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey) {
    return;
  }
  selectedEnemyCommandId.value = commandPlacementId;
  selectedStepIds.value = [];
  selectionAnchorId.value = null;
  const dragIds = [commandPlacementId];
  enemyCommandDragState.value = {
    commandIds: dragIds,
    originClientX: event.clientX,
    originStartTimes: Object.fromEntries(
      enemyCommands.value
        .filter((entry) => dragIds.includes(entry.id))
        .map((entry) => [entry.id, entry.startTime ?? 0]),
    ),
  };
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
  cursorTime.value = clampCursorTime((event.clientX - lane.getBoundingClientRect().left) / AXIS_SCALE);
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
  if (event.shiftKey) {
    selectStep(stepId, "range");
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    selectStep(stepId, "toggle");
    return;
  }

  selectStep(stepId, "replace");
}

function selectEnemyCommand(commandPlacementId: string) {
  selectedEnemyCommandId.value = commandPlacementId;
  selectedStepIds.value = [];
  selectionAnchorId.value = null;
}

function isEnemyCommandSelected(commandPlacementId: string): boolean {
  return selectedEnemyCommandId.value === commandPlacementId;
}

onMounted(() => {
  window.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("mouseup", stopBlockDrag);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handlePointerMove);
  window.removeEventListener("mouseup", stopBlockDrag);
  clearLibraryCommandDrag();
});

watch(
  timelineDuration,
  (value) => {
    cursorTime.value = Math.min(cursorTime.value, value);
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

function getActionCommand(action: { slot: PartySlot; commandId: string }) {
  const actor = partyBySlot.value.get(action.slot);
  return actor?.commands.find((entry) => entry.id === action.commandId) ?? null;
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
    if (command.showNameInHitTimeline) {
      return "Talent";
    }
    switch (command.genericActionType) {
      case "switch":
        return t("rotation.switch");
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

  const enhancedPrefix = command.variant ? "*" : "";

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
    switch (command.genericActionType) {
      case "switch":
        return t("rotation.switch");
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
  return getStepById(action.stepId)?.missed === true || isActionAutoNullified(action);
}

function isActionTransient(action: { slot: PartySlot; commandId: string }): boolean {
  const command = getActionCommand(action);
  return command?.overlapMode === "transient";
}

function getActionCardWidth(action: { realStartTime: number; realEndTime: number }): number {
  return Math.max(28, (action.realEndTime - action.realStartTime) * AXIS_SCALE);
}

function getActionCardZIndex(action: { stepId: string; slot: PartySlot; commandId: string }): number {
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

function getOrderedStepIds(): string[] {
  return [...simulation.value.actions]
    .sort((a, b) => {
      if (a.realStartTime !== b.realStartTime) {
        return a.realStartTime - b.realStartTime;
      }
      return a.slot - b.slot;
    })
    .map((action) => action.stepId);
}

function selectStep(stepId: string, mode: "replace" | "toggle" | "range" = "replace") {
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

  if (mode === "range" && selectionAnchorId.value) {
    const ordered = getOrderedStepIds();
    const anchorIndex = ordered.indexOf(selectionAnchorId.value);
    const targetIndex = ordered.indexOf(stepId);
    if (anchorIndex !== -1 && targetIndex !== -1) {
      const [start, end] = anchorIndex < targetIndex
        ? [anchorIndex, targetIndex]
        : [targetIndex, anchorIndex];
      setSelectedStepIds(ordered.slice(start, end + 1), selectionAnchorId.value);
      return;
    }
  }

  setSelectedStepIds([stepId], stepId);
}

function laneActions(slot: PartySlot) {
  return simulation.value.actions.filter((action) => {
    if (action.slot !== slot) {
      return false;
    }

    const command = getActionCommand(action);
    return command?.genericActionType !== "switch";
  });
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

function getSwitchConnectorStyle(marker: ControlSwitchMarker): Record<string, string> {
  const deltaSlots = marker.slot - marker.previousSlot;
  const absSlots = Math.abs(deltaSlots);

  return {
    left: `${marker.time * AXIS_SCALE + 11}px`,
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

  const upper = characterId.toUpperCase();
  return `/avatars/${upper}/${upper}.webp`;
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
  return iconPath ?? getCharacterAvatarPath(characterId);
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
  for (const ext of timeExtensions) {
    const freezeRealStart = ext.time;
    const freezeRealEnd = ext.time + ext.amount;

    if (realTime >= freezeRealStart && realTime < freezeRealEnd) {
      return ext.gameTime;
    }

    if (realTime < freezeRealStart) {
      return realTime - ext.cumulativeFreezeTime;
    }
  }

  const last = timeExtensions[timeExtensions.length - 1];
  if (!last) {
    return realTime;
  }

  return realTime - (last.cumulativeFreezeTime + last.amount);
}

function toRealTimeFromExtensions(gameTime: number, timeExtensions: RotationTimeExtension[]): number {
  let freezePassed = 0;

  for (const ext of timeExtensions) {
    if (gameTime < ext.gameTime) {
      return gameTime + freezePassed;
    }

    const freezeGameEnd = ext.gameTime;
    if (gameTime === freezeGameEnd) {
      return ext.time;
    }

    freezePassed = ext.cumulativeFreezeTime + ext.amount;
  }

  return gameTime + freezePassed;
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
        <label class="block">
          <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
            <span class="mb-3 text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.startingEnergy") }}</span>
            <span>{{ teamSpConfig.startingEnergyBySlot[selectedLibrarySlot] ?? 0 }}%</span>
          </div>
          <input
            :value="teamSpConfig.startingEnergyBySlot[selectedLibrarySlot] ?? 0"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full accent-[#c8d13c]"
            @input="teamSpConfig.startingEnergyBySlot[selectedLibrarySlot] = Number(($event.target as HTMLInputElement).value)"
          >
        </label>
        <label class="mt-4 block">
          <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
            <span class="text-sm font-semibold text-[#1b1b1b]">Consumable</span>
          </div>
          <select
            :value="teamSpConfig.consumableBySlot[selectedLibrarySlot] ?? ''"
            class="h-11 w-full rounded-xl border border-[#d4d4d4] bg-white px-3 text-sm outline-none focus:border-[#c8d13c]"
            @change="teamSpConfig.consumableBySlot[selectedLibrarySlot] = (($event.target as HTMLSelectElement).value || null)"
          >
            <option value="">None</option>
            <option v-for="item in consumableOptions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div v-if="sidebarMode === 'character' && !libraryCharacter" class="rounded-xl border border-dashed border-[#d6d6d6] bg-[#fafafa] p-4 text-sm text-[#666]">
          {{ t("rotation.configureBuilderFirst") }}
        </div>

        <div v-else class="space-y-4">
          <section v-if="sidebarMode === 'enemy'" class="space-y-4">
            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
              <div class="mb-3 text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.enemySetup") }}</div>
              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("enemy.title") }}</div>
                <select
                  :value="props.selectedEnemyId"
                  class="h-11 w-full rounded-xl border border-[#d4d4d4] bg-white px-3 outline-none focus:border-[#c8d13c]"
                  @change="emit('update:selectedEnemyId', ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="enemy in props.enemies" :key="enemy.id" :value="enemy.id">
                    {{ enemy.name }}
                  </option>
                </select>
              </label>

              <label class="mt-4 block">
                <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
                  <span>{{ t("enemy.level") }}</span>
                  <span>{{ props.enemyLevel }}</span>
                </div>
                <input
                  :value="props.enemyLevel"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  class="w-full accent-[#c8d13c]"
                  @input="emit('update:enemyLevel', Number(($event.target as HTMLInputElement).value))"
                >
              </label>
            </section>

            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
              <div class="grid grid-cols-1 gap-3 text-sm">
                <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                  {{ t("enemy.hp") }} {{ Math.max(0, props.enemyStats.hp - currentEnemyState.currentDamageTaken).toFixed(0) }} / {{ props.enemyStats.hp }}
                </div>
                <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                  {{ t("enemy.staggerGauge") }} {{ currentEnemyState.currentStagger.toFixed(1) }} / {{ props.enemyStaggerGauge.toFixed(1) }}
                </div>
                <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                  {{ t("enemy.def") }} {{ props.enemyStats.def }}
                </div>
              </div>
            </section>

            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-sm font-semibold text-[#1b1b1b]">Enemy Commands</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-xs text-[#444] transition hover:bg-[#f7f7f7]"
                    @click="resetEnemyCommandsToDefault"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-[#ecd0d0] bg-[#fff5f5] px-2 py-1 text-xs text-[#9a3131] transition hover:bg-[#ffecec]"
                    @click="clearEnemyCommands"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div class="space-y-2 border-t border-[#ececec] px-4 py-3">
                <button
                  v-for="command in enemyCommandDefinitions"
                  :key="command.id"
                  type="button"
                  draggable="true"
                  class="block w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-left text-sm transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="addEnemyCommand(command.id)"
                  @dragstart="startLibraryEnemyCommandDrag(command.id)"
                  @dragend="clearLibraryCommandDrag"
                >
                  <div class="font-medium text-[#1b1b1b]">{{ command.label }}</div>
                  <div class="text-xs text-[#777]">{{ command.durationSeconds.toFixed(1) }}s</div>
                </button>
                <div class="rounded-lg border border-dashed border-[#d8d8d8] bg-white px-3 py-2 text-xs text-[#666]">
                  Select an enemy command on the timeline to edit interruption settings.
                </div>
              </div>
            </section>
          </section>

          <section v-if="sidebarMode === 'character' && controlPanelMode === 'detailed'" class="grid grid-cols-2 gap-2">
            <template v-if="selectedCharacterIsControlled">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
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
          </section>

          <section v-if="sidebarMode === 'character' && controlPanelMode === 'simple'" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-3">
            <div class="space-y-3">
              <div class="grid grid-cols-[minmax(0,1fr)_44px_44px] gap-2">
                <button
                  type="button"
                  class="h-11 rounded-xl border border-[#dcdcdc] bg-white px-3 text-sm font-semibold text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="executeControlledBasicAttack"
                >
                  {{ t("rotation.basicAttackSequence") }}
                </button>
                <button
                  type="button"
                  class="h-11 rounded-xl border border-[#dcdcdc] bg-white text-xs font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="executeControlledGeneric('__dodge')"
                >
                  {{ t("rotation.dodge") }}
                </button>
                <button
                  type="button"
                  class="h-11 rounded-xl border border-[#dcdcdc] bg-white text-xs font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                  @click="executeControlledGeneric('__jump')"
                >
                  {{ t("rotation.jump") }}
                </button>
              </div>

              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">{{ t("rotation.switch") }}</div>
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-switch-${slotView.slot}`"
                    type="button"
                    class="relative h-14 w-14 overflow-hidden rounded-full border-2 bg-white transition"
                    :class="[
                      currentControlState.controlledSlot === slotView.slot ? 'border-4 border-[#ece81a]' : 'border-[#d8d8d8]',
                      getSwitchCooldownRemaining(slotView.slot) > 0 ? 'opacity-45' : 'hover:scale-105',
                    ]"
                    @click="executeSwitchToSlot(slotView.slot)"
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
                <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">{{ t("builder.ultimate") }}</div>
                <div class="grid grid-cols-4 gap-2 py-1 justify-items-center">
                  <button
                    v-for="slotView in partyDisplay"
                    :key="`simple-ult-${slotView.slot}`"
                    type="button"
                    class="h-14 w-14 overflow-hidden rounded-full border-2 border-[#d8d8d8] transition hover:scale-105"
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
                    class="h-14 w-14 overflow-hidden rounded-full border-2 transition hover:scale-105"
                    :class="getActiveTriggeredComboWindowForSlot(slotView.slot, cursorTime) ? 'border-4 border-[#ece81a]' : 'border-[#d8d8d8]'"
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
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="sidebarMode === 'character'" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
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
                      Click to view buffs
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
                class="block w-full rounded-xl border border-[#e4e4e4] bg-white p-3 text-left transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="addStep(libraryCharacter!.slot, command.id)"
                @dragstart="startLibraryCommandDrag(libraryCharacter!.slot, command.id)"
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
          <div class="mt-1 text-lg font-semibold">{{ t("rotation.combatRotation") }}</div>
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
              {{ scheme.name }}
            </button>
            <button
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
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="text-xs text-[#777]">
            {{ t("rotation.dragTimelineHint") }}
          </div>
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

      <div class="overflow-x-auto py-5">
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
                  backgroundImage: 'repeating-linear-gradient(to right, rgba(27,27,27,0.06) 0, rgba(27,27,27,0.06) 1px, transparent 1px, transparent 116px)',
                }"
              >
                <div
                  v-for="second in realSeconds"
                  :key="`real-${second}`"
                  class="absolute top-1/2 text-[11px] text-[#7d7d7d]"
                  :style="getTickLabelStyle(second * AXIS_SCALE)"
                >
                  {{ second }}
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
                  backgroundImage: 'repeating-linear-gradient(to right, rgba(27,27,27,0.04) 0, rgba(27,27,27,0.04) 1px, transparent 1px, transparent 116px)',
                }"
              >
                <div
                  v-for="second in gameSeconds"
                  :key="`game-line-${second.value}`"
                  class="absolute inset-y-0 w-px bg-[#1b1b1b]/10"
                  :style="{ left: `${second.realTime * AXIS_SCALE}px` }"
                />
                <div
                  v-for="second in gameSeconds"
                  :key="`game-${second.value}`"
                  class="absolute top-1/2 text-[11px] text-[#7d7d7d]"
                  :style="getTickLabelStyle(second.realTime * AXIS_SCALE)"
                >
                  {{ second.value }}
                </div>
              </div>

              <div
                class="absolute top-0 h-full w-0.5 bg-[#1b1b1b] z-10"
                :style="{ left: `${cursorTime * AXIS_SCALE}px` }"
                @mousedown.stop="startCursorDrag"
              >
                <div class="absolute left-2 top-2 rounded bg-[#1b1b1b] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
                  {{ t("rotation.cursorRealTime", { value: cursorTime.toFixed(2) }) }}
                </div>
                <div class="absolute left-2 top-8 rounded bg-[#3d3d3d] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
                  {{ t("rotation.cursorGameTime", { value: cursorCombatState.cursorGameTime.toFixed(2) }) }}
                </div>
              </div>
            </div>

            <template v-for="slotIndex in 4" :key="slotIndex">
              <button
                type="button"
                class="sticky left-0 z-[30] border-b border-r border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
                :class="
                  sidebarMode === 'character' && selectedLibrarySlot === ((slotIndex - 1) as PartySlot)
                    ? 'bg-[#fff8bf]'
                    : 'bg-white'
                "
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
                class="relative h-28 overflow-hidden border-b border-[#efefef]"
                :style="{
                  width: `${timelineWidth}px`,
                  backgroundImage: 'repeating-linear-gradient(to right, rgba(27,27,27,0.05) 0, rgba(27,27,27,0.05) 1px, transparent 1px, transparent 116px)',
                }"
                @mousedown.self="startMarqueeSelection"
                @click="setCursorFromLane"
                @dragover.prevent
                @drop="handleLaneDrop($event, (slotIndex - 1) as PartySlot)"
              >
                <div class="absolute inset-x-0 top-0 h-7 border-b border-[#f1f1f1] bg-white/85">
                  <div
                    v-for="segment in laneControlSegments((slotIndex - 1) as PartySlot)"
                    :key="`${slotIndex}-${segment.startTime}-${segment.endTime}`"
                    class="absolute top-4 h-1 rounded-full bg-[#73b45d]"
                    :style="{
                      left: `${segment.startTime * AXIS_SCALE}px`,
                      width: `${Math.max(6, (segment.endTime - segment.startTime) * AXIS_SCALE)}px`,
                    }"
                  />

                  <div
                    v-for="marker in laneSwitchMarkers((slotIndex - 1) as PartySlot)"
                    :key="marker.stepId"
                    class="absolute top-1 z-[7]"
                    :style="{ left: `${marker.time * AXIS_SCALE}px` }"
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
                      class="relative z-[8] flex h-7 w-7 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-[#73b45d] bg-white shadow-sm transition hover:scale-105"
                      :class="isStepSelected(marker.stepId) ? 'ring-2 ring-[#c8d13c] ring-offset-1' : ''"
                      @click.stop="selectStep(marker.stepId, $event.shiftKey ? 'range' : (($event.ctrlKey || $event.metaKey) ? 'toggle' : 'replace'))"
                    >
                      <img
                        v-if="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)"
                        :src="getCharacterAvatarPath(partyDisplay[slotIndex - 1]?.actor?.characterId)!"
                        :alt="getLocalizedCharacterName(partyDisplay[slotIndex - 1]?.actor?.characterId, partyDisplay[slotIndex - 1]?.actor?.characterName) || t('rotation.switch')"
                        class="h-full w-full object-cover"
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
                    left: `${extension.time * AXIS_SCALE}px`,
                    width: `${Math.max(6, extension.amount * AXIS_SCALE)}px`,
                  }"
                />
                <div
                  v-for="window in enemyInvulnerabilityWindows"
                  :key="`${slotIndex}-${window.id}-${window.start}-${window.end}`"
                  class="absolute inset-y-0 border-x border-[#c74d4d]/50"
                  :style="{
                    left: `${window.start * AXIS_SCALE}px`,
                    width: `${Math.max(1, (window.end - window.start) * AXIS_SCALE)}px`,
                    backgroundColor: window.color,
                  }"
                />
                <div
                  v-for="window in enemyPhaseTransitionWindows"
                  :key="`${slotIndex}-phase-${window.id}-${window.start}-${window.end}`"
                  class="absolute inset-y-0 z-[2] border-x"
                  :style="{
                    left: `${window.start * AXIS_SCALE}px`,
                    width: `${Math.max(1, (window.end - window.start) * AXIS_SCALE)}px`,
                    backgroundColor: window.color,
                    borderColor: window.borderColor,
                  }"
                />

                <button
                  v-for="action in laneActions((slotIndex - 1) as PartySlot)"
                  :key="action.stepId"
                  type="button"
                  :ref="(element) => setActionElement(action.stepId, element)"
                  class="absolute top-8 overflow-hidden rounded-2xl border px-3 py-2.5 text-left shadow-sm transition active:cursor-grabbing"
                  :class="
                    [
                      isActionTransient(action) ? 'h-[5.25rem] opacity-70' : 'h-[4.5rem]',
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
                    left: `${action.realStartTime * AXIS_SCALE}px`,
                    width: `${getActionCardWidth(action)}px`,
                    zIndex: `${getActionCardZIndex(action)}`,
                  }"
                  @click.stop.prevent="handleActionClick($event, action.stepId)"
                  @mousedown.stop="startBlockDrag($event, action.stepId)"
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
                      {{ t("rotation.startTiming", { game: action.startTime.toFixed(1), real: action.realStartTime.toFixed(1) }) }}
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
                  v-for="entry in simulation.timeline.filter((entry) => entry.slot === ((slotIndex - 1) as PartySlot))"
                  :key="`${entry.stepId}-${entry.hitIndex}-${entry.time}-${entry.damage}`"
                  class="absolute top-2 z-[12] h-24 w-0.5 bg-[#1b1b1b]/25"
                  :style="{ left: `${entry.time * AXIS_SCALE}px` }"
                >
                  <div
                    v-if="entry.registerTime < entry.time - 0.001"
                    class="absolute top-[1.8rem] h-0.5 bg-[#1b1b1b]/35"
                    :style="{
                      left: `${(entry.registerTime - entry.time) * AXIS_SCALE}px`,
                      width: `${Math.max(4, (entry.time - entry.registerTime) * AXIS_SCALE)}px`,
                    }"
                  />
                  <div
                    v-if="entry.registerTime < entry.time - 0.001"
                    class="absolute top-6 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white bg-[#8f8f8f]"
                    :style="{ left: `${(entry.registerTime - entry.time) * AXIS_SCALE}px` }"
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
                  :style="{ left: `${cursorTime * AXIS_SCALE}px` }"
                  @mousedown.stop="startCursorDrag"
                />
              </div>
            </template>

            <button
              type="button"
              class="sticky left-0 z-[30] border-b border-r border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
              :class="sidebarMode === 'enemy' ? 'bg-[#fff8bf]' : 'bg-white'"
              @click="sidebarMode = 'enemy'"
            >
              <div class="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2">
                <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1b1b1b] text-xs font-semibold text-white">
                  {{ getAvatarInitials(props.enemyName) }}
                </div>
                <div class="min-w-0 self-center">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">
                    {{ props.enemyName }}
                  </div>
                </div>

                <div class="col-span-2 min-w-0">
                  <div class="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.1em] text-[#7a7a7a]">
                    <span>{{ t("enemy.hp") }}</span>
                    <span>{{ Math.max(0, props.enemyStats.hp - currentEnemyState.currentDamageTaken).toFixed(0) }} / {{ props.enemyStats.hp }}</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                    <div
                      class="h-full bg-[#d86c6c]"
                      :style="{ width: `${Math.max(0, 1 - currentEnemyState.currentDamageTaken / Math.max(1, props.enemyStats.hp)) * 100}%` }"
                    />
                  </div>
                </div>

                <div class="col-span-2 min-w-0">
                  <div class="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.1em] text-[#7a7a7a]">
                    <span>{{ t("enemy.staggerGauge") }}</span>
                    <span>{{ currentEnemyState.currentStagger.toFixed(1) }} / {{ props.enemyStaggerGauge.toFixed(1) }}</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                    <div class="relative h-full w-full">
                      <div
                        v-for="(section, sectionIndex) in enemyStaggerSections"
                        :key="`enemy-stagger-section-${sectionIndex}`"
                        class="absolute inset-y-0"
                        :style="{
                          left: `${section.start * 100}%`,
                          width: `${(section.end - section.start) * 100}%`,
                        }"
                      >
                        <div
                          class="h-full"
                          :class="currentEnemyState.isStaggered ? 'bg-[#ece81a]' : 'bg-[#c8d13c]'"
                          :style="{ width: `${section.fill * 100}%` }"
                        />
                      </div>
                      <div
                        v-for="(nodePercent, nodeIndex) in enemyStaggerNodePercents"
                        :key="`enemy-stagger-node-${nodeIndex}`"
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
              :style="{
                width: `${timelineWidth}px`,
                backgroundImage: 'repeating-linear-gradient(to right, rgba(27,27,27,0.05) 0, rgba(27,27,27,0.05) 1px, transparent 1px, transparent 116px)',
              }"
              @click="setCursorFromLane"
              @dragover.prevent
              @drop="handleEnemyLaneDrop"
            >
              <div
                v-for="window in enemyInvulnerabilityWindows"
                :key="`enemy-${window.id}-${window.start}-${window.end}`"
                class="pointer-events-none absolute inset-y-0 border-x border-[#c74d4d]/50"
                :style="{
                  left: `${window.start * AXIS_SCALE}px`,
                  width: `${Math.max(1, (window.end - window.start) * AXIS_SCALE)}px`,
                  backgroundColor: window.color,
                }"
              />
              <div
                v-for="window in enemyPhaseTransitionWindows"
                :key="`enemy-phase-${window.id}-${window.start}-${window.end}`"
                class="pointer-events-none absolute inset-y-0 z-[2] border-x"
                :style="{
                  left: `${window.start * AXIS_SCALE}px`,
                  width: `${Math.max(1, (window.end - window.start) * AXIS_SCALE)}px`,
                  backgroundColor: window.color,
                  borderColor: window.borderColor,
                }"
              />
              <button
                v-for="command in enemyTimelineCommands"
                :key="`enemy-cmd-${command.id}`"
                type="button"
                class="absolute z-[6] overflow-hidden rounded-2xl border px-3 py-2 text-left shadow-sm transition active:cursor-grabbing"
                :class="[
                  command.commandId === 'phase_transition' ? 'top-0 z-[9] h-full' : 'top-8 h-[4.5rem]',
                  isEnemyCommandSelected(command.id)
                    ? 'border-[#c8d13c] bg-[#eef38d]'
                    : getEnemyCommandValidation(command.id)
                    ? 'border-[#e5b2b2] bg-[#fff1f1] hover:border-[#d98d8d]'
                    : command.interrupted
                      ? 'border-[#dfc3a5] bg-[#fff3e8] hover:border-[#d6a67a]'
                      : 'border-[#d1d1d1] bg-white hover:border-[#c8d13c]',
                ]"
                :style="{
                  left: `${command.startTime * AXIS_SCALE}px`,
                  width: `${Math.max(44, (command.endTime - command.startTime) * AXIS_SCALE)}px`,
                }"
                @mousedown.stop="startEnemyCommandBlockDrag($event, command.id)"
                @click.stop="
                  selectEnemyCommand(command.id);
                  cursorTime = clampCursorTime(command.startTime);
                "
              >
                <div
                  class="truncate text-[12px] font-semibold uppercase tracking-[0.06em]"
                  :class="
                    getEnemyCommandValidation(command.id)
                      ? 'text-[#8b2d2d]'
                      : command.interrupted
                        ? 'text-[#7f4b1f]'
                        : 'text-[#3d3d3d]'
                  "
                >
                  {{ command.label }}
                </div>
                <div class="mt-1 text-[11px]" :class="getEnemyCommandValidation(command.id) ? 'text-[#7a5858]' : 'text-[#666]'">
                  {{ command.startTime.toFixed(1) }}s
                </div>
                <div
                  v-if="command.interrupted"
                  class="mt-1 inline-flex rounded bg-[#f2bf87] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6a3d0f]"
                >
                  Interrupted
                </div>
                <div v-if="getEnemyCommandValidation(command.id)" class="truncate text-[10px] text-[#b14545]">
                  {{ getEnemyCommandValidation(command.id) }}
                </div>
              </button>
              <div
                class="absolute top-0 z-[8] h-full w-0.5 bg-[#1b1b1b]"
                :style="{ left: `${cursorTime * AXIS_SCALE}px` }"
                @mousedown.stop="startCursorDrag"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-[#ececec] px-5 py-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px_260px]">
          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
            <div class="mb-3 text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.battleStart") }}</div>
            <div class="grid max-w-[560px] grid-cols-1 gap-4 md:grid-cols-2">
              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.startingSp") }}</div>
                <input
                  :value="teamSpConfig.initialSp"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
                  @input="teamSpConfig.initialSp = Number(($event.target as HTMLInputElement).value)"
                >
              </label>

              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.spRegen") }}</div>
                <input
                  :value="teamSpConfig.spRegenRate"
                  type="number"
                  min="0"
                  step="0.5"
                  class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
                  @input="teamSpConfig.spRegenRate = Number(($event.target as HTMLInputElement).value)"
                >
              </label>
            </div>
          </section>

          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.currentTotalDamage") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(cursorCombatState.totalDamage) }}
            </div>
            <div class="mt-4 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.currentStagger") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ cursorCombatState.stagger.toFixed(1) }}
            </div>
          </section>

          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.teamSp") }}</div>
              <div class="text-xs text-[#777]">
                {{ t("rotation.realTime") }} {{ formatTime(cursorCombatState.cursorTime) }}s · {{ t("rotation.gameTime") }} {{ formatTime(cursorCombatState.cursorGameTime) }}s
              </div>
            </div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ cursorCombatState.teamSpTotal.toFixed(1) }} / {{ TEAM_SP_MAX }}
            </div>
            <div class="mt-3 h-4 overflow-hidden rounded-md border border-[#dadada] bg-[#f1f1f1]">
              <div class="relative h-full w-full">
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
                <div class="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_calc(33.333%-1px),rgba(27,27,27,0.18)_calc(33.333%-1px),rgba(27,27,27,0.18)_33.333%,transparent_33.333%,transparent_calc(66.666%-1px),rgba(27,27,27,0.18)_calc(66.666%-1px),rgba(27,27,27,0.18)_66.666%,transparent_66.666%,transparent_100%)]" />
              </div>
            </div>
            <div class="mt-2 flex items-center gap-4 text-xs text-[#666]">
              <span>{{ t("rotation.returned", { value: cursorCombatState.teamSpReturned.toFixed(1) }) }}</span>
              <span>{{ t("rotation.generated", { value: cursorCombatState.teamSpGenerated.toFixed(1) }) }}</span>
            </div>
          </section>
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
                    entry.hitName
                      ?? (entry.damageType === "Healing"
                        ? t("rotation.healingLabel", { index: entry.hitIndex + 1 })
                        : t("rotation.hitLabel", { index: entry.hitIndex + 1 }))
                  }}
                </div>
              </div>
              <div class="text-xs font-medium text-[#666]">{{ entry.time.toFixed(2) }}s</div>
              <div class="grid grid-cols-3 items-center gap-2 text-right">
                <div class="text-xs font-medium text-[#5f5f5f]">{{ formatDamage(entry.noCritDamage) }}</div>
                <div class="text-xs font-medium text-[#5f5f5f]">{{ formatDamage(entry.critDamage) }}</div>
                <div class="text-sm font-semibold text-[#1b1b1b]">{{ formatDamage(entry.damage) }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-4 rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[#1b1b1b]">Debug Event Log (Temporary)</div>
              <div class="text-xs text-[#6a6a6a]">Expand an event to inspect emitted runtime fields.</div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#333] transition hover:bg-[#f5f5f5]"
              @click="eventLogExpanded = !eventLogExpanded"
            >
              {{ eventLogExpanded ? t("ui.collapse") : t("ui.expand") }}
            </button>
          </div>

          <div v-if="allEvents.length === 0" class="text-sm text-[#6a6a6a]">
            No events emitted.
          </div>

          <div v-else-if="!eventLogExpanded" class="text-sm text-[#8a8a8a]">
            Event log hidden.
          </div>

          <div v-else class="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            <details
              v-for="(event, eventIndex) in allEvents"
              :key="`${event.stepId ?? 'no-step'}-${event.type}-${event.time}-${eventIndex}`"
              class="rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <summary class="cursor-pointer list-none">
                <div class="grid grid-cols-[minmax(0,1fr)_68px] items-center gap-2">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">
                    {{ formatEventType(event.type) }} · {{ event.label }}
                  </div>
                  <div class="text-right text-xs font-medium text-[#666]">
                    {{ event.time.toFixed(2) }}s
                  </div>
                </div>
              </summary>

              <div class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div
                  v-for="entry in getEventDetailEntries(event)"
                  :key="`${eventIndex}-${entry.key}`"
                  class="flex items-start justify-between gap-2 rounded border border-[#f0f0f0] bg-[#fcfcfc] px-2 py-1.5 text-xs"
                >
                  <span class="text-[#666]">{{ entry.key }}</span>
                  <span class="break-all text-right font-medium text-[#1b1b1b]">{{ entry.value }}</span>
                </div>
              </div>
            </details>
          </div>
        </section>

        <section class="mt-4 rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[#1b1b1b]">Combo Trigger Debug (Temporary)</div>
              <div class="text-xs text-[#6a6a6a]">Shows why combo trigger attempts succeeded or failed.</div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#333] transition hover:bg-[#f5f5f5]"
              @click="comboTriggerDebugExpanded = !comboTriggerDebugExpanded"
            >
              {{ comboTriggerDebugExpanded ? t("ui.collapse") : t("ui.expand") }}
            </button>
          </div>

          <div v-if="allComboTriggerDebug.length === 0" class="text-sm text-[#6a6a6a]">
            No combo trigger attempts recorded.
          </div>

          <div v-else-if="!comboTriggerDebugExpanded" class="text-sm text-[#8a8a8a]">
            Combo trigger debug hidden.
          </div>

          <div v-else class="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            <details
              v-for="(entry, entryIndex) in allComboTriggerDebug"
              :key="`${entry.sourceStepId}-${entry.sourceEventType}-${entry.time}-${entryIndex}`"
              class="rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <summary class="cursor-pointer list-none">
                <div class="grid grid-cols-[minmax(0,1fr)_68px] items-center gap-2">
                  <div class="truncate text-sm font-medium text-[#1b1b1b]">
                    {{ entry.triggered ? "Triggered" : "Blocked" }} · {{ entry.characterName ?? entry.characterId ?? `Slot ${entry.slot + 1}` }} · {{ entry.sourceEventType }}
                  </div>
                  <div class="text-right text-xs font-medium text-[#666]">
                    {{ entry.time.toFixed(2) }}s
                  </div>
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
          </div>
        </section>
      </div>
    </main>

    <aside class="rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="text-xs uppercase tracking-[0.24em] text-[#777]">{{ t("rotation.rotationSummary") }}</div>
        <div class="mt-1 text-lg font-semibold">{{ t("rotation.outputAndStep") }}</div>
      </div>

      <div class="space-y-6 px-5 py-4">
        <section class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.totalDamage") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(simulation.totalDamage) }}
            </div>
            <div v-if="riggedCritChance != null" class="mt-1 text-xs text-[#8b5b23]">
              Rig chance: {{ (riggedCritChance * 100).toFixed(2) }}%
            </div>
          </div>
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.dps") }}</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(simulation.totalTime > 0 ? simulation.totalDamage / simulation.totalTime : 0) }}
            </div>
          </div>
          <div class="col-span-2 text-xs text-[#777]">
            {{ enemyName }} {{ t("enemy.level") }} {{ enemyLevel }} · {{ t("rotation.realTime") }} {{ formatTime(simulation.totalTime) }}s · {{ t("rotation.gameTime") }} {{ formatTime(simulation.totalGameTime) }}s
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
      v-if="selectedStatusDetails"
      class="fixed inset-0 z-[75] flex items-center justify-center bg-black/35 px-4"
      @click.self="selectedStatusDetails = null"
    >
      <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d6d6d6] bg-white p-4 shadow-xl">
        <div class="mb-3 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm font-semibold text-[#1b1b1b]">Status Buff Details</div>
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
