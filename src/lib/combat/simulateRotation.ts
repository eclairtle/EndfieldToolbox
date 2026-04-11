import { makeBaseModifierStats, type ModifierStats, type ModifierStatKey } from "@/lib/build/stats";
import { isUniqueTalentEnabled } from "@/lib/build/buildConditions";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type {
  ActorCombatStateSnapshot,
  CharacterCombatSnapshot,
  ComboTriggerWindow,
  DamageTimelineEntry,
  EnemyCombatStateSnapshot,
  Rotation,
  RotationCombatEvent,
  RotationSimulationResult,
} from "@/lib/combat/rotation";
import { calculateReactionDamage, calculateResolvedHitDamage } from "@/lib/combat/combatDamage";
import { compileRotationTimeline } from "@/lib/combat/compileRotationTimeline";
import type { CombatHookEnemyArtsInflictionState } from "@/lib/combat/hooks";
import type { ElementType } from "@/data/characters";
import { runGearSetEventListener } from "@/lib/combat/gearSetEffects";
import { runWeaponEventListener } from "@/lib/combat/weaponEffects";
import type {
  CommandHitEffectDefinition,
  ResolvedCommandAtLevel,
  ResolvedCommandHitAtLevel,
  TimeScale,
} from "@/lib/commands";

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

type ArtsReactionKind = "Combustion" | "Corrosion" | "Solidification" | "Electrification";

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

  const latest = [...simulation.actorStateTimeline]
    .filter((entry) => entry.slot === slot && entry.time <= realTime + 0.001)
    .sort((a, b) => b.time - a.time)[0];

  if (!latest) {
    return {
      slot,
      time: realTime,
      gameTime,
      meltingFlameStacks: 0,
      activeBuffs: [],
    };
  }

  return {
    ...latest,
    time: realTime,
    gameTime,
    activeBuffs: latest.activeBuffs.filter((buff) =>
      buff.timeScale === "real" ? buff.expiresAt > realTime : buff.expiresAt > gameTime,
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

  const latest = [...simulation.enemyStateTimeline]
    .filter((entry) => entry.time <= realTime + 0.001)
    .sort((a, b) => b.time - a.time)[0];

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

  return {
    ...latest,
    time: realTime,
    gameTime,
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
  enemyStaggerRecoverySeconds: number;
}): RotationSimulationResult {
  const { rotation, party, enemyStats, enemyMods } = args;

  const partyBySlot = new Map(party.map((member) => [member.slot, member]));
  const { actions, timeExtensions, timeContext } = compileRotationTimeline({ rotation, party });

  const events: RotationCombatEvent[] = [];
  const comboWindows: ComboTriggerWindow[] = [];
  const timeline: DamageTimelineEntry[] = [];
  const actorStateTimeline: ActorCombatStateSnapshot[] = [];
  const enemyStateTimeline: EnemyCombatStateSnapshot[] = [];

  const comboCooldownUntilBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const activeComboWindowBySlot = new Map<CharacterCombatSnapshot["slot"], ComboTriggerWindow>();
  const repeatedHitKeys = new Set<string>();
  const setTriggerFlags = new Set<string>();
  const listenerCooldowns = new Map<string, { expiresAt: number; timeScale: TimeScale }>();
  const listenerCounters = new Map<string, number>();
  const commandLinkMultiplierByStepId = new Map<string, number>();

  let totalDamage = 0;
  const damageBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  let timedEnemyDebuffs: TimedEnemyDebuff[] = [];
  let timedEnemyStatuses: TimedEnemyStatus[] = [];
  let timedActorBuffs: TimedActorBuff[] = [];
  let enemyArtsInfliction: EnemyArtsInflictionState | null = null;
  let timedTeamLinkStacks: TimedTeamLinkStack[] = [];
  const meltingFlameStacksBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  let controlledOperatorSlot: CharacterCombatSnapshot["slot"] = 0;
  const switchBackLockedUntilBySlot = new Map<CharacterCombatSnapshot["slot"], number>();

  const findSlotByCharacterId = (characterId: string) =>
    party.find((member) => member.characterId === characterId)?.slot;

  const toRealTimeFromExtensions = (gameTime: number) => {
    let freezePassed = 0;

    for (const ext of timeExtensions) {
      if (gameTime < ext.gameTime) {
        return gameTime + freezePassed;
      }

      if (gameTime === ext.gameTime) {
        return ext.time;
      }

      freezePassed = ext.cumulativeFreezeTime + ext.amount;
    }

    return gameTime + freezePassed;
  };

  const cleanupStateAt = (realTime: number, gameTime: number) => {
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime,
    );

    timedEnemyStatuses = timedEnemyStatuses.filter((status) =>
      status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
    );

    timedActorBuffs = timedActorBuffs.filter((buff) =>
      buff.timeScale === "real" ? buff.expiresAt > realTime : buff.expiresAt > gameTime,
    );

    if (enemyArtsInfliction && enemyArtsInfliction.expiresAtGameTime <= gameTime) {
      enemyArtsInfliction = null;
    }

    timedTeamLinkStacks = timedTeamLinkStacks.filter((stack) =>
      stack.timeScale === "real" ? stack.expiresAt > realTime : stack.expiresAt > gameTime,
    );

    for (const [slot, window] of activeComboWindowBySlot.entries()) {
      if (window.consumedAt != null || window.expiresAt <= realTime) {
        activeComboWindowBySlot.delete(slot);
      }
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
  }) => {
    if (args.stacks <= 0 || args.durationSeconds <= 0) {
      return;
    }
    const timeScale = args.timeScale ?? "game";
    const now = timeScale === "real" ? args.time : args.gameTime;
    cleanupStateAt(args.time, args.gameTime);
    const available = Math.max(0, 4 - timedTeamLinkStacks.length);
    const toApply = Math.min(available, args.stacks);
    for (let i = 0; i < toApply; i += 1) {
      timedTeamLinkStacks.push({
        expiresAt: now + args.durationSeconds,
        timeScale,
      });
    }
  };

  const consumeTeamLinkStacks = (args: { time: number; gameTime: number }) => {
    cleanupStateAt(args.time, args.gameTime);
    const consumed = Math.min(4, timedTeamLinkStacks.length);
    timedTeamLinkStacks = [];
    return consumed;
  };

  const recordActorState = (slot: CharacterCombatSnapshot["slot"], time: number, gameTime: number) => {
    cleanupStateAt(time, gameTime);
    actorStateTimeline.push({
      slot,
      time,
      gameTime,
      meltingFlameStacks: meltingFlameStacksBySlot.get(slot) ?? 0,
      activeBuffs: timedActorBuffs
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
        })),
    });
  };

  const recordEnemyState = (time: number, gameTime: number) => {
    cleanupStateAt(time, gameTime);
    const currentDamageTaken = timeline
      .filter((entry) => entry.time <= time)
      .reduce((sum, entry) => sum + entry.damage, 0);

    const maxStagger = args.enemyStaggerGauge;
    const recoverySeconds = args.enemyStaggerRecoverySeconds;
    const decayRate = recoverySeconds > 0 ? maxStagger / recoverySeconds : 0;
    const staggerEvents = [...timeline]
      .map((entry) => ({ time: entry.time, stagger: entry.stagger }))
      .sort((a, b) => a.time - b.time);
    let currentStagger = 0;
    let lastTime = 0;
    let staggeredUntil = 0;
    for (const event of staggerEvents) {
      if (event.time > time) break;
      if (lastTime < staggeredUntil && event.time <= staggeredUntil) {
        currentStagger = Math.max(0, maxStagger - Math.max(0, event.time - lastTime) * decayRate);
        lastTime = event.time;
        continue;
      }

      if (event.time < staggeredUntil) {
        currentStagger = Math.max(0, maxStagger - Math.max(0, staggeredUntil - lastTime) * decayRate);
        lastTime = staggeredUntil;
      }

      currentStagger = Math.min(maxStagger, currentStagger + event.stagger);
      if (currentStagger >= maxStagger - 0.001) {
        currentStagger = maxStagger;
        staggeredUntil = event.time + recoverySeconds;
      }
      lastTime = event.time;
    }
    if (time <= staggeredUntil && staggeredUntil > 0) {
      currentStagger = Math.max(0, maxStagger - Math.max(0, time - lastTime) * decayRate);
    }

    enemyStateTimeline.push({
      time,
      gameTime,
      currentDamageTaken,
      currentStagger,
      isStaggered: time <= staggeredUntil && staggeredUntil > 0,
      activeDebuffs: timedEnemyDebuffs.map((debuff) => ({
        label: debuff.label,
        stat: debuff.stat,
        value: debuff.value,
        expiresAt: debuff.expiresAt,
        timeScale: debuff.timeScale,
      })),
      activeStatuses: timedEnemyStatuses.map((status) => ({
        id: status.id,
        label: status.label,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
      })),
      artsInfliction: enemyArtsInfliction ? { ...enemyArtsInfliction } : null,
    });
  };

  const triggerComboIfAvailable = (args: {
    slot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    sourceStepId: string;
    sourceEventType: RotationCombatEvent["type"];
    label: string;
  }): boolean => {
    const actor = partyBySlot.get(args.slot);
    const comboCommand = actor ? getComboCommand(actor) : null;
    if (!actor || !comboCommand) {
      return false;
    }

    cleanupStateAt(args.time, args.gameTime);

    if (activeComboWindowBySlot.has(args.slot)) {
      return false;
    }

    const cooldownUntil = comboCooldownUntilBySlot.get(args.slot) ?? 0;
    const currentTime =
      comboCommand.comboCooldownTimeScale === "real" ? args.time : args.gameTime;

    if (currentTime < cooldownUntil) {
      return false;
    }

    const window: ComboTriggerWindow = {
      slot: args.slot,
      readyAt: args.time,
      expiresAt: args.time + COMBO_READY_TIMEOUT_SECONDS,
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
    timeScale: TimeScale;
    effects?: Partial<ModifierStats>;
    stackGroup?: string;
    maxStacks?: number;
    eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
  }) => {
    if (args.stackGroup) {
      const existingStacks = timedActorBuffs
        .filter((buff) => buff.slot === args.slot && buff.stackGroup === args.stackGroup)
        .sort((left, right) => left.appliedAt - right.appliedAt);
      const keepCount = Math.max(0, (args.maxStacks ?? 1) - 1);
      const stacksToKeep = new Set(existingStacks.slice(-keepCount).map((buff) => buff.id));
      timedActorBuffs = timedActorBuffs.filter((buff) =>
        !(buff.slot === args.slot && buff.stackGroup === args.stackGroup && !stacksToKeep.has(buff.id)),
      );
    } else {
      timedActorBuffs = timedActorBuffs.filter((buff) => !(buff.slot === args.slot && buff.id === args.buffId));
    }

    timedActorBuffs.push({
      id: args.stackGroup ? `${args.buffId}:${args.time.toFixed(3)}:${timedActorBuffs.length}` : args.buffId,
      label: args.label,
      slot: args.slot,
      hidden: args.hidden,
      appliedAt: args.time,
      appliedAtGameTime: args.gameTime,
      expiresAt: (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds,
      timeScale: args.timeScale,
      effects: args.effects ?? {},
      stackGroup: args.stackGroup,
    });

    const event: RotationCombatEvent = {
      type: args.eventType ?? "ACTOR_BUFF_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.slot,
      sourceSlot: args.sourceSlot ?? args.slot,
      label: args.label,
      buffId: args.buffId,
      durationSeconds: args.durationSeconds,
      timeScale: args.timeScale,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };

  const removeActorBuff = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
  }) => {
    timedActorBuffs = timedActorBuffs.filter((buff) =>
      !(buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`))),
    );
  };

  const removeEnemyStatus = (args: {
    statusId: string;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
  }) => {
    const hadStatus = timedEnemyStatuses.some((status) => status.id === args.statusId);
    if (!hadStatus) {
      return;
    }
    timedEnemyStatuses = timedEnemyStatuses.filter((status) => status.id !== args.statusId);
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

  const dispatchPassiveListeners = (event: RotationCombatEvent) => {
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
          slot: event.slot,
          sourceSlot: event.sourceSlot,
          label: event.label,
        },
        state: {
          hasSelfBuff: (buffId: string) =>
            timedActorBuffs.some(
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
              timeScale: args.timeScale ?? "game",
              effects: args.effects,
              stackGroup: args.stackGroup,
              maxStacks: args.maxStacks,
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
                hidden: args.hidden,
                durationSeconds: args.durationSeconds,
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
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
            });
          },
          markTriggerOnce: (key: string) => {
            const onceKey = `event:${member.slot}:${key}`;
            if (setTriggerFlags.has(onceKey)) {
              return false;
            }
            setTriggerFlags.add(onceKey);
            return true;
          },
          triggerSelfCombo: (args) =>
            triggerComboIfAvailable({
              slot: member.slot,
              time: event.time,
              gameTime: event.gameTime,
              sourceStepId: event.stepId ?? "",
              sourceEventType: (args?.sourceEventType as RotationCombatEvent["type"]) ?? event.type,
              label: args?.label ?? `${member.characterName} Combo Triggered`,
            }),
          resetSelfComboCooldown: () => {
            const comboCommand = getComboCommand(member);
            if (!comboCommand) {
              return;
            }
            comboCooldownUntilBySlot.set(
              member.slot,
              comboCommand.comboCooldownTimeScale === "real" ? event.time : event.gameTime,
            );
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
              timeScale: args.timeScale ?? "game",
              effects: args.effects,
              stackGroup: args.stackGroup,
              maxStacks: args.maxStacks,
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
                timeScale: args.timeScale ?? "game",
                effects: args.effects,
                stackGroup: args.stackGroup,
                maxStacks: args.maxStacks,
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
              type: "SKILL_SP_RECOVERED",
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
            timedActorBuffs.some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            ),
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

    const currentStacks = meltingFlameStacksBySlot.get(args.slot) ?? 0;
    const nextStacks = Math.min(4, currentStacks + args.stacks);
    const gainedStacks = nextStacks - currentStacks;
    if (gainedStacks <= 0) {
      return;
    }

    meltingFlameStacksBySlot.set(args.slot, nextStacks);

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
    const currentStacks = meltingFlameStacksBySlot.get(args.slot) ?? 0;
    const consumedStacks = Math.min(currentStacks, Math.max(0, args.stacks));
    if (consumedStacks <= 0) {
      return;
    }

    meltingFlameStacksBySlot.set(args.slot, currentStacks - consumedStacks);
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

  const getEffectiveActorMods = (actor: CharacterCombatSnapshot, realTime: number, gameTime: number) => {
    cleanupStateAt(realTime, gameTime);

    return timedActorBuffs
      .filter((buff) => buff.slot === actor.slot)
      .reduce((mods, buff) => addModifierDelta(mods, buff.effects), actor.mods);
  };

  const getEffectiveEnemyMods = (_actor: CharacterCombatSnapshot, realTime: number, gameTime: number) => {
    cleanupStateAt(realTime, gameTime);

    return timedEnemyDebuffs.reduce(
      (mods, debuff) => addModifierDelta(mods, { [debuff.stat]: debuff.value }),
      { ...enemyMods },
    );
  };

  const hasEnemyVulnerability = () =>
    timedEnemyDebuffs.some((debuff) => debuff.stat === "PHYSICAL_SUS_PCT" && debuff.value > 0);

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
    if (reaction === "Electrification") {
      const clampedLevel = Math.max(1, Math.min(4, Math.floor(level)));
      const table = [12, 18, 24, 30];
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
    return baseAmount * scaling;
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
    damageType: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
    baseMultiplier: number;
    time: number;
    gameTime: number;
    stepId: string;
    commandId: string;
  }) => {
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }

    const effectiveEnemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime);
    const effectiveActorMods = getEffectiveActorMods(actor, args.time, args.gameTime);
    const damageBreakdown = calculateReactionDamage({
      finalAtk: actor.finalAtk,
      damageType: args.damageType,
      baseMultiplier: args.baseMultiplier,
      attackerMods: effectiveActorMods,
      enemyMods: effectiveEnemyMods,
      enemyStats,
      applierLevel: actor.level,
      isPhysicalReaction: false,
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
      commandName: args.reactionName,
      hitIndex: 0,
      hitName: args.hitName,
      damageType: args.damageType,
      multiplier: args.baseMultiplier,
      noCritDamage: damageBreakdown.noCritDamage,
      critDamage: damageBreakdown.critDamage,
      damage: damageBreakdown.averageDamage,
      stagger: 0,
      spGenerated: 0,
      spReturned: 0,
      energyReturn: 0,
      requiresControlledOperator: false,
      triggeredComboSlots: [],
    });

    totalDamage += damageBreakdown.averageDamage;
    damageBySlot.set(actor.slot, (damageBySlot.get(actor.slot) ?? 0) + damageBreakdown.averageDamage);
  };

  const triggerReactionDamageFromConsumedInflictions = (args: {
    reaction: ArtsReactionKind;
    consumedStacks: number;
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
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
    });
  };

  const triggerArtsBurstFromInfliction = (args: {
    element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
  }) => {
    pushReactionDamageHit({
      sourceSlot: args.sourceSlot,
      reactionName: `${args.element} Burst`,
      hitName: "Arts Burst",
      damageType: args.element,
      baseMultiplier: 1.6,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: "__arts_burst",
    });
  };

  const applyReaction = (args: {
    reaction: ArtsReactionKind;
    level: number;
    durationSeconds?: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
  }) => {
    const reactionId = args.reaction.toLowerCase();
    const defaultDuration = getReactionDefaultDurationSeconds(args.reaction, args.level);
    const requestedDuration = args.durationSeconds ?? defaultDuration;

    if (args.reaction === "Corrosion") {
      const previousCorrosion = timedEnemyStatuses.find((status) => status.id === "corrosion");
      const previousRemaining = previousCorrosion
        ? Math.max(0, previousCorrosion.expiresAt - args.gameTime)
        : 0;
      const resolvedLevel = Math.max(args.level, previousCorrosion?.level ?? args.level);
      const resolvedDuration = Math.max(requestedDuration, previousRemaining);
      const baseAmount = getReactionBaseAmount(resolvedLevel);
      const finalAmount = getReactionScaledAmount(args.sourceSlot, baseAmount, args.time, args.gameTime);
      const inheritedReduction = previousCorrosion?.currentReduction;
      const currentReduction = Math.min(
        finalAmount,
        Math.max(0, inheritedReduction ?? finalAmount * 0.3),
      );
      const nextRampAtGameTime = previousCorrosion?.nextRampAtGameTime && previousCorrosion.nextRampAtGameTime > args.gameTime
        ? previousCorrosion.nextRampAtGameTime
        : args.gameTime + 1;

      timedEnemyStatuses = timedEnemyStatuses.filter((status) => status.id !== "corrosion");
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
      timedEnemyStatuses.push(corrosionStatus);
      applyCorrosionDebuffFromStatus(corrosionStatus);
    } else {
      timedEnemyStatuses = timedEnemyStatuses.filter((status) => status.id !== reactionId);
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
        status.finalAmount = getReactionScaledAmount(args.sourceSlot, baseAmount, args.time, args.gameTime);
      }

      timedEnemyStatuses.push(status);

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
      dispatchPassiveListeners(event);

      return;
    }

    if (args.reaction === "Corrosion") {
      const corrosion = timedEnemyStatuses.find((status) => status.id === "corrosion");
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
      dispatchPassiveListeners(event);

    }
  };

  const processReactionTicksUpTo = (args: { realTime: number; gameTime: number }) => {
    while (true) {
      const combustionStatus = timedEnemyStatuses
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
      });

      combustionStatus.nextTickAtGameTime += 1;
    }

    while (true) {
      const corrosionStatus = timedEnemyStatuses
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
  };

  const applyHitEffects = (args: {
    effects: CommandHitEffectDefinition[];
    time: number;
    gameTime: number;
    stepId: string;
    actor: CharacterCombatSnapshot;
    triggerSlots: CharacterCombatSnapshot["slot"][];
  }) => {
    for (const effect of args.effects) {
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
        applyActorBuff({
          slot: args.actor.slot,
          stepId: args.stepId,
          time: args.time,
          gameTime: args.gameTime,
          buffId: effect.buffId,
          label: effect.label ?? effect.buffId,
          hidden: effect.hidden,
          durationSeconds: effect.durationSeconds ?? 0,
          timeScale: effect.timeScale ?? "game",
          effects: effect.effects,
        });
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
          removeActorBuff({
            slot: args.actor.slot,
            buffId: effect.buffId,
          });
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
        if (effect.requiresEnemyStatusId && !timedEnemyStatuses.some((status) => status.id === effect.requiresEnemyStatusId)) {
          continue;
        }
        if ((effect.durationSeconds ?? 0) <= 0) {
          continue;
        }
        applyEnemyBuff({
          buffId: effect.buffId,
          label: effect.label ?? effect.buffId,
          effects: effect.effects ?? {},
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
        const stacks = Math.max(1, effect.stacks ?? 1);
        const durationSeconds = effect.durationSeconds ?? ARTS_INFLICTION_DURATION_SECONDS;

        if (!enemyArtsInfliction) {
          enemyArtsInfliction = {
            element: effect.element,
            stacks,
            expiresAtGameTime: args.gameTime + durationSeconds,
          };
        } else if (enemyArtsInfliction.element === effect.element) {
          triggerArtsBurstFromInfliction({
            element: effect.element,
            sourceSlot: args.actor.slot,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
          });
          enemyArtsInfliction = {
            element: effect.element,
            stacks: Math.min(4, enemyArtsInfliction.stacks + stacks),
            expiresAtGameTime: args.gameTime + durationSeconds,
          };
        } else {
          const previousStacks = enemyArtsInfliction.stacks;
          enemyArtsInfliction = null;

          if (effect.element === "Heat") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Combustion",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
            });
            applyReaction({
              reaction: "Combustion",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
            });
          } else if (effect.element === "Cryo") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Solidification",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
            });
            applyReaction({
              reaction: "Solidification",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
            });
          } else if (effect.element === "Electric") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Electrification",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
            });
            applyReaction({
              reaction: "Electrification",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
            });
          } else if (effect.element === "Nature") {
            triggerReactionDamageFromConsumedInflictions({
              reaction: "Corrosion",
              consumedStacks: previousStacks,
              sourceSlot: args.actor.slot,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
            });
            applyReaction({
              reaction: "Corrosion",
              level: previousStacks,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              sourceSlot: args.actor.slot,
              triggerSlots: args.triggerSlots,
            });
          }
        }

        if (effect.element === "Heat") {
          const wulfgardSlot = findSlotByCharacterId("wulfgard");
          emitEvent({
            type: "HEAT_INFLICTION_APPLIED",
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            target: "enemy",
            label: "Heat Infliction Applied",
          });

          if (
            wulfgardSlot != null &&
            triggerComboIfAvailable({
              slot: wulfgardSlot,
              time: args.time,
              gameTime: args.gameTime,
              sourceStepId: args.stepId,
              sourceEventType: "HEAT_INFLICTION_APPLIED",
              label: "Wulfgard Combo Triggered",
            })
          ) {
            args.triggerSlots.push(wulfgardSlot);
          }
        }

        continue;
      }

      if (effect.type === "APPLY_REACTION") {
        if (effect.reactionDamage) {
          triggerReactionDamageFromConsumedInflictions({
            reaction: effect.reaction,
            consumedStacks: Math.max(1, effect.level ?? 1),
            sourceSlot: args.actor.slot,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
          });
        }
        applyReaction({
          reaction: effect.reaction,
          level: effect.level ?? 1,
          durationSeconds: effect.durationSeconds,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
        });
      }
    }
  };

  const runResolvedHitHooks = (args: {
    occurrence: HitOccurrence;
    isControlledOperatorHit: boolean;
    occurrenceIndex: number;
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
          getEnemyArtsInfliction: () => (enemyArtsInfliction ? { ...enemyArtsInfliction } : null),
          setEnemyArtsInfliction: (value: CombatHookEnemyArtsInflictionState | null) => {
            enemyArtsInfliction = value ? { ...value } : null;
          },
          hasEnemyStatus: (statusId: string) =>
            timedEnemyStatuses.some((status) => status.id === statusId),
          hasSelfBuff: (buffId: string) =>
            timedActorBuffs.some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            ),
          getSelfMeltingFlameStacks: () => meltingFlameStacksBySlot.get(member.slot) ?? 0,
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
            });
          },
          applyOtherTeammatesBuff: (hookArgs) => {
            for (const teammate of party) {
              if (teammate.slot === member.slot) {
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
            });
          },
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
          triggerSelfCombo: (hookArgs) =>
            triggerComboIfAvailable({
              slot: member.slot,
              time: args.occurrence.time,
              gameTime: args.occurrence.gameTime,
              sourceStepId: args.occurrence.action.stepId,
              sourceEventType:
                (hookArgs?.sourceEventType as RotationCombatEvent["type"]) ?? "BATTLE_OR_COMBO_HIT",
              label: hookArgs?.label ?? `${member.characterName} Combo Triggered`,
            }),
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
        },
      });
    }
  };

  const occurrences: Array<ActionOccurrence | ActionEndOccurrence | HitOccurrence> = [];

  for (const member of party) {
    recordActorState(member.slot, 0, 0);
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

    for (let hitIndex = 0; hitIndex < command.hits.length; hitIndex += 1) {
      const hit = command.hits[hitIndex];
      if (!hit) {
        continue;
      }

      for (let repeatIndex = 0; repeatIndex < hit.times; repeatIndex += 1) {
        const hitOffset =
          hit.offsetFrames / 60 +
          (repeatIndex * hit.repeatIntervalFrames) / 60;
        const registerOffset =
          hit.registerOffsetFrames / 60 +
          (repeatIndex * hit.repeatIntervalFrames) / 60;
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
            command.sequenceSegmentIndex != null &&
            command.sequenceSegmentTotal != null &&
            command.sequenceSegmentIndex === command.sequenceSegmentTotal &&
            hitIndex === command.hits.length - 1 &&
            repeatIndex === hit.times - 1,
          isFinisherHit:
            command.attackType === "BASIC_ATTACK" &&
            command.basicAttackVariant === "final_strike" &&
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

  for (let occurrenceIndex = 0; occurrenceIndex < occurrences.length; occurrenceIndex += 1) {
    const occurrence = occurrences[occurrenceIndex]!;
    cleanupStateAt(occurrence.time, occurrence.gameTime);
    processReactionTicksUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });

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
          const bonusByStack = [0.3, 0.45, 0.6, 0.75];
          commandLinkMultiplierByStepId.set(
            occurrence.action.stepId,
            bonusByStack[Math.min(4, linkStacks) - 1] ?? 0,
          );
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
          const bonusByStack = [0.2, 0.3, 0.4, 0.5];
          commandLinkMultiplierByStepId.set(
            occurrence.action.stepId,
            bonusByStack[Math.min(4, linkStacks) - 1] ?? 0,
          );
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
        const activeWindow = activeComboWindowBySlot.get(occurrence.actor.slot);
        if (activeWindow && activeWindow.readyAt <= occurrence.time && activeWindow.expiresAt > occurrence.time) {
          activeWindow.consumedAt = occurrence.time;
          activeComboWindowBySlot.delete(occurrence.actor.slot);
        }

        const cooldownEnd =
          (occurrence.command.comboCooldownTimeScale === "real"
            ? occurrence.time
            : occurrence.gameTime) + occurrence.command.comboCooldownSeconds;
        comboCooldownUntilBySlot.set(occurrence.actor.slot, cooldownEnd);
      }

      continue;
    }

    if (occurrence.kind === "action-end") {
      const recoveredSp = occurrence.command.spGeneratedOnEnd + occurrence.command.spReturnedOnEnd;
      if (
        occurrence.command.attackType !== "BASIC_ATTACK"
        && occurrence.command.attackType !== "GENERIC"
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

    const effectiveEnemyMods = getEffectiveEnemyMods(
      occurrence.actor,
      occurrence.time,
      occurrence.gameTime,
    );
    const effectiveActorMods = getEffectiveActorMods(
      occurrence.actor,
      occurrence.time,
      occurrence.gameTime,
    );

    const damageBreakdown = calculateResolvedHitDamage({
      finalAtk: occurrence.actor.finalAtk,
      attackType: occurrence.hit.attackType,
      damageType: occurrence.hit.damageType,
      hit: occurrence.hit,
      attackerMods: effectiveActorMods,
      enemyMods: effectiveEnemyMods,
      enemyStats,
    });
    const linkMultiplier = commandLinkMultiplierByStepId.get(occurrence.action.stepId) ?? 0;
    const noCritDamage = damageBreakdown.noCritDamage * (1 + linkMultiplier);
    const critDamage = damageBreakdown.critDamage * (1 + linkMultiplier);
    const damage = damageBreakdown.averageDamage * (1 + linkMultiplier);

    totalDamage += damage;
    damageBySlot.set(occurrence.actor.slot, (damageBySlot.get(occurrence.actor.slot) ?? 0) + damage);

    const triggeredComboSlots: CharacterCombatSnapshot["slot"][] = [];

    timeline.push({
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      registerTime: occurrence.command.hits[occurrence.hitIndex]
        ? timeContext.getShiftedEndTime(
            occurrence.action.realStartTime,
            occurrence.hit.registerOffsetFrames / 60 +
              (occurrence.repeatIndex * occurrence.hit.repeatIntervalFrames) / 60,
            occurrence.action.stepId,
          )
        : occurrence.time,
      registerGameTime: occurrence.command.hits[occurrence.hitIndex]
        ? timeContext.toGameTime(
            timeContext.getShiftedEndTime(
              occurrence.action.realStartTime,
              occurrence.hit.registerOffsetFrames / 60 +
                (occurrence.repeatIndex * occurrence.hit.repeatIntervalFrames) / 60,
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
      multiplier: occurrence.hit.multiplier,
      noCritDamage,
      critDamage,
      damage,
      stagger: occurrence.hit.stagger,
      spGenerated: occurrence.hit.spGenerated,
      spReturned: occurrence.hit.spReturned,
      energyReturn: occurrence.hit.energyReturn,
      requiresControlledOperator: occurrence.hit.requiresControlledOperator,
      triggeredComboSlots,
    });

    for (const debuff of occurrence.hit.targetDebuffs) {
      timedEnemyDebuffs.push({
        stat: debuff.stat,
        value: debuff.value,
        expiresAt:
          debuff.timeScale === "real"
            ? occurrence.time + debuff.durationSeconds
            : occurrence.gameTime + debuff.durationSeconds,
        timeScale: debuff.timeScale,
      });

      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName}: ${debuff.stat}`,
        debuffStat: debuff.stat,
        durationSeconds: debuff.durationSeconds,
        timeScale: debuff.timeScale,
      };
      emitEvent(event);
      dispatchPassiveListeners(event);
    }

    applyHitEffects({
      effects: occurrence.hit.effects,
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      stepId: occurrence.action.stepId,
      actor: occurrence.actor,
      triggerSlots: triggeredComboSlots,
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
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        label: `${occurrence.actor.characterName} ${occurrence.command.attackType === "BATTLE_SKILL" ? "Battle" : "Combo"} Hit`,
        commandAttackType: occurrence.command.attackType,
        damageType: occurrence.hit.damageType,
        expectedCritCount: effectiveActorMods.CRIT_RATE_PCT * Math.max(1, occurrence.hit.times),
      };
      emitEvent(battleOrComboEvent);
      dispatchPassiveListeners(battleOrComboEvent);
    }

    if (
      occurrence.command.attackType !== "BASIC_ATTACK"
      && occurrence.command.attackType !== "GENERIC"
      && (occurrence.hit.spGenerated > 0 || occurrence.hit.spReturned > 0)
    ) {
      const skillRecoveredEvent: RotationCombatEvent = {
        type: "SKILL_SP_RECOVERED",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        label: `${occurrence.actor.characterName} Skill Recovered SP`,
        amount: occurrence.hit.spGenerated + occurrence.hit.spReturned,
        commandAttackType: occurrence.command.attackType,
      };
      emitEvent(skillRecoveredEvent);
      dispatchPassiveListeners(skillRecoveredEvent);
    }

    runResolvedHitHooks({
      occurrence,
      isControlledOperatorHit,
      occurrenceIndex,
    });

    recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
    recordEnemyState(occurrence.time, occurrence.gameTime);

    const ardeliaSlot = findSlotByCharacterId("ardelia");

    if (isControlledOperatorHit && occurrence.isFinalStrikeOfBasicSequence) {
      emitEvent({
        type: "BASIC_ATTACK_FINAL_STRIKE_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName} Final Strike Hit`,
      });

      if (
        ardeliaSlot != null &&
        !hasEnemyVulnerability() &&
        enemyArtsInfliction == null &&
        triggerComboIfAvailable({
          slot: ardeliaSlot,
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          sourceStepId: occurrence.action.stepId,
          sourceEventType: "BASIC_ATTACK_FINAL_STRIKE_HIT",
          label: "Ardelia Combo Triggered",
        })
      ) {
        triggeredComboSlots.push(ardeliaSlot);
      }
    }

    if (isControlledOperatorHit && occurrence.isFinisherHit) {
      emitEvent({
        type: "FINISHER_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        slot: occurrence.actor.slot,
        target: "enemy",
        label: `${occurrence.actor.characterName} Finisher Hit`,
      });
    }
  }

  const finalRealTime = actions.reduce((max, action) => Math.max(max, action.realEndTime), 0);
  const finalGameTime = actions.reduce((max, action) => Math.max(max, action.endTime), 0);
  processReactionTicksUpTo({ realTime: finalRealTime, gameTime: finalGameTime });

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
    linkEnhancedStepIds: Array.from(commandLinkMultiplierByStepId.entries())
      .filter(([, bonus]) => bonus > 0)
      .map(([stepId]) => stepId),
    totalGameTime: actions.reduce((max, action) => Math.max(max, action.endTime), 0),
    totalTime: actions.reduce((max, action) => Math.max(max, action.realEndTime), 0),
    timeline,
    actions,
    timeExtensions,
    events,
    comboWindows,
    actorStateTimeline,
    enemyStateTimeline,
  };
}
