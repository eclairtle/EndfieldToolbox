<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useBuildStore, type CharacterBuildSlot } from "@/stores/buildStore";
import type { EnemyBase } from "@/data/enemies";
import type { ModifierStats } from "@/lib/build/stats";
import {
  resolveCommandTransform,
} from "@/lib/commands";
import type {
  CharacterCombatSnapshot,
  PartySlot,
  Rotation,
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
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";

const props = defineProps<{
  enemies: EnemyBase[];
  selectedEnemyId: string;
  enemyName: string;
  enemyLevel: number;
  enemyStats: EnemyResolvedStats;
  enemyStaggerGauge: number;
  enemyStaggerRecoverySeconds: number;
}>();

const emit = defineEmits<{
  (e: "update:selectedEnemyId", value: string): void;
  (e: "update:enemyLevel", value: number): void;
}>();

const buildStore = useBuildStore();
const { slots } = storeToRefs(buildStore);

const SP_STORAGE_KEY = "combat-simulator-rotation-sp-config-v2";
const AXIS_SCALE = 116;
const AXIS_SNAP_SECONDS = 0.1;
const TRACK_LABEL_WIDTH = 160;
const TEAM_SP_MAX = 300;
const GENERATED_SP_TEAM_ENERGY_RATE = 0.065;
const SWITCH_BACK_COOLDOWN_SECONDS = 2;
const TIMELINE_ROW_HEIGHT = 112;
const CONTROL_TRACK_OFFSET = 16;

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
};

function makeDefaultTeamSpConfig(): TeamSpConfig {
  return { initialSp: 200, spRegenRate: 8, startingEnergyBySlot: [0, 0, 0, 0] };
}

function normalizeTeamSpConfig(value: Partial<TeamSpConfig> | null | undefined): TeamSpConfig {
  return {
    initialSp: value?.initialSp ?? 200,
    spRegenRate: value?.spRegenRate ?? 8,
    startingEnergyBySlot: Array.isArray(value?.startingEnergyBySlot)
      ? [0, 1, 2, 3].map((index) => Math.max(0, Math.min(100, value?.startingEnergyBySlot?.[index] ?? 0)))
      : [0, 0, 0, 0],
  };
}

function loadTeamSpConfigByScheme(): Record<string, TeamSpConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(SP_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as
      | Partial<TeamSpConfig>
      | { byScheme?: Record<string, Partial<TeamSpConfig>> }
      | null;

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

const { rotationSchemes, activeScheme, activeRotation: rotation, setActiveScheme, addScheme, renameActiveScheme, removeActiveScheme } = useRotationSchemes();
const selectedLibrarySlot = ref<PartySlot>(0);
const sidebarMode = ref<"character" | "enemy">("character");
const selectedStepIds = ref<string[]>(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
const selectionAnchorId = ref<string | null>(rotation.value.steps[0]?.id ?? null);
const cursorTime = ref(0);
const teamSpConfigByScheme = ref<Record<string, TeamSpConfig>>(loadTeamSpConfigByScheme());
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
  teamSpConfigByScheme,
  (value) => {
    window.localStorage.setItem(SP_STORAGE_KEY, JSON.stringify({ byScheme: value }));
  },
  { deep: true },
);

watch(
  () => activeScheme.value.id,
  () => {
    setSelectedStepIds(rotation.value.steps[0]?.id ? [rotation.value.steps[0].id] : []);
    selectionAnchorId.value = rotation.value.steps[0]?.id ?? null;
    cursorTime.value = 0;
  },
);

const partySnapshots = computed(() =>
  slots.value
    .map((slot, index) => buildSnapshot(slot, index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null),
);

const partyBySlot = computed(() => new Map(partySnapshots.value.map((snapshot) => [snapshot.slot, snapshot])));

const libraryCharacter = computed(() => partyBySlot.value.get(selectedLibrarySlot.value) ?? null);
const visibleLibraryCommands = computed(() =>
  sidebarMode.value === "character"
    ? (libraryCharacter.value?.commands ?? []).filter((command) => !command.hiddenInLibrary)
    : [],
);
const selectedSidebarTitle = computed(() =>
  sidebarMode.value === "enemy"
    ? props.enemyName
    : libraryCharacter.value?.characterName ?? `Character ${selectedLibrarySlot.value + 1}`,
);
const currentEnemyState = computed(() => getEnemyStateAtTime(simulation.value, cursorTime.value));

type GroupedStatusDisplayItem = {
  id: string;
  label: string;
  details?: string;
  stackCount: number;
  shortestRemainingSeconds: number;
};

type RawStatusDisplayItem = {
  label: string;
  details?: string;
  remainingSeconds: number;
};

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
  }

  return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));
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
      });
    }
    for (const status of currentEnemyState.value.activeStatuses) {
      const remainingSeconds = Math.max(
        0,
        status.expiresAt - (status.timeScale === "real" ? cursorTime.value : cursorGameTime),
      );
      items.push({
        label: status.label,
        remainingSeconds,
      });
    }
    if (currentEnemyState.value.artsInfliction) {
      items.push({
        label: `${currentEnemyState.value.artsInfliction.element} Infliction`,
        details: `${currentEnemyState.value.artsInfliction.stacks} stack${currentEnemyState.value.artsInfliction.stacks > 1 ? "s" : ""}`,
        remainingSeconds: Math.max(0, currentEnemyState.value.artsInfliction.expiresAtGameTime - cursorGameTime),
      });
    }

    const grouped = groupStatusItems(items);
    if (grouped.length === 0) {
      return [{
        id: "none",
        label: "No active enemy statuses",
        stackCount: 1,
        shortestRemainingSeconds: 0,
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
    });
  }

  if (actorState.meltingFlameStacks > 0) {
    items.push({
      label: "Melting Flame",
      details: actorState.meltingFlameStacks >= 4 ? "Full" : `${actorState.meltingFlameStacks}/4`,
      remainingSeconds: Number.POSITIVE_INFINITY,
    });
  }

  const grouped = groupStatusItems(items);
  if (grouped.length === 0) {
    return [{
      id: "none",
      label: "No active buffs or statuses",
      stackCount: 1,
      shortestRemainingSeconds: 0,
    }];
  }

  return grouped;
});

function getCommandStateAtTime(slot: PartySlot, realTime: number): {
  activeBuffIds: string[];
  meltingFlameStacks: number;
} {
  const actorState = getActorStateAtTime(simulation.value, slot, realTime);
  return {
    activeBuffIds: actorState.activeBuffs.map((buff) => buff.id),
    meltingFlameStacks: actorState.meltingFlameStacks,
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
    enemyStaggerRecoverySeconds: props.enemyStaggerRecoverySeconds,
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

const allHits = computed(() =>
  [...simulation.value.timeline].sort((a, b) => a.time - b.time),
);
const linkEnhancedStepIdSet = computed(() => new Set(simulation.value.linkEnhancedStepIds));

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];
const damageContributions = computed(() => {
  const totalDamage = simulation.value.totalDamage;
  return simulation.value.damageBySlot.map((entry, index) => ({
    ...entry,
    color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
    percent: totalDamage > 0 ? (entry.damage / totalDamage) * 100 : 0,
  }));
});

const hitTimelineExpanded = ref(false);
const bonusReturnedSpEvents = computed(() =>
  simulation.value.events
    .filter(
      (event) =>
        event.type === "SKILL_SP_RECOVERED"
        && (event.amount ?? 0) > 0
        && event.commandAttackType == null,
    )
    .map((event) => ({
      time: event.time,
      amount: event.amount ?? 0,
    })),
);

type DragState = {
  stepIds: string[];
  originClientX: number;
  originStartTimes: Record<string, number>;
};

type CursorDragState = {
  laneLeft: number;
};

type LibraryDragState = {
  slot: PartySlot;
  commandId: string;
};

type MarqueeSelectionState = {
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
};

const dragState = ref<DragState | null>(null);
const cursorDragState = ref<CursorDragState | null>(null);
const libraryDragState = ref<LibraryDragState | null>(null);
const marqueeSelectionState = ref<MarqueeSelectionState | null>(null);
const actionElementByStepId = new Map<string, HTMLElement>();

const partyDisplay = computed(() =>
  [0, 1, 2, 3].map((index) => {
    const slot = toPartySlot(index);
    const actor = partyBySlot.value.get(slot) ?? null;
    const ultimate = actor?.commands.find((command) => command.attackType === "ULTIMATE") ?? null;
    const combo = actor?.commands.find((command) => command.attackType === "COMBO_SKILL") ?? null;
    return {
      slot,
      label: slots.value[index]?.label ?? `Character ${index + 1}`,
      actor,
      ultimateMaxEnergy: ultimate?.energyCost ?? 0,
      comboCommandId: combo?.id ?? null,
    };
  }),
);

const currentControlState = computed(() => getControlStateAtRealTime(cursorTime.value));

const selectedCharacterIsControlled = computed(() =>
  selectedLibrarySlot.value === currentControlState.value.controlledSlot,
);

const selectedCharacterSwitchLockRemaining = computed(() => {
  const lockedUntil = currentControlState.value.switchBackLockedUntilBySlot.get(selectedLibrarySlot.value) ?? 0;
  return Math.max(0, lockedUntil - cursorTime.value);
});

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

const cursorCombatState = computed(() => {
  const targetTime = cursorTime.value;
  const currentGameTime = toGameTimeFromExtensions(targetTime, simulation.value.timeExtensions);

  const energyBySlot = new Map<PartySlot, number>();
  const energyMaxBySlot = new Map<PartySlot, number>();
  const comboBySlot = new Map<PartySlot, { readyRatio: number; label: string }>();
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
    comboBySlot.set(display.slot, { readyRatio: 1, label: "Ready" });
  }

  const spEvents: Array<
    | { time: number; type: "action-start"; slot: PartySlot; spCost: number; energyCost: number }
    | { time: number; type: "action-end"; slot: PartySlot; energyGain: number; spGeneratedOnEnd: number; spReturnedOnEnd: number }
    | { time: number; type: "hit"; slot: PartySlot; spGenerated: number; spReturned: number; energyReturn: number; requiresControlledOperator: boolean }
    | { time: number; type: "bonus-return"; amount: number }
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
      });
    }

    if (action.realEndTime <= targetTime) {
      spEvents.push({
        time: action.realEndTime,
        type: "action-end",
        slot: action.slot,
        energyGain: command.energyGain,
        spGeneratedOnEnd: command.spGeneratedOnEnd,
        spReturnedOnEnd: command.spReturnedOnEnd,
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
    });
  }
  for (const event of bonusReturnedSpEvents.value) {
    if (event.time <= targetTime) {
      spEvents.push({
        time: event.time,
        type: "bonus-return",
        amount: event.amount,
      });
    }
  }

  spEvents.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    const order = { "action-start": 0, "bonus-return": 1, hit: 2, "action-end": 3 } as const;
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
          const energyMax = energyMaxBySlot.get(display.slot) ?? 0;
          const currentEnergy = energyBySlot.get(display.slot) ?? 0;
          energyBySlot.set(
            display.slot,
            Math.min(energyMax, currentEnergy + generatedConsumed * GENERATED_SP_TEAM_ENERGY_RATE),
          );
        }
      }
    }

    if (event.type === "action-end") {
      const energyMax = energyMaxBySlot.get(event.slot) ?? 0;
      const currentEnergy = energyBySlot.get(event.slot) ?? 0;
      energyBySlot.set(event.slot, Math.min(energyMax, currentEnergy + event.energyGain));
      addGeneratedSp(teamSp, event.spGeneratedOnEnd);
      addReturnedSp(teamSp, event.spReturnedOnEnd);
    }

    if (event.type === "bonus-return") {
      addReturnedSp(teamSp, event.amount);
    }

    if (event.type === "hit") {
      if (!event.requiresControlledOperator || event.slot === 0) {
        addGeneratedSp(teamSp, event.spGenerated);
      }
      addReturnedSp(teamSp, event.spReturned);

      const energyMax = energyMaxBySlot.get(event.slot) ?? 0;
      const currentEnergy = energyBySlot.get(event.slot) ?? 0;
      energyBySlot.set(event.slot, Math.min(energyMax, currentEnergy + event.energyReturn));
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
      comboBySlot.set(display.slot, { readyRatio: 1, label: "No Combo" });
      continue;
    }

    const activeReadyWindow = [...simulation.value.comboWindows]
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

    if (activeReadyWindow) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: "Ready" });
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
      comboBySlot.set(display.slot, { readyRatio: 1, label: "Not Triggered" });
      continue;
    }

    const comboCommand = display.actor?.commands.find((command) => command.id === display.comboCommandId);
    const cooldown = comboCommand?.comboCooldownSeconds ?? 0;
    const cooldownTimeScale = comboCommand?.comboCooldownTimeScale ?? "real";
    const cooldownStart =
      cooldownTimeScale === "real" ? comboAction.realStartTime : comboAction.startTime;
    const cooldownNow = cooldownTimeScale === "real" ? targetTime : currentGameTime;

    if (cooldown <= 0 || cooldownNow >= cooldownStart + cooldown) {
      comboBySlot.set(display.slot, { readyRatio: 1, label: "Not Triggered" });
      continue;
    }

    const remaining = Math.max(0, cooldownStart + cooldown - cooldownNow);
    const progress = Math.min(1, Math.max(0, 1 - remaining / cooldown));
    comboBySlot.set(display.slot, {
      readyRatio: progress,
      label: `${Math.max(0, remaining).toFixed(1)}s`,
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
  > = [];

  for (const action of simulation.value.actions) {
    validationEvents.push({ time: action.realStartTime, type: "action-start", action });
    validationEvents.push({ time: action.realEndTime, type: "action-end", action });
  }

  for (const hit of simulation.value.timeline) {
    validationEvents.push({ time: hit.time, type: "hit", hit });
  }
  for (const event of bonusReturnedSpEvents.value) {
    validationEvents.push({ time: event.time, type: "bonus-return", amount: event.amount });
  }

  validationEvents.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    const order = { "action-start": 0, "bonus-return": 1, hit: 2, "action-end": 3 } as const;
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

    if (event.type === "hit") {
      const hit = event.hit;
      if (!hit.requiresControlledOperator || hit.slot === 0) {
        addGeneratedSp(teamSp, hit.spGenerated);
      }
      addReturnedSp(teamSp, hit.spReturned);

      const energyMax = energyMaxBySlot.get(hit.slot) ?? 0;
      const currentEnergy = energyBySlot.get(hit.slot) ?? 0;
      energyBySlot.set(hit.slot, Math.min(energyMax, currentEnergy + hit.energyReturn));
      continue;
    }

    const action = event.action;
    const actor = partyBySlot.value.get(action.slot);
    const command = actor?.commands.find((entry) => entry.id === action.commandId);
    if (!actor || !command) {
      continue;
    }

    if (event.type === "action-end") {
      const energyMax = energyMaxBySlot.get(action.slot) ?? 0;
      const currentEnergy = energyBySlot.get(action.slot) ?? 0;
      energyBySlot.set(action.slot, Math.min(energyMax, currentEnergy + command.energyGain));
      addGeneratedSp(teamSp, command.spGeneratedOnEnd);
      addReturnedSp(teamSp, command.spReturnedOnEnd);
      continue;
    }

    const reasons: string[] = [];
    const currentEnergy = energyBySlot.get(action.slot) ?? 0;
    const currentTeamSp = teamSp.generated + teamSp.returned;

    if (command.energyCost > currentEnergy + 0.001) {
      reasons.push("Not enough energy");
    }

    if (command.spCost > currentTeamSp + 0.001) {
      reasons.push("Not enough SP");
    }

    if (command.requiresControlledOperator && action.slot !== controlledSlot) {
      reasons.push("Controlled operator only");
    }

    if (command.genericActionType === "switch") {
      if (action.slot === controlledSlot) {
        reasons.push("Already controlled");
      }

      const lockedUntil = switchBackLockedUntilBySlot.get(action.slot) ?? 0;
      if (action.realStartTime < lockedUntil - 0.001) {
        reasons.push("Switch on cooldown");
      }
    }

    if (command.attackType === "COMBO_SKILL") {
      const matchingWindow = simulation.value.comboWindows.find((window) => {
        const activeUntil = window.consumedAt != null
          ? Math.min(window.expiresAt, window.consumedAt)
          : window.expiresAt;
        return (
          window.slot === action.slot &&
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
        const cooldownStart = previousComboAction
          ? (cooldownTimeScale === "real" ? previousComboAction.realStartTime : previousComboAction.startTime)
          : null;
        const cooldownNow = cooldownTimeScale === "real" ? action.realStartTime : action.startTime;

        if (cooldownStart != null && cooldownNow < cooldownStart + cooldown - 0.001) {
          reasons.push("Combo Skill on cooldown");
        } else {
          reasons.push("Combo Skill not triggered");
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
        const energyMax = energyMaxBySlot.get(display.slot) ?? 0;
        const existingEnergy = energyBySlot.get(display.slot) ?? 0;
        energyBySlot.set(
          display.slot,
          Math.min(energyMax, existingEnergy + generatedConsumed * GENERATED_SP_TEAM_ENERGY_RATE),
        );
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

function addStep(slot: PartySlot, commandId: string) {
  addStepAtTime(slot, commandId, cursorTime.value);
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

  const expandedCommands = command.expandsToCommandIds.length > 0
    ? command.expandsToCommandIds
        .map((commandId) => actor.commands.find((entry) => entry.id === commandId))
        .filter((entry): entry is CharacterCombatSnapshot["commands"][number] => entry != null)
    : [command];

  let currentStart = startTime;
  let firstCreatedStepId: string | null = null;

  for (const expandedCommand of expandedCommands) {
    const nextStep: RotationStep = {
      id: makeStepId(),
      slot,
      commandId: expandedCommand.id,
      startTime: Math.max(0, roundToSnap(currentStart)),
    };

    rotation.value.steps.push(nextStep);
    firstCreatedStepId ??= nextStep.id;
    currentStart = roundToSnap((nextStep.startTime ?? 0) + expandedCommand.durationFrames / 60);
  }

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
  cleanupGroups();
  setSelectedStepIds([]);
}

function clearRotation() {
  rotation.value = { steps: [], groups: [] };
  setSelectedStepIds([]);
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

  const nextName = window.prompt("Rename rotation", activeScheme.value.name);
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

function cleanupGroups() {
  const groups = rotation.value.groups ?? [];
  const usedGroupIds = new Set(rotation.value.steps.map((step) => step.groupId).filter(Boolean));
  rotation.value.groups = groups.filter((group) => usedGroupIds.has(group.id));
}

function createGroupId(): string {
  return `group_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultGroupName(): string {
  return `group ${(rotation.value.groups?.length ?? 0) + 1}`;
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
  libraryDragState.value = { slot, commandId };
}

function clearLibraryCommandDrag() {
  libraryDragState.value = null;
}

function handleLaneDrop(event: DragEvent, slot: PartySlot) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !libraryDragState.value) {
    clearLibraryCommandDrag();
    return;
  }

  const dropTime = clampCursorTime((event.clientX - target.getBoundingClientRect().left) / AXIS_SCALE);
  addStepAtTime(slot, libraryDragState.value.commandId, dropTime);
  selectedLibrarySlot.value = libraryDragState.value.slot;
  clearLibraryCommandDrag();
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
  return Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
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
      return "Enhanced Battle Skill";
    case "enhanced_basic_attack":
      return "Enhanced Basic Attack";
    default:
      return null;
  }
}

function formatSkillTypeLabel(attackType: string, commandName?: string): string {
  switch (attackType) {
    case "ULTIMATE":
      return "Ultimate";
    case "COMBO_SKILL":
      return "Combo Skill";
    case "BATTLE_SKILL":
      return "Battle Skill";
    case "GENERIC":
      return commandName ?? "Generic";
    default:
      return formatAttackTypeLabel(attackType);
  }
}

function getActionCommand(action: { slot: PartySlot; commandId: string }) {
  const actor = partyBySlot.value.get(action.slot);
  return actor?.commands.find((entry) => entry.id === action.commandId) ?? null;
}

function getCommandDisplayType(command: CharacterCombatSnapshot["commands"][number] | null | undefined): string {
  if (!command) {
    return "Battle Skill";
  }

  const enhancedPrefix = command.variant ? "*" : "";

  if (command.attackType === "BASIC_ATTACK") {
    switch (command.basicAttackVariant) {
      case "sequence_segment":
        return command.sequenceSegmentIndex === command.sequenceSegmentTotal
          ? `${enhancedPrefix}Final Strike`
          : `${enhancedPrefix}A${command.sequenceSegmentIndex ?? ""}`;
      case "final_strike":
        return `${enhancedPrefix}Final Strike`;
      case "dive_attack":
        return `${enhancedPrefix}Dive Attack`;
      default:
        return `${enhancedPrefix}Basic Attack Sequence`;
    }
  }

  if (command.attackType === "GENERIC") {
    switch (command.genericActionType) {
      case "switch":
        return "Switch";
      case "dodge":
        return "Dodge";
      case "jump":
        return "Jump";
      default:
        return "Generic";
    }
  }

  return `${enhancedPrefix}${formatSkillTypeLabel(command.attackType, command.name)}`;
}

function isActionLinkEnhanced(stepId: string): boolean {
  return linkEnhancedStepIdSet.value.has(stepId);
}

function getActionCardWidth(action: { realStartTime: number; realEndTime: number }): number {
  return Math.max(28, (action.realEndTime - action.realStartTime) * AXIS_SCALE);
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
    <aside class="rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="text-xs uppercase tracking-[0.24em] text-[#777]">Control Panel</div>
        <div class="mt-1 text-lg font-semibold">{{ selectedSidebarTitle }}</div>
      </div>

      <div v-if="sidebarMode === 'character'" class="border-b border-[#ececec] px-5 py-4">
        <label class="block">
          <div class="mb-1 flex items-center justify-between gap-3 text-xs text-[#666]">
            <span class="mb-3 text-sm font-semibold text-[#1b1b1b]">Starting Energy</span>
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
      </div>

      <div class="max-h-[calc(100vh-300px)] overflow-y-auto px-5 py-4">
        <div v-if="sidebarMode === 'character' && !libraryCharacter" class="rounded-xl border border-dashed border-[#d6d6d6] bg-[#fafafa] p-4 text-sm text-[#666]">
          Configure a character and weapon in the builder first. Commands for that slot will appear here.
        </div>

        <div v-else class="space-y-4">
          <section v-if="sidebarMode === 'enemy'" class="space-y-4">
            <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
              <div class="mb-3 text-sm font-semibold text-[#1b1b1b]">Enemy Setup</div>
              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Enemy</div>
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
                  <span>Enemy Level</span>
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
                  HP {{ Math.max(0, props.enemyStats.hp - currentEnemyState.currentDamageTaken).toFixed(0) }} / {{ props.enemyStats.hp }}
                </div>
                <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                  Stagger {{ currentEnemyState.currentStagger.toFixed(1) }} / {{ props.enemyStaggerGauge.toFixed(1) }}
                </div>
                <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                  DEF {{ props.enemyStats.def }}
                </div>
              </div>
            </section>
          </section>

          <section v-if="sidebarMode === 'character'" class="grid grid-cols-2 gap-2">
            <template v-if="selectedCharacterIsControlled">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="addGenericStep('__dodge')"
              >
                Dodge
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="addGenericStep('__jump')"
              >
                Jump
              </button>
            </template>
            <button
              v-else
              type="button"
              class="col-span-2 inline-flex items-center justify-between rounded-xl border border-[#dcdcdc] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#1b1b1b] transition hover:border-[#c8d13c] hover:bg-[#fffde2] disabled:cursor-not-allowed disabled:border-[#ececec] disabled:bg-[#f6f6f6] disabled:text-[#9a9a9a]"
              :disabled="selectedCharacterSwitchLockRemaining > 0"
              @click="addGenericStep('__switch')"
            >
              <span>Switch</span>
              <span class="text-xs text-[#6b6b6b]">
                {{
                  selectedCharacterSwitchLockRemaining > 0
                    ? `${selectedCharacterSwitchLockRemaining.toFixed(1)}s`
                    : 'Ready'
                }}
              </span>
            </button>
          </section>

          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left"
              @click="statusListExpanded = !statusListExpanded"
            >
              <span class="text-sm font-semibold text-[#1b1b1b]">Buffs And Statuses</span>
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[#666]">
                <svg class="h-4 w-4 transition" :class="statusListExpanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
            <div v-if="statusListExpanded" class="space-y-2 border-t border-[#ececec] px-4 py-3">
              <div
                v-for="item in libraryCharacterStatuses"
                :key="item.id"
                class="rounded-lg border border-[#ececec] bg-white px-3 py-2 text-xs text-[#444]"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate font-medium text-[#2b2b2b]">{{ item.label }}</div>
                    <div v-if="item.details" class="truncate text-[11px] text-[#6b6b6b]">{{ item.details }}</div>
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
              </div>
            </div>
          </section>

          <section v-if="sidebarMode === 'character'" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb]">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left"
              @click="commandListExpanded = !commandListExpanded"
            >
              <span class="text-sm font-semibold text-[#1b1b1b]">Command List</span>
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
                    <div class="font-medium text-[#1b1b1b]">{{ command.name }}</div>
                    <div class="mt-1 text-xs uppercase tracking-[0.18em] text-[#7d7d7d]">
                      {{ getCommandVariantLabel(command) ?? formatAttackTypeLabel(command.attackType) }}
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
          <div class="text-xs uppercase tracking-[0.24em] text-[#777]">Axis Workspace</div>
          <div class="mt-1 text-lg font-semibold">Combat Rotation</div>
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
              aria-label="Add rotation"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[#555] transition hover:bg-[#f6f6f6]"
              @click="renameCurrentRotationScheme"
              aria-label="Rename rotation"
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
              aria-label="Delete rotation"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5.5 6.5h9M8 6.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M7 8.5V14M10 8.5V14M13 8.5V14M6.5 6.5l.5 9a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="text-xs text-[#777]">
            Drag timeline blocks horizontally to retime steps.
          </div>
          <button
            type="button"
            class="rounded-lg border border-[#d4d4d4] bg-[#f7f7f7] px-3 py-2 text-sm text-[#333] transition hover:bg-[#efefef]"
            @click="removeSelectedStep"
          >
            Remove
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#f0d0d0] bg-[#fff5f5] px-3 py-2 text-sm text-[#9a3131] transition hover:bg-[#ffeaea]"
            @click="clearRotation"
          >
            Clear
          </button>
        </div>
      </div>

      <div class="overflow-x-auto px-5 py-5">
        <div class="min-w-full" :style="{ width: `${TRACK_LABEL_WIDTH + timelineWidth}px` }">
          <div class="grid grid-cols-[160px_minmax(0,1fr)]">
            <div class="sticky left-0 z-20 border-b border-[#ececec] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#5d5d5d]">
              Real Time
            </div>

            <div
              class="relative border-b border-[#ececec] bg-[#fafafa]"
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

            <div class="sticky left-0 z-20 border-b border-[#e8e8e8] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#5d5d5d]">
              Game Time
            </div>

            <div
              class="relative border-b border-[#e8e8e8] bg-[#fafafa]"
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
                  Real Time {{ cursorTime.toFixed(2) }}s
                </div>
                <div class="absolute left-2 top-8 rounded bg-[#3d3d3d] px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
                  Game Time {{ cursorCombatState.cursorGameTime.toFixed(2) }}s
                </div>
              </div>
            </div>

            <template v-for="slotIndex in 4" :key="slotIndex">
              <button
                type="button"
                class="sticky left-0 z-10 border-b border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
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
                      :alt="partyDisplay[slotIndex - 1]?.actor?.characterName ?? 'Avatar'"
                      class="h-full w-full object-cover"
                    >
                    <span v-else>
                      {{ getAvatarInitials(partyDisplay[slotIndex - 1]?.actor?.characterName) }}
                    </span>
                  </div>
                  <div class="min-w-0 self-center">
                    <div class="truncate text-sm font-medium text-[#1b1b1b]">
                      {{ partyDisplay[slotIndex - 1]?.actor?.characterName ?? slots[slotIndex - 1]?.label }}
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
                      <span>Combo Skill</span>
                      <span>{{ cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.label }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                      <div
                        class="h-full"
                        :style="{
                          width: `${(cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.readyRatio ?? 0) * 100}%`,
                          backgroundColor:
                            cursorCombatState.comboBySlot.get((slotIndex - 1) as PartySlot)?.label === 'Ready'
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
                        :alt="partyDisplay[slotIndex - 1]?.actor?.characterName ?? 'Switch'"
                        class="h-full w-full object-cover"
                      >
                      <span v-else class="text-[9px] font-semibold text-[#1b1b1b]">
                        {{ getAvatarInitials(partyDisplay[slotIndex - 1]?.actor?.characterName) }}
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

                <button
                  v-for="action in laneActions((slotIndex - 1) as PartySlot)"
                  :key="action.stepId"
                  type="button"
                  :ref="(element) => setActionElement(action.stepId, element)"
                  class="absolute top-8 h-[4.5rem] overflow-hidden rounded-2xl border px-3 py-2.5 text-left shadow-sm transition active:cursor-grabbing"
                  :class="
                    getActionValidation(action)
                      ? isStepSelected(action.stepId)
                        ? 'border-[#d85b5b] bg-[#fff1f1] cursor-grab'
                        : 'border-[#e5b2b2] bg-[#fff7f7] hover:border-[#d98d8d] cursor-grab'
                      : getStepGroup(action.stepId)
                        ? isStepSelected(action.stepId)
                          ? 'border-[#e4cc52] bg-[#fff8cc] cursor-grab'
                          : 'border-[#e4cc52] bg-white hover:border-[#d4bb3f] cursor-grab'
                        : isStepSelected(action.stepId)
                          ? 'border-[#c8d13c] bg-[#eef38d] cursor-grab'
                          : 'border-[#dadada] bg-white hover:border-[#cacaca] cursor-grab'
                  "
                  :style="{
                    left: `${action.realStartTime * AXIS_SCALE}px`,
                    width: `${getActionCardWidth(action)}px`,
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
                      getActionValidation(action) ? 'text-[#8b2d2d]' : 'text-[#3d3d3d]',
                    ]"
                  >
                    {{ getActionSkillTypeLabel(action) }}
                    <span
                      v-if="shouldShowActionName(action)"
                      class="ml-1.5 text-[11px] font-medium normal-case tracking-normal"
                      :class="getActionValidation(action) ? 'text-[#a14b4b]' : 'text-[#626262]'"
                    >
                      {{ action.commandName }}
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
                    :class="getActionValidation(action) ? 'mt-1 text-[#7a5858]' : 'mt-2 text-[#595959]'"
                  >
                    <div class="min-w-0 truncate">
                      Start {{ action.startTime.toFixed(1) }}s Game/{{ action.realStartTime.toFixed(1) }}s Real
                    </div>
                    <div class="min-w-0 truncate text-right">
                      Duration {{ (action.endTime - action.startTime).toFixed(1) }}s Game /{{ (action.realEndTime - action.realStartTime).toFixed(1) }}s Real
                    </div>
                  </div>

                  <div
                    v-if="isActionLinkEnhanced(action.stepId)"
                    class="absolute bottom-1 left-2 rounded bg-[#ece81a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#5f5500]"
                  >
                    Link
                  </div>
                </button>

                <div
                  v-for="entry in simulation.timeline.filter((entry) => entry.slot === ((slotIndex - 1) as PartySlot))"
                  :key="`${entry.stepId}-${entry.hitIndex}-${entry.time}-${entry.damage}`"
                  class="absolute top-2 h-24 w-0.5 bg-[#1b1b1b]/25"
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
                        :alt="partyBySlot.get(triggerSlot)?.characterName ?? 'Triggered Combo'"
                        class="h-full w-full object-cover"
                      >
                      <span v-else>
                        {{ getAvatarInitials(partyBySlot.get(triggerSlot)?.characterName) }}
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
              class="sticky left-0 z-10 border-b border-[#efefef] px-3 py-3 text-left transition hover:bg-[#fffef2]"
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
                    <span>HP</span>
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
                    <span>Stagger</span>
                    <span>{{ currentEnemyState.currentStagger.toFixed(1) }} / {{ props.enemyStaggerGauge.toFixed(1) }}</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-[#ececec]">
                    <div
                      class="h-full"
                      :class="currentEnemyState.isStaggered ? 'bg-[#ece81a]' : 'bg-[#c8d13c]'"
                      :style="{ width: `${Math.min(100, (currentEnemyState.currentStagger / Math.max(1, props.enemyStaggerGauge)) * 100)}%` }"
                    />
                  </div>
                </div>
              </div>
            </button>

            <div
              class="relative h-28 border-b border-[#efefef]"
              :style="{
                width: `${timelineWidth}px`,
                backgroundImage: 'repeating-linear-gradient(to right, rgba(27,27,27,0.05) 0, rgba(27,27,27,0.05) 1px, transparent 1px, transparent 116px)',
              }"
              @click="setCursorFromLane"
            />
          </div>
        </div>
      </div>

      <div class="border-t border-[#ececec] px-5 py-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px_260px]">
          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
            <div class="mb-3 text-sm font-semibold text-[#1b1b1b]">Battle Start</div>
            <div class="grid max-w-[560px] grid-cols-1 gap-4 md:grid-cols-2">
              <label class="block">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Starting SP</div>
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
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">SP Regen</div>
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
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Current Total Damage</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(cursorCombatState.totalDamage) }}
            </div>
            <div class="mt-4 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Current Stagger</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ cursorCombatState.stagger.toFixed(1) }}
            </div>
          </section>

          <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Team SP</div>
              <div class="text-xs text-[#777]">
                Real Time {{ formatTime(cursorCombatState.cursorTime) }}s · Game Time {{ formatTime(cursorCombatState.cursorGameTime) }}s
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
              <span>Returned {{ cursorCombatState.teamSpReturned.toFixed(1) }}</span>
              <span>Generated {{ cursorCombatState.teamSpGenerated.toFixed(1) }}</span>
            </div>
          </section>
        </div>
      </div>

      <div class="border-t border-[#ececec] px-5 py-4">
        <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[#1b1b1b]">Hit Timeline</div>
              <div class="text-xs text-[#6a6a6a]">Resolved hits from start to finish.</div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#333] transition hover:bg-[#f5f5f5]"
              @click="hitTimelineExpanded = !hitTimelineExpanded"
            >
              {{ hitTimelineExpanded ? 'Collapse' : 'Expand' }}
            </button>
          </div>

          <div v-if="allHits.length === 0" class="text-sm text-[#6a6a6a]">
            No resolved hits yet. Add commands to the rotation to populate the timeline.
          </div>

          <div v-else-if="!hitTimelineExpanded" class="text-sm text-[#8a8a8a]">
            Hit list hidden while collapsed.
          </div>

          <div
            v-else
            class="overflow-y-auto pr-1"
            :class="hitTimelineExpanded ? 'max-h-[60vh]' : 'max-h-72'"
          >
            <div
              class="sticky top-0 z-10 mb-2 grid grid-cols-[minmax(0,1fr)_72px_270px] items-center gap-3 rounded-lg border border-[#e6e6e6] bg-[#f5f5f5] px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-[#5a5a5a]"
            >
              <div>Command/Hit</div>
              <div>Timestamp</div>
              <div class="text-right">NoCrit&nbsp;|&nbsp;Crit&nbsp;|&nbsp;Avg</div>
            </div>

            <div
              v-for="entry in allHits"
              :key="`${entry.stepId}-${entry.hitIndex}-${entry.time}`"
              class="mb-2 grid grid-cols-[minmax(0,1fr)_72px_270px] items-center gap-3 rounded-lg border border-[#ededed] bg-white px-3 py-2"
            >
              <div class="flex min-w-0 items-center gap-2">
                <div class="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-[#d9d9d9] bg-[#f2f2f2]">
                  <img
                    v-if="getCharacterAvatarPath(partyBySlot.get(entry.slot)?.characterId)"
                    :src="getCharacterAvatarPath(partyBySlot.get(entry.slot)?.characterId) ?? undefined"
                    :alt="entry.characterName"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-[#666]"
                  >
                    {{ getAvatarInitials(entry.characterName) }}
                  </div>
                </div>
                <div class="truncate text-sm font-medium text-[#1b1b1b]">
                  {{ entry.commandName }} / {{ entry.hitName ?? `Hit ${entry.hitIndex + 1}` }}
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
      </div>
    </main>

    <aside class="rounded-2xl border border-[#d6d6d6] bg-white shadow-sm">
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="text-xs uppercase tracking-[0.24em] text-[#777]">Rotation Summary</div>
        <div class="mt-1 text-lg font-semibold">Output And Step</div>
      </div>

      <div class="space-y-6 px-5 py-4">
        <section class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Total Damage</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(simulation.totalDamage) }}
            </div>
          </div>
          <div class="rounded-xl border border-[#e4e4e4] bg-[#fafafa] p-3">
            <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">DPS</div>
            <div class="mt-2 text-2xl font-semibold text-[#1b1b1b]">
              {{ formatDamage(simulation.totalTime > 0 ? simulation.totalDamage / simulation.totalTime : 0) }}
            </div>
          </div>
          <div class="col-span-2 text-xs text-[#777]">
            {{ enemyName }} Lv{{ enemyLevel }} · Real Time {{ formatTime(simulation.totalTime) }}s · Game Time {{ formatTime(simulation.totalGameTime) }}s
          </div>
        </section>

        <section v-if="damageContributions.length > 0" class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-1 text-sm font-semibold text-[#1b1b1b]">Damage Contribution</div>
          <div class="text-xs text-[#6a6a6a]">Share of total rotation damage by character.</div>
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
                <span class="text-[#1b1b1b]">{{ entry.characterName }}</span>
              </div>
              <div class="text-[#555]">
                {{ formatDamage(entry.damage) }} ({{ entry.percent.toFixed(1) }}%)
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="text-sm font-semibold text-[#1b1b1b]">
              {{ hasMultiSelection ? `${selectedCommandsCount} Commands Selected` : 'Selected Command' }}
            </div>
            <button
              v-if="selectedSteps.length > 0"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e3bcbc] bg-white text-[#9a3131] transition hover:bg-[#fff1f1]"
              @click="removeSelectedStep"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M8 5V3.8c0-.44.36-.8.8-.8h2.4c.44 0 .8.36.8.8V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M6 7l.5 8.1c.03.5.45.9.95.9h5.1c.5 0 .92-.4.95-.9L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.5 9.2v4.6M11.5 9.2v4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div v-if="selectedSteps.length === 0" class="text-sm text-[#6a6a6a]">
            Select a step on the axis, or add one from the command library.
          </div>

          <div v-else-if="hasMultiSelection" class="space-y-3">
            <div class="rounded-xl border border-[#ececec] bg-white px-4 py-3 text-sm text-[#444]">
              {{ selectedCommandsCount }} commands are selected. Grouped commands will move and delete together.
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#333] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="groupSelectedSteps"
              >
                Group
              </button>
              <button
                v-if="selectedGroup"
                type="button"
                class="rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#333] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
                @click="ungroupSelectedSteps"
              >
                Ungroup
              </button>
            </div>

            <label v-if="selectedGroup" class="block">
              <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Group Name</div>
              <input
                :value="selectedGroup.name"
                type="text"
                class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
                @change="renameSelectedGroup(($event.target as HTMLInputElement).value)"
              >
            </label>
          </div>

          <div v-else class="space-y-3">
            <div class="rounded-xl border border-[#ececec] bg-white px-4 py-3">
              <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
                {{ getCommandDisplayType(selectedStepCommand) }}
              </div>
              <div class="mt-1 text-lg font-medium text-[#1b1b1b]">
                {{ selectedStepCommand?.name ?? selectedStep?.commandId }}
              </div>
              <div
                v-if="selectedStepValidation"
                class="mt-2 text-sm font-medium text-[#c23f3f]"
              >
                {{ selectedStepValidation }}
              </div>
            </div>

            <div
              v-if="selectedStepAction"
              class="grid grid-cols-2 gap-2 text-xs text-[#5f5f5f]"
            >
              <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                Real start {{ selectedStepAction.realStartTime.toFixed(2) }}s
              </div>
              <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                Game start {{ selectedStepAction.startTime.toFixed(2) }}s
              </div>
              <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                Real end {{ selectedStepAction.realEndTime.toFixed(2) }}s
              </div>
              <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
                Game end {{ selectedStepAction.endTime.toFixed(2) }}s
              </div>
            </div>

            <label class="block">
              <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Real Start Time</div>
              <input
                :value="selectedStep?.startTime?.toFixed(3) ?? ''"
                type="number"
                min="0"
                step="0.1"
                class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
                @input="
                  updateSelectedStep({
                    startTime: ($event.target as HTMLInputElement).value === ''
                      ? undefined
                      : Number(Number(($event.target as HTMLInputElement).value).toFixed(3)),
                  })
                "
              >
            </label>
          </div>
        </section>

      </div>
    </aside>

    <div
      v-if="marqueeSelectionState"
      class="pointer-events-none fixed z-[60] rounded-md border border-[#c8d13c] bg-[#ece81a]/15"
      :style="getMarqueeStyle()"
    />
  </section>
</template>
