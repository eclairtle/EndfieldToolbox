import { makeBaseModifierStats, type ModifierStats, type ModifierStatKey } from "@/lib/build/stats";
import { isUniqueTalentEnabled } from "@/lib/build/buildConditions";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type {
  ActorCombatStateSnapshot,
  CharacterCombatSnapshot,
  ComboTriggerDebugEntry,
  CritRigMode,
  ComboTriggerWindow,
  DamageTimelineEntry,
  EnemyActionWindow,
  EnemyCombatStateSnapshot,
  Rotation,
  RotationCombatEvent,
  RotationSimulationResult,
} from "@/lib/combat/rotation";
import type { UnifiedCombatStatus } from "@/lib/combat/statusModel";
import { calculateReactionDamage, calculateResolvedHitDamage } from "@/lib/combat/combatDamage";
import { compileRotationTimeline } from "@/lib/combat/compileRotationTimeline";
import type { CombatHookEnemyArtsInflictionState } from "@/lib/combat/hooks";
import type { ElementType } from "@/data/characters";
import { CONSUMABLE_BY_ID } from "@/data/consumables";
import { runGearSetEventListener } from "@/lib/combat/gearSetEffects";
import { runWeaponEventListener } from "@/lib/combat/weaponEffects";
import type {
  CombatCondition,
  CommandHitEffectDefinition,
  ResolvedCommandAtLevel,
  ResolvedCommandHitAtLevel,
  TimeScale,
} from "@/lib/commands";
import { calculateHealingAmount } from "@/lib/combat/combatDamage";

type TimedEnemyDebuff = {
  id?: string;
  buffId?: string;
  label?: string;
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
  timeScale: TimeScale;
};

type TimedEnemyStatus = {
  id: string;
  label: string;
  expiresAt: number;
  timeScale: TimeScale;
  applierSlot?: CharacterCombatSnapshot["slot"];
  level?: number;
  nextTickAtGameTime?: number;
  finalAmount?: number;
  currentReduction?: number;
  nextRampAtGameTime?: number;
};

type TimedEffectStatus = {
  id: string;
  label: string;
  sourceSlot: CharacterCombatSnapshot["slot"];
  sourceStepId: string;
  linkSourceStepId?: string;
  target: "enemy" | "self" | "global";
  expiresAt: number;
  timeScale: TimeScale;
  periods: number;
  periodsExecuted: number;
  periodInterval: number;
  nextPeriodAt?: number;
  pauseStatusIds?: string[];
  effects?: Partial<ModifierStats>;
  periodicEffects: CommandHitEffectDefinition[];
  expireEffects: CommandHitEffectDefinition[];
};

type TimedTeamLinkStack = {
  expiresAt: number;
  timeScale: TimeScale;
};

type TimedActorBuff = {
  id: string;
  label: string;
  slot: CharacterCombatSnapshot["slot"];
  hidden?: boolean;
  appliedAt: number;
  appliedAtGameTime: number;
  expiresAt: number;
  timeScale: TimeScale;
  effects: Partial<ModifierStats>;
  stackGroup?: string;
};

type EnemyArtsInflictionState = {
  element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  stacks: number;
  expiresAtGameTime: number;
};

type EnemyPhysicalInflictionState = {
  stacks: number;
  expiresAtGameTime: number;
};

type PendingArtsBurst = {
  executeGameTime: number;
  sourceSlot: CharacterCombatSnapshot["slot"];
  element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  stepId: string;
};

type PendingExecuteHit = {
  actor: CharacterCombatSnapshot;
  hit: ResolvedCommandHitAtLevel;
  hitIndex: number;
  hitName?: string;
  sourceCommandId: string;
  sourceCommandName: string;
  stepId: string;
  executionTime: number;
  executionGameTime: number;
  registerTime: number;
  registerGameTime: number;
  triggerSlots: CharacterCombatSnapshot["slot"][];
  linkSourceStepId?: string;
  applySourceCommandModifiers?: boolean;
};

type ArtsReactionKind = "Combustion" | "Corrosion" | "Solidification" | "Electrification";
type PhysicalReactionKind = "Lift" | "Knockdown" | "Crush" | "Breach";

type ActionOccurrence = {
  kind: "action-start";
  time: number;
  gameTime: number;
  actor: CharacterCombatSnapshot;
  command: ResolvedCommandAtLevel;
  action: RotationSimulationResult["actions"][number];
};

type ActionEndOccurrence = {
  kind: "action-end";
  time: number;
  gameTime: number;
  actor: CharacterCombatSnapshot;
  command: ResolvedCommandAtLevel;
  action: RotationSimulationResult["actions"][number];
};

type HitOccurrence = {
  kind: "hit";
  time: number;
  gameTime: number;
  actor: CharacterCombatSnapshot;
  command: ResolvedCommandAtLevel;
  action: RotationSimulationResult["actions"][number];
  hit: ResolvedCommandHitAtLevel;
  hitIndex: number;
  repeatIndex: number;
  isFinalStrikeOfBasicSequence: boolean;
  isFinisherHit: boolean;
};

const COMBO_READY_TIMEOUT_SECONDS = 10;
const ARTS_INFLICTION_DURATION_SECONDS = 20;
const MELTING_FLAME_STATUS_ID = "melting_flame";
const ARTS_INFLICTION_STATUS_ID = "arts_infliction";
const VULNERABILITY_STATUS_ID = "vulnerability";
const ENEMY_STAGGERED_STATUS_ID = "enemy_staggered";
const ENEMY_FINISHER_AVAILABLE_STATUS_ID = "enemy_finisher_available";
const ENEMY_STAGGERED_DAMAGE_MULTIPLIER = 1.3;
const PRE_BATTLE_START_GAME_TIME = 0;
const TANGTANG_ULTIMATE_STATUS_ID = "tangtang_olden_stare";
const ENEMY_STATUS_KIND = "reaction_status";
const EFFECT_STATUS_KIND = "effect_status";
const ACTOR_BUFF_KIND = "actor_buff";
const SWITCH_BACK_COOLDOWN_SECONDS = 2;
function addModifierDelta(
  base: ModifierStats,
  delta: Partial<ModifierStats>,
): ModifierStats {
  const out: ModifierStats = { ...base };

  for (const [key, value] of Object.entries(delta)) {
    if (value == null) {
      continue;
    }

    out[key as ModifierStatKey] += value;
  }

  return out;
}

function getComboCommand(actor: CharacterCombatSnapshot): ResolvedCommandAtLevel | null {
  return actor.commands.find((command) => command.attackType === "COMBO_SKILL") ?? null;
}

function getComboCommandById(
  actor: CharacterCombatSnapshot | null | undefined,
  commandId?: string,
): ResolvedCommandAtLevel | null {
  if (!actor) {
    return null;
  }
  if (commandId) {
    return actor.commands.find((command) => command.id === commandId && command.attackType === "COMBO_SKILL") ?? null;
  }
  return getComboCommand(actor);
}

export function makeEnemyModifierSnapshot(input: {
  resistances: {
    PHYSICAL_RESIST_PCT: number;
    HEAT_RESIST_PCT: number;
    CRYO_RESIST_PCT: number;
    ELECTRIC_RESIST_PCT: number;
    NATURE_RESIST_PCT: number;
    AETHER_RESIST_PCT: number;
  };
  dmgTakenPct?: number;
}): ModifierStats {
  const base = makeBaseModifierStats();
  return {
    ...base,
    DMG_TAKEN_PCT: input.dmgTakenPct ?? 0,
    PHYSICAL_RESIST_PCT: input.resistances.PHYSICAL_RESIST_PCT,
    HEAT_RESIST_PCT: input.resistances.HEAT_RESIST_PCT,
    CRYO_RESIST_PCT: input.resistances.CRYO_RESIST_PCT,
    ELECTRIC_RESIST_PCT: input.resistances.ELECTRIC_RESIST_PCT,
    NATURE_RESIST_PCT: input.resistances.NATURE_RESIST_PCT,
    AETHER_RESIST_PCT: input.resistances.AETHER_RESIST_PCT,
  };
}

export function getActorStateAtTime(
  simulation: RotationSimulationResult,
  slot: CharacterCombatSnapshot["slot"],
  realTime: number,
): ActorCombatStateSnapshot {
  const gameTime = simulation.timeExtensions.length === 0
    ? realTime
    : (() => {
        for (const ext of simulation.timeExtensions) {
          const freezeRealStart = ext.time;
          const freezeRealEnd = ext.time + ext.amount;

          if (realTime >= freezeRealStart && realTime < freezeRealEnd) {
            return ext.gameTime;
          }

          if (realTime < freezeRealStart) {
            return realTime - ext.cumulativeFreezeTime;
          }
        }

        const last = simulation.timeExtensions[simulation.timeExtensions.length - 1];
        return last ? realTime - (last.cumulativeFreezeTime + last.amount) : realTime;
      })();

  let latest: ActorCombatStateSnapshot | undefined;
  for (let index = simulation.actorStateTimeline.length - 1; index >= 0; index -= 1) {
    const entry = simulation.actorStateTimeline[index];
    if (!entry) {
      continue;
    }
    if (entry.slot !== slot) {
      continue;
    }
    if (entry.time <= realTime + 0.001) {
      latest = entry;
      break;
    }
  }

  if (!latest) {
    return {
      slot,
      time: realTime,
      gameTime,
      currentHp: 0,
      maxHp: 0,
      meltingFlameStacks: 0,
      activeBuffs: [],
      activeTeamStatuses: [],
    };
  }

  return {
    ...latest,
    time: realTime,
    gameTime,
    activeBuffs: latest.activeBuffs.filter((buff) =>
      buff.timeScale === "real" ? buff.expiresAt > realTime : buff.expiresAt > gameTime,
    ),
    activeTeamStatuses: latest.activeTeamStatuses.filter((status) =>
      status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
    ),
  };
}

export function getEnemyStateAtTime(
  simulation: RotationSimulationResult,
  realTime: number,
): EnemyCombatStateSnapshot {
  const gameTime = simulation.timeExtensions.length === 0
    ? realTime
    : (() => {
        for (const ext of simulation.timeExtensions) {
          const freezeRealStart = ext.time;
          const freezeRealEnd = ext.time + ext.amount;

          if (realTime >= freezeRealStart && realTime < freezeRealEnd) {
            return ext.gameTime;
          }

          if (realTime < freezeRealStart) {
            return realTime - ext.cumulativeFreezeTime;
          }
        }

        const last = simulation.timeExtensions[simulation.timeExtensions.length - 1];
        return last ? realTime - (last.cumulativeFreezeTime + last.amount) : realTime;
      })();

  let latest: EnemyCombatStateSnapshot | undefined;
  for (let index = simulation.enemyStateTimeline.length - 1; index >= 0; index -= 1) {
    const entry = simulation.enemyStateTimeline[index];
    if (!entry) {
      continue;
    }
    if (entry.time <= realTime + 0.001) {
      latest = entry;
      break;
    }
  }

  if (!latest) {
    return {
      time: realTime,
      gameTime,
      currentDamageTaken: 0,
      currentStagger: 0,
      isStaggered: false,
      activeDebuffs: [],
      activeStatuses: [],
      artsInfliction: null,
    };
  }

  let liveStagger = latest.currentStagger;
  let liveIsStaggered = latest.isStaggered;
  if (liveIsStaggered && liveStagger > 0 && realTime > latest.time) {
    liveStagger = Math.max(
      0,
      liveStagger - (realTime - latest.time) * Math.max(0, simulation.enemyStaggerDecayRate),
    );
    if (liveStagger <= 0.0001) {
      liveStagger = 0;
      liveIsStaggered = false;
    }
  }

  return {
    ...latest,
    time: realTime,
    gameTime,
    currentStagger: liveStagger,
    isStaggered: liveIsStaggered,
    activeDebuffs: latest.activeDebuffs.filter((debuff) =>
      debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime,
    ),
    activeStatuses: latest.activeStatuses.filter((status) =>
      status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
    ),
    artsInfliction:
      latest.artsInfliction && latest.artsInfliction.expiresAtGameTime > gameTime
        ? latest.artsInfliction
        : null,
  };
}

export function simulateRotation(args: {
  rotation: Rotation;
  party: CharacterCombatSnapshot[];
  enemyStats: EnemyResolvedStats;
  enemyMods: ModifierStats;
  enemyStaggerGauge: number;
  enemyStaggerNodes?: number[];
  enemyStaggerRecoverySeconds: number;
  enemyFinisherMultiplier?: number;
  enemyFinisherSpGain?: number;
  battleStartConsumableIdsBySlot?: Array<string | null | undefined>;
  enemyActionWindows?: EnemyActionWindow[];
  debug?: {
    onResolvedHit?: (ctx: {
      time: number;
      gameTime: number;
      occurrence: HitOccurrence;
      effectiveActorMods: ModifierStats;
      effectiveEnemyMods: ModifierStats;
      linkMultiplier: number;
      actorBuffs: TimedActorBuff[];
      enemyDebuffs: TimedEnemyDebuff[];
      enemyStatuses: TimedEnemyStatus[];
      teamLinkStacks: TimedTeamLinkStack[];
    }) => void;
  };
}): RotationSimulationResult {
  const { rotation, party, enemyStats, enemyMods } = args;

  const partyBySlot = new Map(party.map((member) => [member.slot, member]));
  const { actions, timeExtensions, timeContext } = compileRotationTimeline({ rotation, party });

  const events: RotationCombatEvent[] = [];
  const comboWindows: ComboTriggerWindow[] = [];
  const comboTriggerDebug: ComboTriggerDebugEntry[] = [];
  const timeline: DamageTimelineEntry[] = [];
  const actorStateTimeline: ActorCombatStateSnapshot[] = [];
  const enemyStateTimeline: EnemyCombatStateSnapshot[] = [];

  const comboCooldownUntilBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const pendingComboCooldownBySlot = new Map<
    CharacterCombatSnapshot["slot"],
    { durationSeconds: number; timeScale: TimeScale }
  >();
  const activeComboWindowBySlot = new Map<CharacterCombatSnapshot["slot"], ComboTriggerWindow>();
  const perfectTimingStepIds = new Set<string>();
  const repeatedHitKeys = new Set<string>();
  const terminatedRepeatHitChains = new Set<string>();
  const setTriggerFlags = new Set<string>();
  const listenerCooldowns = new Map<string, { expiresAt: number; timeScale: TimeScale }>();
  const listenerCounters = new Map<string, number>();
  const critThresholdProgressBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const commandLinkedStacksByStepId = new Map<string, number>();
  const interruptedAtByStepId = new Map<string, number>();
  const pendingArtsBursts: PendingArtsBurst[] = [];
  const pendingExecuteHits: PendingExecuteHit[] = [];
  const critRiggingRules = (rotation.critRiggingRules ?? []).filter((rule) => rule.enabled !== false);
  const critRigModeByHitKey = new Map<string, CritRigMode>();
  for (const rule of critRiggingRules) {
    critRigModeByHitKey.set(`${rule.stepId}:${rule.hitIndex}:${rule.repeatIndex}`, rule.mode);
  }

  let totalDamage = 0;
  let riggedCritCount = 0;
  const damageBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  let timedEnemyDebuffs: TimedEnemyDebuff[] = [];
  let runtimeStatuses: UnifiedCombatStatus[] = [];
  const actorMaxHpBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const actorCurrentHpBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  let controlledOperatorSlot: CharacterCombatSnapshot["slot"] = 0;
  const switchBackLockedUntilBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const enemyActionWindows = [...(args.enemyActionWindows ?? [])]
    .filter((window) => Number.isFinite(window.startTime) && Number.isFinite(window.endTime) && window.endTime > window.startTime)
    .sort((left, right) => left.startTime - right.startTime);
  const enemyInterruptTimes = enemyActionWindows
    .filter((window) => !window.interrupted && window.effects?.some((effect) => effect.type === "INTERRUPT_ONGOING_COMMANDS"))
    .map((window) => window.startTime)
    .sort((left, right) => left - right);
  const enemyStaggerResetTimes = enemyActionWindows
    .filter((window) => !window.interrupted && window.effects?.some((effect) => effect.type === "RESET_STAGGER"))
    .map((window) => window.startTime)
    .sort((left, right) => left - right);
  const enemyInterruptedCommandWindows = enemyActionWindows
    .filter((window) =>
      window.interruptible !== false
      && window.interrupted === true
      && ((window.interruptedSpGain ?? 0) > 0 || (window.interruptedStagger ?? 0) > 0),
    )
    .sort((left, right) => left.startTime - right.startTime);
  const enemyActionWindowIds = new Set(enemyActionWindows.map((window) => window.id));
  const enemyActionCommandIds = new Set(enemyActionWindows.map((window) => window.commandId));
  const maxStagger = Math.max(0, args.enemyStaggerGauge);
  const staggerRecoverySeconds = Math.max(0, args.enemyStaggerRecoverySeconds);
  const staggerDecayRate = staggerRecoverySeconds > 0 ? maxStagger / staggerRecoverySeconds : 0;
  const enemyStaggerNodeThresholds = (args.enemyStaggerNodes ?? [])
    .map((node) => (node > 0 && node <= 1 ? node * maxStagger : node))
    .filter((node) => node > 0 && node < maxStagger)
    .sort((left, right) => left - right);
  const enemyFinisherMultiplier = Math.max(0, args.enemyFinisherMultiplier ?? 1);
  const enemyFinisherSpGain = Math.max(0, args.enemyFinisherSpGain ?? 0);

  let enemyCurrentStaggerForEvents = 0;
  let enemyStaggerLastUpdateTime = 0;
  let enemyIsStaggeredForEvents = false;
  let nextEnemyStaggerResetIndex = 0;
  let nextEnemyInterruptedCommandWindowIndex = 0;
  const reachedStaggerNodeThresholds = new Set<number>();

  const isEnemyInvulnerableAt = (time: number) =>
    enemyActionWindows.some((window) => window.invulnerable && time >= window.startTime && time < window.endTime);
  const canHitEnemyBeforeBattleStart = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
  }) =>
    hasUnifiedStatus({
      statusId: TANGTANG_ULTIMATE_STATUS_ID,
      target: "global",
      sourceSlot: args.sourceSlot,
      realTime: args.time,
      gameTime: args.gameTime,
    });
  const isEnemyHitBlocked = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId?: string;
    commandId?: string;
    time: number;
    gameTime: number;
  }) => {
    const blockedByNormalInvulnerability =
      !shouldIgnoreEnemyInvulnerability({ stepId: args.stepId, commandId: args.commandId })
      && isEnemyInvulnerableAt(args.time);
    if (args.gameTime < PRE_BATTLE_START_GAME_TIME) {
      return !canHitEnemyBeforeBattleStart(args) || blockedByNormalInvulnerability;
    }
    return blockedByNormalInvulnerability;
  };
  const shouldIgnoreEnemyInvulnerability = (args: { stepId?: string; commandId?: string }) =>
    (args.stepId != null && enemyActionWindowIds.has(args.stepId))
    || (args.commandId != null && enemyActionCommandIds.has(args.commandId));

  const hasEnemyStatusById = (statusId: string) =>
    runtimeStatuses.some((status) =>
      status.scope === "enemy" && status.kind === ENEMY_STATUS_KIND && status.id === statusId,
    );

  const addEnemyStatusById = (args: {
    statusId: string;
    label: string;
    expiresAt: number;
    timeScale: TimeScale;
  }) => {
    runtimeStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy" && status.kind === ENEMY_STATUS_KIND && status.id === args.statusId),
    );
    runtimeStatuses.push({
      id: args.statusId,
      label: args.label,
      scope: "enemy",
      kind: ENEMY_STATUS_KIND,
      expiresAt: args.expiresAt,
      timeScale: args.timeScale,
    });
  };

  const removeEnemyStatusById = (statusId: string) => {
    runtimeStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy" && status.kind === ENEMY_STATUS_KIND && status.id === statusId),
    );
  };

  const clearEnemyStaggerStatuses = () => {
    removeEnemyStatusById(ENEMY_STAGGERED_STATUS_ID);
    removeEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
  };

  const advanceEnemyStaggerTo = (args: { time: number; gameTime: number }) => {
    const processDecay = (fromTime: number, toTime: number) => {
      if (!enemyIsStaggeredForEvents || staggerDecayRate <= 0 || toTime <= fromTime) {
        return;
      }
      enemyCurrentStaggerForEvents = Math.max(0, enemyCurrentStaggerForEvents - (toTime - fromTime) * staggerDecayRate);
      if (enemyCurrentStaggerForEvents <= 0.0001) {
        enemyCurrentStaggerForEvents = 0;
        enemyIsStaggeredForEvents = false;
        reachedStaggerNodeThresholds.clear();
        clearEnemyStaggerStatuses();
      }
    };

    while (
      nextEnemyStaggerResetIndex < enemyStaggerResetTimes.length
      && (enemyStaggerResetTimes[nextEnemyStaggerResetIndex] ?? Number.POSITIVE_INFINITY) <= args.time + 0.0001
    ) {
      const resetTime = enemyStaggerResetTimes[nextEnemyStaggerResetIndex]!;
      processDecay(enemyStaggerLastUpdateTime, resetTime);
      enemyCurrentStaggerForEvents = 0;
      enemyIsStaggeredForEvents = false;
      reachedStaggerNodeThresholds.clear();
      clearEnemyStaggerStatuses();
      enemyStaggerLastUpdateTime = resetTime;
      nextEnemyStaggerResetIndex += 1;
    }

    processDecay(enemyStaggerLastUpdateTime, args.time);
    enemyStaggerLastUpdateTime = args.time;
  };

  const applyEnemyStaggerFromHit = (args: {
    rawStagger: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }): number => {
    advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
    const baseStagger = Math.max(0, args.rawStagger);
    const sourceActor = args.sourceSlot != null ? partyBySlot.get(args.sourceSlot) : undefined;
    const sourceMods = sourceActor ? getEffectiveActorMods(sourceActor, args.time, args.gameTime) : undefined;
    const staggerEfficiencyMultiplier = Math.max(0, 1 + (sourceMods?.STAGGER_EFFICIENCY_PCT ?? 0));
    const effectiveStagger = baseStagger * staggerEfficiencyMultiplier;
    if (effectiveStagger <= 0 || enemyIsStaggeredForEvents || maxStagger <= 0) {
      return 0;
    }

    const previousStagger = enemyCurrentStaggerForEvents;
    const nextStagger = Math.min(maxStagger, previousStagger + effectiveStagger);
    enemyCurrentStaggerForEvents = nextStagger;

    for (const threshold of enemyStaggerNodeThresholds) {
      if (reachedStaggerNodeThresholds.has(threshold)) {
        continue;
      }
      if (previousStagger < threshold - 0.0001 && nextStagger >= threshold - 0.0001) {
        reachedStaggerNodeThresholds.add(threshold);
        const nodeEvent: RotationCombatEvent = {
          type: "STAGGER_NODE_REACHED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          target: "enemy",
          label: "Stagger Node Reached",
          amount: threshold,
        };
        emitEvent(nodeEvent);
        dispatchPassiveListeners(nodeEvent, args.triggerSlots);
      }
    }

    if (enemyCurrentStaggerForEvents >= maxStagger - 0.0001) {
      enemyCurrentStaggerForEvents = maxStagger;
      enemyIsStaggeredForEvents = true;
      reachedStaggerNodeThresholds.clear();
      addEnemyStatusById({
        statusId: ENEMY_STAGGERED_STATUS_ID,
        label: "Staggered",
        expiresAt: args.time + Math.max(0.001, staggerRecoverySeconds),
        timeScale: "real",
      });
      addEnemyStatusById({
        statusId: ENEMY_FINISHER_AVAILABLE_STATUS_ID,
        label: "Finisher Available",
        expiresAt: args.time + Math.max(0.001, staggerRecoverySeconds),
        timeScale: "real",
      });
      const staggeredEvent: RotationCombatEvent = {
        type: "ENEMY_STAGGERED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        target: "enemy",
        label: "Staggered",
      };
      emitEvent(staggeredEvent);
      dispatchPassiveListeners(staggeredEvent, args.triggerSlots);
    }

    return Math.max(0, nextStagger - previousStagger);
  };

  const findSlotByCharacterId = (characterId: string) =>
    party.find((member) => member.characterId === characterId)?.slot;

  const toRealTimeFromExtensions = (gameTime: number) => {
    const totalFreeze = timeExtensions.reduce((sum, ext) => sum + Math.max(0, ext.amount), 0);
    let low = gameTime - totalFreeze - 10;
    let high = gameTime + totalFreeze + 10;
    for (let index = 0; index < 80; index += 1) {
      const mid = (low + high) / 2;
      const midGameTime = toGameTimeFromExtensions(mid);
      if (midGameTime < gameTime) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  };

  const toGameTimeFromExtensions = (realTime: number) => {
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
  };

  const getRootStepId = (stepId: string) => stepId.split(":")[0] ?? stepId;
  const getInterruptCutoffForStep = (stepId: string) => interruptedAtByStepId.get(getRootStepId(stepId));
  const isInterruptedAtOrAfter = (stepId: string, time: number) => {
    const cutoff = getInterruptCutoffForStep(stepId);
    return cutoff != null && time >= cutoff - 0.0001;
  };

  const flushEnemyInterruptedCommandEventsUpTo = (args: { time: number }) => {
    while (
      nextEnemyInterruptedCommandWindowIndex < enemyInterruptedCommandWindows.length
      && (enemyInterruptedCommandWindows[nextEnemyInterruptedCommandWindowIndex]?.startTime ?? Number.POSITIVE_INFINITY) <= args.time + 0.0001
    ) {
      const window = enemyInterruptedCommandWindows[nextEnemyInterruptedCommandWindowIndex]!;
      const eventTime = window.startTime;
      const eventGameTime = timeContext.toGameTime(eventTime);
      const amount = Math.max(0, window.interruptedSpGain ?? 0);
      const interruptedStagger = Math.max(0, window.interruptedStagger ?? 0);
      if (amount > 0) {
        const interruptedSpEvent: RotationCombatEvent = {
          type: "ENEMY_COMMAND_INTERRUPTED",
          time: eventTime,
          gameTime: eventGameTime,
          label: `${window.label} Interrupted`,
          amount,
        };
        emitEvent(interruptedSpEvent);
      }
      if (interruptedStagger > 0) {
        applyEnemyStaggerFromHit({
          rawStagger: interruptedStagger,
          time: eventTime,
          gameTime: eventGameTime,
          stepId: window.id,
        });
      }
      nextEnemyInterruptedCommandWindowIndex += 1;
    }
  };

  const getEnemyArtsInfliction = (): EnemyArtsInflictionState | null => {
    const status = runtimeStatuses.find((entry) =>
      entry.id === ARTS_INFLICTION_STATUS_ID && entry.scope === "enemy" && entry.kind === "infliction"
    );
    if (!status) {
      return null;
    }
    const element = status.metadata?.element;
    if (element !== "Heat" && element !== "Cryo" && element !== "Electric" && element !== "Nature") {
      return null;
    }
    return {
      element,
      stacks: Math.max(1, Math.floor(status.stacks ?? 1)),
      expiresAtGameTime: status.expiresAt,
    };
  };

  const setEnemyArtsInfliction = (value: EnemyArtsInflictionState | null) => {
    runtimeStatuses = runtimeStatuses.filter((entry) => !(entry.id === ARTS_INFLICTION_STATUS_ID && entry.scope === "enemy"));
    if (!value) {
      return;
    }
    runtimeStatuses.push({
      id: ARTS_INFLICTION_STATUS_ID,
      label: `${value.element} Infliction`,
      scope: "enemy",
      kind: "infliction",
      expiresAt: value.expiresAtGameTime,
      timeScale: "game",
      stacks: Math.max(1, Math.floor(value.stacks)),
      metadata: {
        element: value.element,
      },
    });
  };

  const getEnemyPhysicalInfliction = (): EnemyPhysicalInflictionState | null => {
    const status = runtimeStatuses.find((entry) =>
      entry.id === VULNERABILITY_STATUS_ID && entry.scope === "enemy" && entry.kind === "infliction"
    );
    if (!status) {
      return null;
    }
    return {
      stacks: Math.max(1, Math.floor(status.stacks ?? 1)),
      expiresAtGameTime: status.expiresAt,
    };
  };

  const setEnemyPhysicalInfliction = (value: EnemyPhysicalInflictionState | null) => {
    runtimeStatuses = runtimeStatuses.filter((entry) => !(entry.id === VULNERABILITY_STATUS_ID && entry.scope === "enemy"));
    if (!value) {
      return;
    }
    runtimeStatuses.push({
      id: VULNERABILITY_STATUS_ID,
      label: "Vulnerability",
      scope: "enemy",
      kind: "infliction",
      expiresAt: value.expiresAtGameTime,
      timeScale: "game",
      stacks: Math.max(1, Math.floor(value.stacks)),
    });
  };

  const getMeltingFlameStacks = (slot: CharacterCombatSnapshot["slot"]) => {
    const status = runtimeStatuses.find((entry) =>
      entry.id === MELTING_FLAME_STATUS_ID && entry.scope === "actor" && entry.targetSlot === slot
    );
    return Math.max(0, Math.floor(status?.stacks ?? 0));
  };

  const setMeltingFlameStacks = (slot: CharacterCombatSnapshot["slot"], stacks: number) => {
    runtimeStatuses = runtimeStatuses.filter((entry) =>
      !(entry.id === MELTING_FLAME_STATUS_ID && entry.scope === "actor" && entry.targetSlot === slot),
    );
    if (stacks <= 0) {
      return;
    }
    runtimeStatuses.push({
      id: MELTING_FLAME_STATUS_ID,
      label: "Melting Flame",
      scope: "actor",
      kind: "special_stack",
      expiresAt: Number.POSITIVE_INFINITY,
      timeScale: "game",
      ownerSlot: slot,
      targetSlot: slot,
      stacks: Math.max(1, Math.floor(stacks)),
    });
  };

  const decodeEnemyStatus = (status: UnifiedCombatStatus): TimedEnemyStatus => ({
    id: status.id,
    label: status.label,
    expiresAt: status.expiresAt,
    timeScale: status.timeScale,
    applierSlot: status.ownerSlot,
    level: typeof status.metadata?.level === "number" ? status.metadata.level : status.stacks,
    nextTickAtGameTime:
      typeof status.metadata?.nextTickAtGameTime === "number" ? status.metadata.nextTickAtGameTime : undefined,
    finalAmount: typeof status.metadata?.finalAmount === "number" ? status.metadata.finalAmount : undefined,
    currentReduction:
      typeof status.metadata?.currentReduction === "number" ? status.metadata.currentReduction : undefined,
    nextRampAtGameTime:
      typeof status.metadata?.nextRampAtGameTime === "number" ? status.metadata.nextRampAtGameTime : undefined,
  });

  const getEnemyStatuses = () =>
    runtimeStatuses
      .filter((status) => status.scope === "enemy" && status.kind === ENEMY_STATUS_KIND)
      .map(decodeEnemyStatus);

  const setEnemyStatuses = (statuses: TimedEnemyStatus[]) => {
    runtimeStatuses = runtimeStatuses.filter((status) => !(status.scope === "enemy" && status.kind === ENEMY_STATUS_KIND));
    for (const status of statuses) {
      runtimeStatuses.push({
        id: status.id,
        label: status.label,
        scope: "enemy",
        kind: ENEMY_STATUS_KIND,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
        ownerSlot: status.applierSlot,
        stacks: status.level,
        metadata: {
          level: status.level,
          nextTickAtGameTime: status.nextTickAtGameTime,
          finalAmount: status.finalAmount,
          currentReduction: status.currentReduction,
          nextRampAtGameTime: status.nextRampAtGameTime,
        },
      });
    }
  };

  const decodeEffectStatus = (status: UnifiedCombatStatus): TimedEffectStatus => ({
    id: status.id,
    label: status.label,
    sourceSlot: (status.ownerSlot ?? 0) as CharacterCombatSnapshot["slot"],
    sourceStepId: (status.metadata?.sourceStepId as string) ?? "",
    linkSourceStepId: typeof status.metadata?.linkSourceStepId === "string"
      ? status.metadata.linkSourceStepId
      : undefined,
    target:
      status.scope === "enemy"
        ? "enemy"
        : status.scope === "global"
          ? "global"
          : "self",
    expiresAt: status.expiresAt,
    timeScale: status.timeScale,
    periods: typeof status.metadata?.periods === "number" ? status.metadata.periods : 1,
    periodsExecuted: typeof status.metadata?.periodsExecuted === "number" ? status.metadata.periodsExecuted : 0,
    periodInterval: typeof status.metadata?.periodInterval === "number" ? status.metadata.periodInterval : 0,
    nextPeriodAt: typeof status.metadata?.nextPeriodAt === "number" ? status.metadata.nextPeriodAt : undefined,
    periodicEffects: (status.metadata?.periodicEffects as CommandHitEffectDefinition[]) ?? [],
    expireEffects: (status.metadata?.expireEffects as CommandHitEffectDefinition[]) ?? [],
    pauseStatusIds: Array.isArray(status.metadata?.pauseStatusIds)
      ? (status.metadata?.pauseStatusIds as string[])
      : undefined,
  });

  const getEffectStatuses = () =>
    runtimeStatuses
      .filter((status) => status.kind === EFFECT_STATUS_KIND)
      .map(decodeEffectStatus);

  const setEffectStatuses = (statuses: TimedEffectStatus[]) => {
    runtimeStatuses = runtimeStatuses.filter((status) => status.kind !== EFFECT_STATUS_KIND);
    for (const status of statuses) {
      runtimeStatuses.push({
        id: status.id,
        label: status.label,
        scope: status.target === "self" ? "actor" : status.target,
        kind: EFFECT_STATUS_KIND,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
        ownerSlot: status.sourceSlot,
        targetSlot: status.target === "self" ? status.sourceSlot : undefined,
        metadata: {
          sourceStepId: status.sourceStepId,
          linkSourceStepId: status.linkSourceStepId,
          effects: status.effects,
          periods: status.periods,
          periodsExecuted: status.periodsExecuted,
          periodInterval: status.periodInterval,
          nextPeriodAt: status.nextPeriodAt,
          periodicEffects: status.periodicEffects,
          expireEffects: status.expireEffects,
          pauseStatusIds: status.pauseStatusIds,
        },
      });
    }
  };

  const decodeActorBuff = (status: UnifiedCombatStatus): TimedActorBuff => ({
    id: status.id,
    label: status.label,
    slot: (status.targetSlot ?? status.ownerSlot ?? 0) as CharacterCombatSnapshot["slot"],
    hidden: status.hidden,
    appliedAt: typeof status.metadata?.appliedAt === "number" ? status.metadata.appliedAt : 0,
    appliedAtGameTime: typeof status.metadata?.appliedAtGameTime === "number" ? status.metadata.appliedAtGameTime : 0,
    expiresAt: status.expiresAt,
    timeScale: status.timeScale,
    effects: (status.metadata?.effects as Partial<ModifierStats>) ?? {},
    stackGroup: typeof status.metadata?.stackGroup === "string" ? status.metadata.stackGroup : undefined,
  });

  const getActorBuffs = () =>
    runtimeStatuses
      .filter((status) => status.kind === ACTOR_BUFF_KIND && status.scope === "actor")
      .map(decodeActorBuff);

  const setActorBuffs = (buffs: TimedActorBuff[]) => {
    runtimeStatuses = runtimeStatuses.filter((status) => status.kind !== ACTOR_BUFF_KIND);
    for (const buff of buffs) {
      runtimeStatuses.push({
        id: buff.id,
        label: buff.label,
        scope: "actor",
        kind: ACTOR_BUFF_KIND,
        expiresAt: buff.expiresAt,
        timeScale: buff.timeScale,
        ownerSlot: buff.slot,
        targetSlot: buff.slot,
        hidden: buff.hidden,
        metadata: {
          appliedAt: buff.appliedAt,
          appliedAtGameTime: buff.appliedAtGameTime,
          effects: buff.effects,
          stackGroup: buff.stackGroup,
        },
      });
    }
  };

  const cleanupStateAt = (realTime: number, gameTime: number) => {
    advanceEnemyStaggerTo({ time: realTime, gameTime });

    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime,
    );

    runtimeStatuses = runtimeStatuses.filter((status) => {
      if (status.stacks != null && status.stacks <= 0) {
        return false;
      }
      return status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime;
    });

    for (const [slot, window] of activeComboWindowBySlot.entries()) {
      if (window.consumedAt != null || window.expiresAt <= realTime) {
        activeComboWindowBySlot.delete(slot);
      }
    }

    for (const member of party) {
      const slot = member.slot;
      const pending = pendingComboCooldownBySlot.get(slot);
      if (!pending || activeComboWindowBySlot.has(slot)) {
        continue;
      }
      const now = pending.timeScale === "real" ? realTime : gameTime;
      comboCooldownUntilBySlot.set(slot, now + pending.durationSeconds);
      pendingComboCooldownBySlot.delete(slot);
    }
  };

  const emitEvent = (event: RotationCombatEvent) => {
    events.push(event);
    for (const member of party) {
      recordActorState(member.slot, event.time, event.gameTime);
    }
    recordEnemyState(event.time, event.gameTime);
  };

  const gainTeamLinkStacks = (args: {
    stacks: number;
    durationSeconds: number;
    timeScale?: TimeScale;
    time: number;
    gameTime: number;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    stepId?: string;
    label?: string;
  }) => {
    if (args.stacks <= 0 || args.durationSeconds <= 0) {
      return;
    }
    const timeScale = args.timeScale ?? "game";
    const now = timeScale === "real" ? args.time : args.gameTime;
    cleanupStateAt(args.time, args.gameTime);
    const existingLinkStacks = runtimeStatuses.filter((status) =>
      status.scope === "team" && status.kind === "link_status" && status.id === "team_link",
    );
    const available = Math.max(0, 4 - existingLinkStacks.length);
    const toApply = Math.min(available, args.stacks);
    for (let i = 0; i < toApply; i += 1) {
      runtimeStatuses.push({
        id: "team_link",
        label: "Link",
        scope: "team",
        kind: "link_status",
        expiresAt: now + args.durationSeconds,
        timeScale,
        stacks: 1,
      });
    }

    const event: RotationCombatEvent = {
      type: "TEAM_LINK_GAINED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      label: args.label ?? "Link Gained",
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };

  const consumeTeamLinkStacks = (args: { time: number; gameTime: number }) => {
    cleanupStateAt(args.time, args.gameTime);
    const existingLinkStacks = runtimeStatuses.filter((status) =>
      status.scope === "team" && status.kind === "link_status" && status.id === "team_link",
    );
    const consumed = Math.min(4, existingLinkStacks.length);
    runtimeStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "team" && status.kind === "link_status" && status.id === "team_link"),
    );
    return consumed;
  };

  const getLinkBonusForAttackType = (
    linkedStacks: number,
    attackType: ResolvedCommandHitAtLevel["attackType"],
  ) => {
    const clampedStacks = Math.max(0, Math.min(4, linkedStacks));
    if (clampedStacks <= 0) {
      return 0;
    }
    const battleSkillBonusByStack = [0.3, 0.45, 0.6, 0.75];
    const ultimateBonusByStack = [0.2, 0.3, 0.4, 0.5];
    if (attackType === "BATTLE_SKILL") {
      return battleSkillBonusByStack[clampedStacks - 1] ?? 0;
    }
    if (attackType === "ULTIMATE") {
      return ultimateBonusByStack[clampedStacks - 1] ?? 0;
    }
    return 0;
  };

  const gainTeamStatusStacks = (args: {
    statusId: string;
    label: string;
    stacks: number;
    maxStacks?: number;
    refreshExistingStacks?: boolean;
    durationSeconds: number;
    timeScale?: TimeScale;
    time: number;
    gameTime: number;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    stepId?: string;
  }) => {
    if (args.stacks <= 0 || args.durationSeconds <= 0) {
      return 0;
    }
    const timeScale = args.timeScale ?? "game";
    const now = timeScale === "real" ? args.time : args.gameTime;
    cleanupStateAt(args.time, args.gameTime);

    const existingStatuses = runtimeStatuses
      .filter((status) =>
        status.scope === "team"
        && status.kind === "team_status"
        && status.id === args.statusId,
      )
      .sort((left, right) => left.expiresAt - right.expiresAt);
    const existingCount = existingStatuses.length;
    const maxStacks = Math.max(1, args.maxStacks ?? Number.POSITIVE_INFINITY);
    const shouldRefreshExisting = args.refreshExistingStacks ?? true;
    if (shouldRefreshExisting && existingCount > 0) {
      for (const status of existingStatuses) {
        status.label = args.label;
        status.expiresAt = now + args.durationSeconds;
        status.timeScale = timeScale;
      }
    }
    const available = Math.max(0, maxStacks - existingCount);
    const toApply = Math.min(available, args.stacks);
    if (toApply <= 0) {
      if (shouldRefreshExisting && existingCount > 0) {
        const existingStatus = existingStatuses[0];
        if (existingStatus) {
          const refreshEvent: RotationCombatEvent = {
            type: "TEAM_STATUS_GAINED",
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            slot: args.sourceSlot,
            sourceSlot: args.sourceSlot,
            label: args.label,
            stackDelta: 0,
            durationSeconds: args.durationSeconds,
            timeScale,
          };
          emitEvent(refreshEvent);
          dispatchPassiveListeners(refreshEvent);
        }
      }
      return 0;
    }

    for (let i = 0; i < toApply; i += 1) {
      runtimeStatuses.push({
        id: args.statusId,
        label: args.label,
        scope: "team",
        kind: "team_status",
        expiresAt: now + args.durationSeconds,
        timeScale,
        stacks: 1,
      });
    }

    const event: RotationCombatEvent = {
      type: "TEAM_STATUS_GAINED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      label: args.label,
      stackDelta: toApply,
      durationSeconds: args.durationSeconds,
      timeScale,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
    return toApply;
  };

  const consumeTeamStatusStacks = (args: {
    statusId: string;
    stacks: number;
    time: number;
    gameTime: number;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    stepId?: string;
    label?: string;
  }) => {
    cleanupStateAt(args.time, args.gameTime);
    const toConsume = Math.max(0, Math.floor(args.stacks));
    if (toConsume <= 0) {
      return {
        consumed: 0,
        remaining: runtimeStatuses.filter((status) =>
          status.scope === "team" && status.kind === "team_status" && status.id === args.statusId,
        ).length,
      };
    }

    const matching = runtimeStatuses
      .map((status, index) => ({ status, index }))
      .filter((entry) =>
        entry.status.scope === "team"
        && entry.status.kind === "team_status"
        && entry.status.id === args.statusId,
      )
      .sort((left, right) => left.status.expiresAt - right.status.expiresAt);

    const consumed = Math.min(toConsume, matching.length);
    if (consumed <= 0) {
      return { consumed: 0, remaining: matching.length };
    }

    const removeIndices = new Set(matching.slice(0, consumed).map((entry) => entry.index));
    runtimeStatuses = runtimeStatuses.filter((_, index) => !removeIndices.has(index));
    const remaining = runtimeStatuses.filter((status) =>
      status.scope === "team" && status.kind === "team_status" && status.id === args.statusId,
    ).length;

    const event: RotationCombatEvent = {
      type: "TEAM_STATUS_CONSUMED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      label: args.label ?? args.statusId,
      stackDelta: -consumed,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);

    return { consumed, remaining };
  };

  const recordActorState = (slot: CharacterCombatSnapshot["slot"], time: number, gameTime: number) => {
    cleanupStateAt(time, gameTime);
    const teamStatuses = runtimeStatuses
      .filter((status) =>
        status.scope === "team"
        && (status.kind === "link_status" || status.kind === "team_status"),
      )
      .map((status) => ({
        id: status.id,
        label: status.label,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
      }));

    actorStateTimeline.push({
      slot,
      time,
      gameTime,
      currentHp: actorCurrentHpBySlot.get(slot) ?? 0,
      maxHp: actorMaxHpBySlot.get(slot) ?? 0,
      meltingFlameStacks: getMeltingFlameStacks(slot),
      activeBuffs: getActorBuffs()
        .filter((buff) => buff.slot === slot)
        .map((buff) => ({
          id: buff.id,
          label: buff.label,
          slot: buff.slot,
          hidden: buff.hidden,
          timeScale: buff.timeScale,
          appliedAt: buff.appliedAt,
          appliedAtGameTime: buff.appliedAtGameTime,
          expiresAt: buff.expiresAt,
          effects: buff.effects,
        })),
      activeTeamStatuses: teamStatuses,
    });
  };

  const applyResolvedHitHealing = (args: {
    sourceActor: CharacterCombatSnapshot;
    hit: ResolvedCommandHitAtLevel;
    target: "controlled" | "self";
    label?: string;
    time: number;
    gameTime: number;
    stepId: string;
  }): number => {
    const healerMods = getEffectiveActorMods(args.sourceActor, args.time, args.gameTime);
    const scalingBase = args.hit.scalingStat === "WIL"
      ? args.sourceActor.attrs.WIL
      : getEffectiveFinalAtk(args.sourceActor, healerMods);
    const baseAmount = scalingBase * args.hit.multiplier + args.hit.flatAmount;
    if (baseAmount <= 0) {
      return 0;
    }

    const targetSlot = args.target === "self" ? args.sourceActor.slot : controlledOperatorSlot;
    const targetActor = partyBySlot.get(targetSlot);
    if (!targetActor) {
      return 0;
    }
    const targetMods = getEffectiveActorMods(targetActor, args.time, args.gameTime);
    const healing = calculateHealingAmount({
      baseAmount,
      healerMods,
      targetHealingReceivedBonus: targetMods.HEALING_RECEIVED_PCT,
    });
    const currentHp = actorCurrentHpBySlot.get(targetSlot) ?? targetActor.maxHp;
    const maxHp = actorMaxHpBySlot.get(targetSlot) ?? targetActor.maxHp;
    const applied = Math.max(0, Math.min(healing, maxHp - currentHp));
    if (applied > 0) {
      actorCurrentHpBySlot.set(targetSlot, currentHp + applied);
    }
    const healingEvent: RotationCombatEvent = {
      type: "HEALING_HIT_EXECUTED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: targetSlot,
      sourceSlot: args.sourceActor.slot,
      label: args.label ?? "Healing",
      healedAmount: applied,
    };
    emitEvent(healingEvent);
    dispatchPassiveListeners(healingEvent);
    return applied;
  };

  const applyCommandHitHealing = (args: {
    sourceActor: CharacterCombatSnapshot;
    commandId: string;
    hitIndex: number;
    target: "controlled" | "self";
    label?: string;
    time: number;
    gameTime: number;
    stepId: string;
  }): number => {
    const hit = args.sourceActor.commands.find((entry) => entry.id === args.commandId)?.hits[args.hitIndex];
    if (!hit) {
      return 0;
    }
    return applyResolvedHitHealing({
      sourceActor: args.sourceActor,
      hit,
      target: args.target,
      label: args.label,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
    });
  };

  const emitCritThresholdEvent = (args: {
    slot: CharacterCombatSnapshot["slot"];
    sourceSlot: CharacterCombatSnapshot["slot"];
    expectedCritCount: number;
    time: number;
    gameTime: number;
    stepId: string;
    commandId?: string;
    commandName?: string;
    commandAttackType?: RotationCombatEvent["commandAttackType"];
    damageType?: RotationCombatEvent["damageType"];
    triggerSlots?: CharacterCombatSnapshot["slot"][];
    label?: string;
  }) => {
    if (args.expectedCritCount <= 0) {
      return;
    }
    const current = critThresholdProgressBySlot.get(args.slot) ?? 0;
    const next = current + args.expectedCritCount;
    const triggerCount = Math.floor(next);
    critThresholdProgressBySlot.set(args.slot, next - triggerCount);
    if (triggerCount <= 0) {
      return;
    }

    const event: RotationCombatEvent = {
      type: "CRIT_THRESHOLD_REACHED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: args.commandId,
      commandName: args.commandName,
      slot: args.slot,
      sourceSlot: args.sourceSlot,
      label: args.label ?? "Crit Threshold Reached",
      amount: triggerCount,
      commandAttackType: args.commandAttackType,
      damageType: args.damageType,
    };
    emitEvent(event);
    dispatchPassiveListeners(event, args.triggerSlots);
  };

  const recordEnemyState = (time: number, gameTime: number) => {
    cleanupStateAt(time, gameTime);
    const currentDamageTaken = timeline
      .filter((entry) => entry.time <= time)
      .reduce((sum, entry) => sum + entry.damage, 0);

    enemyStateTimeline.push({
      time,
      gameTime,
      currentDamageTaken,
      currentStagger: enemyCurrentStaggerForEvents,
      isStaggered: enemyIsStaggeredForEvents,
      activeDebuffs: timedEnemyDebuffs.map((debuff) => ({
        label: debuff.label,
        stat: debuff.stat,
        value: debuff.value,
        expiresAt: debuff.expiresAt,
        timeScale: debuff.timeScale,
      })),
      activeStatuses: getEnemyStatuses().map((status) => ({
        id: status.id,
        label: status.label,
        stacks: status.level,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
      })).concat(
        (() => {
          const vulnerability = getEnemyPhysicalInfliction();
          if (!vulnerability) {
            return [];
          }
          return [{
            id: VULNERABILITY_STATUS_ID,
            label: "Vulnerability",
            stacks: vulnerability.stacks,
            expiresAt: vulnerability.expiresAtGameTime,
            timeScale: "game" as const,
          }];
        })(),
        getEffectStatuses()
          .filter((status) => status.target !== "self")
          .map((status) => ({
          id: status.id,
          label: status.label,
          stacks: undefined,
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
        })),
      ),
      artsInfliction: getEnemyArtsInfliction(),
    });
  };

  const triggerComboIfAvailable = (args: {
    slot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    sourceStepId: string;
    sourceEventType: RotationCombatEvent["type"];
    label: string;
    comboCommandId?: string;
  }): boolean => {
    const actor = partyBySlot.get(args.slot);
    const comboCommand = getComboCommandById(actor, args.comboCommandId);
    const baseDebugEntry: Omit<ComboTriggerDebugEntry, "triggered" | "blockReason"> = {
      time: args.time,
      gameTime: args.gameTime,
      slot: args.slot,
      characterId: actor?.characterId,
      characterName: actor?.characterName,
      sourceStepId: args.sourceStepId,
      sourceEventType: args.sourceEventType,
      label: args.label,
      comboCommandId: comboCommand?.id,
      cooldownOwnerCommandId: comboCommand?.comboCooldownOwnerCommandId ?? comboCommand?.id,
      hasActiveComboWindow: activeComboWindowBySlot.has(args.slot),
      hasPendingCooldown: pendingComboCooldownBySlot.has(args.slot),
      currentTime: args.time,
      cooldownUntil: comboCooldownUntilBySlot.get(args.slot) ?? 0,
      comboTimeScale: comboCommand?.comboCooldownTimeScale ?? "real",
    };
    if (!actor || !comboCommand) {
      comboTriggerDebug.push({
        ...baseDebugEntry,
        triggered: false,
        blockReason: "MISSING_ACTOR_OR_COMBO_COMMAND",
      });
      return false;
    }

    cleanupStateAt(args.time, args.gameTime);

    if (activeComboWindowBySlot.has(args.slot)) {
      comboTriggerDebug.push({
        ...baseDebugEntry,
        currentTime: comboCommand.comboCooldownTimeScale === "real" ? args.time : args.gameTime,
        comboTimeScale: comboCommand.comboCooldownTimeScale,
        hasActiveComboWindow: true,
        triggered: false,
        blockReason: "ACTIVE_COMBO_WINDOW_EXISTS",
      });
      return false;
    }

    const cooldownOwnerId = comboCommand.comboCooldownOwnerCommandId ?? comboCommand.id;
    const cooldownOwnerCommand = getComboCommandById(actor, cooldownOwnerId);
    const cooldownUntil = comboCooldownUntilBySlot.get(args.slot) ?? 0;
    const pendingCooldown = pendingComboCooldownBySlot.get(args.slot);
    const currentTime =
      (cooldownOwnerCommand?.comboCooldownTimeScale ?? comboCommand.comboCooldownTimeScale) === "real"
        ? args.time
        : args.gameTime;

    if (
      comboCommand.id === cooldownOwnerId
      && (pendingCooldown != null || currentTime < cooldownUntil)
    ) {
      comboTriggerDebug.push({
        ...baseDebugEntry,
        currentTime,
        cooldownUntil,
        hasPendingCooldown: pendingCooldown != null,
        comboTimeScale: comboCommand.comboCooldownTimeScale,
        triggered: false,
        blockReason: "COMBO_ON_COOLDOWN",
      });
      return false;
    }

    const readyAt = args.time + Math.max(0, comboCommand.comboWindowDelaySeconds);
    const windowDuration = Math.max(0, comboCommand.comboWindowDurationSeconds || COMBO_READY_TIMEOUT_SECONDS);
    const perfectTimingDelaySeconds = Math.max(
      0,
      comboCommand.perfectTimingDelaySeconds
      || (comboCommand.id !== cooldownOwnerId ? comboCommand.comboWindowDelaySeconds : 0),
    );
    const perfectTimingDurationSeconds = Math.max(
      0,
      comboCommand.perfectTimingDurationSeconds
      || (comboCommand.id !== cooldownOwnerId ? comboCommand.comboWindowDurationSeconds : 0),
    );
    const perfectTimingStartAt = perfectTimingDurationSeconds > 0
      ? args.time + perfectTimingDelaySeconds
      : undefined;
    const perfectTimingEndAt = perfectTimingStartAt != null
      ? perfectTimingStartAt + perfectTimingDurationSeconds
      : undefined;
    const window: ComboTriggerWindow = {
      slot: args.slot,
      commandId: comboCommand.id,
      readyAt,
      expiresAt: readyAt + windowDuration,
      perfectTimingStartAt,
      perfectTimingEndAt,
      sourceStepId: args.sourceStepId,
      sourceEventType: args.sourceEventType,
    };

    comboWindows.push(window);
    activeComboWindowBySlot.set(args.slot, window);
    emitEvent({
      type: "COMBO_TRIGGERED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.sourceStepId,
      slot: args.slot,
      target: "enemy",
      label: args.label,
      triggeredSlot: args.slot,
    });
    comboTriggerDebug.push({
      ...baseDebugEntry,
      currentTime,
      cooldownUntil,
      hasPendingCooldown: pendingCooldown != null,
      hasActiveComboWindow: false,
      comboTimeScale: comboCommand.comboCooldownTimeScale,
      readyAt: window.readyAt,
      expiresAt: window.expiresAt,
      triggered: true,
    });

    return true;
  };

  const applyActorBuff = (args: {
    slot: CharacterCombatSnapshot["slot"];
    sourceSlot?: CharacterCombatSnapshot["slot"];
    stepId: string;
    time: number;
    gameTime: number;
    buffId: string;
    label: string;
    hidden?: boolean;
    durationSeconds: number;
    infiniteDuration?: boolean;
    timeScale: TimeScale;
    effects?: Partial<ModifierStats>;
    stackGroup?: string;
    maxStacks?: number;
    refreshExistingStacks?: boolean;
    eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
  }) => {
    let actorBuffs = getActorBuffs();
    const shouldRefreshExisting = args.refreshExistingStacks ?? true;
    const resolvedExpiresAt = args.infiniteDuration
      ? Number.POSITIVE_INFINITY
      : (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds;
    if (args.stackGroup) {
      const existingStacks = actorBuffs
        .filter((buff) => buff.slot === args.slot && buff.stackGroup === args.stackGroup)
        .sort((left, right) => left.appliedAt - right.appliedAt);
      if (shouldRefreshExisting) {
        const refreshedExpiresAt = resolvedExpiresAt;
        for (const existingStack of existingStacks) {
          existingStack.label = args.label;
          existingStack.hidden = args.hidden;
          existingStack.effects = args.effects ?? existingStack.effects;
          existingStack.expiresAt = refreshedExpiresAt;
          existingStack.timeScale = args.timeScale;
        }
      }
      const keepCount = Math.max(0, (args.maxStacks ?? 1) - 1);
      const stacksToKeep = new Set(existingStacks.slice(-keepCount).map((buff) => buff.id));
      actorBuffs = actorBuffs.filter((buff) =>
        !(buff.slot === args.slot && buff.stackGroup === args.stackGroup && !stacksToKeep.has(buff.id)),
      );
    } else {
      actorBuffs = actorBuffs.filter((buff) => !(buff.slot === args.slot && buff.id === args.buffId));
    }

    actorBuffs.push({
      id: args.stackGroup ? `${args.buffId}:${args.time.toFixed(3)}:${actorBuffs.length}` : args.buffId,
      label: args.label,
      slot: args.slot,
      hidden: args.hidden,
      appliedAt: args.time,
      appliedAtGameTime: args.gameTime,
      expiresAt: resolvedExpiresAt,
      timeScale: args.timeScale,
      effects: args.effects ?? {},
      stackGroup: args.stackGroup,
    });
    setActorBuffs(actorBuffs);

    const event: RotationCombatEvent = {
      type: args.eventType ?? "ACTOR_BUFF_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.slot,
      sourceSlot: args.sourceSlot ?? args.slot,
      label: args.label,
      buffId: args.buffId,
      durationSeconds: args.infiniteDuration ? undefined : args.durationSeconds,
      timeScale: args.timeScale,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };

  const removeActorBuff = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
  }) => {
    setActorBuffs(getActorBuffs().filter((buff) =>
      !(buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`))),
    ));
  };

  const getActorBuffStackCount = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
  }) =>
    getActorBuffs().filter((buff) =>
      buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`)),
    ).length;

  const removeActorBuffStacks = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
    stacks: number;
  }) => {
    const toRemove = Math.max(1, Math.floor(args.stacks));
    const actorBuffs = getActorBuffs();
    const matchingBuffs = actorBuffs
      .filter((buff) =>
        buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`)),
      )
      .sort((left, right) => right.appliedAt - left.appliedAt);

    if (matchingBuffs.length <= 0) {
      return;
    }

    const removeIds = new Set(matchingBuffs.slice(0, toRemove).map((buff) => buff.id));
    setActorBuffs(actorBuffs.filter((buff) => !(buff.slot === args.slot && removeIds.has(buff.id))));
  };

  const removeEnemyStatus = (args: {
    statusId: string;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
  }) => {
    const enemyStatuses = getEnemyStatuses();
    const matchingStatuses = enemyStatuses.filter((status) => status.id === args.statusId);
    const hadStatus = matchingStatuses.length > 0;
    if (!hadStatus) {
      return;
    }
    setEnemyStatuses(enemyStatuses.filter((status) => status.id !== args.statusId));
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== args.statusId);

    if (
      args.statusId === "combustion"
      || args.statusId === "corrosion"
      || args.statusId === "solidification"
      || args.statusId === "electrification"
    ) {
      const reactionName = args.statusId === "combustion"
        ? "Combustion"
        : args.statusId === "corrosion"
          ? "Corrosion"
          : args.statusId === "solidification"
            ? "Solidification"
            : "Electrification";
      const consumedElement = args.statusId === "combustion"
        ? "Heat"
        : args.statusId === "corrosion"
          ? "Nature"
          : args.statusId === "solidification"
            ? "Cryo"
            : "Electric";
      const event: RotationCombatEvent = {
        type: "ARTS_REACTION_CONSUMED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: `${reactionName} Consumed Arts Reaction`,
        consumedElement,
        consumedStacks: Math.max(1, matchingStatuses[0]?.level ?? 1),
      };
      emitEvent(event);
      dispatchPassiveListeners(event);
    }
  };

  const applyEnemyBuff = (args: {
    buffId: string;
    label: string;
    effects: Partial<ModifierStats>;
    durationSeconds: number;
    timeScale: TimeScale;
    time: number;
    gameTime: number;
    stepId?: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
  }) => {
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== args.buffId);
    runtimeStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy" && status.id === args.buffId),
    );
    runtimeStatuses.push({
      id: args.buffId,
      label: args.label,
      scope: "enemy",
      kind: ENEMY_STATUS_KIND,
      expiresAt: (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds,
      timeScale: args.timeScale,
      ownerSlot: args.sourceSlot,
      metadata: {
        sourceStepId: args.stepId,
      },
    });
    for (const [statKey, value] of Object.entries(args.effects)) {
      if (value == null || value === 0) {
        continue;
      }
      const stat = statKey as ModifierStatKey;
      timedEnemyDebuffs.push({
        id: `${args.buffId}:${stat}`,
        buffId: args.buffId,
        label: args.label,
        stat,
        value,
        expiresAt: (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds,
        timeScale: args.timeScale,
      });

      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: args.label,
        debuffStat: stat,
        durationSeconds: args.durationSeconds,
        timeScale: args.timeScale,
      };
      emitEvent(event);
      dispatchPassiveListeners(event);
    }
  };

  const applyEnemyDebuff = (args: {
    debuffId: string;
    label: string;
    stat: ModifierStatKey;
    value: number;
    durationSeconds: number;
    timeScale: TimeScale;
    time: number;
    gameTime: number;
    stepId?: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
  }) => {
    applyEnemyBuff({
      buffId: args.debuffId,
      label: args.label,
      effects: { [args.stat]: args.value },
      durationSeconds: args.durationSeconds,
      timeScale: args.timeScale,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      sourceSlot: args.sourceSlot,
    });
  };

  const dispatchPassiveListeners = (
    event: RotationCombatEvent,
    triggerSlots?: CharacterCombatSnapshot["slot"][],
  ) => {
    for (const member of party) {
      const combatHooks = member.combatHooks;
      combatHooks?.onEvent?.({
        self: {
          slot: member.slot,
          characterId: member.characterId,
          characterName: member.characterName,
        },
        event: {
          type: event.type,
          time: event.time,
          gameTime: event.gameTime,
          stepId: event.stepId,
          commandId: event.commandId,
          commandName: event.commandName,
          slot: event.slot,
          sourceSlot: event.sourceSlot,
          label: event.label,
          commandAttackType: event.commandAttackType,
          consumedElement: event.consumedElement,
          consumedStacks: event.consumedStacks,
        },
        state: {
          getEnemyArtsInfliction: () => getEnemyArtsInfliction(),
          hasSelfBuff: (buffId: string) =>
            getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            ),
          isSelfUniqueTalentEnabled: (key: string) =>
            isUniqueTalentEnabled(key, {
              ascensionStage: member.ascensionStage,
              uniqueTalentToggles: member.uniqueTalentToggles,
              uniqueTalentConditions: member.uniqueTalentConditions,
              uniqueTalentDefaults: member.uniqueTalentDefaults,
            }),
          isSelfPotentialActive: (level: number) => member.potentialLevel >= level,
          getSelfCommandHit: (commandId: string, hitIndex: number) => {
            const command = member.commands.find((entry) => entry.id === commandId);
            return command?.hits[hitIndex] ?? null;
          },
          applySelfBuff: (args) => {
            applyActorBuff({
              slot: member.slot,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
              time: event.time,
              gameTime: event.gameTime,
              buffId: args.buffId,
              label: args.label,
              hidden: args.hidden,
              durationSeconds: args.durationSeconds,
              infiniteDuration: args.infiniteDuration,
              timeScale: args.timeScale ?? "game",
              effects: args.effects,
              stackGroup: args.stackGroup,
              maxStacks: args.maxStacks,
              refreshExistingStacks: args.refreshExistingStacks,
            });
          },
          applyOtherTeammatesBuff: (args) => {
            for (const teammate of party) {
              if (teammate.slot === member.slot) {
                continue;
              }
              if (args.classes && args.classes.length > 0 && !args.classes.includes(teammate.characterClass)) {
                continue;
              }
              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: event.stepId ?? "",
                time: event.time,
                gameTime: event.gameTime,
                buffId: args.buffId,
                label: args.label,
                hidden: args.hidden,
                durationSeconds: args.durationSeconds,
                infiniteDuration: args.infiniteDuration,
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
                refreshExistingStacks: args.refreshExistingStacks,
              });
            }
          },
          gainTeamLinkStacks: (args) => {
            gainTeamLinkStacks({
              stacks: args.stacks,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale ?? "game",
              time: event.time,
              gameTime: event.gameTime,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
              label: args.label,
            });
          },
          gainTeamStatusStacks: (args) =>
            gainTeamStatusStacks({
              statusId: args.statusId,
              label: args.label,
              stacks: args.stacks,
              maxStacks: args.maxStacks,
              refreshExistingStacks: args.refreshExistingStacks,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale ?? "game",
              time: event.time,
              gameTime: event.gameTime,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
            }),
          consumeTeamStatusStacks: (args) =>
            consumeTeamStatusStacks({
              statusId: args.statusId,
              stacks: args.stacks,
              time: event.time,
              gameTime: event.gameTime,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
            }),
          getTeamStatusStackCount: (statusId: string) =>
            runtimeStatuses.filter((status) =>
              status.scope === "team" && status.kind === "team_status" && status.id === statusId,
            ).length,
          applyCommandHitHealing: (args) =>
            applyCommandHitHealing({
              sourceActor: member,
              commandId: args.commandId,
              hitIndex: args.hitIndex,
              target: args.target ?? "controlled",
              label: args.label,
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId ?? "",
            }),
          markTriggerOnce: (key: string) => {
            const onceKey = `event:${member.slot}:${key}`;
            if (setTriggerFlags.has(onceKey)) {
              return false;
            }
            setTriggerFlags.add(onceKey);
            return true;
          },
          triggerSelfCombo: (args) => {
            const triggered = triggerComboIfAvailable({
              slot: member.slot,
              time: event.time,
              gameTime: event.gameTime,
              sourceStepId: event.stepId ?? "",
              sourceEventType: (args?.sourceEventType as RotationCombatEvent["type"]) ?? event.type,
              label: args?.label ?? `${member.characterName} Combo Triggered`,
              comboCommandId: args?.comboCommandId,
            });
            if (triggered && triggerSlots && !triggerSlots.includes(member.slot)) {
              triggerSlots.push(member.slot);
            }
            return triggered;
          },
          resetSelfComboCooldown: () => {
            const comboCommand = getComboCommand(member);
            if (!comboCommand) {
              return;
            }
            pendingComboCooldownBySlot.delete(member.slot);
            comboCooldownUntilBySlot.set(
              member.slot,
              comboCommand.comboCooldownTimeScale === "real" ? event.time : event.gameTime,
            );
          },
          hasStatus: (hookArgs) =>
            hasUnifiedStatus({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              realTime: event.time,
              gameTime: event.gameTime,
            }),
          emitEvent: (hookArgs) => {
            emitEvent({
              type: hookArgs.type as RotationCombatEvent["type"],
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              target: hookArgs.target,
              label: hookArgs.label,
              stackDelta: hookArgs.stackDelta,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale,
            });
          },
          applyEffects: (hookArgs) => {
            applyHitEffects({
              effects: hookArgs.effects,
              time: event.time,
              gameTime: event.gameTime,
              stepId: hookArgs.stepId ?? event.stepId ?? "",
              actor: member,
              triggerSlots: [],
              sourceCommandId: event.commandId,
              sourceCommandName: event.commandName,
            });
          },
        },
      });

      runGearSetEventListener({
        wearer: member,
        event,
        helpers: {
          applySelfBuff: (args) => {
            applyActorBuff({
              slot: member.slot,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
              time: event.time,
              gameTime: event.gameTime,
              buffId: args.buffId,
              label: args.label,
              hidden: args.hidden,
              durationSeconds: args.durationSeconds,
              infiniteDuration: args.infiniteDuration,
              timeScale: args.timeScale ?? "game",
              effects: args.effects,
              stackGroup: args.stackGroup,
              maxStacks: args.maxStacks,
              refreshExistingStacks: args.refreshExistingStacks,
              eventType: args.eventType,
            });
          },
          applyOtherTeammatesBuff: (args) => {
            for (const teammate of party) {
              if (teammate.slot === member.slot) {
                continue;
              }

              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: event.stepId ?? "",
                time: event.time,
                gameTime: event.gameTime,
                buffId: args.buffId,
                label: args.label,
                durationSeconds: args.durationSeconds,
                infiniteDuration: args.infiniteDuration,
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
                refreshExistingStacks: args.refreshExistingStacks,
                eventType: args.eventType,
              });
            }
          },
          grantReturnedSp: (args) => {
            if (args.onceKey && setTriggerFlags.has(args.onceKey)) {
              return;
            }
            if (args.onceKey) {
              setTriggerFlags.add(args.onceKey);
            }
            emitEvent({
              type: "SP_RETURNED",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label: args.label,
              amount: args.amount,
            });
          },
          markOnce: (onceKey: string) => {
            if (setTriggerFlags.has(onceKey)) {
              return false;
            }
            setTriggerFlags.add(onceKey);
            return true;
          },
          hasSelfBuff: (buffId: string) =>
            getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            ),
          removeSelfBuff: (buffId: string) => {
            removeActorBuff({
              slot: member.slot,
              buffId,
            });
          },
          getSelfBuffStackCount: (buffId: string) =>
            getActorBuffStackCount({
              slot: member.slot,
              buffId,
            }),
          consumeThreshold: ({ key, amount, threshold = 1 }) => {
            const current = listenerCounters.get(key) ?? 0;
            const next = current + amount;
            const triggerCount = Math.floor(next / threshold);
            listenerCounters.set(key, next - triggerCount * threshold);
            return triggerCount;
          },
          applyEffects: (args) => {
            applyHitEffects({
              effects: args.effects,
              time: event.time,
              gameTime: event.gameTime,
              stepId: args.stepId ?? event.stepId ?? "",
              actor: member,
              triggerSlots: [],
            });
          },
        },
      });

      runWeaponEventListener({
        wearer: member,
        event,
        helpers: {
          applySelfBuff: (args) => {
            applyActorBuff({
              slot: member.slot,
              sourceSlot: member.slot,
              stepId: event.stepId ?? "",
              time: event.time,
              gameTime: event.gameTime,
              buffId: args.buffId,
              label: args.label,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale ?? "game",
              effects: args.effects,
              stackGroup: args.stackGroup,
              maxStacks: args.maxStacks,
              refreshExistingStacks: args.refreshExistingStacks,
              eventType: args.eventType,
            });
          },
          applyTeamBuff: (args) => {
            for (const teammate of party) {
              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: event.stepId ?? "",
                time: event.time,
                gameTime: event.gameTime,
                buffId: args.buffId,
                label: args.label,
                durationSeconds: args.durationSeconds,
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
                refreshExistingStacks: args.refreshExistingStacks,
                eventType: args.eventType,
              });
            }
          },
          applyTeamBuffFiltered: (args) => {
            for (const teammate of party) {
              if (!args.shouldApplyTo(teammate)) {
                continue;
              }
              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: event.stepId ?? "",
                time: event.time,
                gameTime: event.gameTime,
                buffId: args.buffId,
                label: args.label,
                durationSeconds: args.durationSeconds,
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
                refreshExistingStacks: args.refreshExistingStacks,
                eventType: args.eventType,
              });
            }
          },
          applyEnemyDebuff: (args) => {
            applyEnemyDebuff({
              debuffId: args.debuffId,
              label: args.label,
              stat: args.stat,
              value: args.value,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale ?? "game",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              sourceSlot: member.slot,
            });
          },
          applyEnemyBuff: (args) => {
            applyEnemyBuff({
              buffId: args.buffId,
              label: args.label,
              effects: args.effects,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale ?? "game",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              sourceSlot: member.slot,
            });
          },
          markOnce: (onceKey: string) => {
            if (setTriggerFlags.has(onceKey)) {
              return false;
            }
            setTriggerFlags.add(onceKey);
            return true;
          },
          tryActivateCooldown: ({ key, durationSeconds, timeScale = "game" }) => {
            const active = listenerCooldowns.get(key);
            const currentTime = timeScale === "real" ? event.time : event.gameTime;
            if (active && active.timeScale === timeScale && currentTime < active.expiresAt - 0.0001) {
              return false;
            }
            listenerCooldowns.set(key, {
              expiresAt: currentTime + durationSeconds,
              timeScale,
            });
            return true;
          },
          consumeThreshold: ({ key, amount, threshold = 1 }) => {
            const current = listenerCounters.get(key) ?? 0;
            const next = current + amount;
            const triggerCount = Math.floor(next / threshold);
            listenerCounters.set(key, next - triggerCount * threshold);
            return triggerCount;
          },
          getSelfBuffStackCount: (buffId: string) =>
            getActorBuffStackCount({
              slot: member.slot,
              buffId,
            }),
        },
      });
    }
  };

  const gainMeltingFlameStacks = (args: {
    slot: CharacterCombatSnapshot["slot"];
    stacks: number;
    time: number;
    gameTime: number;
    stepId: string;
    label?: string;
  }) => {
    if (args.stacks <= 0) {
      return;
    }

    const currentStacks = getMeltingFlameStacks(args.slot);
    const nextStacks = Math.min(4, currentStacks + args.stacks);
    const gainedStacks = nextStacks - currentStacks;
    if (gainedStacks <= 0) {
      return;
    }

    setMeltingFlameStacks(args.slot, nextStacks);

    emitEvent({
      type: "MELTING_FLAME_GAINED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.slot,
      target: "enemy",
      label: args.label ?? `Melting Flame +${gainedStacks}`,
      stackDelta: gainedStacks,
    });

    if (nextStacks >= 4) {
      const event: RotationCombatEvent = {
        type: "MELTING_FLAME_FULL",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.slot,
        sourceSlot: args.slot,
        label: "Scorching Heart",
      };
      emitEvent(event);
      dispatchPassiveListeners(event);
    }
  };

  const consumeMeltingFlameStacks = (args: {
    slot: CharacterCombatSnapshot["slot"];
    stacks: number;
    time: number;
    gameTime: number;
    stepId: string;
    label?: string;
  }) => {
    const currentStacks = getMeltingFlameStacks(args.slot);
    const consumedStacks = Math.min(currentStacks, Math.max(0, args.stacks));
    if (consumedStacks <= 0) {
      return;
    }

    setMeltingFlameStacks(args.slot, currentStacks - consumedStacks);
    emitEvent({
      type: "MELTING_FLAME_CONSUMED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.slot,
      label: args.label ?? `Melting Flame -${consumedStacks}`,
      stackDelta: -consumedStacks,
    });
  };

  const isSelfUniqueTalentEnabled = (actor: CharacterCombatSnapshot, key: string) =>
    actor.uniqueTalentToggles[key] === true || actor.uniqueTalentDefaults?.[key] === true;

  const getEffectiveActorMods = (actor: CharacterCombatSnapshot, realTime: number, gameTime: number) => {
    cleanupStateAt(realTime, gameTime);

    let effective = getActorBuffs()
      .filter((buff) => buff.slot === actor.slot)
      .reduce((mods, buff) => addModifierDelta(mods, buff.effects), actor.mods);

    for (const conditional of actor.conditionalModifiers) {
      const requiresEnabled = conditional.condition.requiresUniqueTalentsEnabled ?? [];
      if (requiresEnabled.some((key) => !isSelfUniqueTalentEnabled(actor, key))) {
        continue;
      }
      const requiresDisabled = conditional.condition.requiresUniqueTalentsDisabled ?? [];
      if (requiresDisabled.some((key) => isSelfUniqueTalentEnabled(actor, key))) {
        continue;
      }

      if (
        (conditional.condition.enemyStatusIdsAny?.length ?? 0) > 0
        && !conditional.condition.enemyStatusIdsAny!.some((statusId) =>
          hasUnifiedStatus({
            statusId,
            target: "enemy",
            realTime,
            gameTime,
          }),
        )
      ) {
        continue;
      }

      if (
        (conditional.condition.enemyStatusIdsNone?.length ?? 0) > 0
        && conditional.condition.enemyStatusIdsNone!.some((statusId) =>
          hasUnifiedStatus({
            statusId,
            target: "enemy",
            realTime,
            gameTime,
          }),
        )
      ) {
        continue;
      }

      if (
        (conditional.condition.enemyInflictionElementsAny?.length ?? 0) > 0
        && (() => {
          const enemyInfliction = getEnemyArtsInfliction();
          return !(
            enemyInfliction
            && conditional.condition.enemyInflictionElementsAny!.includes(enemyInfliction.element)
          );
        })()
      ) {
        continue;
      }

      effective = addModifierDelta(effective, conditional.effects);
    }

    return effective;
  };

  const getEffectiveFinalAtk = (actor: CharacterCombatSnapshot, mods: ModifierStats) => {
    const rawAtk = actor.baseAtk + actor.weaponAtk;
    const modAtk = rawAtk * (mods.ATK_PCT ?? 0);
    const flatAtk = mods.FLAT_ATK ?? 0;
    return Math.floor((rawAtk + modAtk + flatAtk) * (1 + actor.attributeBonus));
  };

  const getEffectiveEnemyMods = (_actor: CharacterCombatSnapshot, realTime: number, gameTime: number) => {
    cleanupStateAt(realTime, gameTime);

    return timedEnemyDebuffs.reduce(
      (mods, debuff) => addModifierDelta(mods, { [debuff.stat]: debuff.value }),
      { ...enemyMods },
    );
  };

  const hasEnemyVulnerability = () =>
    (getEnemyPhysicalInfliction()?.stacks ?? 0) > 0;

  const getReactionDamageType = (reaction: ArtsReactionKind): Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature"> => {
    switch (reaction) {
      case "Combustion":
        return "Heat";
      case "Corrosion":
        return "Nature";
      case "Solidification":
        return "Cryo";
      case "Electrification":
        return "Electric";
      default:
        return "Heat";
    }
  };

  const getReactionBaseAmount = (level: number) => {
    const clampedLevel = Math.max(1, Math.min(4, Math.floor(level)));
    const table = [0.12, 0.16, 0.2, 0.24];
    return table[clampedLevel - 1] ?? table[0]!;
  };

  const getReactionDefaultDurationSeconds = (reaction: ArtsReactionKind, level: number) => {
    const clampedLevel = Math.max(1, Math.min(4, Math.floor(level)));
    if (reaction === "Electrification") {
      const table = [12, 18, 24, 30];
      return table[clampedLevel - 1] ?? table[0]!;
    }
    if (reaction === "Solidification") {
      const table = [6, 7, 8, 9];
      return table[clampedLevel - 1] ?? table[0]!;
    }
    if (reaction === "Corrosion") {
      return 15;
    }
    return ARTS_INFLICTION_DURATION_SECONDS;
  };

  const getReactionScaledAmount = (sourceSlot: CharacterCombatSnapshot["slot"], baseAmount: number, time: number, gameTime: number) => {
    const actor = partyBySlot.get(sourceSlot);
    if (!actor) {
      return 0;
    }
    const artsIntensity = Math.max(0, getEffectiveActorMods(actor, time, gameTime).ARTS_INTENSITY);
    const scaling = (2 * artsIntensity) / (artsIntensity + 300);
    return baseAmount * (1 + scaling);
  };

  const setReactionDebuff = (args: {
    buffId: string;
    label: string;
    effects: Partial<ModifierStats>;
    expiresAt: number;
    timeScale: TimeScale;
  }) => {
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== args.buffId);
    for (const [statKey, value] of Object.entries(args.effects)) {
      if (value == null || value === 0) {
        continue;
      }
      timedEnemyDebuffs.push({
        id: `${args.buffId}:${statKey}`,
        buffId: args.buffId,
        label: args.label,
        stat: statKey as ModifierStatKey,
        value,
        expiresAt: args.expiresAt,
        timeScale: args.timeScale,
      });
    }
  };

  const applyCorrosionDebuffFromStatus = (status: TimedEnemyStatus) => {
    const reduction = Math.max(0, status.currentReduction ?? 0);
    setReactionDebuff({
      buffId: "corrosion",
      label: status.label,
      effects: {
        PHYSICAL_RESIST_PCT: -reduction,
        HEAT_RESIST_PCT: -reduction,
        CRYO_RESIST_PCT: -reduction,
        ELECTRIC_RESIST_PCT: -reduction,
        NATURE_RESIST_PCT: -reduction,
        AETHER_RESIST_PCT: -reduction,
      },
      expiresAt: status.expiresAt,
      timeScale: status.timeScale,
    });
  };

  const pushReactionDamageHit = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    reactionName: string;
    hitName: string;
    damageType: Extract<ElementType, "Physical" | "Heat" | "Cryo" | "Electric" | "Nature">;
    baseMultiplier: number;
    time: number;
    gameTime: number;
    stepId: string;
    commandId: string;
    commandName?: string;
    reactionCategory?: "arts" | "physical";
    linkSourceStepId?: string;
    stagger?: number;
    noCrit?: boolean;
  }) => {
    if (
      isEnemyHitBlocked({
        sourceSlot: args.sourceSlot,
        stepId: args.stepId,
        commandId: args.commandId,
        time: args.time,
        gameTime: args.gameTime,
      })
    ) {
      return;
    }
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }

    const triggeredComboSlots: CharacterCombatSnapshot["slot"][] = [];
    const effectiveEnemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime);
    const effectiveActorMods = getEffectiveActorMods(actor, args.time, args.gameTime);
    const effectiveFinalAtk = getEffectiveFinalAtk(actor, effectiveActorMods);
    const damageBreakdown = calculateReactionDamage({
      finalAtk: effectiveFinalAtk,
      damageType: args.damageType,
      baseMultiplier: args.baseMultiplier,
      attackerMods: effectiveActorMods,
      enemyMods: effectiveEnemyMods,
      enemyStats,
      applierLevel: actor.level,
      reactionCategory: args.reactionCategory ?? "arts",
      noCrit: args.noCrit,
    });
    const linkedStacks = args.linkSourceStepId
      ? (commandLinkedStacksByStepId.get(args.linkSourceStepId) ?? 0)
      : 0;
    const linkMultiplier = getLinkBonusForAttackType(linkedStacks, "REACTION");
    advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
    const isEnemyStaggered = enemyIsStaggeredForEvents;
    const staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
    const noCritDamage = damageBreakdown.noCritDamage * (1 + linkMultiplier) * staggeredMultiplier;
    const critDamage = damageBreakdown.critDamage * (1 + linkMultiplier) * staggeredMultiplier;
    const averageDamage = damageBreakdown.averageDamage * (1 + linkMultiplier) * staggeredMultiplier;
    const appliedStagger = applyEnemyStaggerFromHit({
      rawStagger: args.stagger ?? 0,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      sourceSlot: args.sourceSlot,
      triggerSlots: triggeredComboSlots,
    });

    timeline.push({
      time: args.time,
      gameTime: args.gameTime,
      registerTime: args.time,
      registerGameTime: args.gameTime,
      stepId: args.stepId,
      slot: actor.slot,
      characterName: actor.characterName,
      commandId: args.commandId,
      commandName: args.commandName ?? args.reactionName,
      hitIndex: 0,
      hitName: args.hitName,
      damageType: args.damageType,
      multiplier: args.baseMultiplier,
      noCritDamage,
      critDamage,
      damage: averageDamage,
      stagger: appliedStagger,
      spGenerated: 0,
      spReturned: 0,
      energyReturn: 0,
      requiresControlledOperator: false,
      triggeredComboSlots,
      calculationContext: {
        finalAtk: effectiveFinalAtk,
        attackType: "REACTION",
        attackerMods: { ...effectiveActorMods },
        enemyMods: { ...effectiveEnemyMods },
        enemyDef: enemyStats.def,
        hitTimes: 1,
        linkMultiplier,
        reactionBaseMultiplier: args.baseMultiplier,
        applierLevel: actor.level,
        isPhysicalReaction: (args.reactionCategory ?? "arts") === "physical",
        staggeredMultiplier,
        finisherBonusMultiplier: 1,
        totalEnemyMultiplier: staggeredMultiplier,
      },
    });

    totalDamage += averageDamage;
    damageBySlot.set(actor.slot, (damageBySlot.get(actor.slot) ?? 0) + averageDamage);

    emitCritThresholdEvent({
      slot: actor.slot,
      sourceSlot: actor.slot,
      expectedCritCount: args.noCrit ? 0 : Math.max(0, effectiveActorMods.CRIT_RATE_PCT),
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: args.commandId,
      commandName: args.commandName,
      commandAttackType: "REACTION",
      damageType: args.damageType,
      label: `${args.reactionName} Crit Threshold`,
    });
  };

  const pushResolvedTimelineHit = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId: string;
    commandId: string;
    commandName: string;
    hitIndex: number;
    hit: ResolvedCommandHitAtLevel;
    hitName?: string;
    time: number;
    gameTime: number;
    registerTime?: number;
    registerGameTime?: number;
    linkSourceStepId?: string;
    applySourceCommandModifiers?: boolean;
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }) => {
    if (
      args.hit.damageType !== "Healing"
      && isEnemyHitBlocked({
        sourceSlot: args.sourceSlot,
        stepId: args.stepId,
        commandId: args.commandId,
        time: args.time,
        gameTime: args.gameTime,
      })
    ) {
      return;
    }
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }

    const triggeredComboSlots = args.triggerSlots ?? [];
    const effectiveEnemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime);
    const sourceCommand = actor.commands.find((command) => command.id === args.commandId);
    const baseActorMods = getEffectiveActorMods(actor, args.time, args.gameTime);
    const effectiveActorMods = args.applySourceCommandModifiers === false
      ? baseActorMods
      : addModifierDelta(baseActorMods, sourceCommand?.commandModifiers ?? {});
    const effectiveFinalAtk = getEffectiveFinalAtk(actor, effectiveActorMods);
    const damageBreakdown = calculateResolvedHitDamage({
      finalAtk: effectiveFinalAtk,
      attackType: args.hit.attackType,
      basicAttackVariant: sourceCommand?.basicAttackVariant,
      damageType: args.hit.damageType,
      hit: args.hit,
      attackerMods: effectiveActorMods,
      enemyMods: effectiveEnemyMods,
      enemyStats,
      noCrit: args.hit.noCrit,
    });
    const linkedStacks = args.linkSourceStepId
      ? (commandLinkedStacksByStepId.get(args.linkSourceStepId) ?? 0)
      : 0;
    const linkMultiplier = getLinkBonusForAttackType(linkedStacks, args.hit.attackType);
    advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
    const isEnemyStaggered = enemyIsStaggeredForEvents;
    const isFinisherHit = sourceCommand?.attackType === "BASIC_ATTACK" && sourceCommand?.basicAttackVariant === "finisher";
    const finisherAvailable = hasEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
    const finisherBonusMultiplier =
      isEnemyStaggered && isFinisherHit && finisherAvailable ? enemyFinisherMultiplier : 1;
    const staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
    const totalEnemyMultiplier = staggeredMultiplier * finisherBonusMultiplier;
    const noCritDamage = damageBreakdown.noCritDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const critDamage = damageBreakdown.critDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const averageDamage = damageBreakdown.averageDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const finisherBonusSp =
      isEnemyStaggered && isFinisherHit && finisherAvailable ? enemyFinisherSpGain : 0;
      const appliedStagger = applyEnemyStaggerFromHit({
        rawStagger: args.hit.stagger,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        sourceSlot: args.sourceSlot,
        triggerSlots: triggeredComboSlots,
      });
    if (finisherBonusSp > 0) {
      removeEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
    }

    timeline.push({
      time: args.time,
      gameTime: args.gameTime,
      registerTime: args.registerTime ?? args.time,
      registerGameTime: args.registerGameTime ?? args.gameTime,
      stepId: args.stepId,
      slot: actor.slot,
      characterName: actor.characterName,
      commandId: args.commandId,
      commandName: args.commandName,
      hitIndex: args.hitIndex,
      hitName: args.hitName ?? args.hit.name,
      damageType: args.hit.damageType,
      multiplier: args.hit.multiplier,
      noCritDamage,
      critDamage,
      damage: averageDamage,
      stagger: appliedStagger,
      spGenerated: args.hit.spGenerated + finisherBonusSp,
      spReturned: args.hit.spReturned,
      energyReturn: args.hit.energyReturn,
      requiresControlledOperator: args.hit.requiresControlledOperator,
      triggeredComboSlots,
      calculationContext: {
        finalAtk: effectiveFinalAtk,
        attackType: args.hit.attackType,
        basicAttackVariant: sourceCommand?.basicAttackVariant,
        attackerMods: { ...effectiveActorMods },
        enemyMods: { ...effectiveEnemyMods },
        enemyDef: enemyStats.def,
        hitTimes: 1,
        linkMultiplier,
        staggeredMultiplier,
        finisherBonusMultiplier,
        totalEnemyMultiplier,
      },
    });

    totalDamage += averageDamage;
    damageBySlot.set(actor.slot, (damageBySlot.get(actor.slot) ?? 0) + averageDamage);

    if (args.hit.damageType !== "Healing") {
      emitCritThresholdEvent({
        slot: actor.slot,
        sourceSlot: actor.slot,
        expectedCritCount: args.hit.noCrit ? 0 : Math.max(0, effectiveActorMods.CRIT_RATE_PCT),
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: args.commandId,
        commandName: args.commandName,
        commandAttackType: args.hit.attackType,
        damageType: args.hit.damageType,
        label: `${args.commandName} Crit Threshold`,
      });
    }
  };

  const pushUtilityTimelineHit = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId: string;
    commandId: string;
    commandName: string;
    hitIndex: number;
    hit: ResolvedCommandHitAtLevel;
    hitName?: string;
    time: number;
    gameTime: number;
    registerTime?: number;
    registerGameTime?: number;
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }) => {
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }
    timeline.push({
      time: args.time,
      gameTime: args.gameTime,
      registerTime: args.registerTime ?? args.time,
      registerGameTime: args.registerGameTime ?? args.gameTime,
      stepId: args.stepId,
      slot: actor.slot,
      characterName: actor.characterName,
      commandId: args.commandId,
      commandName: args.commandName,
      hitIndex: args.hitIndex,
      hitName: args.hitName ?? args.hit.name,
      damageType: args.hit.damageType,
      multiplier: args.hit.multiplier,
      noCritDamage: 0,
      critDamage: 0,
      damage: 0,
      stagger: 0,
      spGenerated: args.hit.spGenerated,
      spReturned: args.hit.spReturned,
      energyReturn: args.hit.energyReturn,
      requiresControlledOperator: args.hit.requiresControlledOperator,
      triggeredComboSlots: args.triggerSlots ?? [],
      calculationContext: {
        finalAtk: 0,
        attackType: args.hit.attackType,
        basicAttackVariant: undefined,
        attackerMods: makeBaseModifierStats(),
        enemyMods: makeBaseModifierStats(),
        enemyDef: enemyStats.def,
        hitTimes: 1,
        linkMultiplier: 0,
        staggeredMultiplier: 1,
        finisherBonusMultiplier: 1,
        totalEnemyMultiplier: 1,
      },
    });
  };

  const executeHitEffect = (args: {
    actor: CharacterCombatSnapshot;
    effect: Extract<CommandHitEffectDefinition, { type: "EXECUTE_HIT" }>;
    time: number;
    gameTime: number;
    stepId: string;
    sourceCommandId?: string;
    sourceCommandName?: string;
    triggerSlots: CharacterCombatSnapshot["slot"][];
    linkSourceStepId?: string;
  }) => {
    if (isInterruptedAtOrAfter(args.stepId, args.time)) {
      return;
    }
    const resolvedByRef = args.effect.hitRefId
      ? args.actor.executeHits[args.effect.hitRefId]
      : undefined;

    const command = !resolvedByRef && args.effect.commandId
      ? args.actor.commands.find((entry) => entry.id === args.effect.commandId)
      : undefined;

    const hitIndex = Math.max(0, args.effect.hitIndex ?? 0);
    const hit = resolvedByRef?.hit ?? command?.hits[hitIndex];
    if (!hit) {
      return;
    }
    const sourceCommandId =
      resolvedByRef?.commandId
      ?? command?.id
      ?? args.effect.commandId
      ?? args.sourceCommandId
      ?? "__execute_hit";
    const sourceCommandName =
      resolvedByRef?.commandName
      ?? command?.name
      ?? args.sourceCommandName
      ?? "Execute Hit";
    const repeatTimes = Math.max(1, Math.floor(args.effect.times ?? 1));
    const repeatIntervalSeconds = Math.max(0, args.effect.repeatIntervalFrames ?? 0) / 60;
    const executeDelaySeconds = Math.max(0, args.effect.executeDelayFrames ?? 0) / 60;
    const registerOffsetSeconds = Math.max(0, args.effect.registerOffsetFrames ?? 0) / 60;
    const repeatRegisterOffsetWithInterval = args.effect.repeatRegisterOffsetWithInterval ?? true;
    const registerAtInitialTime = args.effect.registerAtInitialTime ?? false;
    const inheritSourceBonuses = args.effect.inheritSourceBonuses ?? true;

    for (let repeatIndex = 0; repeatIndex < repeatTimes; repeatIndex += 1) {
      const executionOffsetSeconds = executeDelaySeconds + repeatIndex * repeatIntervalSeconds;
      const executionTime = timeContext.getShiftedEndTime(args.time, executionOffsetSeconds, args.stepId);
      const executionGameTime = timeContext.toGameTime(executionTime);
      if (isInterruptedAtOrAfter(args.stepId, executionTime)) {
        continue;
      }
      const blockedByEnemyInvulnerability =
        hit.damageType !== "Healing"
        && isEnemyHitBlocked({
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          commandId: sourceCommandId,
          time: executionTime,
          gameTime: executionGameTime,
        });

      const registerOffsetWithRepeat = registerAtInitialTime
        ? registerOffsetSeconds
        : registerOffsetSeconds + (repeatRegisterOffsetWithInterval ? executionOffsetSeconds : 0);
      const registerTime = timeContext.getShiftedEndTime(args.time, registerOffsetWithRepeat, args.stepId);
      const registerGameTime = timeContext.toGameTime(registerTime);

      const shouldDeferExecution = executionTime > args.time + 0.0001;
      if (shouldDeferExecution) {
        pendingExecuteHits.push({
          actor: args.actor,
          hit,
          hitIndex,
          hitName:
            repeatTimes > 1
              ? `${args.effect.hitName ?? hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
              : (args.effect.hitName ?? hit.name),
          sourceCommandId,
          sourceCommandName: args.effect.commandName ?? sourceCommandName,
          stepId: args.stepId,
          executionTime,
          executionGameTime,
          registerTime,
          registerGameTime,
          triggerSlots: [...args.triggerSlots],
          linkSourceStepId: args.linkSourceStepId,
          applySourceCommandModifiers: inheritSourceBonuses,
        });
        continue;
      }

      applyHitEffects({
        effects: hit.effects,
        time: executionTime,
        gameTime: executionGameTime,
        stepId: args.stepId,
        actor: args.actor,
        triggerSlots: args.triggerSlots,
        sourceCommandId,
        sourceCommandName,
        linkSourceStepId: args.linkSourceStepId,
        blockEnemyTargetEffects: blockedByEnemyInvulnerability,
      });

      if (blockedByEnemyInvulnerability) {
        applyHitEffects({
          effects: hit.postEffects ?? [],
          time: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
          actor: args.actor,
          triggerSlots: args.triggerSlots,
          sourceCommandId,
          sourceCommandName,
          linkSourceStepId: args.linkSourceStepId,
          blockEnemyTargetEffects: true,
        });
        if (hit.multiplier === 0 && hit.flatAmount === 0) {
          pushUtilityTimelineHit({
            sourceSlot: args.actor.slot,
            stepId: args.stepId,
            commandId: sourceCommandId,
            commandName: args.effect.commandName ?? sourceCommandName,
            hitIndex,
            hit,
            hitName:
              repeatTimes > 1
                ? `${args.effect.hitName ?? hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
                : (args.effect.hitName ?? hit.name),
            time: executionTime,
            gameTime: executionGameTime,
            registerTime,
            registerGameTime,
            triggerSlots: args.triggerSlots,
          });
        }
        continue;
      }

      pushResolvedTimelineHit({
        sourceSlot: args.actor.slot,
        stepId: args.stepId,
        commandId: sourceCommandId,
        commandName: args.effect.commandName ?? sourceCommandName,
        hitIndex,
        hit,
        hitName:
          repeatTimes > 1
            ? `${args.effect.hitName ?? hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
            : (args.effect.hitName ?? hit.name),
        time: executionTime,
        gameTime: executionGameTime,
        registerTime,
        registerGameTime,
        linkSourceStepId: inheritSourceBonuses ? args.linkSourceStepId : undefined,
        applySourceCommandModifiers: inheritSourceBonuses,
        triggerSlots: args.triggerSlots,
      });

      if (hit.damageType === "Healing") {
        applyResolvedHitHealing({
          sourceActor: args.actor,
          hit,
          target: "controlled",
          label: args.effect.commandName ?? sourceCommandName,
          time: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
        });
      }

      applyHitEffects({
        effects: hit.postEffects ?? [],
        time: executionTime,
        gameTime: executionGameTime,
        stepId: args.stepId,
        actor: args.actor,
        triggerSlots: args.triggerSlots,
        sourceCommandId,
        sourceCommandName,
        linkSourceStepId: args.linkSourceStepId,
        blockEnemyTargetEffects: false,
      });
    }
  };

  const processPendingExecuteHitsUpTo = (args: { realTime: number; gameTime: number }) => {
    pendingExecuteHits.sort((left, right) => left.executionTime - right.executionTime);
    while (pendingExecuteHits.length > 0) {
      const next = pendingExecuteHits[0];
      if (!next || next.executionTime > args.realTime + 0.0001) {
        break;
      }
      pendingExecuteHits.shift();
      if (isInterruptedAtOrAfter(next.stepId, next.executionTime)) {
        continue;
      }

      const blockedByEnemyInvulnerability =
        next.hit.damageType !== "Healing"
        && isEnemyHitBlocked({
          sourceSlot: next.actor.slot,
          stepId: next.stepId,
          commandId: next.sourceCommandId,
          time: next.executionTime,
          gameTime: next.executionGameTime,
        });

      applyHitEffects({
        effects: next.hit.effects,
        time: next.executionTime,
        gameTime: next.executionGameTime,
        stepId: next.stepId,
        actor: next.actor,
        triggerSlots: next.triggerSlots,
        sourceCommandId: next.sourceCommandId,
        sourceCommandName: next.sourceCommandName,
        linkSourceStepId: next.linkSourceStepId,
        blockEnemyTargetEffects: blockedByEnemyInvulnerability,
      });

      if (blockedByEnemyInvulnerability) {
        applyHitEffects({
          effects: next.hit.postEffects ?? [],
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
          actor: next.actor,
          triggerSlots: next.triggerSlots,
          sourceCommandId: next.sourceCommandId,
          sourceCommandName: next.sourceCommandName,
          linkSourceStepId: next.linkSourceStepId,
          blockEnemyTargetEffects: true,
        });
        if (next.hit.multiplier === 0 && next.hit.flatAmount === 0) {
          pushUtilityTimelineHit({
            sourceSlot: next.actor.slot,
            stepId: next.stepId,
            commandId: next.sourceCommandId,
            commandName: next.sourceCommandName,
            hitIndex: next.hitIndex,
            hit: next.hit,
            hitName: next.hitName,
            time: next.executionTime,
            gameTime: next.executionGameTime,
            registerTime: next.registerTime,
            registerGameTime: next.registerGameTime,
            triggerSlots: next.triggerSlots,
          });
        }
        recordActorState(next.actor.slot, next.executionTime, next.executionGameTime);
        recordEnemyState(next.executionTime, next.executionGameTime);
        continue;
      }

      pushResolvedTimelineHit({
        sourceSlot: next.actor.slot,
        stepId: next.stepId,
        commandId: next.sourceCommandId,
        commandName: next.sourceCommandName,
        hitIndex: next.hitIndex,
        hit: next.hit,
        hitName: next.hitName,
        time: next.executionTime,
        gameTime: next.executionGameTime,
        registerTime: next.registerTime,
        registerGameTime: next.registerGameTime,
        linkSourceStepId: next.applySourceCommandModifiers === false ? undefined : next.linkSourceStepId,
        applySourceCommandModifiers: next.applySourceCommandModifiers,
        triggerSlots: next.triggerSlots,
      });

      if (next.hit.damageType === "Healing") {
        applyResolvedHitHealing({
          sourceActor: next.actor,
          hit: next.hit,
          target: "controlled",
          label: next.sourceCommandName,
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
        });
      }

      applyHitEffects({
        effects: next.hit.postEffects ?? [],
        time: next.executionTime,
        gameTime: next.executionGameTime,
        stepId: next.stepId,
        actor: next.actor,
        triggerSlots: next.triggerSlots,
        sourceCommandId: next.sourceCommandId,
        sourceCommandName: next.sourceCommandName,
        linkSourceStepId: next.linkSourceStepId,
        blockEnemyTargetEffects: false,
      });

      recordActorState(next.actor.slot, next.executionTime, next.executionGameTime);
      recordEnemyState(next.executionTime, next.executionGameTime);
    }
  };

  const triggerReactionDamageFromConsumedInflictions = (args: {
    reaction: ArtsReactionKind;
    consumedStacks: number;
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
    linkSourceStepId?: string;
  }) => {
    if (args.consumedStacks <= 0) {
      return;
    }

    const baseMultiplier = args.reaction === "Corrosion"
      ? 0.5 + 0.5 * args.consumedStacks
      : 0.8 + 0.8 * args.consumedStacks;
    pushReactionDamageHit({
      sourceSlot: args.sourceSlot,
      reactionName: args.reaction,
      hitName: `${args.reaction} Trigger`,
      damageType: getReactionDamageType(args.reaction),
      baseMultiplier,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: "__reaction_trigger",
      linkSourceStepId: args.linkSourceStepId,
    });
  };

  const queueArtsBurstFromInfliction = (args: {
    element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }) => {
    const applyEvent: RotationCombatEvent = {
      type: "ARTS_BURST_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      target: "enemy",
      label: `${args.element} Arts Burst Applied`,
      consumedElement: args.element,
    };
    emitEvent(applyEvent);
    dispatchPassiveListeners(applyEvent, args.triggerSlots);

    pendingArtsBursts.push({
      executeGameTime: args.gameTime + 1,
      sourceSlot: args.sourceSlot,
      element: args.element,
      stepId: args.stepId,
    });
    pendingArtsBursts.sort((left, right) => left.executeGameTime - right.executeGameTime);
  };

  const processPendingArtsBurstsUpTo = (args: { realTime: number; gameTime: number }) => {
    while (pendingArtsBursts.length > 0) {
      const next = pendingArtsBursts[0]!;
      if (next.executeGameTime > args.gameTime + 0.0001) {
        break;
      }
      const executeRealTime = toRealTimeFromExtensions(next.executeGameTime);
      if (executeRealTime > args.realTime + 0.0001) {
        break;
      }

      pendingArtsBursts.shift();
      if (isInterruptedAtOrAfter(next.stepId, executeRealTime)) {
        continue;
      }

      pushReactionDamageHit({
        sourceSlot: next.sourceSlot,
        reactionName: `${next.element} Burst`,
        hitName: "Arts Burst",
        damageType: next.element,
        baseMultiplier: 1.6,
        time: executeRealTime,
        gameTime: next.executeGameTime,
        stepId: next.stepId,
        commandId: "__arts_burst",
      });
      const event: RotationCombatEvent = {
        type: "ARTS_BURST_HIT",
        time: executeRealTime,
        gameTime: next.executeGameTime,
        stepId: next.stepId,
        slot: next.sourceSlot,
        sourceSlot: next.sourceSlot,
        target: "enemy",
        label: `${next.element} Arts Burst`,
        consumedElement: next.element,
      };
      emitEvent(event);
      dispatchPassiveListeners(event);
    }
  };

  const applyReaction = (args: {
    reaction: ArtsReactionKind;
    level: number;
    durationSeconds?: number;
    debuffScaleMultiplier?: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandId?: string;
    sourceCommandName?: string;
  }) => {
    const reactionId = args.reaction.toLowerCase();
    const defaultDuration = getReactionDefaultDurationSeconds(args.reaction, args.level);
    const requestedDuration = args.durationSeconds ?? defaultDuration;

    if (args.reaction === "Corrosion") {
      const previousCorrosion = getEnemyStatuses().find((status) => status.id === "corrosion");
      const previousRemaining = previousCorrosion
        ? Math.max(0, previousCorrosion.expiresAt - args.gameTime)
        : 0;
      const resolvedLevel = Math.max(args.level, previousCorrosion?.level ?? args.level);
      const resolvedDuration = Math.max(requestedDuration, previousRemaining);
      const baseAmount = getReactionBaseAmount(resolvedLevel);
      const finalAmount = getReactionScaledAmount(args.sourceSlot, baseAmount, args.time, args.gameTime)
        * (args.debuffScaleMultiplier ?? 1);
      const inheritedReduction = previousCorrosion?.currentReduction;
      const currentReduction = Math.min(
        finalAmount,
        Math.max(0, inheritedReduction ?? finalAmount * 0.3),
      );
      const nextRampAtGameTime = previousCorrosion?.nextRampAtGameTime && previousCorrosion.nextRampAtGameTime > args.gameTime
        ? previousCorrosion.nextRampAtGameTime
        : args.gameTime + 1;

      let nextEnemyStatuses = getEnemyStatuses().filter((status) => status.id !== "corrosion");
      const corrosionStatus: TimedEnemyStatus = {
        id: "corrosion",
        label: `Corrosion Lv${resolvedLevel}`,
        expiresAt: args.gameTime + resolvedDuration,
        timeScale: "game",
        applierSlot: args.sourceSlot,
        level: resolvedLevel,
        finalAmount,
        currentReduction,
        nextRampAtGameTime,
      };
      nextEnemyStatuses.push(corrosionStatus);
      setEnemyStatuses(nextEnemyStatuses);
      applyCorrosionDebuffFromStatus(corrosionStatus);
    } else {
      let nextEnemyStatuses = getEnemyStatuses().filter((status) => status.id !== reactionId);
      const status: TimedEnemyStatus = {
        id: reactionId,
        label: `${args.reaction} Lv${args.level}`,
        expiresAt: args.gameTime + requestedDuration,
        timeScale: "game",
        applierSlot: args.sourceSlot,
        level: args.level,
        nextTickAtGameTime: args.reaction === "Combustion" ? args.gameTime + 1 : undefined,
      };

      if (args.reaction === "Electrification") {
        const baseAmount = getReactionBaseAmount(args.level);
        status.finalAmount = getReactionScaledAmount(args.sourceSlot, baseAmount, args.time, args.gameTime)
          * (args.debuffScaleMultiplier ?? 1);
      }

      nextEnemyStatuses.push(status);
      setEnemyStatuses(nextEnemyStatuses);

      if (args.reaction === "Electrification") {
        setReactionDebuff({
          buffId: "electrification",
          label: status.label,
          effects: {
            ARTS_DMG_TAKEN_PCT: status.finalAmount ?? 0,
          },
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
        });
      }
    }

    const sourceCommand = args.sourceCommandId
      ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
      : undefined;
    const reactionAppliedEvent: RotationCombatEvent = {
      type: "ARTS_REACTION_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: args.sourceCommandId,
      commandName: args.sourceCommandName,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      target: "enemy",
      label: `${args.reaction} Applied`,
      commandAttackType: sourceCommand?.attackType,
    };
    emitEvent(reactionAppliedEvent);
    dispatchPassiveListeners(reactionAppliedEvent, args.triggerSlots);

    if (args.reaction === "Combustion") {
      const event: RotationCombatEvent = {
        type: "COMBUSTION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        target: "enemy",
        label: `Combustion Applied Lv${args.level}`,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);

      return;
    }

    if (args.reaction === "Corrosion") {
      const corrosion = getEnemyStatuses().find((status) => status.id === "corrosion");
      const event: RotationCombatEvent = {
        type: "CORROSION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        target: "enemy",
        label: `Corrosion Applied Lv${corrosion?.level ?? args.level}`,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);

    }
  };

  const applyPhysicalReaction = (args: {
    reaction: PhysicalReactionKind;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
    forceApply: boolean;
    reactionDamage: boolean;
    baseMultiplier?: number;
    linkSourceStepId?: string;
    sourceCommandId?: string;
    sourceCommandName?: string;
  }) => {
    const emitPhysicalReactionAppliedEvent = (reaction: PhysicalReactionKind) => {
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const event: RotationCombatEvent = {
        type: "PHYSICAL_REACTION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: args.sourceCommandId,
        commandName: args.sourceCommandName,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: `${reaction} Applied`,
        commandAttackType: sourceCommand?.attackType,
        amount: 1,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);
    };

    const emitVulnerabilityAppliedEvent = () => {
      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: "Vulnerability Applied",
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);
    };

    const triggerShatterIfSolidificationPresent = () => {
      const solidificationStatuses = getEnemyStatuses().filter((status) => status.id === "solidification");
      if (solidificationStatuses.length <= 0) {
        return;
      }

      const solidificationLevel = Math.max(
        1,
        ...solidificationStatuses.map((status) => Math.max(1, status.level ?? 1)),
      );
      setEnemyStatuses(getEnemyStatuses().filter((status) => status.id !== "solidification"));

      pushReactionDamageHit({
        sourceSlot: args.sourceSlot,
        reactionName: "Shatter",
        hitName: "Shatter Trigger",
        damageType: "Physical",
        baseMultiplier: 1.2 + 1.2 * solidificationLevel,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: "__physical_reaction_trigger",
        reactionCategory: "arts",
        linkSourceStepId: args.linkSourceStepId,
      });
    };

    if (!args.forceApply && (getEnemyPhysicalInfliction()?.stacks ?? 0) <= 0) {
      setEnemyPhysicalInfliction({
        stacks: 1,
        expiresAtGameTime: args.gameTime + ARTS_INFLICTION_DURATION_SECONDS,
      });
      emitVulnerabilityAppliedEvent();
      triggerShatterIfSolidificationPresent();
      return;
    }

    const actor = partyBySlot.get(args.sourceSlot);
    const artsIntensity = actor
      ? Math.max(0, getEffectiveActorMods(actor, args.time, args.gameTime).ARTS_INTENSITY)
      : 0;

    if (args.reaction === "Lift" || args.reaction === "Knockdown") {
      const currentStacks = getEnemyPhysicalInfliction()?.stacks ?? 0;
      setEnemyPhysicalInfliction({
        stacks: Math.max(1, Math.min(4, currentStacks + 1)),
        expiresAtGameTime: args.gameTime + ARTS_INFLICTION_DURATION_SECONDS,
      });
      emitVulnerabilityAppliedEvent();
      const reactionId = args.reaction.toLowerCase();
      const nextEnemyStatuses = getEnemyStatuses().filter((status) => status.id !== reactionId);
      nextEnemyStatuses.push({
        id: reactionId,
        label: args.reaction,
        expiresAt: args.gameTime + 1.5,
        timeScale: "game",
        applierSlot: args.sourceSlot,
      });
      setEnemyStatuses(nextEnemyStatuses);

      if (args.reactionDamage) {
        pushReactionDamageHit({
          sourceSlot: args.sourceSlot,
          reactionName: args.reaction,
          hitName: `${args.reaction} Trigger`,
          damageType: "Physical",
          baseMultiplier: args.baseMultiplier ?? 1.2,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          commandId: "__physical_reaction_trigger",
          reactionCategory: "physical",
          linkSourceStepId: args.linkSourceStepId,
          stagger: 10 * (1 + artsIntensity / 200),
        });
      }
      emitPhysicalReactionAppliedEvent(args.reaction);
      triggerShatterIfSolidificationPresent();
      return;
    }

    const consumedStacks = Math.max(1, getEnemyPhysicalInfliction()?.stacks ?? 0);
    setEnemyPhysicalInfliction(null);

    if (args.reaction === "Crush") {
      if (args.reactionDamage) {
        pushReactionDamageHit({
          sourceSlot: args.sourceSlot,
          reactionName: "Crush",
          hitName: "Crush Trigger",
          damageType: "Physical",
          baseMultiplier: args.baseMultiplier ?? (1.5 + 1.5 * consumedStacks),
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          commandId: "__physical_reaction_trigger",
          reactionCategory: "physical",
          linkSourceStepId: args.linkSourceStepId,
        });
      }
      emitPhysicalReactionAppliedEvent("Crush");
      triggerShatterIfSolidificationPresent();
      return;
    }

    const clampedStacks = Math.max(1, Math.min(4, consumedStacks));
    const durationTable = [12, 18, 24, 30];
    const baseTakenTable = [0.12, 0.16, 0.2, 0.24];
    const durationSeconds = durationTable[clampedStacks - 1] ?? durationTable[0]!;
    const baseTakenPct = baseTakenTable[clampedStacks - 1] ?? baseTakenTable[0]!;
    const breachMultiplier = 1 + (2 * artsIntensity) / (artsIntensity + 300);
    const finalTakenPct = baseTakenPct * breachMultiplier;

    if (args.reactionDamage) {
      pushReactionDamageHit({
        sourceSlot: args.sourceSlot,
        reactionName: "Breach",
        hitName: "Breach Trigger",
        damageType: "Physical",
        baseMultiplier: args.baseMultiplier ?? (0.5 + 0.5 * consumedStacks),
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: "__physical_reaction_trigger",
        reactionCategory: "physical",
        linkSourceStepId: args.linkSourceStepId,
      });
    }

    const nextEnemyStatuses = getEnemyStatuses().filter((status) => status.id !== "breach");
    nextEnemyStatuses.push({
      id: "breach",
      label: "Breach",
      expiresAt: args.gameTime + durationSeconds,
      timeScale: "game",
      applierSlot: args.sourceSlot,
      level: clampedStacks,
    });
    setEnemyStatuses(nextEnemyStatuses);

    setReactionDebuff({
      buffId: "breach",
      label: `Breach Lv${clampedStacks}`,
      effects: {
        PHYSICAL_DMG_TAKEN_PCT: finalTakenPct,
      },
      expiresAt: args.gameTime + durationSeconds,
      timeScale: "game",
    });

    emitPhysicalReactionAppliedEvent("Breach");
    triggerShatterIfSolidificationPresent();
  };

  const getUnifiedStatuses = (args: { realTime: number; gameTime: number }): UnifiedCombatStatus[] => {
    cleanupStateAt(args.realTime, args.gameTime);

    const statuses: UnifiedCombatStatus[] = [...runtimeStatuses];

    return statuses;
  };

  const hasUnifiedStatus = (args: {
    statusId: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global";
    realTime: number;
    gameTime: number;
  }) => {
    const statuses = getUnifiedStatuses({ realTime: args.realTime, gameTime: args.gameTime });
    return statuses.some((status) => {
      if (status.id !== args.statusId) {
        return false;
      }

      if (args.target === "enemy") {
        return status.scope === "enemy";
      }

      if (args.target === "self") {
        return status.scope === "actor" && status.targetSlot === args.sourceSlot;
      }

      if (args.target === "global") {
        return status.scope === "global";
      }

      if (args.sourceSlot == null) {
        return true;
      }
      if (status.scope === "actor") {
        return status.targetSlot === args.sourceSlot || status.ownerSlot === args.sourceSlot;
      }
      return true;
    });
  };

  const consumeEnemyStatusForAccumulator = (args: {
    statusId: string;
    maxConsumed: number;
    useLevelAsStacks: boolean;
    realTime: number;
    gameTime: number;
  }): number => {
    cleanupStateAt(args.realTime, args.gameTime);
    let remaining = Math.max(0, Math.floor(args.maxConsumed));
    if (remaining <= 0) {
      return 0;
    }

    const matched: Array<{ index: number; units: number }> = [];
    for (let index = 0; index < runtimeStatuses.length; index += 1) {
      const status = runtimeStatuses[index];
      if (!status || status.scope !== "enemy" || status.id !== args.statusId) {
        continue;
      }
      const levelFromMetadata = typeof status.metadata?.level === "number"
        ? Math.max(1, Math.floor(status.metadata.level))
        : undefined;
      const stackUnits = Math.max(1, Math.floor(status.stacks ?? 1));
      const units = args.useLevelAsStacks ? (levelFromMetadata ?? stackUnits) : stackUnits;
      matched.push({ index, units });
    }

    if (matched.length === 0) {
      return 0;
    }

    const removals = new Set<number>();
    let consumedTotal = 0;
    for (const entry of matched) {
      if (remaining <= 0) {
        break;
      }
      const take = Math.min(remaining, entry.units);
      if (take <= 0) {
        continue;
      }
      remaining -= take;
      consumedTotal += take;
      const nextUnits = entry.units - take;
      const current = runtimeStatuses[entry.index];
      if (!current) {
        continue;
      }
      if (nextUnits <= 0) {
        removals.add(entry.index);
        continue;
      }
      const nextMetadata = { ...(current.metadata ?? {}) };
      if (args.useLevelAsStacks && typeof current.metadata?.level === "number") {
        nextMetadata.level = nextUnits;
      }
      runtimeStatuses[entry.index] = {
        ...current,
        stacks: nextUnits,
        metadata: nextMetadata,
      };
    }

    if (removals.size > 0) {
      runtimeStatuses = runtimeStatuses.filter((_, index) => !removals.has(index));
    }

    return consumedTotal;
  };

  const evaluateCombatCondition = (args: {
    condition: CombatCondition;
    actor: CharacterCombatSnapshot;
    realTime: number;
    gameTime: number;
    stepId?: string;
    isCommandHit?: boolean;
  }): boolean => {
    const condition = args.condition;
    if (condition.type === "and") {
      return condition.conditions.every((child) => evaluateCombatCondition({ ...args, condition: child }));
    }
    if (condition.type === "or") {
      return condition.conditions.some((child) => evaluateCombatCondition({ ...args, condition: child }));
    }
    if (condition.type === "not") {
      return !evaluateCombatCondition({ ...args, condition: condition.condition });
    }
    if (condition.type === "require_status") {
      return hasUnifiedStatus({
        statusId: condition.statusId,
        sourceSlot: args.actor.slot,
        target: condition.target ?? "enemy",
        realTime: args.realTime,
        gameTime: args.gameTime,
      });
    }
    if (condition.type === "require_perfect_timing") {
      if (args.isCommandHit !== true || !args.stepId) {
        return false;
      }
      return perfectTimingStepIds.has(args.stepId);
    }

    const expectedEnabled = condition.enabled ?? true;
    return isUniqueTalentEnabled(condition.talentKey, {
      ascensionStage: args.actor.ascensionStage,
      potentialLevel: args.actor.potentialLevel,
      uniqueTalentToggles: args.actor.uniqueTalentToggles,
      uniqueTalentConditions: args.actor.uniqueTalentConditions,
      uniqueTalentDefaults: args.actor.uniqueTalentDefaults,
    }) === expectedEnabled;
  };

  const removeTimedStatus = (args: {
    statusId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global";
  }): TimedEffectStatus[] => {
    const effectStatuses = getEffectStatuses();
    const removed = effectStatuses.filter((status) =>
      status.id === args.statusId
      && status.sourceSlot === args.sourceSlot
      && (args.target == null || status.target === args.target),
    );
    if (removed.length <= 0) {
      return [];
    }
    for (const status of removed) {
      if (status.target === "enemy") {
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== status.id);
      }
    }
    setEffectStatuses(effectStatuses.filter((status) => !removed.includes(status)));
    return removed;
  };

  const applyTimedStatus = (args: {
    effect: Extract<CommandHitEffectDefinition, { type: "APPLY_STATUS" }>;
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId: string;
    time: number;
    gameTime: number;
    linkSourceStepId?: string;
  }) => {
    const timeScale = args.effect.timeScale ?? "game";
    const now = timeScale === "real" ? args.time : args.gameTime;
    const durationSeconds = Math.max(0, args.effect.durationSeconds);
    if (durationSeconds <= 0) {
      return;
    }

    if ((args.effect.initialEffects?.length ?? 0) > 0) {
      const sourceActor = partyBySlot.get(args.sourceSlot);
      if (sourceActor) {
        applyHitEffects({
          effects: args.effect.initialEffects ?? [],
          time: args.time,
          gameTime: args.gameTime,
          stepId: `${args.stepId}:${args.effect.statusId}:initial`,
          actor: sourceActor,
          triggerSlots: [],
          linkSourceStepId: args.linkSourceStepId,
        });
      }
    }

    const periods = Math.max(0, Math.floor(args.effect.periods ?? 0));
    const periodInterval = periods > 0 ? durationSeconds / periods : 0;

    const effectStatuses = getEffectStatuses().filter((status) => !(
      status.id === args.effect.statusId
      && status.sourceSlot === args.sourceSlot
      && status.target === args.effect.target
    ));
    if (args.effect.target === "enemy") {
      timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== args.effect.statusId);
      const expiresAt = now + durationSeconds;
      for (const [statKey, value] of Object.entries(args.effect.effects ?? {})) {
        if (value == null || value === 0) {
          continue;
        }
        const stat = statKey as ModifierStatKey;
        timedEnemyDebuffs.push({
          id: `${args.effect.statusId}:${stat}`,
          buffId: args.effect.statusId,
          label: args.effect.label ?? args.effect.statusId,
          stat,
          value,
          expiresAt,
          timeScale,
        });
      }
    }

    effectStatuses.push({
      id: args.effect.statusId,
      label: args.effect.label ?? args.effect.statusId,
      sourceSlot: args.sourceSlot,
      sourceStepId: args.stepId,
      linkSourceStepId: args.linkSourceStepId,
      target: args.effect.target,
      expiresAt: now + durationSeconds,
      timeScale,
      periods,
      periodsExecuted: 0,
      periodInterval,
      nextPeriodAt: periods > 0 ? now + periodInterval : undefined,
      periodicEffects: args.effect.periodicEffects ?? [],
      expireEffects: args.effect.expireEffects ?? [],
      pauseStatusIds: args.effect.pauseStatusIds,
      effects: args.effect.effects,
    });

    if ((args.effect.pauseStatusIds?.length ?? 0) > 0) {
      const pauseIds = new Set(args.effect.pauseStatusIds);
      for (const status of runtimeStatuses) {
        if (!pauseIds.has(status.id) || status.kind !== ACTOR_BUFF_KIND) {
          continue;
        }
        status.expiresAt += durationSeconds;
      }
    }
    setEffectStatuses(effectStatuses);
  };

  const processTimedEffectStatusesUpTo = (args: { realTime: number; gameTime: number }) => {
    let effectStatuses = getEffectStatuses();
    for (const status of [...effectStatuses]) {
      const interruptedAt = getInterruptCutoffForStep(status.sourceStepId);
      if (interruptedAt != null && interruptedAt <= args.realTime + 0.0001) {
        effectStatuses = effectStatuses.filter((entry) => entry !== status);
        continue;
      }

      const sourceActor = partyBySlot.get(status.sourceSlot);
      if (!sourceActor) {
        effectStatuses = effectStatuses.filter((entry) => entry !== status);
        continue;
      }

      while (
        status.periodsExecuted < status.periods
        && status.nextPeriodAt != null
      ) {
        const periodTime = status.nextPeriodAt;
        const periodGameTime = status.timeScale === "game" ? periodTime : toGameTimeFromExtensions(periodTime);
        const periodRealTime = status.timeScale === "real" ? periodTime : toRealTimeFromExtensions(periodTime);
        if (periodRealTime > args.realTime + 0.0001 || periodGameTime > args.gameTime + 0.0001) {
          break;
        }
        if (isInterruptedAtOrAfter(status.sourceStepId, periodRealTime)) {
          break;
        }
        if (periodTime >= status.expiresAt - 0.0001) {
          break;
        }

        applyHitEffects({
          effects: status.periodicEffects,
          time: periodRealTime,
          gameTime: periodGameTime,
          stepId: `${status.sourceStepId}:${status.id}:period:${status.periodsExecuted + 1}`,
          actor: sourceActor,
          triggerSlots: [],
          linkSourceStepId: status.linkSourceStepId,
        });

        status.periodsExecuted += 1;
        status.nextPeriodAt = periodTime + Math.max(0.0001, status.periodInterval);
      }

      const expiresAtGameTime = status.timeScale === "game" ? status.expiresAt : toGameTimeFromExtensions(status.expiresAt);
      const expiresAtRealTime = status.timeScale === "real" ? status.expiresAt : toRealTimeFromExtensions(status.expiresAt);
      if (expiresAtRealTime > args.realTime + 0.0001 || expiresAtGameTime > args.gameTime + 0.0001) {
        continue;
      }
      if (isInterruptedAtOrAfter(status.sourceStepId, expiresAtRealTime)) {
        effectStatuses = effectStatuses.filter((entry) => entry !== status);
        continue;
      }

      applyHitEffects({
        effects: status.expireEffects,
        time: expiresAtRealTime,
        gameTime: expiresAtGameTime,
        stepId: `${status.sourceStepId}:${status.id}:expire`,
        actor: sourceActor,
        triggerSlots: [],
        linkSourceStepId: status.linkSourceStepId,
      });
      if (status.target === "enemy") {
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== status.id);
      }

      effectStatuses = effectStatuses.filter((entry) => entry !== status);
    }
    setEffectStatuses(effectStatuses);
  };

  const processReactionTicksUpTo = (args: { realTime: number; gameTime: number }) => {
    const enemyStatuses = getEnemyStatuses();
    while (true) {
      const combustionStatus = enemyStatuses
        .filter(
          (status) =>
            status.id === "combustion"
            && status.applierSlot != null
            && status.level != null
            && status.nextTickAtGameTime != null
            && status.nextTickAtGameTime <= args.gameTime + 0.0001
            && status.nextTickAtGameTime < status.expiresAt - 0.0001,
        )
        .sort((a, b) => (a.nextTickAtGameTime ?? Number.POSITIVE_INFINITY) - (b.nextTickAtGameTime ?? Number.POSITIVE_INFINITY))[0];

      if (!combustionStatus || combustionStatus.nextTickAtGameTime == null || combustionStatus.level == null || combustionStatus.applierSlot == null) {
        break;
      }

      const tickGameTime = combustionStatus.nextTickAtGameTime;
      const tickRealTime = toRealTimeFromExtensions(tickGameTime);
      if (tickRealTime > args.realTime + 0.0001) {
        break;
      }

      const tickMultiplier = 0.12 + 0.12 * combustionStatus.level;
      pushReactionDamageHit({
        sourceSlot: combustionStatus.applierSlot,
        reactionName: "Combustion",
        hitName: "Combustion Tick",
        damageType: "Heat",
        baseMultiplier: tickMultiplier,
        time: tickRealTime,
        gameTime: tickGameTime,
        stepId: `combustion_tick:${tickGameTime.toFixed(3)}`,
        commandId: "__combustion_tick",
        noCrit: true,
      });

      combustionStatus.nextTickAtGameTime += 1;
    }

    while (true) {
      const corrosionStatus = enemyStatuses
        .filter(
          (status) =>
            status.id === "corrosion"
            && status.finalAmount != null
            && status.currentReduction != null
            && status.nextRampAtGameTime != null
            && status.nextRampAtGameTime <= args.gameTime + 0.0001
            && status.nextRampAtGameTime < status.expiresAt - 0.0001,
        )
        .sort((a, b) => (a.nextRampAtGameTime ?? Number.POSITIVE_INFINITY) - (b.nextRampAtGameTime ?? Number.POSITIVE_INFINITY))[0];

      if (!corrosionStatus || corrosionStatus.nextRampAtGameTime == null || corrosionStatus.finalAmount == null || corrosionStatus.currentReduction == null) {
        break;
      }

      const rampGameTime = corrosionStatus.nextRampAtGameTime;
      const rampRealTime = toRealTimeFromExtensions(rampGameTime);
      if (rampRealTime > args.realTime + 0.0001) {
        break;
      }

      const stepIncrease = corrosionStatus.finalAmount * 0.07;
      corrosionStatus.currentReduction = Math.min(
        corrosionStatus.finalAmount,
        corrosionStatus.currentReduction + stepIncrease,
      );
      corrosionStatus.nextRampAtGameTime += 1;
      applyCorrosionDebuffFromStatus(corrosionStatus);
    }
    setEnemyStatuses(enemyStatuses);
  };

  const resolveBuffEffectsForActor = (args: {
    effect: Extract<CommandHitEffectDefinition, { type: "APPLY_BUFF" }>;
    actor: CharacterCombatSnapshot;
  }): Partial<ModifierStats> => {
    const resolvedEffects: Partial<ModifierStats> = {
      ...(args.effect.effects ?? {}),
    };

    for (const [statKey, scaling] of Object.entries(args.effect.effectAttributeScalings ?? {})) {
      if (!scaling) {
        continue;
      }
      const dynamicValue = args.actor.attrs[scaling.attribute] * scaling.ratio;
      const cappedValue = scaling.max != null ? Math.min(scaling.max, dynamicValue) : dynamicValue;
      resolvedEffects[statKey as ModifierStatKey] = (resolvedEffects[statKey as ModifierStatKey] ?? 0) + cappedValue;
    }

    return resolvedEffects;
  };

  const applyHitEffects = (args: {
    effects: CommandHitEffectDefinition[];
    time: number;
    gameTime: number;
    stepId: string;
    actor: CharacterCombatSnapshot;
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandId?: string;
    sourceCommandName?: string;
    linkSourceStepId?: string;
    isCommandHit?: boolean;
    blockEnemyTargetEffects?: boolean;
  }) => {
    if (isInterruptedAtOrAfter(args.stepId, args.time)) {
      return;
    }
    const resolvedLinkSourceStepId = args.linkSourceStepId
      ?? (commandLinkedStacksByStepId.has(args.stepId) ? args.stepId : undefined);

    const computeDeterministicChanceRoll = (key: string) => {
      let hash = 2166136261;
      for (let index = 0; index < key.length; index += 1) {
        hash ^= key.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return ((hash >>> 0) % 1_000_000) / 1_000_000;
    };

    for (let effectIndex = 0; effectIndex < args.effects.length; effectIndex += 1) {
      const effect = args.effects[effectIndex]!;
      if (effect.chance != null) {
        const procChance = Math.max(0, Math.min(1, effect.chance));
        if (procChance <= 0) {
          continue;
        }
        if (procChance < 1) {
          const roll = computeDeterministicChanceRoll(
            `${args.stepId}:${effectIndex}:${args.actor.slot}:${args.time.toFixed(6)}:${args.gameTime.toFixed(6)}`,
          );
          if (roll > procChance) {
            continue;
          }
        }
      }

      if (
        effect.condition
        && !evaluateCombatCondition({
          condition: effect.condition,
          actor: args.actor,
          realTime: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          isCommandHit: args.isCommandHit ?? false,
        })
      ) {
        continue;
      }

      if (effect.type === "EXECUTE_HIT") {
        executeHitEffect({
          actor: args.actor,
          effect,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
          triggerSlots: args.triggerSlots,
          linkSourceStepId: resolvedLinkSourceStepId,
        });
        continue;
      }

      if (effect.type === "APPLY_STATUS") {
        if (args.blockEnemyTargetEffects && effect.target === "enemy") {
          continue;
        }
        applyTimedStatus({
          effect,
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          time: args.time,
          gameTime: args.gameTime,
          linkSourceStepId: resolvedLinkSourceStepId,
        });
        continue;
      }

      if (effect.type === "APPLY_PHYSICAL_INFLICTION") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const currentStacks = Math.max(0, getEnemyPhysicalInfliction()?.stacks ?? 0);
        const addedStacks = Math.max(0, effect.stacks ?? 1);
        const nextStacks = Math.max(1, Math.min(4, currentStacks + addedStacks));
        const durationSeconds = Math.max(0.001, effect.durationSeconds ?? ARTS_INFLICTION_DURATION_SECONDS);
        setEnemyPhysicalInfliction({
          stacks: nextStacks,
          expiresAtGameTime: args.gameTime + durationSeconds,
        });
        const event: RotationCombatEvent = {
          type: "ENEMY_DEBUFF_APPLIED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          target: "enemy",
          label: "Vulnerability Applied",
        };
        emitEvent(event);
        dispatchPassiveListeners(event, args.triggerSlots);
        continue;
      }

      if (effect.type === "APPLY_GILBERTA_GRAVITY_FIELD_SUS") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const vulnerabilityStacks = Math.max(0, getEnemyPhysicalInfliction()?.stacks ?? 0);
        const hasPotential2 = args.actor.characterId === "gilberta" && args.actor.potentialLevel >= 2;
        const effectiveStacks = hasPotential2
          ? Math.min(4, vulnerabilityStacks + 1)
          : Math.min(4, vulnerabilityStacks);
        const baseSus = effect.baseSusPct ?? 0;
        const perStackSus = (effect.perStackSusPct ?? 0) * (hasPotential2 ? 2 : 1);
        const fourStackSus = effect.fourStackSusPct;
        const artsSusValue = effectiveStacks >= 4 && fourStackSus != null
          ? fourStackSus
          : baseSus + perStackSus * effectiveStacks;

        applyEnemyBuff({
          buffId: "gilberta_gravity_field_arts_sus",
          label: "Gravity Field Arts Sus",
          effects: {
            ARTS_SUS_PCT: artsSusValue,
          },
          durationSeconds: Math.max(0, effect.durationSeconds),
          timeScale: "game",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
        });
        continue;
      }

      if (effect.type === "APPLY_TEAM_STATUS") {
        gainTeamStatusStacks({
          statusId: effect.statusId,
          label: effect.label,
          stacks: Math.max(1, effect.stacks ?? 1),
          maxStacks: effect.maxStacks,
          refreshExistingStacks: effect.refreshExistingStacks,
          durationSeconds: effect.durationSeconds,
          timeScale: effect.timeScale ?? "game",
          time: args.time,
          gameTime: args.gameTime,
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
        });
        continue;
      }

      if (effect.type === "CONSUME_TEAM_STATUS") {
        consumeTeamStatusStacks({
          statusId: effect.statusId,
          stacks: Math.max(1, effect.stacks ?? 1),
          time: args.time,
          gameTime: args.gameTime,
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          label: effect.label,
        });
        continue;
      }

      if (effect.type === "REMOVE_STATUS") {
        if (args.blockEnemyTargetEffects && effect.target === "enemy") {
          continue;
        }
        removeTimedStatus({
          statusId: effect.statusId,
          sourceSlot: args.actor.slot,
          target: effect.target,
        });
        continue;
      }

      if (effect.type === "APPLY_BUFF" && effect.requiresSelfBuffId) {
        const selfBuffStacks = getActorBuffStackCount({
          slot: args.actor.slot,
          buffId: effect.requiresSelfBuffId,
        });
        if (effect.requiresSelfBuffStacksExact != null && selfBuffStacks !== effect.requiresSelfBuffStacksExact) {
          continue;
        }
        if (effect.requiresSelfBuffStacksAtLeast != null && selfBuffStacks < effect.requiresSelfBuffStacksAtLeast) {
          continue;
        }
      }

      if (effect.type === "APPLY_BUFF" && effect.requiresSelfPotentialAtLeast != null) {
        const selfActor = partyBySlot.get(args.actor.slot);
        if (!selfActor || selfActor.potentialLevel < effect.requiresSelfPotentialAtLeast) {
          continue;
        }
      }

      if (effect.type === "APPLY_BUFF" && effect.requiresControlledOperatorFullHp) {
        const controlledCurrentHp = actorCurrentHpBySlot.get(controlledOperatorSlot) ?? 0;
        const controlledMaxHp = actorMaxHpBySlot.get(controlledOperatorSlot) ?? 0;
        if (controlledMaxHp <= 0 || controlledCurrentHp + 0.001 < controlledMaxHp) {
          continue;
        }
      }

      if (effect.type === "APPLY_BUFF" && effect.target === "self" && effect.buffId === MELTING_FLAME_STATUS_ID) {
        gainMeltingFlameStacks({
          slot: args.actor.slot,
          stacks: Math.max(1, effect.stacks ?? 1),
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          label: `${args.actor.characterName}: Melting Flame +${Math.max(1, effect.stacks ?? 1)}`,
        });
        continue;
      }

      if (effect.type === "APPLY_BUFF" && effect.target === "self") {
        if ((effect.durationSeconds ?? 0) <= 0) {
          continue;
        }
        const stackApplications = Math.max(1, effect.stacks ?? 1);
        const resolvedEffects = resolveBuffEffectsForActor({ effect, actor: args.actor });
        for (let index = 0; index < stackApplications; index += 1) {
          applyActorBuff({
            slot: args.actor.slot,
            sourceSlot: args.actor.slot,
            stepId: args.stepId,
            time: args.time,
            gameTime: args.gameTime,
            buffId: effect.buffId,
            label: effect.label ?? effect.buffId,
            hidden: effect.hidden,
            durationSeconds: effect.durationSeconds ?? 0,
            timeScale: effect.timeScale ?? "game",
            effects: resolvedEffects,
            stackGroup: effect.stackGroup,
            maxStacks: effect.maxStacks,
            refreshExistingStacks: effect.refreshExistingStacks,
          });
        }
        continue;
      }

      if (effect.type === "APPLY_BUFF" && effect.target === "team") {
        if ((effect.durationSeconds ?? 0) <= 0) {
          continue;
        }
        const stackApplications = Math.max(1, effect.stacks ?? 1);
        const resolvedEffects = resolveBuffEffectsForActor({ effect, actor: args.actor });
        for (const teammate of party) {
          for (let index = 0; index < stackApplications; index += 1) {
            applyActorBuff({
              slot: teammate.slot,
              sourceSlot: args.actor.slot,
              stepId: args.stepId,
              time: args.time,
              gameTime: args.gameTime,
              buffId: effect.buffId,
              label: effect.label ?? effect.buffId,
              hidden: effect.hidden,
              durationSeconds: effect.durationSeconds ?? 0,
              timeScale: effect.timeScale ?? "game",
              effects: resolvedEffects,
              stackGroup: effect.stackGroup,
              maxStacks: effect.maxStacks,
              refreshExistingStacks: effect.refreshExistingStacks,
            });
          }
        }
        continue;
      }

      if (effect.type === "REMOVE_BUFF") {
        if (effect.target === "self" && effect.buffId === MELTING_FLAME_STATUS_ID) {
          consumeMeltingFlameStacks({
            slot: args.actor.slot,
            stacks: Math.max(1, effect.stacks ?? 1),
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            label: `${args.actor.characterName}: Melting Flame -${Math.max(1, effect.stacks ?? 1)}`,
          });
          continue;
        }

        if (effect.target === "self") {
          if ((effect.stacks ?? 0) > 0) {
            removeActorBuffStacks({
              slot: args.actor.slot,
              buffId: effect.buffId,
              stacks: effect.stacks ?? 1,
            });
            continue;
          }
          removeActorBuff({
            slot: args.actor.slot,
            buffId: effect.buffId,
          });
          continue;
        }

        if (args.blockEnemyTargetEffects) {
          continue;
        }
        removeEnemyStatus({
          statusId: effect.buffId,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
        });
        continue;
      }

      if (effect.type === "APPLY_BUFF" && effect.target === "enemy") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        if (
          effect.requiresEnemyStatusId
          && !hasUnifiedStatus({
            statusId: effect.requiresEnemyStatusId,
            target: "enemy",
            sourceSlot: args.actor.slot,
            realTime: args.time,
            gameTime: args.gameTime,
          })
        ) {
          continue;
        }
        if ((effect.durationSeconds ?? 0) <= 0) {
          continue;
        }
        applyEnemyBuff({
          buffId: effect.buffId,
          label: effect.label ?? effect.buffId,
          effects: resolveBuffEffectsForActor({ effect, actor: args.actor }),
          durationSeconds: effect.durationSeconds ?? 0,
          timeScale: effect.timeScale ?? "game",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
        });
        continue;
      }

      if (effect.type === "APPLY_ARTS_INFLICTION") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const stacks = Math.max(1, effect.stacks ?? 1);
        const durationSeconds = effect.durationSeconds ?? ARTS_INFLICTION_DURATION_SECONDS;
        const currentInfliction = getEnemyArtsInfliction();
        if (!currentInfliction) {
          setEnemyArtsInfliction({
            element: effect.element,
            stacks,
            expiresAtGameTime: args.gameTime + durationSeconds,
          });
        } else if (currentInfliction.element === effect.element) {
          queueArtsBurstFromInfliction({
            element: effect.element,
            sourceSlot: args.actor.slot,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            triggerSlots: args.triggerSlots,
          });
          setEnemyArtsInfliction({
            element: effect.element,
            stacks: Math.min(4, currentInfliction.stacks + stacks),
            expiresAtGameTime: args.gameTime + durationSeconds,
          });
        } else {
          const previousStacks = currentInfliction.stacks;
          const inflictionConsumedEvent: RotationCombatEvent = {
            type: "ARTS_INFLICTION_CONSUMED",
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            slot: args.actor.slot,
            sourceSlot: args.actor.slot,
            target: "enemy",
            label: `${currentInfliction.element} Infliction Consumed`,
            consumedElement: currentInfliction.element,
            consumedStacks: previousStacks,
          };
          emitEvent(inflictionConsumedEvent);
          dispatchPassiveListeners(inflictionConsumedEvent, args.triggerSlots);
          setEnemyArtsInfliction(null);

          if (effect.element === "Heat") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Combustion",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              linkSourceStepId: resolvedLinkSourceStepId,
            });
            applyReaction({
              reaction: "Combustion",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
              sourceCommandId: args.sourceCommandId,
              sourceCommandName: args.sourceCommandName,
            });
          } else if (effect.element === "Cryo") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Solidification",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              linkSourceStepId: resolvedLinkSourceStepId,
            });
            applyReaction({
              reaction: "Solidification",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
              sourceCommandId: args.sourceCommandId,
              sourceCommandName: args.sourceCommandName,
            });
          } else if (effect.element === "Electric") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Electrification",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              linkSourceStepId: resolvedLinkSourceStepId,
            });
            applyReaction({
              reaction: "Electrification",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
              sourceCommandId: args.sourceCommandId,
              sourceCommandName: args.sourceCommandName,
            });
          } else if (effect.element === "Nature") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Corrosion",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              linkSourceStepId: resolvedLinkSourceStepId,
            });
            applyReaction({
              reaction: "Corrosion",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
              sourceCommandId: args.sourceCommandId,
              sourceCommandName: args.sourceCommandName,
            });
          }
        }

        const inflictionEvent: RotationCombatEvent = {
          type: "ARTS_INFLICTION_APPLIED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          target: "enemy",
          label: `${effect.element} Infliction Applied`,
          consumedElement: effect.element,
        };
        emitEvent(inflictionEvent);
        dispatchPassiveListeners(inflictionEvent, args.triggerSlots);

        if (effect.element === "Heat") {
          emitEvent({
            type: "HEAT_INFLICTION_APPLIED",
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            target: "enemy",
            label: "Heat Infliction Applied",
          });

        }

        continue;
      }

      if (effect.type === "APPLY_REACTION") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        if (
          effect.reaction === "Lift"
          || effect.reaction === "Knockdown"
          || effect.reaction === "Crush"
          || effect.reaction === "Breach"
        ) {
          applyPhysicalReaction({
            reaction: effect.reaction,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            sourceSlot: args.actor.slot,
            triggerSlots: args.triggerSlots,
            forceApply: effect.forceApply ?? false,
            reactionDamage: effect.reactionDamage ?? true,
            baseMultiplier: effect.baseMultiplier,
            linkSourceStepId: resolvedLinkSourceStepId,
            sourceCommandId: args.sourceCommandId,
            sourceCommandName: args.sourceCommandName,
          });
          continue;
        }

        if (effect.reactionDamage) {
          triggerReactionDamageFromConsumedInflictions({
            reaction: effect.reaction,
            consumedStacks: Math.max(1, effect.level ?? 1),
            sourceSlot: args.actor.slot,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            linkSourceStepId: resolvedLinkSourceStepId,
          });
        }
        applyReaction({
          reaction: effect.reaction,
          level: effect.level ?? 1,
          durationSeconds: effect.durationSeconds,
          debuffScaleMultiplier: effect.debuffScaleMultiplier,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        continue;
      }

      if (effect.type === "APPLY_CUSTOM_REACTION" && effect.reactionId === "YVONNE_BATTLE_SKILL_FREEZE") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const currentInfliction = getEnemyArtsInfliction();
        if (!currentInfliction) {
          continue;
        }

        // Yvonne's battle skill only consumes Cryo/Nature inflictions into Solidification.
        if (currentInfliction.element !== "Cryo" && currentInfliction.element !== "Nature") {
          continue;
        }

        const consumedStacks = Math.max(1, Math.min(4, currentInfliction.stacks));
        const inflictionConsumedEvent: RotationCombatEvent = {
          type: "ARTS_INFLICTION_CONSUMED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          target: "enemy",
          label: `${currentInfliction.element} Infliction Consumed`,
          consumedElement: currentInfliction.element,
          consumedStacks,
        };
        emitEvent(inflictionConsumedEvent);
        dispatchPassiveListeners(inflictionConsumedEvent, args.triggerSlots);
        setEnemyArtsInfliction(null);

        applyReaction({
          reaction: "Solidification",
          level: consumedStacks,
          durationSeconds: effect.durationSeconds,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });

        const customHit: ResolvedCommandHitAtLevel = {
          name: "Freeze Trigger",
          multiplier: (effect.baseMultiplier ?? 0) + (effect.bonusMultiplierPerConsumedStack ?? 0) * consumedStacks,
          flatAmount: 0,
          scalingStat: "ATK",
          stagger: effect.stagger ?? 0,
          spGenerated: 0,
          spReturned: 0,
          offsetFrames: 0,
          registerOffsetFrames: 0,
          times: 1,
          repeatIntervalFrames: 0,
          repeatRegisterOffsetWithInterval: true,
          energyReturn: (effect.baseEnergyReturn ?? 0) + (effect.bonusEnergyReturnPerConsumedStack ?? 0) * consumedStacks,
          attackType: "BATTLE_SKILL",
          damageType: "Cryo",
          noCrit: false,
          requiresControlledOperator: false,
          effects: [],
          postEffects: [],
        };

        pushResolvedTimelineHit({
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          commandId: args.sourceCommandId ?? "__custom_reaction",
          commandName: args.sourceCommandName ?? "Custom Reaction",
          hitIndex: 0,
          hit: customHit,
          hitName: customHit.name,
          time: args.time,
          gameTime: args.gameTime,
          linkSourceStepId: resolvedLinkSourceStepId,
        });

        const battleOrComboEvent: RotationCombatEvent = {
          type: "BATTLE_OR_COMBO_HIT",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: `${args.actor.characterName} Battle Hit`,
          commandAttackType: "BATTLE_SKILL",
          damageType: customHit.damageType,
          expectedCritCount: Math.max(0, getEffectiveActorMods(args.actor, args.time, args.gameTime).CRIT_RATE_PCT),
        };
        emitEvent(battleOrComboEvent);
        dispatchPassiveListeners(battleOrComboEvent, args.triggerSlots);

        if (
          isSelfUniqueTalentEnabled(args.actor, "yvonne_barrage_of_technology_1")
          || isSelfUniqueTalentEnabled(args.actor, "yvonne_barrage_of_technology_2")
        ) {
          applyActorBuff({
            slot: args.actor.slot,
            sourceSlot: args.actor.slot,
            stepId: args.stepId,
            time: args.time,
            gameTime: args.gameTime,
            buffId: "yvonne_barrage_of_technology",
            label: "Barrage of Technology",
            hidden: false,
            durationSeconds: 15,
            timeScale: "game",
            effects: {
              FINAL_STRIKE_DMG_PCT: 0.5,
            },
          });
        }
      }
    }
  };

  const runResolvedHitHooks = (args: {
    occurrence: HitOccurrence;
    isControlledOperatorHit: boolean;
    occurrenceIndex: number;
    triggerSlots: CharacterCombatSnapshot["slot"][];
  }) => {
    for (const member of party) {
      const hooks = member.combatHooks;
      if (!hooks?.onResolvedHit) {
        continue;
      }

      hooks.onResolvedHit({
        self: {
          slot: member.slot,
          characterId: member.characterId,
          characterName: member.characterName,
        },
        time: args.occurrence.time,
        gameTime: args.occurrence.gameTime,
        stepId: args.occurrence.action.stepId,
        source: {
          slot: args.occurrence.actor.slot,
          characterId: args.occurrence.actor.characterId,
          characterName: args.occurrence.actor.characterName,
          commandId: args.occurrence.command.id,
          commandName: args.occurrence.command.name,
          hitIndex: args.occurrence.hitIndex,
          hitName: args.occurrence.hit.name,
          isControlledOperatorHit: args.isControlledOperatorHit,
        },
        flags: {
          isFinalStrikeOfBasicSequence: args.occurrence.isFinalStrikeOfBasicSequence,
          isFinisherHit: args.occurrence.isFinisherHit,
        },
        state: {
          getEnemyArtsInfliction: () => getEnemyArtsInfliction(),
          setEnemyArtsInfliction: (value: CombatHookEnemyArtsInflictionState | null) => {
            setEnemyArtsInfliction(value ? { ...value } : null);
          },
          hasEnemyStatus: (statusId: string) =>
            hasUnifiedStatus({
              statusId,
              target: "enemy",
              sourceSlot: member.slot,
              realTime: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
            }),
          hasStatus: (hookArgs) =>
            hasUnifiedStatus({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              realTime: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
            }),
          hasSelfBuff: (buffId: string) =>
            getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            ),
          getSelfMeltingFlameStacks: () => getMeltingFlameStacks(member.slot),
          gainSelfMeltingFlameStacks: (stacks: number, label?: string) => {
            gainMeltingFlameStacks({
              slot: member.slot,
              stacks,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: args.occurrence.action.stepId,
              label,
            });
          },
          isSelfUniqueTalentEnabled: (key: string) =>
            isUniqueTalentEnabled(key, {
              ascensionStage: member.ascensionStage,
              uniqueTalentToggles: member.uniqueTalentToggles,
                uniqueTalentConditions: member.uniqueTalentConditions,
                uniqueTalentDefaults: member.uniqueTalentDefaults,
              }),
          isSelfPotentialActive: (level: number) => member.potentialLevel >= level,
          getSelfAttr: (attr: "STR" | "AGI" | "INT" | "WIL") => member.attrs[attr],
          getSelfCommandHit: (commandId: string, hitIndex: number) => {
            const command = member.commands.find((entry) => entry.id === commandId);
            return command?.hits[hitIndex] ?? null;
          },
          applySelfBuff: (hookArgs) => {
            applyActorBuff({
              slot: member.slot,
              sourceSlot: member.slot,
              stepId: args.occurrence.action.stepId,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              buffId: hookArgs.buffId,
              label: hookArgs.label,
              hidden: hookArgs.hidden,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale ?? "game",
              effects: hookArgs.effects,
              stackGroup: hookArgs.stackGroup,
              maxStacks: hookArgs.maxStacks,
              refreshExistingStacks: hookArgs.refreshExistingStacks,
            });
          },
          applyOtherTeammatesBuff: (hookArgs) => {
            for (const teammate of party) {
              if (teammate.slot === member.slot) {
                continue;
              }
              if (hookArgs.classes && hookArgs.classes.length > 0 && !hookArgs.classes.includes(teammate.characterClass)) {
                continue;
              }

              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: args.occurrence.action.stepId,
                time: args.occurrence.time,
                gameTime: args.occurrence.gameTime,
                buffId: hookArgs.buffId,
                label: hookArgs.label,
                hidden: hookArgs.hidden,
                durationSeconds: hookArgs.durationSeconds,
                timeScale: hookArgs.timeScale ?? "game",
                effects: hookArgs.effects,
                stackGroup: hookArgs.stackGroup,
                maxStacks: hookArgs.maxStacks,
                refreshExistingStacks: hookArgs.refreshExistingStacks,
              });
            }
          },
          applyEnemyDebuff: (hookArgs) => {
            applyEnemyDebuff({
              debuffId: hookArgs.debuffId,
              label: hookArgs.label,
              stat: hookArgs.stat,
              value: hookArgs.value,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale ?? "game",
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: args.occurrence.action.stepId,
              sourceSlot: member.slot,
            });
          },
          grantReturnedSp: (amount: number, label: string) => {
            if (amount <= 0) {
              return;
            }
            const event: RotationCombatEvent = {
              type: "SKILL_SP_RECOVERED",
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: args.occurrence.action.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
            };
            emitEvent(event);
            dispatchPassiveListeners(event);
          },
          gainTeamLinkStacks: (hookArgs) => {
            gainTeamLinkStacks({
              stacks: hookArgs.stacks,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale ?? "game",
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              sourceSlot: member.slot,
              stepId: args.occurrence.action.stepId,
              label: hookArgs.label,
            });
          },
          gainTeamStatusStacks: (hookArgs) =>
            gainTeamStatusStacks({
              statusId: hookArgs.statusId,
              label: hookArgs.label,
              stacks: hookArgs.stacks,
              maxStacks: hookArgs.maxStacks,
              refreshExistingStacks: hookArgs.refreshExistingStacks,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale ?? "game",
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              sourceSlot: member.slot,
              stepId: args.occurrence.action.stepId,
            }),
          consumeTeamStatusStacks: (hookArgs) =>
            consumeTeamStatusStacks({
              statusId: hookArgs.statusId,
              stacks: hookArgs.stacks,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              sourceSlot: member.slot,
              stepId: args.occurrence.action.stepId,
            }),
          getTeamStatusStackCount: (statusId: string) =>
            runtimeStatuses.filter((status) =>
              status.scope === "team" && status.kind === "team_status" && status.id === statusId,
            ).length,
          applyCommandHitHealing: (hookArgs) =>
            applyCommandHitHealing({
              sourceActor: member,
              commandId: hookArgs.commandId,
              hitIndex: hookArgs.hitIndex,
              target: hookArgs.target ?? "controlled",
              label: hookArgs.label,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: args.occurrence.action.stepId,
            }),
          markTriggerOnce: (key: string) => {
            const onceKey = `hook:${member.slot}:${key}`;
            if (setTriggerFlags.has(onceKey)) {
              return false;
            }
            setTriggerFlags.add(onceKey);
            return true;
          },
          repeatCurrentHitOnce: (key: string) => {
            const repeatKey = `${args.occurrence.action.stepId}:${member.slot}:${key}`;
            if (repeatedHitKeys.has(repeatKey)) {
              return false;
            }

            repeatedHitKeys.add(repeatKey);
            occurrences.splice(args.occurrenceIndex + 1, 0, {
              ...args.occurrence,
            });
            return true;
          },
          triggerSelfCombo: (hookArgs) => {
            const triggered = triggerComboIfAvailable({
              slot: member.slot,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              sourceStepId: args.occurrence.action.stepId,
              sourceEventType:
                (hookArgs?.sourceEventType as RotationCombatEvent["type"]) ?? "BATTLE_OR_COMBO_HIT",
              label: hookArgs?.label ?? `${member.characterName} Combo Triggered`,
              comboCommandId: hookArgs?.comboCommandId,
            });
            if (triggered && !args.triggerSlots.includes(member.slot)) {
              args.triggerSlots.push(member.slot);
            }
            return triggered;
          },
          emitEvent: (event) => {
            emitEvent({
              type: event.type as RotationCombatEvent["type"],
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: args.occurrence.action.stepId,
              slot: member.slot,
              target: event.target,
              label: event.label,
              stackDelta: event.stackDelta,
              durationSeconds: event.durationSeconds,
              timeScale: event.timeScale,
            });
          },
          applyEffects: (hookArgs) => {
            applyHitEffects({
              effects: hookArgs.effects,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              stepId: hookArgs.stepId ?? args.occurrence.action.stepId,
              actor: member,
              triggerSlots: args.triggerSlots,
            });
          },
        },
      });
    }
  };

  const occurrences: Array<ActionOccurrence | ActionEndOccurrence | HitOccurrence> = [];

  for (const member of party) {
    actorMaxHpBySlot.set(member.slot, member.maxHp);
    actorCurrentHpBySlot.set(member.slot, member.maxHp);
    recordActorState(member.slot, 0, 0);
  }
  for (const member of party) {
    const consumableId = args.battleStartConsumableIdsBySlot?.[member.slot] ?? null;
    if (!consumableId) {
      continue;
    }
    const consumable = CONSUMABLE_BY_ID[consumableId];
    if (!consumable) {
      continue;
    }
    applyActorBuff({
      slot: member.slot,
      sourceSlot: member.slot,
      stepId: `__battle_start_consumable:${member.slot}`,
      time: 0,
      gameTime: 0,
      buffId: `consumable:${consumable.id}`,
      label: consumable.name,
      durationSeconds: consumable.durationSeconds,
      timeScale: "game",
      effects: consumable.effects,
    });
  }
  recordEnemyState(0, 0);

  for (const action of actions) {
    const actor = partyBySlot.get(action.slot);
    if (!actor) {
      continue;
    }

    const command = actor.commands.find((entry) => entry.id === action.commandId);
    if (!command) {
      continue;
    }

    occurrences.push({
      kind: "action-start",
      time: action.realStartTime,
      gameTime: action.startTime,
      actor,
      command,
      action,
    });

    occurrences.push({
      kind: "action-end",
      time: action.realEndTime,
      gameTime: action.endTime,
      actor,
      command,
      action,
    });

    if (action.missed || action.interrupted) {
      continue;
    }

    for (let hitIndex = 0; hitIndex < command.hits.length; hitIndex += 1) {
      const hit = command.hits[hitIndex];
      if (!hit) {
        continue;
      }

      for (let repeatIndex = 0; repeatIndex < hit.times; repeatIndex += 1) {
        const hitOffset =
          hit.offsetFrames / 60 +
          (repeatIndex * hit.repeatIntervalFrames) / 60;
        const registerRepeatOffset = hit.repeatRegisterOffsetWithInterval
          ? (repeatIndex * hit.repeatIntervalFrames) / 60
          : 0;
        const registerOffset =
          hit.registerOffsetFrames / 60 +
          registerRepeatOffset;
        const registerTime = timeContext.getShiftedEndTime(action.realStartTime, registerOffset, action.stepId);
        const hitTime = timeContext.getShiftedEndTime(action.realStartTime, hitOffset, action.stepId);
        if (registerTime > action.realEndTime + 0.0001) {
          continue;
        }
        const registerGameTime = timeContext.toGameTime(registerTime);
        const gameTime = timeContext.toGameTime(hitTime);

        occurrences.push({
          kind: "hit",
          time: hitTime,
          gameTime,
          actor,
          command,
          action,
          hit,
          hitIndex,
          repeatIndex,
          isFinalStrikeOfBasicSequence:
            command.attackType === "BASIC_ATTACK" &&
            (
              command.basicAttackVariant === "final_strike" ||
              (
                command.sequenceSegmentIndex != null &&
                command.sequenceSegmentTotal != null &&
                command.sequenceSegmentIndex === command.sequenceSegmentTotal
              )
            ) &&
            hitIndex === command.hits.length - 1 &&
            repeatIndex === hit.times - 1,
          isFinisherHit:
            command.attackType === "BASIC_ATTACK" &&
            command.basicAttackVariant === "finisher" &&
            hitIndex === command.hits.length - 1 &&
            repeatIndex === hit.times - 1,
        });
      }
    }
  }

  occurrences.sort((left, right) => {
    if (left.time !== right.time) {
      return left.time - right.time;
    }

    if (left.kind !== right.kind) {
      const priority = (kind: ActionOccurrence["kind"] | ActionEndOccurrence["kind"] | HitOccurrence["kind"]) => {
        if (kind === "action-start") return 0;
        if (kind === "hit") return 1;
        return 2;
      };
      return priority(left.kind) - priority(right.kind);
    }

    return left.actor.slot - right.actor.slot;
  });

  for (const action of actions) {
    if (action.interrupted) {
      const existing = interruptedAtByStepId.get(action.stepId);
      if (existing == null || action.realStartTime < existing) {
        interruptedAtByStepId.set(action.stepId, action.realStartTime);
      }
    }
    for (const interruptAt of enemyInterruptTimes) {
      if (action.realStartTime < interruptAt - 0.0001) {
        const existing = interruptedAtByStepId.get(action.stepId);
        if (existing == null || interruptAt < existing) {
          interruptedAtByStepId.set(action.stepId, interruptAt);
        }
        break;
      }
    }
  }

  for (let occurrenceIndex = 0; occurrenceIndex < occurrences.length; occurrenceIndex += 1) {
    const occurrence = occurrences[occurrenceIndex]!;
    flushEnemyInterruptedCommandEventsUpTo({ time: occurrence.time });
    processTimedEffectStatusesUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });
    processReactionTicksUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });
    processPendingArtsBurstsUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });
    processPendingExecuteHitsUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });
    cleanupStateAt(occurrence.time, occurrence.gameTime);

    if (occurrence.kind === "action-start") {
      if (occurrence.command.genericActionType === "switch") {
        const lockedUntil = switchBackLockedUntilBySlot.get(occurrence.actor.slot) ?? 0;
        if (
          occurrence.actor.slot !== controlledOperatorSlot &&
          occurrence.time >= lockedUntil - 0.001
        ) {
          const previousControlledSlot = controlledOperatorSlot;
          controlledOperatorSlot = occurrence.actor.slot;
          switchBackLockedUntilBySlot.set(previousControlledSlot, occurrence.time + SWITCH_BACK_COOLDOWN_SECONDS);
        }
        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
        continue;
      }

      if (occurrence.command.attackType === "BATTLE_SKILL") {
        const linkStacks = consumeTeamLinkStacks({ time: occurrence.time, gameTime: occurrence.gameTime });
        if (linkStacks > 0) {
          commandLinkedStacksByStepId.set(occurrence.action.stepId, Math.min(4, linkStacks));
        }

        const event: RotationCombatEvent = {
          type: "BATTLE_SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          slot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Battle Skill Cast`,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);
      }

      if (occurrence.command.attackType === "ULTIMATE") {
        const linkStacks = consumeTeamLinkStacks({ time: occurrence.time, gameTime: occurrence.gameTime });
        if (linkStacks > 0) {
          commandLinkedStacksByStepId.set(occurrence.action.stepId, Math.min(4, linkStacks));
        }

        const event: RotationCombatEvent = {
          type: "ULTIMATE_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          slot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Ultimate Cast`,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);

        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
      }

      if (occurrence.command.attackType === "COMBO_SKILL") {
        const cooldownOwnerId = occurrence.command.comboCooldownOwnerCommandId ?? occurrence.command.id;
        if (
          occurrence.command.id === cooldownOwnerId
          && occurrence.command.comboCooldownSeconds > 0
          && occurrence.command.comboCooldownStartsAt === "start"
        ) {
          const cooldownStart = occurrence.command.comboCooldownTimeScale === "real"
            ? occurrence.action.realStartTime
            : occurrence.action.startTime;
          comboCooldownUntilBySlot.set(
            occurrence.actor.slot,
            cooldownStart + occurrence.command.comboCooldownSeconds,
          );
          pendingComboCooldownBySlot.delete(occurrence.actor.slot);
        }

        const activeWindow = activeComboWindowBySlot.get(occurrence.actor.slot);
        if (
          activeWindow
          && activeWindow.commandId === occurrence.command.id
          && activeWindow.readyAt <= occurrence.time
          && activeWindow.expiresAt > occurrence.time
        ) {
          activeWindow.consumedAt = occurrence.time;
          if (
            activeWindow.perfectTimingStartAt != null
            && activeWindow.perfectTimingEndAt != null
            && occurrence.time >= activeWindow.perfectTimingStartAt
            && occurrence.time <= activeWindow.perfectTimingEndAt
          ) {
            activeWindow.perfectTimingTriggered = true;
            perfectTimingStepIds.add(occurrence.action.stepId);
          }
          activeComboWindowBySlot.delete(occurrence.actor.slot);
        }

      }

      if ((occurrence.command.initialEffects?.length ?? 0) > 0) {
        applyHitEffects({
          effects: occurrence.command.initialEffects ?? [],
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          actor: occurrence.actor,
          triggerSlots: [],
        });
      }

      continue;
    }

    if (occurrence.kind === "action-end") {
      const interruptedAt = interruptedAtByStepId.get(occurrence.action.stepId);
      if (interruptedAt != null && occurrence.time >= interruptedAt - 0.0001) {
        continue;
      }
      if (occurrence.command.attackType === "COMBO_SKILL") {
        const cooldownOwnerId = occurrence.command.comboCooldownOwnerCommandId ?? occurrence.command.id;
        if (
          occurrence.command.id === cooldownOwnerId
          && occurrence.command.comboCooldownSeconds > 0
          && occurrence.command.comboCooldownStartsAt === "end"
        ) {
          pendingComboCooldownBySlot.set(occurrence.actor.slot, {
            durationSeconds: occurrence.command.comboCooldownSeconds,
            timeScale: occurrence.command.comboCooldownTimeScale,
          });
          comboCooldownUntilBySlot.delete(occurrence.actor.slot);
          cleanupStateAt(occurrence.time, occurrence.gameTime);
        }
      }

      const recoveredSp = occurrence.command.spGeneratedOnEnd + occurrence.command.spReturnedOnEnd;
      if (
        occurrence.command.attackType !== "BASIC_ATTACK"
        && occurrence.command.attackType !== "GENERIC"
        && occurrence.command.attackType !== "TALENT"
        && recoveredSp > 0
      ) {
        const event: RotationCombatEvent = {
          type: "SKILL_SP_RECOVERED",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Skill Recovered SP`,
          amount: recoveredSp,
          commandAttackType: occurrence.command.attackType,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);
      }
      continue;
    }

    const interruptedAt = interruptedAtByStepId.get(occurrence.action.stepId);
    if (interruptedAt != null && occurrence.time >= interruptedAt - 0.0001) {
      continue;
    }

    const executeCondition = occurrence.hit.executeCondition;
    const repeatHitChainKey = `${occurrence.action.stepId}:${occurrence.command.id}:${occurrence.hitIndex}`;
    if (terminatedRepeatHitChains.has(repeatHitChainKey)) {
      continue;
    }

    if (executeCondition) {
      if (
        executeCondition.condition
        && !evaluateCombatCondition({
          condition: executeCondition.condition,
          actor: occurrence.actor,
          realTime: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          isCommandHit: true,
        })
      ) {
        terminatedRepeatHitChains.add(repeatHitChainKey);
        continue;
      }

      if (executeCondition.requiresSelfBuffId) {
        const stackCount = getActorBuffStackCount({
          slot: occurrence.actor.slot,
          buffId: executeCondition.requiresSelfBuffId,
        });
        if (executeCondition.requiresStacksExact != null && stackCount !== executeCondition.requiresStacksExact) {
          terminatedRepeatHitChains.add(repeatHitChainKey);
          continue;
        }
        if (executeCondition.requiresStacksAtLeast != null && stackCount < executeCondition.requiresStacksAtLeast) {
          terminatedRepeatHitChains.add(repeatHitChainKey);
          continue;
        }
      }

      if (
        executeCondition.requiresEnemyStatusId
        && !hasUnifiedStatus({
          statusId: executeCondition.requiresEnemyStatusId,
          target: "enemy",
          sourceSlot: occurrence.actor.slot,
          realTime: occurrence.time,
          gameTime: occurrence.gameTime,
        })
      ) {
        terminatedRepeatHitChains.add(repeatHitChainKey);
        continue;
      }
    }

    const triggeredComboSlots: CharacterCombatSnapshot["slot"][] = [];
    const blockedByEnemyInvulnerability =
      occurrence.hit.damageType !== "Healing"
      && isEnemyHitBlocked({
        sourceSlot: occurrence.actor.slot,
        stepId: occurrence.action.stepId,
        commandId: occurrence.command.id,
        time: occurrence.time,
        gameTime: occurrence.gameTime,
      });

    applyHitEffects({
      effects: occurrence.hit.effects,
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      stepId: occurrence.action.stepId,
      actor: occurrence.actor,
      triggerSlots: triggeredComboSlots,
      sourceCommandId: occurrence.command.id,
      sourceCommandName: occurrence.command.name,
      linkSourceStepId: occurrence.action.stepId,
      isCommandHit: true,
      blockEnemyTargetEffects: blockedByEnemyInvulnerability,
    });
    if (blockedByEnemyInvulnerability) {
      applyHitEffects({
        effects: occurrence.hit.postEffects ?? [],
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        actor: occurrence.actor,
        triggerSlots: triggeredComboSlots,
        sourceCommandId: occurrence.command.id,
        sourceCommandName: occurrence.command.name,
        linkSourceStepId: occurrence.action.stepId,
        isCommandHit: true,
        blockEnemyTargetEffects: true,
      });
      if (occurrence.hit.multiplier === 0 && occurrence.hit.flatAmount === 0) {
        pushUtilityTimelineHit({
          sourceSlot: occurrence.actor.slot,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          hitIndex: occurrence.hitIndex,
          hit: occurrence.hit,
          hitName: occurrence.hit.name,
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          triggerSlots: triggeredComboSlots,
        });
      }
      recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
      recordEnemyState(occurrence.time, occurrence.gameTime);
      continue;
    }

    let consumedArtsInflictionStacksForBonus = 0;
    let effectiveHitMultiplier = occurrence.hit.multiplier;
    let effectiveHitFlatAmount = occurrence.hit.flatAmount;
    let effectiveHitStagger = occurrence.hit.stagger;
    let effectiveHitSpGenerated = occurrence.hit.spGenerated;
    let effectiveHitSpReturned = occurrence.hit.spReturned;
    let effectiveHitEnergyReturn = occurrence.hit.energyReturn;
    if (occurrence.hit.accumulator?.type === "consume_enemy_status") {
      const artsInflictionBeforeConsume =
        occurrence.hit.accumulator.statusId === ARTS_INFLICTION_STATUS_ID
          ? getEnemyArtsInfliction()
          : null;
      const consumed = consumeEnemyStatusForAccumulator({
        statusId: occurrence.hit.accumulator.statusId,
        maxConsumed: occurrence.hit.accumulator.maxConsumed,
        useLevelAsStacks: occurrence.hit.accumulator.useLevelAsStacks,
        realTime: occurrence.time,
        gameTime: occurrence.gameTime,
      });
      if (consumed > 0) {
        if (occurrence.hit.accumulator.statusId === ARTS_INFLICTION_STATUS_ID) {
          consumedArtsInflictionStacksForBonus = consumed;
          const consumedElement = artsInflictionBeforeConsume?.element;
          if (consumedElement) {
            const inflictionConsumedEvent: RotationCombatEvent = {
              type: "ARTS_INFLICTION_CONSUMED",
              time: occurrence.time,
              gameTime: occurrence.gameTime,
              stepId: occurrence.action.stepId,
              slot: occurrence.actor.slot,
              sourceSlot: occurrence.actor.slot,
              target: "enemy",
              label: `${consumedElement} Infliction Consumed`,
              consumedElement,
              consumedStacks: consumed,
            };
            emitEvent(inflictionConsumedEvent);
            dispatchPassiveListeners(inflictionConsumedEvent);
          }
        }
        effectiveHitMultiplier += occurrence.hit.accumulator.multiplier * consumed;
        effectiveHitFlatAmount += occurrence.hit.accumulator.flatAmount * consumed;
        effectiveHitStagger += occurrence.hit.accumulator.stagger * consumed;
        effectiveHitSpGenerated += occurrence.hit.accumulator.spGenerated * consumed;
        effectiveHitSpReturned += occurrence.hit.accumulator.spReturned * consumed;
        effectiveHitEnergyReturn += occurrence.hit.accumulator.energyReturn * consumed;
      }
    }
    const effectiveHit: ResolvedCommandHitAtLevel = {
      ...occurrence.hit,
      multiplier: effectiveHitMultiplier,
      flatAmount: effectiveHitFlatAmount,
      stagger: effectiveHitStagger,
      spGenerated: effectiveHitSpGenerated,
      spReturned: effectiveHitSpReturned,
      energyReturn: effectiveHitEnergyReturn,
    };
    const effectiveEnemyMods = getEffectiveEnemyMods(
      occurrence.actor,
      occurrence.time,
      occurrence.gameTime,
    );
    const baseActorMods = getEffectiveActorMods(
      occurrence.actor,
      occurrence.time,
      occurrence.gameTime,
    );
    const effectiveActorMods = addModifierDelta(baseActorMods, occurrence.command.commandModifiers ?? {});
    const effectiveFinalAtk = getEffectiveFinalAtk(occurrence.actor, effectiveActorMods);
    const linkStacks = commandLinkedStacksByStepId.get(occurrence.action.stepId) ?? 0;
    const linkMultiplier = getLinkBonusForAttackType(linkStacks, occurrence.hit.attackType);

    args.debug?.onResolvedHit?.({
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      occurrence,
      effectiveActorMods,
      effectiveEnemyMods,
      linkMultiplier,
      actorBuffs: getActorBuffs().filter((buff) => buff.slot === occurrence.actor.slot),
      enemyDebuffs: [...timedEnemyDebuffs],
      enemyStatuses: getEnemyStatuses(),
      teamLinkStacks: runtimeStatuses
        .filter((status) => status.scope === "team" && status.kind === "link_status" && status.id === "team_link")
        .map((status) => ({
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
        })),
    });

    const damageBreakdown = calculateResolvedHitDamage({
      finalAtk: effectiveFinalAtk,
      attackType: effectiveHit.attackType,
      basicAttackVariant: occurrence.command.basicAttackVariant,
      damageType: effectiveHit.damageType,
      hit: effectiveHit,
      attackerMods: effectiveActorMods,
      enemyMods: effectiveEnemyMods,
      enemyStats,
      noCrit: effectiveHit.noCrit,
    });
    const isHealingHit = occurrence.hit.damageType === "Healing";
    const critRigMode = critRigModeByHitKey.get(
      `${occurrence.action.stepId}:${occurrence.hitIndex}:${occurrence.repeatIndex}`,
    );
    advanceEnemyStaggerTo({ time: occurrence.time, gameTime: occurrence.gameTime });
    const isEnemyStaggered = enemyIsStaggeredForEvents;
    const finisherAvailable = hasEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
    const finisherBonusMultiplier =
      isEnemyStaggered && occurrence.isFinisherHit && finisherAvailable ? enemyFinisherMultiplier : 1;
    const staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
    const totalEnemyMultiplier = staggeredMultiplier * finisherBonusMultiplier;
    const noCritDamage = isHealingHit ? 0 : damageBreakdown.noCritDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const critDamage = isHealingHit ? 0 : damageBreakdown.critDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const averageDamage = isHealingHit ? 0 : damageBreakdown.averageDamage * (1 + linkMultiplier) * totalEnemyMultiplier;
    const damage = isHealingHit
      ? 0
      : critRigMode === "force_crit"
        ? critDamage
        : critRigMode === "force_non_crit"
          ? noCritDamage
          : averageDamage;
    const finisherBonusSp =
      !isHealingHit && isEnemyStaggered && occurrence.isFinisherHit && finisherAvailable
        ? enemyFinisherSpGain
        : 0;
    const appliedStagger = isHealingHit
      ? 0
      : applyEnemyStaggerFromHit({
          rawStagger: effectiveHit.stagger,
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          sourceSlot: occurrence.actor.slot,
          triggerSlots: triggeredComboSlots,
        });
    if (finisherBonusSp > 0) {
      removeEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
    }

    if (!isHealingHit) {
      totalDamage += damage;
      if (critRigMode === "force_crit") {
        riggedCritCount += 1;
      }
      damageBySlot.set(occurrence.actor.slot, (damageBySlot.get(occurrence.actor.slot) ?? 0) + damage);
    } else {
      if (occurrence.command.id !== "xaihi_battle_skill") {
        applyCommandHitHealing({
          sourceActor: occurrence.actor,
          commandId: occurrence.command.id,
          hitIndex: occurrence.hitIndex,
          target: "controlled",
          label: `${occurrence.actor.characterName} Healing`,
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
        });
      }
    }

    timeline.push({
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      registerTime: occurrence.command.hits[occurrence.hitIndex]
        ? timeContext.getShiftedEndTime(
            occurrence.action.realStartTime,
            occurrence.hit.registerOffsetFrames / 60 +
              (occurrence.hit.repeatRegisterOffsetWithInterval
                ? (occurrence.repeatIndex * occurrence.hit.repeatIntervalFrames) / 60
                : 0),
            occurrence.action.stepId,
          )
        : occurrence.time,
      registerGameTime: occurrence.command.hits[occurrence.hitIndex]
        ? timeContext.toGameTime(
            timeContext.getShiftedEndTime(
              occurrence.action.realStartTime,
              occurrence.hit.registerOffsetFrames / 60 +
                (occurrence.hit.repeatRegisterOffsetWithInterval
                  ? (occurrence.repeatIndex * occurrence.hit.repeatIntervalFrames) / 60
                  : 0),
              occurrence.action.stepId,
            ),
          )
        : occurrence.gameTime,
      stepId: occurrence.action.stepId,
      slot: occurrence.actor.slot,
      characterName: occurrence.actor.characterName,
      commandId: occurrence.command.id,
      commandName: occurrence.command.name,
      hitIndex: occurrence.hitIndex,
      hitName:
        occurrence.hit.times > 1
          ? `${occurrence.hit.name ?? `Hit ${occurrence.hitIndex + 1}`} #${occurrence.repeatIndex + 1}`
          : occurrence.hit.name,
      damageType: occurrence.hit.damageType,
      multiplier: effectiveHit.multiplier,
      noCritDamage,
      critDamage,
      damage,
      stagger: appliedStagger,
      spGenerated: effectiveHit.spGenerated + finisherBonusSp,
      spReturned: effectiveHit.spReturned,
      energyReturn: effectiveHit.energyReturn,
      requiresControlledOperator: occurrence.hit.requiresControlledOperator,
      triggeredComboSlots,
      critRigMode,
      riggedCrit: critRigMode === "force_crit",
      calculationContext: {
        finalAtk: effectiveFinalAtk,
        attackType: effectiveHit.attackType,
        basicAttackVariant: occurrence.command.basicAttackVariant,
        attackerMods: { ...effectiveActorMods },
        enemyMods: { ...effectiveEnemyMods },
        enemyDef: enemyStats.def,
        hitTimes: 1,
        linkMultiplier,
        consumedArtsInflictionStacksForBonus,
        staggeredMultiplier,
        finisherBonusMultiplier,
        totalEnemyMultiplier,
      },
    });

    applyHitEffects({
      effects: occurrence.hit.postEffects ?? [],
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      stepId: occurrence.action.stepId,
      actor: occurrence.actor,
      triggerSlots: triggeredComboSlots,
      sourceCommandId: occurrence.command.id,
      sourceCommandName: occurrence.command.name,
      linkSourceStepId: occurrence.action.stepId,
      isCommandHit: true,
      blockEnemyTargetEffects: false,
    });

    const isControlledOperatorHit = occurrence.actor.slot === controlledOperatorSlot;

    if (
      (occurrence.command.attackType === "BATTLE_SKILL" || occurrence.command.attackType === "COMBO_SKILL")
    ) {
      const battleOrComboEvent: RotationCombatEvent = {
        type: "BATTLE_OR_COMBO_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        commandId: occurrence.command.id,
        commandName: occurrence.command.name,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        label: `${occurrence.actor.characterName} ${occurrence.command.attackType === "BATTLE_SKILL" ? "Battle" : "Combo"} Hit`,
        commandAttackType: occurrence.command.attackType,
        damageType: occurrence.hit.damageType,
        expectedCritCount: occurrence.hit.noCrit ? 0 : effectiveActorMods.CRIT_RATE_PCT,
      };
      emitEvent(battleOrComboEvent);
      dispatchPassiveListeners(battleOrComboEvent, triggeredComboSlots);
    }

    if (!isHealingHit) {
      emitCritThresholdEvent({
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        expectedCritCount: occurrence.hit.noCrit ? 0 : Math.max(0, effectiveActorMods.CRIT_RATE_PCT),
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        commandId: occurrence.command.id,
        commandName: occurrence.command.name,
        commandAttackType: occurrence.command.attackType,
        damageType: occurrence.hit.damageType,
        triggerSlots: triggeredComboSlots,
        label: `${occurrence.actor.characterName} Crit Threshold`,
      });
    }

    if (
      occurrence.command.attackType !== "BASIC_ATTACK"
      && occurrence.command.attackType !== "GENERIC"
      && occurrence.command.attackType !== "TALENT"
      && (effectiveHit.spGenerated > 0 || effectiveHit.spReturned > 0)
    ) {
      const skillRecoveredEvent: RotationCombatEvent = {
        type: "SKILL_SP_RECOVERED",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        label: `${occurrence.actor.characterName} Skill Recovered SP`,
        amount: effectiveHit.spGenerated + effectiveHit.spReturned,
        commandAttackType: occurrence.command.attackType,
      };
      emitEvent(skillRecoveredEvent);
      dispatchPassiveListeners(skillRecoveredEvent, triggeredComboSlots);
    }

    runResolvedHitHooks({
      occurrence,
      isControlledOperatorHit,
      occurrenceIndex,
      triggerSlots: triggeredComboSlots,
    });

    recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
    recordEnemyState(occurrence.time, occurrence.gameTime);

    if (isControlledOperatorHit && occurrence.isFinalStrikeOfBasicSequence) {
      const finalStrikeEvent: RotationCombatEvent = {
        type: "BASIC_ATTACK_FINAL_STRIKE_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName} Final Strike Hit`,
      };
      emitEvent(finalStrikeEvent);
      dispatchPassiveListeners(finalStrikeEvent, triggeredComboSlots);
    }

    if (
      isControlledOperatorHit
      && occurrence.command.attackType === "BASIC_ATTACK"
      && occurrence.command.basicAttackVariant === "dive_attack"
    ) {
      const diveEvent: RotationCombatEvent = {
        type: "DIVE_ATTACK_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName} Dive Attack Hit`,
      };
      emitEvent(diveEvent);
      dispatchPassiveListeners(diveEvent, triggeredComboSlots);
    }

    if (isControlledOperatorHit && occurrence.isFinisherHit) {
      const finisherEvent: RotationCombatEvent = {
        type: "FINISHER_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName} Finisher Hit`,
      };
      emitEvent(finisherEvent);
      dispatchPassiveListeners(finisherEvent, triggeredComboSlots);
    }
  }

  const finalRealTime = actions.reduce((max, action) => Math.max(max, action.realEndTime), 0);
  const finalGameTime = actions.reduce((max, action) => Math.max(max, action.endTime), 0);
  const finalStatusGameTime = getEffectStatuses().reduce(
    (max, status) => Math.max(
      max,
      status.timeScale === "game" ? status.expiresAt : toGameTimeFromExtensions(status.expiresAt),
    ),
    finalGameTime,
  );
  const finalPendingBurstGameTime = pendingArtsBursts.reduce(
    (max, entry) => Math.max(max, entry.executeGameTime),
    finalStatusGameTime,
  );
  const finalStatusRealTime = Math.max(finalRealTime, toRealTimeFromExtensions(finalPendingBurstGameTime));
  flushEnemyInterruptedCommandEventsUpTo({ time: finalStatusRealTime });
  processReactionTicksUpTo({ realTime: finalStatusRealTime, gameTime: finalStatusGameTime });
  processPendingArtsBurstsUpTo({ realTime: finalStatusRealTime, gameTime: finalPendingBurstGameTime });
  processPendingExecuteHitsUpTo({ realTime: finalStatusRealTime, gameTime: finalStatusGameTime });
  processTimedEffectStatusesUpTo({ realTime: finalStatusRealTime, gameTime: finalStatusGameTime });

  timeline.sort((left, right) => left.time - right.time);
  events.sort((left, right) => left.time - right.time);
  comboWindows.sort((left, right) => left.readyAt - right.readyAt);
  actorStateTimeline.sort((left, right) => left.time - right.time);
  enemyStateTimeline.sort((left, right) => left.time - right.time);

  return {
    totalDamage,
    damageBySlot: party
      .map((member) => ({
        slot: member.slot,
        characterName: member.characterName,
        damage: damageBySlot.get(member.slot) ?? 0,
      }))
      .sort((left, right) => left.slot - right.slot),
    linkEnhancedStepIds: Array.from(commandLinkedStacksByStepId.entries())
      .filter(([, stacks]) => stacks > 0)
      .map(([stepId]) => stepId),
    totalGameTime: finalPendingBurstGameTime,
    totalTime: finalStatusRealTime,
    timeline,
    actions,
    timeExtensions,
    events,
    comboWindows,
    actorStateTimeline,
    enemyStateTimeline,
    enemyActionWindows,
    enemyStaggerDecayRate: staggerDecayRate,
    riggedCritCount,
    comboTriggerDebug,
  };
}
