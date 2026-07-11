import { makeBaseModifierStats, type ModifierStats, type ModifierStatKey } from "@/lib/build/stats";
import { isUniqueTalentEnabled } from "@/lib/build/buildConditions";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type {
  ActorCombatStateSnapshot,
  CharacterCombatSnapshot,
  CompiledRotationAction,
  ComboTriggerDebugEntry,
  ComboTriggerWindow,
  DamageTimelineEntry,
  EnemyActionWindow,
  EnemyCombatStateSnapshot,
  EnemySlotId,
  EnemySlotState,
  PassiveListenerDebugEntry,
  PartySlot,
  Rotation,
  RotationCombatEvent,
  RotationSimulationCheckpoint,
  RotationSimulationInitialResourceState,
  RotationSimulationInitialState,
  RotationSimulationResult,
} from "@/lib/combat/rotation";
import { CRIT_RIG_HIT_INDEX_EXECUTE, CRIT_RIG_HIT_INDEX_REACTION } from "@/lib/combat/rotation";
import type {
  UnifiedCombatStatus,
  UnifiedStatusChangeLogEntry,
  UnifiedStatusChangeType,
  UnifiedStatusKind,
} from "@/lib/combat/statusModel";
import { calculateReactionDamage, calculateResolvedHitDamage } from "@/lib/combat/combatDamage";
import { createCritRigModeResolver, resolveExecuteCritRigId } from "@/lib/combat/critRigging";
import { compileRotationTimeline } from "@/lib/combat/compileRotationTimeline";
import {
  createRootEffectTree,
  extendEffectTree,
  withEffectTreeTarget,
  type CombatEffectTree,
  type CombatEffectTarget,
} from "@/lib/combat/effectTree";
import type {
  CombatHookEnemyArtsInflictionState,
  CombatHookEnemyRef,
  CombatHookEnemySelector,
} from "@/lib/combat/hooks";
import type { ElementType } from "@/data/characters";
import { CHARACTERS } from "@/data/characters";
import { CONSUMABLE_BY_ID } from "@/data/consumables";
import { ENEMIES } from "@/data/enemies";
import { runGearSetEventListener } from "@/lib/combat/gearSetEffects";
import { runWeaponEventListener } from "@/lib/combat/weaponEffects";
import { calculateEnemyStats } from "@/lib/enemy/enemyScaling";
import {
  getSuppressionDebuffStatFromEvent,
  getContingencyContractVariant,
  resolveContingencyContracts,
  type ActiveContingencyContract,
} from "@/lib/combat/contracts";
import {
  getActiveInternalCombatTriggers,
  getActiveInternalTriggerVariables,
  getInternalTriggerEnabledByContracts,
} from "@/lib/combat/internalTriggers";
import {
  CUSTOM_TRIGGER_STATUS_OPTIONS,
  getAllTriggerVariables,
  matchesCustomTriggerEventType,
  type CustomCombatTrigger,
  type TriggerAction,
  type TriggerConditionNode,
  type TriggerControlReference,
  type TriggerEnemyReferenceExpression,
  type TriggerNumericSource,
  type TriggerOperatorReferenceExpression,
  type TriggerReferenceExpression,
  type TriggerVariableDefinition,
  type TriggerValueExpression,
} from "@/lib/combat/triggers";
import { getCombatStatusDefinition } from "@/lib/combat/statusRegistry";
import type {
  AttackType,
  CombatCondition,
  CommandHitEffectDefinition,
  ResolvedCommandAtLevel,
  ResolvedCommandHitAtLevel,
  TimeScale,
} from "@/lib/commands";
import { calculateHealingAmount } from "@/lib/combat/combatDamage";

type TimedEnemyDebuff = {
  enemySlotId?: EnemySlotId;
  id?: string;
  buffId?: string;
  label?: string;
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
  timeScale: TimeScale;
};

type TimedContractDamageModifier = {
  slot: CharacterCombatSnapshot["slot"];
  value: number;
  attackType?: AttackType;
  damageType?: ElementType;
  expiresAt: number;
  timeScale: TimeScale;
};

const POST_ACTION_SIMULATION_BUFFER_SECONDS = 15;
const SIMULATION_CHECKPOINT_CHUNK_SECONDS = 15;

function deepClone<T>(value: T): T {
  const cloneInner = (input: unknown, seen: WeakMap<object, unknown>): unknown => {
    if (input == null || typeof input !== "object") {
      return input;
    }
    if (typeof Window !== "undefined" && input instanceof Window) {
      return undefined;
    }
    if (typeof EventTarget !== "undefined" && input instanceof EventTarget) {
      return undefined;
    }
    if (input instanceof Date) {
      return new Date(input.getTime());
    }
    if (Array.isArray(input)) {
      return input.map((entry) => cloneInner(entry, seen));
    }
    if (input instanceof Map) {
      const out = new Map();
      seen.set(input, out);
      for (const [key, entry] of input.entries()) {
        out.set(cloneInner(key, seen), cloneInner(entry, seen));
      }
      return out;
    }
    if (input instanceof Set) {
      const out = new Set();
      seen.set(input, out);
      for (const entry of input.values()) {
        out.add(cloneInner(entry, seen));
      }
      return out;
    }
    if (seen.has(input)) {
      return seen.get(input);
    }
    const output: Record<string, unknown> = {};
    seen.set(input, output);
    for (const [key, entry] of Object.entries(input as Record<string, unknown>)) {
      const clonedEntry = cloneInner(entry, seen);
      if (clonedEntry !== undefined) {
        output[key] = clonedEntry;
      }
    }
    return output;
  };

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      return cloneInner(value, new WeakMap<object, unknown>()) as T;
    }
  }
  return cloneInner(value, new WeakMap<object, unknown>()) as T;
}

function isCombatHookEnemyRefObject(
  value: CombatHookEnemyRef | undefined,
): value is Exclude<CombatHookEnemyRef, EnemySlotId> {
  return value != null && typeof value !== "string";
}

type TimedEnemyStatus = {
  instanceId?: string;
  id: string;
  label: string;
  expiresAt: number;
  timeScale: TimeScale;
  applierSlot?: CharacterCombatSnapshot["slot"];
  level?: number;
  nextTickAtGameTime?: number;
  finalAmount?: number;
  baseTickMultiplier?: number;
  currentReduction?: number;
  nextRampAtGameTime?: number;
  healPctPerSecond?: number;
};

type TimedEffectStatus = {
  instanceId?: string;
  id: string;
  label: string;
  sourceSlot: CharacterCombatSnapshot["slot"];
  sourceStepId: string;
  linkSourceStepId?: string;
  target: "enemy" | "self" | "global";
  enemySlotId?: EnemySlotId;
  expiresAt: number;
  timeScale: TimeScale;
  hidden?: boolean;
  fieldStatus?: boolean;
  blocksOperatorArtsInflictionElements?: Array<Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">>;
  periods: number;
  maxPeriods?: number;
  periodsExecuted: number;
  periodInterval: number;
  nextPeriodAt?: number;
  pauseStatusIds?: string[];
  effects?: Partial<ModifierStats>;
  periodicEffects: CommandHitEffectDefinition[];
  expireEffects: CommandHitEffectDefinition[];
  removeEffects: CommandHitEffectDefinition[];
};

type TimedTeamLinkStack = {
  expiresAt: number;
  timeScale: TimeScale;
};

type TimedActorBuff = {
  instanceId?: string;
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
  enemySlotId?: EnemySlotId;
  sourceSlot: CharacterCombatSnapshot["slot"];
  element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  stepId: string;
  sourceCommandId?: string;
  sourceCommandName?: string;
};

type RuntimeEnemySlotState = {
  slotId: EnemySlotId;
  level: number;
  spawnTime: number;
  hasConfiguredEnemy: boolean;
  isPresent: boolean;
  isDead: boolean;
  deadAt?: number;
  noDeath: boolean;
  base: typeof ENEMIES[number];
  stats: EnemyResolvedStats;
  modifierBase: ModifierStats;
  damageTaken: number;
  currentStaggerForEvents: number;
  staggerLastUpdateTime: number;
  isStaggeredForEvents: boolean;
  reachedStaggerNodeThresholds: Set<number>;
};

type EnemyHpHistoryEntry = {
  time: number;
  hp: number;
  maxHp: number;
};

type EnemyHpDeltaEntry = {
  time: number;
  hpDelta: number;
};

type StatusMutationLogArgs = {
  reason: string;
  time: number;
  gameTime: number;
  stepId?: string;
  changeType?: UnifiedStatusChangeType;
};

type PendingExecuteHit = {
  actor: CharacterCombatSnapshot;
  hit: ResolvedCommandHitAtLevel;
  hitIndex: number;
  repeatIndex: number;
  hitName?: string;
  executeCritRigId?: string;
  critRigStepId?: string;
  effectTree?: CombatEffectTree;
  sourceCommandId: string;
  sourceCommandName: string;
  sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
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
const COMBO_READY_RETRIGGER_ICD_SECONDS = 0.25;
const ARTS_INFLICTION_DURATION_SECONDS = 20;
const MELTING_FLAME_STATUS_ID = "melting_flame";
const ARTS_INFLICTION_STATUS_ID = "arts_infliction";
const VULNERABILITY_STATUS_ID = "vulnerability";
const PLAYER_COMBUSTION_STATUS_ID = "combustion";
const PLAYER_SOLIDIFICATION_STATUS_ID = "solidification";
const ENEMY_STAGGERED_STATUS_ID = "enemy_staggered";
const ENEMY_FINISHER_AVAILABLE_STATUS_ID = "enemy_finisher_available";
const TANGTANG_OLDEN_STARE_CROWD_CONTROL_STATUS_ID = "tangtang_olden_stare_crowd_control";
const ENCASEMENT_STATUS_IDS = {
  Physical: "contract_encasement_physical",
  Heat: "contract_encasement_heat",
  Cryo: "contract_encasement_cryo",
  Electric: "contract_encasement_electric",
  Nature: "contract_encasement_nature",
} as const;
const ENCASEMENT_RESIDUAL_STATUS_IDS = {
  Physical: "contract_encasement_physical_residual",
  Heat: "contract_encasement_heat_residual",
  Cryo: "contract_encasement_cryo_residual",
  Electric: "contract_encasement_electric_residual",
  Nature: "contract_encasement_nature_residual",
} as const;
const ENEMY_STAGGERED_DAMAGE_MULTIPLIER = 1.3;
const PRE_BATTLE_START_GAME_TIME = 0;
const TANGTANG_ULTIMATE_STATUS_ID = "tangtang_olden_stare_vulnerable";
const ENEMY_STATUS_KIND = "reaction_status";
const EFFECT_STATUS_KIND = "effect_status";
const ACTOR_BUFF_KIND = "actor_buff";
const ACTOR_STATUS_KIND: UnifiedStatusKind = "special_stack";
const SWITCH_BACK_COOLDOWN_SECONDS = 2;

type PlayerArtsElement = Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
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

function getSuppressionDamageTypeFromStat(stat: ModifierStatKey): ElementType | null {
  switch (stat) {
    case "PHYSICAL_DMG_PCT":
      return "Physical";
    case "HEAT_DMG_PCT":
      return "Heat";
    case "CRYO_DMG_PCT":
      return "Cryo";
    case "ELECTRIC_DMG_PCT":
      return "Electric";
    case "NATURE_DMG_PCT":
      return "Nature";
    default:
      return null;
  }
}

function isNonCommandAttackType(attackType: AttackType): boolean {
  return attackType !== "BASIC_ATTACK"
    && attackType !== "BATTLE_SKILL"
    && attackType !== "COMBO_SKILL"
    && attackType !== "ULTIMATE";
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
      activeBuildVariant: 0,
      currentHp: 0,
      maxHp: 0,
      meltingFlameStacks: 0,
      activeBuffs: [],
      activeStatuses: [],
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
    activeStatuses: latest.activeStatuses.filter((status) =>
      status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
    ),
    activeTeamStatuses: latest.activeTeamStatuses.filter((status) =>
      status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
    ),
  };
}

export function getEnemyStateAtTime(
  simulation: RotationSimulationResult,
  realTime: number,
  enemySlotId?: EnemySlotId,
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
  const resolvedEnemySlotId =
    enemySlotId
    ?? simulation.targetedEnemySlotId
    ?? simulation.enemySlots?.[0]?.slotId
    ?? simulation.enemyStateTimeline[0]?.enemySlotId;
  const configuredSlot = simulation.enemySlots?.find((slot) => slot.slotId === resolvedEnemySlotId);
  const configuredEnemy = configuredSlot
    ? ENEMIES.find((enemy) => enemy.id === configuredSlot.enemyId) ?? null
    : null;
  const configuredEnemyStats = configuredEnemy && configuredSlot
    ? calculateEnemyStats(configuredEnemy, configuredSlot.level)
    : null;
  const configuredSpawnTime = configuredSlot?.spawnTimeEnabled === true
    ? (configuredSlot.spawnTime ?? 0)
    : Number.NEGATIVE_INFINITY;
  for (let index = simulation.enemyStateTimeline.length - 1; index >= 0; index -= 1) {
    const entry = simulation.enemyStateTimeline[index];
    if (!entry) {
      continue;
    }
    if (resolvedEnemySlotId && entry.enemySlotId !== resolvedEnemySlotId) {
      continue;
    }
    if (entry.time <= realTime + 0.001) {
      latest = entry;
      break;
    }
  }

  if (!latest) {
    const hasConfiguredEnemy = typeof configuredSlot?.enemyId === "string" && configuredSlot.enemyId.length > 0;
    const isPresentByDefault = hasConfiguredEnemy && realTime + 0.001 >= configuredSpawnTime;
    const defaultMaxHp = configuredEnemyStats?.hp ?? 1;
    return {
      time: realTime,
      gameTime,
      enemySlotId: resolvedEnemySlotId,
      isPresent: isPresentByDefault,
      isDead: false,
      deadAt: undefined,
      enemyId: hasConfiguredEnemy ? (configuredSlot?.enemyId ?? "") : "",
      enemyName: hasConfiguredEnemy ? (configuredEnemy?.name ?? configuredSlot?.enemyId ?? "") : "",
      baseMaxHp: defaultMaxHp,
      currentHp: isPresentByDefault ? defaultMaxHp : 0,
      maxHp: defaultMaxHp,
      currentDamageTaken: 0,
      staggerGauge: configuredEnemy?.staggerGauge ?? 0,
      staggerNodes: configuredEnemy?.staggerNodes ?? [],
      staggerDecayRate:
        (configuredEnemy?.staggerRecoverySeconds ?? 0) > 0
          ? (configuredEnemy?.staggerGauge ?? 0) / (configuredEnemy?.staggerRecoverySeconds ?? 1)
          : 0,
      currentStagger: 0,
      isStaggered: false,
      activeDebuffs: [],
      activeStatuses: [],
      artsInfliction: null,
    };
  }

  if (realTime + 0.001 < configuredSpawnTime) {
    return {
      ...latest,
      time: realTime,
      gameTime,
      isPresent: false,
      isDead: latest.isDead ?? false,
      deadAt: latest.deadAt,
      currentHp: 0,
      maxHp: latest.baseMaxHp,
      currentDamageTaken: 0,
      currentStagger: 0,
      isStaggered: false,
      activeDebuffs: [],
      activeStatuses: [],
      artsInfliction: null,
    };
  }

  if (latest.isPresent === false) {
    return {
      ...latest,
      time: realTime,
      gameTime,
      isPresent: false,
      isDead: latest.isDead ?? false,
      deadAt: latest.deadAt,
      currentHp: 0,
      maxHp: latest.baseMaxHp,
      currentDamageTaken: latest.isDead ? latest.baseMaxHp : 0,
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
      liveStagger - (realTime - latest.time) * Math.max(0, latest.staggerDecayRate),
    );
    if (liveStagger <= 0.0001) {
      liveStagger = 0;
      liveIsStaggered = false;
    }
  }

  const liveEnemyHpPctModifier = latest.activeDebuffs
    .filter((debuff) =>
      debuff.stat === "HP_PCT"
      && (debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime),
    )
    .reduce((sum, debuff) => sum + debuff.value, 0);
  const liveMaxHp = Math.max(1, latest.baseMaxHp * (1 + liveEnemyHpPctModifier));
  const liveCurrentHp = Math.max(0, liveMaxHp - latest.currentDamageTaken);
  const liveActiveStatuses = latest.activeStatuses.filter((status) =>
    status.timeScale === "real" ? status.expiresAt > realTime : status.expiresAt > gameTime,
  );

  return {
    ...latest,
    time: realTime,
    gameTime,
    isPresent: true,
    isDead: false,
    deadAt: undefined,
    currentHp: liveCurrentHp,
    maxHp: liveMaxHp,
    currentStagger: liveStagger,
    isStaggered: liveIsStaggered,
    activeDebuffs: latest.activeDebuffs.filter((debuff) =>
      debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime,
    ),
    activeStatuses: liveActiveStatuses,
    artsInfliction:
      latest.artsInfliction && latest.artsInfliction.expiresAtGameTime > gameTime
        ? latest.artsInfliction
        : null,
  };
}

export function simulateRotation(args: {
  rotation: Rotation;
  party: CharacterCombatSnapshot[];
  partyVariantsBySlot?: Partial<Record<PartySlot, CharacterCombatSnapshot[]>>;
  initialVariantIndex?: number;
  enemySlots?: EnemySlotState[];
  targetedEnemySlotId?: EnemySlotId;
  enemyId: string;
  enemyLevel: number;
  enemyStats: EnemyResolvedStats;
  enemyMods: ModifierStats;
  enemyStaggerGauge: number;
  enemyStaggerNodes?: number[];
  enemyStaggerRecoverySeconds: number;
  enemyFinisherMultiplier?: number;
  enemyFinisherSpGain?: number;
  battleStartConsumableIdsBySlot?: Array<string | null | undefined>;
  battleStartInitialSp?: number;
  battleStartSpRegenRate?: number;
  battleStartStartingEnergyPctBySlot?: number[];
  contingencyContracts?: ActiveContingencyContract[];
  customTriggers?: CustomCombatTrigger[];
  customTriggerVariables?: TriggerVariableDefinition[];
  enemyActionWindows?: EnemyActionWindow[];
  initialState?: RotationSimulationInitialState;
  resumeFromCheckpoint?: RotationSimulationCheckpoint;
  relayStartTime?: number;
  relayStartGameTime?: number;
  emitRotationRelayedEvent?: boolean;
  resumeOutputPrefix?: {
    totalDamage: number;
    riggedCritCount: number;
    damageBySlot: Array<{ slot: PartySlot; damage: number }>;
    timeline: DamageTimelineEntry[];
    events: RotationCombatEvent[];
    comboWindows: ComboTriggerWindow[];
    actorStateTimeline: ActorCombatStateSnapshot[];
    enemyStateTimeline: EnemyCombatStateSnapshot[];
    enemyLifecycleTimeline: RotationSimulationResult["enemyLifecycleTimeline"];
    countdownTimeline: RotationSimulationResult["countdownTimeline"];
    relayTimeline: RotationSimulationResult["relayTimeline"];
    enemyTransitionTimeline: RotationSimulationResult["enemyTransitionTimeline"];
    comboTriggerDebug: ComboTriggerDebugEntry[];
    passiveListenerDebug: PassiveListenerDebugEntry[];
    statusChangeLog: UnifiedStatusChangeLogEntry[];
    simulationCheckpoints?: RotationSimulationCheckpoint[];
    warnings?: string[];
  };
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
  const { rotation, party } = args;
  const synthesizedResumeCheckpoint = args.initialState
    ? ({
      chunkIndex: 0,
      time: args.initialState.startTime,
      gameTime: args.initialState.startGameTime,
      outputCounts: {
        totalDamage: 0,
        riggedCritCount: 0,
        timelineCount: 0,
        eventCount: 0,
        comboWindowCount: 0,
        enemyLifecycleCount: 0,
        countdownCount: 0,
        relayCount: 0,
        enemyTransitionCount: 0,
        actorStateCount: 0,
        enemyStateCount: 0,
        comboTriggerDebugCount: 0,
        passiveListenerDebugCount: 0,
        statusChangeLogCount: 0,
      },
      sequences: args.initialState.sequences,
      runtime: args.initialState.runtime,
    } satisfies RotationSimulationCheckpoint)
    : null;
  const resumeCheckpoint = synthesizedResumeCheckpoint ?? args.resumeFromCheckpoint ?? null;
  const explicitRelayStartTime = typeof args.relayStartTime === "number" && Number.isFinite(args.relayStartTime)
    ? args.relayStartTime
    : null;
  const explicitRelayStartGameTime = typeof args.relayStartGameTime === "number" && Number.isFinite(args.relayStartGameTime)
    ? args.relayStartGameTime
    : null;
  const displayTimeOffset = args.initialState?.displayTimeOffset ?? 0;
  const displayGameTimeOffset = args.initialState?.displayGameTimeOffset ?? 0;
  const defaultInitialResources = (() => {
    const energyBySlot = new Map<PartySlot, number>();
    const energyMaxBySlot = new Map<PartySlot, number>();
    for (const member of party) {
      const ultimateEnergyMax = member.commands.find((command) => command.attackType === "ULTIMATE")?.energyCost ?? 0;
      const startingEnergyPct = args.battleStartStartingEnergyPctBySlot?.[member.slot] ?? 100;
      energyBySlot.set(member.slot, ultimateEnergyMax * (Math.max(0, Math.min(100, startingEnergyPct)) / 100));
      energyMaxBySlot.set(member.slot, ultimateEnergyMax);
    }
    return {
      teamSpGenerated: Math.max(0, Math.min(200, args.battleStartInitialSp ?? 200)),
      teamSpReturned: 0,
      spRegenRate: args.battleStartSpRegenRate ?? 8,
      energyBySlot,
      energyMaxBySlot,
    };
  })();
  const initialResources = deepClone(args.initialState?.initialResources ?? defaultInitialResources);
  const shouldEmitRotationRelayedEvent = args.emitRotationRelayedEvent === true;
  const resumeOutputPrefix = args.initialState ? null : (args.resumeOutputPrefix ?? null);
  const simulationDebug = args.debug;
  const characterById = new Map(CHARACTERS.map((character) => [character.id, character]));
  const enemyById = new Map(ENEMIES.map((enemy) => [enemy.id, enemy]));
  const resolvedContracts = resolveContingencyContracts(args.contingencyContracts);
  const activeContractVariantIds = new Set((args.contingencyContracts ?? []).map((entry) => entry.variantId));
  const customTriggers = args.customTriggers ?? [];
  const internalTriggers = getActiveInternalCombatTriggers(args.contingencyContracts ?? []);
  const internalTriggerVariables = getActiveInternalTriggerVariables(args.contingencyContracts ?? []);
  const allRuntimeTriggers = [...customTriggers, ...internalTriggers];
  const customTriggerVariables = getAllTriggerVariables([...(args.customTriggerVariables ?? []), ...internalTriggerVariables]);
  const customTriggerRuntimeEnabledById = resumeCheckpoint?.runtime.customTriggerRuntimeEnabledById
    ? deepClone(resumeCheckpoint.runtime.customTriggerRuntimeEnabledById)
    : new Map(allRuntimeTriggers.map((trigger) => [
    trigger.id,
    getInternalTriggerEnabledByContracts(trigger.id, args.contingencyContracts ?? []) ?? (trigger.enabled !== false),
  ]));
  const triggerVariableValuesById = resumeCheckpoint?.runtime.triggerVariableValuesById
    ? deepClone(resumeCheckpoint.runtime.triggerVariableValuesById)
    : new Map<string, string | number | boolean>(
      customTriggerVariables.map((variable) => [
      variable.id,
      variable.initialValue.type === "string_literal"
        ? variable.initialValue.value
        : variable.initialValue.type === "boolean_literal"
          ? variable.initialValue.value
          : variable.initialValue.value,
      ]),
    );
  const battleTimeLimitSeconds = resolvedContracts.battleTimeLimitSeconds;
  const warnings: string[] = [...(resumeOutputPrefix?.warnings ?? [])];

  const partyBySlot = new Map(party.map((member) => [member.slot, member]));
  const partyVariantsBySlot = new Map<PartySlot, CharacterCombatSnapshot[]>();
  for (const [slotKey, variants] of Object.entries(args.partyVariantsBySlot ?? {})) {
    const slot = Number(slotKey) as PartySlot;
    if (!Array.isArray(variants) || variants.length === 0) {
      continue;
    }
    partyVariantsBySlot.set(slot, variants);
  }
  const { actions, timeExtensions, timeContext } = compileRotationTimeline({ rotation, party });

  const events: RotationCombatEvent[] = [...(resumeOutputPrefix?.events ?? [])];
  const comboWindows: ComboTriggerWindow[] = [...(resumeOutputPrefix?.comboWindows ?? [])];
  const enemyLifecycleTimeline: RotationSimulationResult["enemyLifecycleTimeline"] = [...(resumeOutputPrefix?.enemyLifecycleTimeline ?? [])];
  const countdownTimeline: RotationSimulationResult["countdownTimeline"] = [...(resumeOutputPrefix?.countdownTimeline ?? [])];
  const relayTimeline: RotationSimulationResult["relayTimeline"] = [...(resumeOutputPrefix?.relayTimeline ?? [])].map((entry) => ({
    ...entry,
    inherited: true,
  }));
  const enemyTransitionTimeline: RotationSimulationResult["enemyTransitionTimeline"] = [
    ...((resumeOutputPrefix as (typeof resumeOutputPrefix & { enemyTransitionTimeline?: RotationSimulationResult["enemyTransitionTimeline"] }) | null)?.enemyTransitionTimeline ?? []),
  ];
  const simulationCheckpoints: RotationSimulationCheckpoint[] = [...(resumeOutputPrefix?.simulationCheckpoints ?? [])];
  const comboTriggerDebug: ComboTriggerDebugEntry[] = [...(resumeOutputPrefix?.comboTriggerDebug ?? [])];
  const passiveListenerDebug: PassiveListenerDebugEntry[] = [...(resumeOutputPrefix?.passiveListenerDebug ?? [])];
  const statusChangeLog: UnifiedStatusChangeLogEntry[] = [...(resumeOutputPrefix?.statusChangeLog ?? [])];
  const timeline: DamageTimelineEntry[] = [...(resumeOutputPrefix?.timeline ?? [])];
  const actorStateTimeline: ActorCombatStateSnapshot[] = [...(resumeOutputPrefix?.actorStateTimeline ?? [])];
  const enemyStateTimeline: EnemyCombatStateSnapshot[] = [...(resumeOutputPrefix?.enemyStateTimeline ?? [])];
  let stateSnapshotSequence = resumeCheckpoint?.sequences.stateSnapshotSequence ?? 0;
  let statusInstanceSequence = resumeCheckpoint?.sequences.statusInstanceSequence ?? 0;
  let statusChangeSequence = resumeCheckpoint?.sequences.statusChangeSequence ?? 0;

  const comboCooldownUntilBySlot = deepClone(resumeCheckpoint?.runtime.comboCooldownUntilBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  const pendingComboCooldownBySlot = deepClone(resumeCheckpoint?.runtime.pendingComboCooldownBySlot ?? new Map<
    CharacterCombatSnapshot["slot"],
    { durationSeconds: number; timeScale: TimeScale }
  >());
  const comboCooldownPauseIntervalsBySlot = deepClone(resumeCheckpoint?.runtime.comboCooldownPauseIntervalsBySlot ?? new Map<
    CharacterCombatSnapshot["slot"],
    Array<{ startTime: number; endTime: number }>
  >());
  const activeComboWindowBySlot = deepClone(resumeCheckpoint?.runtime.activeComboWindowBySlot ?? new Map<CharacterCombatSnapshot["slot"], ComboTriggerWindow>());
  const lastComboTriggerTimeBySlot = deepClone(resumeCheckpoint?.runtime.lastComboTriggerTimeBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  const perfectTimingStepIds = deepClone(resumeCheckpoint?.runtime.perfectTimingStepIds ?? new Set<string>());
  const repeatedHitKeys = deepClone(resumeCheckpoint?.runtime.repeatedHitKeys ?? new Set<string>());
  const terminatedRepeatHitChains = deepClone(resumeCheckpoint?.runtime.terminatedRepeatHitChains ?? new Set<string>());
  const setTriggerFlags = deepClone(resumeCheckpoint?.runtime.setTriggerFlags ?? new Set<string>());
  const listenerCooldowns = deepClone(resumeCheckpoint?.runtime.listenerCooldowns ?? new Map<string, { expiresAt: number; timeScale: TimeScale }>());
  const listenerCounters = deepClone(resumeCheckpoint?.runtime.listenerCounters ?? new Map<string, number>());
  const commandModifierByStepId = deepClone(resumeCheckpoint?.runtime.commandModifierByStepId ?? new Map<string, Partial<ModifierStats>>());
  const bladebreakingPendingBySlot = deepClone(resumeCheckpoint?.runtime.bladebreakingPendingBySlot ?? new Map<PartySlot, boolean>());
  const stepContractDamageMultiplierByStepId = deepClone(resumeCheckpoint?.runtime.stepContractDamageMultiplierByStepId ?? new Map<string, number>());
  const timedContractDamageModifiers: TimedContractDamageModifier[] = deepClone(resumeCheckpoint?.runtime.timedContractDamageModifiers ?? []);
  const critThresholdProgressBySlot = deepClone(resumeCheckpoint?.runtime.critThresholdProgressBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  const commandLinkedStacksByStepId = deepClone(resumeCheckpoint?.runtime.commandLinkedStacksByStepId ?? new Map<string, number>());
  const commandAttackTypeByStepId = deepClone(resumeCheckpoint?.runtime.commandAttackTypeByStepId ?? new Map<string, ResolvedCommandAtLevel["attackType"]>());
  const castEventEmittedByStepId = deepClone(resumeCheckpoint?.runtime.castEventEmittedByStepId ?? new Map<string, { battleSkill: boolean; ultimate: boolean }>());
  const interruptedAtByStepId = deepClone(resumeCheckpoint?.runtime.interruptedAtByStepId ?? new Map<string, number>());
  const pendingArtsBursts: PendingArtsBurst[] = deepClone(resumeCheckpoint?.runtime.pendingArtsBursts ?? []);
  const pendingExecuteHits: PendingExecuteHit[] = deepClone(resumeCheckpoint?.runtime.pendingExecuteHits ?? []);
  type PendingTriggerResume = {
    instanceId: string;
    triggerId: string;
    event: RotationCombatEvent;
    actions: TriggerAction[];
    nextActionIndex: number;
    executionTime: number;
    executionGameTime: number;
  };
  const pendingTriggerResumes: PendingTriggerResume[] = deepClone(
    resumeCheckpoint?.runtime.pendingTriggerResumes ?? [],
  ) as PendingTriggerResume[];
  const pendingEnemyListenerWindowEnds: RotationSimulationCheckpoint["runtime"]["pendingEnemyListenerWindowEnds"] = deepClone(
    resumeCheckpoint?.runtime.pendingEnemyListenerWindowEnds ?? [],
  );
  const getCritRigMode = createCritRigModeResolver(rotation.critRiggingRules ?? []);
  let triggerExecutionBlockedUntil = resumeCheckpoint?.runtime.triggerExecutionBlockedUntil ?? Number.NEGATIVE_INFINITY;
  let triggerExecutionGloballyBlocked = resumeCheckpoint?.runtime.triggerExecutionGloballyBlocked ?? false;
  let triggerExecutionTotalCount = resumeCheckpoint?.runtime.triggerExecutionTotalCount ?? 0;
  const recentTriggerExecutionTimes: number[] = deepClone(resumeCheckpoint?.runtime.recentTriggerExecutionTimes ?? []);
  const activeTriggerRunIds = deepClone(resumeCheckpoint?.runtime.activeTriggerRunIds ?? new Set<string>());
  const stoppedTriggerInstanceIds = deepClone(resumeCheckpoint?.runtime.stoppedTriggerInstanceIds ?? new Set<string>());
  const triggerInstanceIdsByTriggerId = deepClone(resumeCheckpoint?.runtime.triggerInstanceIdsByTriggerId ?? new Map<string, Set<string>>());
  let triggerInstanceSequence = resumeCheckpoint?.sequences.triggerInstanceSequence ?? 0;

  const registerTriggerExecution = (time: number) => {
    while (recentTriggerExecutionTimes.length > 0 && recentTriggerExecutionTimes[0] != null && recentTriggerExecutionTimes[0] < time - 0.1 + 0.0001) {
      recentTriggerExecutionTimes.shift();
    }
    recentTriggerExecutionTimes.push(time);
    triggerExecutionTotalCount += 1;
    if (recentTriggerExecutionTimes.length > 64) {
      triggerExecutionBlockedUntil = Math.max(triggerExecutionBlockedUntil, time + 0.1);
    }
    if (triggerExecutionTotalCount > 1024) {
      triggerExecutionGloballyBlocked = true;
    }
  };

  const canExecuteTriggerAt = (time: number) =>
    !triggerExecutionGloballyBlocked && time >= triggerExecutionBlockedUntil - 0.0001;

  const makeTriggerInstanceId = (triggerId: string) => `${triggerId}:inst:${triggerInstanceSequence++}`;
  const registerTriggerInstance = (triggerId: string, instanceId: string) => {
    const set = triggerInstanceIdsByTriggerId.get(triggerId) ?? new Set<string>();
    set.add(instanceId);
    triggerInstanceIdsByTriggerId.set(triggerId, set);
  };
  const unregisterTriggerInstance = (triggerId: string, instanceId: string) => {
    const set = triggerInstanceIdsByTriggerId.get(triggerId);
    if (!set) {
      return;
    }
    set.delete(instanceId);
    if (set.size <= 0) {
      triggerInstanceIdsByTriggerId.delete(triggerId);
    }
  };
  const stopTriggerInstance = (triggerId: string, instanceId: string) => {
    stoppedTriggerInstanceIds.add(instanceId);
    unregisterTriggerInstance(triggerId, instanceId);
    for (let index = pendingTriggerResumes.length - 1; index >= 0; index -= 1) {
      if (pendingTriggerResumes[index]?.instanceId === instanceId) {
        pendingTriggerResumes.splice(index, 1);
      }
    }
  };
  const stopAllTriggerInstances = (triggerId: string | null) => {
    if (!triggerId) {
      return;
    }
    const instanceIds = [...(triggerInstanceIdsByTriggerId.get(triggerId) ?? [])];
    for (const instanceId of instanceIds) {
      stopTriggerInstance(triggerId, instanceId);
    }
  };

  const pushEnemyLifecycleEntry = (entry: RotationSimulationResult["enemyLifecycleTimeline"][number]) => {
    enemyLifecycleTimeline.push(entry);
  };
  const pushCountdownEntry = (entry: RotationSimulationResult["countdownTimeline"][number]) => {
    countdownTimeline.push(entry);
  };
  const pushRelayEntry = (entry: RotationSimulationResult["relayTimeline"][number]) => {
    relayTimeline.push(entry);
  };
  const TEAM_SP_MAX = 300;
  const PRE_BATTLE_SP_MAX = 200;
  const PRE_BATTLE_SP_REGEN_RATE = 50;
  const GENERATED_SP_TEAM_ENERGY_RATE = 0.065;
  const pushCountdownEntries = (args: {
    triggerId: string;
    triggerName: string;
    instanceId: string;
    executionTime: number;
    executionGameTime: number;
    durationSeconds: number;
  }) => {
    const durationSeconds = Math.max(0, args.durationSeconds);
    if (durationSeconds <= 0) {
      return;
    }
    const integerStart = Math.max(0, Math.floor(durationSeconds));
    for (let value = integerStart; value >= 1; value -= 1) {
      const elapsed = integerStart - value;
      pushCountdownEntry({
        time: args.executionTime + elapsed,
        gameTime: args.executionGameTime + elapsed,
        value,
        triggerId: args.triggerId,
        triggerName: args.triggerName,
        instanceId: args.instanceId,
      });
    }
    pushCountdownEntry({
      time: args.executionTime + durationSeconds,
      gameTime: args.executionGameTime + durationSeconds,
      value: 0,
      triggerId: args.triggerId,
      triggerName: args.triggerName,
      instanceId: args.instanceId,
    });
  };

  const applyCommandModifierToStep = (stepId: string, effects: Partial<ModifierStats>) => {
    const existing = commandModifierByStepId.get(stepId) ?? {};
    const merged: Partial<ModifierStats> = { ...existing };
    (Object.keys(effects) as (keyof ModifierStats)[]).forEach((key) => {
      const delta = effects[key];
      if (typeof delta !== "number" || Number.isNaN(delta) || delta === 0) {
        return;
      }
      merged[key] = (merged[key] ?? 0) + delta;
    });
    commandModifierByStepId.set(stepId, merged);
  };

  const addStepContractDamageModifier = (stepId: string, value: number) => {
    const existing = stepContractDamageMultiplierByStepId.get(stepId) ?? 1;
    stepContractDamageMultiplierByStepId.set(
      stepId,
      existing * Math.max(0, 1 + value),
    );
  };

  const addTimedContractDamageModifier = (args: {
    slot: CharacterCombatSnapshot["slot"];
    value: number;
    attackType?: AttackType;
    damageType?: ElementType;
    durationSeconds: number;
    timeScale: TimeScale;
    time: number;
    gameTime: number;
  }) => {
    const expiresAt = (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds;
    for (let index = timedContractDamageModifiers.length - 1; index >= 0; index -= 1) {
      const existing = timedContractDamageModifiers[index];
      if (!existing) {
        continue;
      }
      if (existing.slot !== args.slot) {
        continue;
      }
      if ((existing.attackType ?? null) !== (args.attackType ?? null)) {
        continue;
      }
      if ((existing.damageType ?? null) !== (args.damageType ?? null)) {
        continue;
      }
      if (existing.timeScale !== args.timeScale) {
        continue;
      }
      timedContractDamageModifiers.splice(index, 1);
    }
    timedContractDamageModifiers.push({
      slot: args.slot,
      value: args.value,
      attackType: args.attackType,
      damageType: args.damageType,
      expiresAt,
      timeScale: args.timeScale,
    });
  };

  const getActiveContractVariant = (contractId: string) => {
    const active = args.contingencyContracts?.find((entry) => entry.id === contractId);
    return active ? getContingencyContractVariant(active.id, active.variantId) : null;
  };

  const applyContractTokenBuff = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
    label: string;
    time: number;
    gameTime: number;
    stepId: string;
    durationSeconds?: number;
    infiniteDuration?: boolean;
    timeScale?: TimeScale;
  }) => {
    applyActorBuff({
      slot: args.slot,
      sourceSlot: args.slot,
      stepId: args.stepId,
      time: args.time,
      gameTime: args.gameTime,
      buffId: args.buffId,
      label: args.label,
      durationSeconds: args.durationSeconds ?? 0,
      infiniteDuration: args.infiniteDuration ?? true,
      timeScale: args.timeScale ?? "game",
      effects: {},
    });
  };

  const getContractDamageMultiplier = (args: {
    slot: CharacterCombatSnapshot["slot"];
    attackType: AttackType;
    damageType: ElementType;
    time: number;
    gameTime: number;
    stepId?: string;
    enemySlotId?: EnemySlotId;
  }) => {
    let multiplier = 1;

    if (args.attackType === "BATTLE_SKILL") {
      for (const value of resolvedContracts.battleSkillDamagePctValues) {
        multiplier *= Math.max(0, 1 + value);
      }
    }

    if (isNonCommandAttackType(args.attackType)) {
      for (const value of resolvedContracts.nonCommandDamagePctValues) {
        multiplier *= Math.max(0, 1 + value);
      }
    }

    if (args.stepId) {
      multiplier *= stepContractDamageMultiplierByStepId.get(args.stepId) ?? 1;
    }

    for (const modifier of timedContractDamageModifiers) {
      if (modifier.slot !== args.slot) {
        continue;
      }
      if (modifier.attackType && modifier.attackType !== args.attackType) {
        continue;
      }
      if (modifier.damageType && modifier.damageType !== args.damageType) {
        continue;
      }
      const referenceTime = modifier.timeScale === "real" ? args.time : args.gameTime;
      if (modifier.expiresAt <= referenceTime + 1e-9) {
        continue;
      }
      multiplier *= Math.max(0, 1 + modifier.value);
    }

    if (resolvedContracts.encasementActive && args.enemySlotId) {
      const encasementStatusId = args.damageType === "Physical"
        ? ENCASEMENT_STATUS_IDS.Physical
        : args.damageType === "Heat"
          ? ENCASEMENT_STATUS_IDS.Heat
          : args.damageType === "Cryo"
            ? ENCASEMENT_STATUS_IDS.Cryo
            : args.damageType === "Electric"
              ? ENCASEMENT_STATUS_IDS.Electric
              : args.damageType === "Nature"
                ? ENCASEMENT_STATUS_IDS.Nature
                : null;
      const encasementResidualStatusId = args.damageType === "Physical"
        ? ENCASEMENT_RESIDUAL_STATUS_IDS.Physical
        : args.damageType === "Heat"
          ? ENCASEMENT_RESIDUAL_STATUS_IDS.Heat
          : args.damageType === "Cryo"
            ? ENCASEMENT_RESIDUAL_STATUS_IDS.Cryo
            : args.damageType === "Electric"
              ? ENCASEMENT_RESIDUAL_STATUS_IDS.Electric
              : args.damageType === "Nature"
                ? ENCASEMENT_RESIDUAL_STATUS_IDS.Nature
                : null;
      if (encasementStatusId && encasementResidualStatusId) {
        const baseStacks = Math.max(0, getEnemySpecialStackStatus(encasementStatusId, args.enemySlotId)?.stacks ?? 0);
        const residualStacks = Math.max(0, getEnemySpecialStackStatus(encasementResidualStatusId, args.enemySlotId)?.stacks ?? 0);
        const totalStacks = baseStacks + residualStacks;
        if (totalStacks > 0) {
          multiplier *= Math.max(0, 1 - 0.1 * totalStacks);
        }
      }
    }

    return Math.max(0, multiplier);
  };

  let totalDamage = resumeOutputPrefix?.totalDamage ?? 0;
  let riggedCritCount = resumeOutputPrefix?.riggedCritCount ?? 0;
  const damageBySlot = new Map<CharacterCombatSnapshot["slot"], number>(
    (resumeOutputPrefix?.damageBySlot ?? []).map((entry) => [entry.slot, entry.damage]),
  );
  let timedEnemyDebuffs: TimedEnemyDebuff[] = deepClone(resumeCheckpoint?.runtime.timedEnemyDebuffs ?? []);
  let runtimeStatuses: UnifiedCombatStatus[] = deepClone(resumeCheckpoint?.runtime.runtimeStatuses ?? []);
  const cloneStatusForLog = (status: UnifiedCombatStatus): UnifiedCombatStatus => ({
    ...status,
    metadata: status.metadata ? { ...status.metadata } : undefined,
  });
  const makeStatusInstanceId = (statusId: string) => `${statusId}:inst:${statusInstanceSequence++}`;
  const normalizeStatus = (status: Omit<UnifiedCombatStatus, "instanceId"> & { instanceId?: string }): UnifiedCombatStatus => ({
    ...status,
    instanceId: status.instanceId ?? makeStatusInstanceId(status.id),
    metadata: status.metadata ? { ...status.metadata } : undefined,
  });
  const pushStatusChangeLog = (args: {
    changeType: UnifiedStatusChangeType;
    reason: string;
    time: number;
    gameTime: number;
    stepId?: string;
    status: UnifiedCombatStatus;
    previousStatus?: UnifiedCombatStatus;
  }) => {
    statusChangeLog.push({
      sequence: statusChangeSequence++,
      changeType: args.changeType,
      reason: args.reason,
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      status: cloneStatusForLog(args.status),
      previousStatus: args.previousStatus ? cloneStatusForLog(args.previousStatus) : undefined,
    });
  };

  const buildStatusUpdatedEvent = (status: UnifiedCombatStatus, args: {
    time: number;
    gameTime: number;
    stepId?: string;
    reason: string;
    changeType: UnifiedStatusChangeType;
  }): RotationCombatEvent => {
    const metadataElement = status.metadata?.element;
    const consumedElement = metadataElement === "Heat" || metadataElement === "Cryo" || metadataElement === "Electric" || metadataElement === "Nature"
      ? metadataElement
      : undefined;
    const statusNow = status.timeScale === "real" ? args.time : args.gameTime;
    const statusDurationSeconds = Number.isFinite(status.expiresAt)
      ? Math.max(0, status.expiresAt - statusNow)
      : undefined;
    return {
      type: "STATUS_UPDATED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: status.targetSlot ?? status.ownerSlot,
      sourceSlot: status.ownerSlot,
      target: status.scope === "enemy" ? "enemy" : undefined,
      enemySlotId: status.enemySlotId,
      affectedEnemySlotIds: status.enemySlotId ? [status.enemySlotId] : undefined,
      label: `${status.label} Ended`,
      buffId: status.id,
      statusId: status.id,
      statusScope: status.scope,
      statusKind: status.kind,
      statusChangeType: args.changeType,
      statusReason: args.reason,
      statusStacks: status.stacks,
      statusDurationSeconds,
      statusTargetSlot: status.targetSlot,
      statusOwnerSlot: status.ownerSlot,
      consumedElement,
    };
  };
  const appendStatusUpdatedEvent = (event: RotationCombatEvent) => {
    events.push(event);
  };
  const observeStatusUpdatedEvent = (event: RotationCombatEvent) => {
    if (!resolvedContracts.encasementActive) {
      return;
    }
    const shouldRefreshEncasement =
      event.statusId === ARTS_INFLICTION_STATUS_ID
      || event.statusId === VULNERABILITY_STATUS_ID;
    if (!shouldRefreshEncasement) {
      return;
    }
    const enemySlotIds = event.affectedEnemySlotIds?.length
      ? event.affectedEnemySlotIds
      : event.enemySlotId
        ? [event.enemySlotId]
        : [];
    for (const enemySlotId of enemySlotIds) {
      updateEnemyEncasementStatuses({
        enemySlotId,
        time: event.time,
        gameTime: event.gameTime,
        stepId: event.stepId,
      });
    }
  };
  const replaceRuntimeStatuses = (
    nextStatuses: UnifiedCombatStatus[],
    args: {
      reason: string;
      time: number;
      gameTime: number;
      stepId?: string;
      changeType?: UnifiedStatusChangeType;
      previousStatuses?: UnifiedCombatStatus[];
    },
  ) => {
    const normalized = nextStatuses.map(normalizeStatus);
    const previous = (args.previousStatuses ?? runtimeStatuses).map(cloneStatusForLog);
    const previousByInstanceId = new Map(previous.map((status) => [status.instanceId, status]));
    const nextByInstanceId = new Map(normalized.map((status) => [status.instanceId, status]));
    const changedStatuses: Array<{ status: UnifiedCombatStatus; changeType: UnifiedStatusChangeType }> = [];
    for (const status of previous) {
      if (!nextByInstanceId.has(status.instanceId)) {
        changedStatuses.push({ status, changeType: args.changeType ?? "removed" });
        pushStatusChangeLog({
          changeType: args.changeType ?? "removed",
          reason: args.reason,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          status,
        });
      }
    }
    for (const status of normalized) {
      const prev = previousByInstanceId.get(status.instanceId);
      if (!prev) {
        changedStatuses.push({ status, changeType: args.changeType ?? "added" });
        pushStatusChangeLog({
          changeType: args.changeType ?? "added",
          reason: args.reason,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          status,
        });
        continue;
      }
      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(status);
      if (prevSerialized !== nextSerialized) {
        changedStatuses.push({ status, changeType: args.changeType ?? "updated" });
        pushStatusChangeLog({
          changeType: args.changeType ?? "updated",
          reason: args.reason,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          status,
          previousStatus: prev,
        });
      }
    }
    runtimeStatuses = normalized;
    for (const entry of changedStatuses) {
      const event = buildStatusUpdatedEvent(entry.status, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        reason: args.reason,
        changeType: entry.changeType,
      });
      appendStatusUpdatedEvent(event);
      observeStatusUpdatedEvent(event);
    }
  };
  const actorMaxHpBySlot = deepClone(resumeCheckpoint?.runtime.actorMaxHpBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  const actorCurrentHpBySlot = deepClone(resumeCheckpoint?.runtime.actorCurrentHpBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  let controlledOperatorSlot: CharacterCombatSnapshot["slot"] = resumeCheckpoint?.runtime.controlledOperatorSlot ?? 0;
  const activeBuildVariantBySlot = deepClone(resumeCheckpoint?.runtime.activeBuildVariantBySlot ?? new Map<PartySlot, number>());
  const getRuntimeActorBySlot = (slot: PartySlot) => {
    const variant = activeBuildVariantBySlot.get(slot) ?? Math.max(0, Math.min(3, args.initialVariantIndex ?? 0));
    return partyVariantsBySlot.get(slot)?.[variant] ?? partyBySlot.get(slot);
  };
  const createCommandEffectTree = (args: {
    actor: CharacterCombatSnapshot;
    stepId: string;
    commandId: string;
    commandName: string;
    target?: CombatEffectTarget;
  }) =>
    createRootEffectTree({
      kind: "command",
      stepId: args.stepId,
      slot: args.actor.slot,
      characterId: args.actor.characterId,
      characterName: args.actor.characterName,
      commandId: args.commandId,
      commandName: args.commandName,
      target: args.target,
    });
  const extendMemberEffectTree = (args: {
    tree: CombatEffectTree | undefined;
    kind: "character_hook" | "gear_set" | "weapon_skill";
    member: CharacterCombatSnapshot;
    stepId: string;
    sourceId?: string;
    sourceName?: string;
    target?: CombatEffectTarget;
  }) =>
    extendEffectTree(args.tree, {
      kind: args.kind,
      stepId: args.stepId,
      slot: args.member.slot,
      characterId: args.member.characterId,
      characterName: args.member.characterName,
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      target: args.target,
    });
  const switchBackLockedUntilBySlot = deepClone(resumeCheckpoint?.runtime.switchBackLockedUntilBySlot ?? new Map<CharacterCombatSnapshot["slot"], number>());
  const trySwitchControlledOperator = (args: {
    nextSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
    label: string;
    ignoreCooldown?: boolean;
  }): boolean => {
    if (resolvedContracts.disabledGenericActions.has("switch")) {
      return false;
    }
    if (args.nextSlot === controlledOperatorSlot) {
      return false;
    }
    if (!args.ignoreCooldown) {
      const lockedUntil = switchBackLockedUntilBySlot.get(args.nextSlot) ?? 0;
      if (args.time < lockedUntil - 0.001) {
        return false;
      }
    }

    const previousControlledSlot = controlledOperatorSlot;
    controlledOperatorSlot = args.nextSlot;
    switchBackLockedUntilBySlot.set(previousControlledSlot, args.time + SWITCH_BACK_COOLDOWN_SECONDS);
    const switchedEvent: RotationCombatEvent = {
      type: "OPERATOR_SWITCHED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: controlledOperatorSlot,
      sourceSlot: previousControlledSlot,
      label: args.label,
    };
    emitEvent(switchedEvent);
    dispatchPassiveListeners(switchedEvent);
    if (resolvedContracts.decapitationDamageTakenPct != null && resolvedContracts.decapitationDamageTakenPct > 0) {
      removeActorBuff({
        slot: previousControlledSlot,
        buffId: "contract_decapitation_controlled",
      });
      applyActorBuff({
        slot: controlledOperatorSlot,
        sourceSlot: controlledOperatorSlot,
        stepId: args.stepId,
        time: args.time,
        gameTime: args.gameTime,
        buffId: "contract_decapitation_controlled",
        label: "Decapitation",
        durationSeconds: 0,
        infiniteDuration: true,
        timeScale: "game",
        effects: {
          DMG_TAKEN_PCT: resolvedContracts.decapitationDamageTakenPct,
        },
      });
    }
    return true;
  };
  const MAX_ENEMY_SLOTS = 10;
  const makeVirtualEnemySlotId = (index: number) => `enemy_slot_virtual_${index + 1}`;
  const providedEnemySlots: EnemySlotState[] =
    Array.isArray(args.enemySlots) && args.enemySlots.length > 0
      ? args.enemySlots.map((slot) => ({
          slotId: slot.slotId,
          enemyId: slot.enemyId,
          level: Math.max(1, Math.min(100, Math.round(slot.level))),
          spawnTimeEnabled: slot.spawnTimeEnabled === true,
          spawnTime:
            typeof slot.spawnTime === "number" && Number.isFinite(slot.spawnTime)
              ? Math.round(slot.spawnTime * 1000) / 1000
              : 0,
          noDeath: slot.noDeath === true,
        }))
      : [{
          slotId: "enemy_slot_1",
          enemyId: args.enemyId,
          level: Math.max(1, Math.min(100, Math.round(args.enemyLevel))),
          spawnTimeEnabled: false,
          spawnTime: 0,
          noDeath: false,
        }];
  const normalizedEnemySlots: EnemySlotState[] = [
    ...providedEnemySlots,
    ...Array.from({ length: Math.max(0, MAX_ENEMY_SLOTS - providedEnemySlots.length) }, (_, index) => ({
      slotId: makeVirtualEnemySlotId(providedEnemySlots.length + index),
      enemyId: "",
      level: Math.max(1, Math.min(100, Math.round(args.enemyLevel))),
      spawnTimeEnabled: false,
      spawnTime: 0,
      noDeath: false,
    })),
  ];
  const initialTargetedEnemySlotId =
    args.targetedEnemySlotId && normalizedEnemySlots.some((slot) => slot.slotId === args.targetedEnemySlotId)
      ? args.targetedEnemySlotId
      : normalizedEnemySlots[0]!.slotId;
  const makeFallbackEnemyBase = (enemyId: string) => ({
    id: enemyId,
    name: enemyId,
    rank: "common" as const,
    baseHpLv1: args.enemyStats.hp,
    baseAtkLv1: args.enemyStats.atk,
    hpScalingModel: [1],
    atkScalingModel: [1],
    def: args.enemyStats.def,
    resistances: args.enemyStats.resistances,
    weight: 1,
    staggerGauge: args.enemyStaggerGauge,
    staggerNodes: args.enemyStaggerNodes,
    staggerRecoverySeconds: args.enemyStaggerRecoverySeconds,
    finisherMultiplier: args.enemyFinisherMultiplier ?? 1,
    finisherSpGain: args.enemyFinisherSpGain ?? 0,
  });
  const enemyRuntimeBySlot = deepClone(resumeCheckpoint?.runtime.enemyRuntimeBySlot ?? new Map<EnemySlotId, RuntimeEnemySlotState>());
  const enemyHpHistoryBySlot = deepClone(resumeCheckpoint?.runtime.enemyHpHistoryBySlot ?? new Map<EnemySlotId, EnemyHpHistoryEntry[]>());
  const enemyHpDeltaHistoryBySlot = deepClone(resumeCheckpoint?.runtime.enemyHpDeltaHistoryBySlot ?? new Map<EnemySlotId, EnemyHpDeltaEntry[]>());
  if (!resumeCheckpoint) {
    for (const slot of normalizedEnemySlots) {
      const spawnTime = slot.spawnTimeEnabled === true ? (slot.spawnTime ?? 0) : Number.NEGATIVE_INFINITY;
      const hasConfiguredEnemy = typeof slot.enemyId === "string" && slot.enemyId.length > 0;
      const base = hasConfiguredEnemy
        ? (enemyById.get(slot.enemyId) ?? makeFallbackEnemyBase(slot.enemyId))
        : makeFallbackEnemyBase("");
      const stats = hasConfiguredEnemy && enemyById.get(slot.enemyId)
        ? calculateEnemyStats(base, slot.level)
        : {
            level: slot.level,
            ...args.enemyStats,
          };
      enemyRuntimeBySlot.set(slot.slotId, {
        slotId: slot.slotId,
        level: slot.level,
        spawnTime,
        hasConfiguredEnemy,
        isPresent: false,
        isDead: false,
        deadAt: undefined,
        noDeath: slot.noDeath === true,
        base,
        stats,
        modifierBase: makeEnemyModifierSnapshot({
          resistances: {
            PHYSICAL_RESIST_PCT: stats.resistances.Physical,
            HEAT_RESIST_PCT: stats.resistances.Heat,
            CRYO_RESIST_PCT: stats.resistances.Cryo,
            ELECTRIC_RESIST_PCT: stats.resistances.Electric,
            NATURE_RESIST_PCT: stats.resistances.Nature,
            AETHER_RESIST_PCT: stats.resistances.Aether,
          },
        }),
        damageTaken: 0,
        currentStaggerForEvents: 0,
        staggerLastUpdateTime: 0,
        isStaggeredForEvents: false,
        reachedStaggerNodeThresholds: new Set<number>(),
      });
      enemyHpHistoryBySlot.set(slot.slotId, []);
      enemyHpDeltaHistoryBySlot.set(slot.slotId, []);
    }
  }
  let currentTargetedEnemySlotId = resumeCheckpoint?.runtime.currentTargetedEnemySlotId ?? initialTargetedEnemySlotId;
  const normalizedEnemySlotById = new Map(normalizedEnemySlots.map((slot) => [slot.slotId, slot]));
  const isEnemyPresent = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    enemyRuntimeBySlot.get(enemySlotId)?.isPresent === true;
  const applyContractEnemyModifiersToSlot = (enemySlotId: EnemySlotId, time: number, gameTime: number) => {
    if (Object.keys(resolvedContracts.enemyModifierEffects).length <= 0) {
      return;
    }
    applyEnemyBuff({
      buffId: "contract_enemy_modifiers",
      label: "Contract Enemy Modifiers",
      effects: resolvedContracts.enemyModifierEffects,
      durationSeconds: Number.POSITIVE_INFINITY,
      timeScale: "game",
      time,
      gameTime,
      stepId: "__contract_enemy_modifiers",
      sourceSlot: controlledOperatorSlot,
      enemySlotId,
    });
  };
  const emitEnemySpawnedEvent = (enemySlotId: EnemySlotId, time: number, gameTime: number, enemyId: string) => {
    const event: RotationCombatEvent = {
      type: "ENEMY_SPAWNED",
      time,
      gameTime,
      enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      target: "enemy",
      label: "Enemy Spawned",
      enemyId,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };
  const emitEnemyReplacedEvent = (enemySlotId: EnemySlotId, time: number, gameTime: number, enemyId: string) => {
    const event: RotationCombatEvent = {
      type: "ENEMY_REPLACED",
      time,
      gameTime,
      enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      target: "enemy",
      label: "Enemy Replaced",
      enemyId,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };
  const spawnEnemySlotIfNeeded = (enemySlotId: EnemySlotId, time: number) => {
    const runtime = enemyRuntimeBySlot.get(enemySlotId);
    if (
      !runtime
      || !runtime.hasConfiguredEnemy
      || runtime.isPresent
      || runtime.isDead
      || time + 0.0001 < runtime.spawnTime
    ) {
      return false;
    }
    runtime.isPresent = true;
    runtime.isDead = false;
    runtime.deadAt = undefined;
    runtime.damageTaken = 0;
    runtime.currentStaggerForEvents = 0;
    runtime.isStaggeredForEvents = false;
    runtime.reachedStaggerNodeThresholds.clear();
    runtime.staggerLastUpdateTime = time;
    enemyHpDeltaHistoryBySlot.set(enemySlotId, []);
    enemyHpHistoryBySlot.set(enemySlotId, [{
      time,
      hp: runtime.stats.hp,
      maxHp: runtime.stats.hp,
    }]);
    pushEnemyLifecycleEntry({
      enemySlotId,
      time,
      gameTime: timeContext.toGameTime(time),
      enemyId: runtime.base.id,
      type: "spawned",
    });
    applyContractEnemyModifiersToSlot(enemySlotId, time, timeContext.toGameTime(time));
    emitEnemySpawnedEvent(enemySlotId, time, timeContext.toGameTime(time), runtime.base.id);
    return true;
  };
  const syncEnemyPresenceToTime = (time: number) => {
    for (const slot of normalizedEnemySlots) {
      spawnEnemySlotIfNeeded(slot.slotId, time);
    }
  };
  const getCurrentEnemyRuntimeState = () => {
    const resolvedSlotId = currentEnemyResolutionSlotId ?? currentTargetedEnemySlotId;
    const runtime = enemyRuntimeBySlot.get(resolvedSlotId);
    if (!runtime) {
      throw new Error(`Missing runtime enemy state for slot ${resolvedSlotId}`);
    }
    return runtime;
  };
  let currentEnemyResolutionSlotId: EnemySlotId | null = null;
  const getResolvedEnemySlotId = (enemySlotId?: EnemySlotId) => enemySlotId ?? currentEnemyResolutionSlotId ?? currentTargetedEnemySlotId;
  const getFinisherTargetEnemySlotId = () =>
    normalizedEnemySlots.find((slot) => isEnemyPresent(slot.slotId) && hasEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID, slot.slotId))?.slotId
    ?? currentTargetedEnemySlotId;
  const withEnemyResolutionSlot = <T>(enemySlotId: EnemySlotId, fn: () => T): T => {
    const previous = currentEnemyResolutionSlotId;
    currentEnemyResolutionSlotId = enemySlotId;
    try {
      return fn();
    } finally {
      currentEnemyResolutionSlotId = previous;
    }
  };
  const resolveEnemyStatusSlotId = (enemySlotId?: EnemySlotId) => getResolvedEnemySlotId(enemySlotId);
  const resolveEnemyDebuffSlotId = (enemySlotId?: EnemySlotId) => getResolvedEnemySlotId(enemySlotId);
  const resolveAffectedEnemySlotIds = (targeting: "all_enemies" | "targeted_enemy" | "finisher" = "all_enemies") => {
    if (targeting === "targeted_enemy") {
      return isEnemyPresent(currentTargetedEnemySlotId) ? [currentTargetedEnemySlotId] : [];
    }
    if (targeting === "finisher") {
      const finisherTarget = getFinisherTargetEnemySlotId();
      return isEnemyPresent(finisherTarget) ? [finisherTarget] : [];
    }
    return normalizedEnemySlots
      .map((slot) => slot.slotId)
      .filter((slotId) => isEnemyPresent(slotId));
  };

  const enemyActionWindows = [...(args.enemyActionWindows ?? [])]
    .filter((window) => Number.isFinite(window.startTime) && Number.isFinite(window.endTime) && window.endTime > window.startTime)
    .map((window) => ({
      ...window,
      enemySlotId: window.enemySlotId ?? initialTargetedEnemySlotId,
    }))
    .sort((left, right) => left.startTime - right.startTime);
  const enemyInterruptTimes = enemyActionWindows
    .filter((window) =>
      !window.interrupted
      && window.startEffects?.some((effect) => effect.type === "INTERRUPT_ONGOING_COMMANDS"))
    .map((window) => window.startTime)
    .sort((left, right) => left - right);
  const interruptOngoingCommandsAt = (interruptAt: number) => {
    for (const action of actions) {
      if (action.realStartTime < interruptAt - 0.0001 && action.realEndTime > interruptAt - 0.0001) {
        const existing = interruptedAtByStepId.get(action.stepId);
        if (existing == null || interruptAt < existing) {
          interruptedAtByStepId.set(action.stepId, interruptAt);
        }
      }
    }
  };
  const enemyInterruptedCommandWindows = enemyActionWindows
    .filter((window) =>
      window.interruptible !== false
      && window.interrupted === true
      && ((window.interruptedSpGain ?? 0) > 0 || (window.interruptedStagger ?? 0) > 0),
    )
    .sort((left, right) => left.startTime - right.startTime);
  const enemyActionWindowIds = new Set(enemyActionWindows.map((window) => window.id));
  const enemyActionCommandIds = new Set(enemyActionWindows.map((window) => window.commandId));
  const getCurrentEnemyBase = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState().base);
  const getCurrentEnemyStats = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState().stats);
  const getCurrentEnemyModifierBase = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState().modifierBase);
  const getCurrentEnemyStaggerGauge = () => Math.max(0, getCurrentEnemyBase().staggerGauge);
  const getCurrentEnemyStaggerNodes = () => getCurrentEnemyBase().staggerNodes ?? [];
  const getCurrentEnemyStaggerRecoverySeconds = () => Math.max(0, getCurrentEnemyBase().staggerRecoverySeconds);
  const getCurrentEnemyStaggerDecayRate = () => {
    const gauge = getCurrentEnemyStaggerGauge();
    const recovery = getCurrentEnemyStaggerRecoverySeconds();
    return recovery > 0 ? gauge / recovery : 0;
  };
  const getCurrentEnemyStaggerNodeThresholds = () => {
    const gauge = getCurrentEnemyStaggerGauge();
    return getCurrentEnemyStaggerNodes()
      .map((node) => (node > 0 && node <= 1 ? node * gauge : node))
      .filter((node) => node > 0 && node < gauge)
      .sort((left, right) => left - right);
  };
  const getCurrentEnemyFinisherMultiplier = () => Math.max(0, getCurrentEnemyBase().finisherMultiplier);
  const getCurrentEnemyFinisherSpGain = () => Math.max(0, getCurrentEnemyBase().finisherSpGain);
  const getCurrentEnemyHpPctModifier = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    !isEnemyPresent(enemySlotId)
      ? 0
      :
    timedEnemyDebuffs
      .filter((debuff) => resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId)
      .filter((debuff) => debuff.stat === "HP_PCT")
      .reduce((sum, debuff) => sum + debuff.value, 0);
  const getCurrentEnemyMaxHp = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    !isEnemyPresent(enemySlotId)
      ? Math.max(1, getCurrentEnemyStats(enemySlotId).hp)
      : Math.max(1, getCurrentEnemyStats(enemySlotId).hp * (1 + getCurrentEnemyHpPctModifier(enemySlotId)));
  const getCurrentEnemyHp = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    !isEnemyPresent(enemySlotId)
      ? 0
      :
    withEnemyResolutionSlot(enemySlotId, () =>
      Math.max(0, getCurrentEnemyMaxHp(enemySlotId) - getCurrentEnemyRuntimeState().damageTaken));
  const appendEnemyHpHistory = (enemySlotId: EnemySlotId, entry: EnemyHpHistoryEntry) => {
    const history = enemyHpHistoryBySlot.get(enemySlotId) ?? [];
    const last = history[history.length - 1];
    if (last && Math.abs(last.time - entry.time) <= 1e-9) {
      history[history.length - 1] = entry;
    } else {
      history.push(entry);
    }
    while (history.length > 0 && history[0] && history[0].time < entry.time - 1) {
      history.shift();
    }
    enemyHpHistoryBySlot.set(enemySlotId, history);
  };
  const appendEnemyHpDeltaHistory = (enemySlotId: EnemySlotId, entry: EnemyHpDeltaEntry) => {
    const history = enemyHpDeltaHistoryBySlot.get(enemySlotId) ?? [];
    history.push(entry);
    while (history.length > 0 && history[0] && history[0].time < entry.time - 1) {
      history.shift();
    }
    enemyHpDeltaHistoryBySlot.set(enemySlotId, history);
  };
  const clearEnemyRuntimeEffects = (enemySlotId: EnemySlotId) => {
    runtimeStatuses = runtimeStatuses.filter((status) =>
      !(
        status.scope === "enemy"
        && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
      ),
    );
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      resolveEnemyDebuffSlotId(debuff.enemySlotId) !== enemySlotId,
    );
  };
  const markEnemyDead = (args: {
    enemySlotId: EnemySlotId;
    time: number;
    gameTime: number;
    stepId?: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    commandId?: string;
    commandName?: string;
    hitName?: string;
    damageType?: ElementType;
    commandAttackType?: RotationCombatEvent["commandAttackType"];
  }) => {
    const runtime = enemyRuntimeBySlot.get(args.enemySlotId);
    if (!runtime || runtime.isDead) {
      return;
    }
    const finalMaxHp = getCurrentEnemyMaxHp(args.enemySlotId);
    const defeatedEnemyId = runtime.base.id;
    runtime.isPresent = false;
    runtime.isDead = true;
    runtime.deadAt = args.time;
    runtime.damageTaken = finalMaxHp;
    runtime.currentStaggerForEvents = 0;
    runtime.isStaggeredForEvents = false;
    runtime.reachedStaggerNodeThresholds.clear();
    runtime.staggerLastUpdateTime = args.time;
    appendEnemyHpHistory(args.enemySlotId, {
      time: args.time,
      hp: 0,
      maxHp: finalMaxHp,
    });
    pushEnemyLifecycleEntry({
      enemySlotId: args.enemySlotId,
      time: args.time,
      gameTime: args.gameTime,
      enemyId: defeatedEnemyId,
      type: "defeated",
    });
    const event: RotationCombatEvent = {
      type: "ENEMY_DEFEATED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      enemySlotId: args.enemySlotId,
      affectedEnemySlotIds: [args.enemySlotId],
      commandId: args.commandId,
      commandName: args.commandName,
      hitName: args.hitName,
      damageType: args.damageType,
      commandAttackType: args.commandAttackType,
      target: "enemy",
      label: "Enemy Defeated",
      dealsDamage: true,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
    runEnemyDefinitionListeners({
      enemySlotId: args.enemySlotId,
      enemyId: defeatedEnemyId,
      eventType: "ENEMY_DEFEATED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
    });
    const runtimeAfterEvent = enemyRuntimeBySlot.get(args.enemySlotId);
    if (runtimeAfterEvent?.isDead && runtimeAfterEvent.isPresent === false) {
      clearEnemyRuntimeEffects(args.enemySlotId);
      enemyHpDeltaHistoryBySlot.set(args.enemySlotId, []);
    }
  };
  const getEnemyHpHistorySnapshotAtOrBefore = (
    enemySlotId: EnemySlotId,
    time: number,
  ): EnemyHpHistoryEntry => {
    if (!isEnemyPresent(enemySlotId)) {
      return {
        time,
        hp: 0,
        maxHp: getCurrentEnemyStats(enemySlotId).hp,
      };
    }
    const history = enemyHpHistoryBySlot.get(enemySlotId) ?? [];
    let latest = history[0] ?? {
      time: 0,
      hp: getCurrentEnemyMaxHp(enemySlotId),
      maxHp: getCurrentEnemyMaxHp(enemySlotId),
    };
    for (const entry of history) {
      if (entry.time <= time + 1e-9) {
        latest = entry;
      } else {
        break;
      }
    }
    return latest;
  };
  const getEnemyDamageClampResult = (
    damage: number,
    enemySlotId: EnemySlotId,
    time: number,
  ) => {
    if (!(damage > 0) || !resolvedContracts.swiftendActive) {
      return {
        allowedDamage: Math.max(0, damage),
        contractFlatModifier: 0,
      };
    }
    const runtime = withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState());
    const currentMaxHp = getCurrentEnemyMaxHp(enemySlotId);
    const recentDamageInWindow = (enemyHpDeltaHistoryBySlot.get(enemySlotId) ?? [])
      .filter((entry) => entry.time > time - 0.1 - 1e-9 && entry.time <= time + 1e-9)
      .reduce((sum, entry) => sum + entry.hpDelta, 0);
    const maxAllowedDamage = Math.max(0, currentMaxHp * 0.25 - recentDamageInWindow);
    if (damage > maxAllowedDamage + 1e-9) {
      return {
        allowedDamage: Math.max(0, maxAllowedDamage),
        contractFlatModifier: maxAllowedDamage - damage,
      };
    }
    return {
      allowedDamage: damage,
      contractFlatModifier: 0,
    };
  };
  const applyEnemyDamage = (
    damage: number,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
    context?: {
      time?: number;
      gameTime?: number;
      stepId?: string;
      sourceSlot?: CharacterCombatSnapshot["slot"];
      commandId?: string;
      commandName?: string;
      hitName?: string;
      damageType?: ElementType;
      commandAttackType?: RotationCombatEvent["commandAttackType"];
    },
  ) => {
    if (!(damage > 0) || !isEnemyPresent(enemySlotId)) {
      return { appliedDamage: 0, contractFlatModifier: 0 };
    }
    const runtime = withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState());
    const currentMaxHp = getCurrentEnemyMaxHp(enemySlotId);
    const clamp = context?.time != null
      ? getEnemyDamageClampResult(damage, enemySlotId, context.time)
      : { allowedDamage: damage, contractFlatModifier: 0 };
    const appliedDamage = clamp.allowedDamage;
    const contractFlatModifier = clamp.contractFlatModifier;
    const hpBefore = Math.max(0, currentMaxHp - runtime.damageTaken);
    runtime.damageTaken = Math.min(currentMaxHp, runtime.damageTaken + appliedDamage);
    appendEnemyHpDeltaHistory(enemySlotId, {
      time: context?.time ?? 0,
      hpDelta: appliedDamage,
    });
    appendEnemyHpHistory(enemySlotId, {
      time: context?.time ?? 0,
      hp: Math.max(0, currentMaxHp - runtime.damageTaken),
      maxHp: currentMaxHp,
    });
    if (!runtime.noDeath && hpBefore > 0.0001 && runtime.damageTaken >= currentMaxHp - 0.0001) {
      markEnemyDead({
        enemySlotId,
        time: context?.time ?? 0,
        gameTime: context?.gameTime ?? 0,
        stepId: context?.stepId,
        sourceSlot: context?.sourceSlot,
        commandId: context?.commandId,
        commandName: context?.commandName,
        hitName: context?.hitName,
        damageType: context?.damageType,
        commandAttackType: context?.commandAttackType,
      });
    }
    return { appliedDamage, contractFlatModifier };
  };
  const applyEnemyHealing = (
    amount: number,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
    context?: {
      time?: number;
    },
  ) => {
    if (!(amount > 0) || !isEnemyPresent(enemySlotId)) {
      return 0;
    }
    const runtime = withEnemyResolutionSlot(enemySlotId, () => getCurrentEnemyRuntimeState());
    const currentMaxHp = getCurrentEnemyMaxHp(enemySlotId);
    const hpBefore = Math.max(0, currentMaxHp - runtime.damageTaken);
    runtime.damageTaken = Math.max(0, runtime.damageTaken - amount);
    const healed = Math.max(0, Math.min(amount, currentMaxHp - hpBefore));
    appendEnemyHpHistory(enemySlotId, {
      time: context?.time ?? 0,
      hp: Math.max(0, currentMaxHp - runtime.damageTaken),
      maxHp: currentMaxHp,
    });
    return healed;
  };
  const applyActorFlatHpChange = (args: {
    slot: PartySlot;
    amount: number;
    operation: "damage" | "heal";
  }) => {
    const actor = partyBySlot.get(args.slot);
    if (!actor || !(args.amount > 0)) {
      return 0;
    }
    const currentHp = actorCurrentHpBySlot.get(args.slot) ?? actor.maxHp;
    const maxHp = actorMaxHpBySlot.get(args.slot) ?? actor.maxHp;
    if (args.operation === "heal") {
      const applied = Math.max(0, Math.min(args.amount, maxHp - currentHp));
      if (applied > 0) {
        actorCurrentHpBySlot.set(args.slot, currentHp + applied);
      }
      return applied;
    }
    const applied = Math.max(0, Math.min(args.amount, currentHp));
    if (applied > 0) {
      actorCurrentHpBySlot.set(args.slot, currentHp - applied);
    }
    return applied;
  };

  const applyEnemyDamageToActor = (args: {
    slot: PartySlot;
    maxHpRatio: number;
    time: number;
    gameTime: number;
    stepId: string;
  }) => {
    const actor = getRuntimeActorBySlot(args.slot) ?? partyBySlot.get(args.slot);
    if (!actor) {
      return;
    }
    const amount = Math.max(0, actor.maxHp * Math.max(0, args.maxHpRatio));
    if (amount <= 0) {
      return;
    }
    applyActorFlatHpChange({
      slot: args.slot,
      amount,
      operation: "damage",
    });
    recordActorState(args.slot, args.time, args.gameTime);
  };

  const applyActorArtsInfliction = (args: {
    slot: PartySlot;
    element: PlayerArtsElement;
    durationSeconds: number;
    stacks?: number;
    time: number;
    gameTime: number;
    stepId: string;
  }) => {
    const actorBlocksArtsInflictionElement = (
      slot: PartySlot,
      element: PlayerArtsElement,
      time: number,
      gameTime: number,
    ) => {
      const hasBlockingRuntimeStatus = runtimeStatuses.some((status) => {
        if (status.scope !== "actor" || status.targetSlot !== slot) {
          return false;
        }
        const definition = getCombatStatusDefinition(status.id);
        const blockedElements = (
          Array.isArray(status.metadata?.blocksOperatorArtsInflictionElements)
            ? status.metadata.blocksOperatorArtsInflictionElements
            : definition?.blocksOperatorArtsInflictionElements
        ) as PlayerArtsElement[] | undefined;
        return Array.isArray(blockedElements) && blockedElements.includes(element);
      });
      if (hasBlockingRuntimeStatus) {
        return true;
      }
      return getEffectStatuses().some((status) => {
        if (
          status.target !== "self"
          || status.sourceSlot !== slot
          || (status.timeScale === "real" ? status.expiresAt <= time : status.expiresAt <= gameTime)
        ) {
          return false;
        }
        return Array.isArray(status.blocksOperatorArtsInflictionElements)
          && status.blocksOperatorArtsInflictionElements.includes(element);
      });
    };
    if (actorBlocksArtsInflictionElement(args.slot, args.element, args.time, args.gameTime)) {
      return;
    }
    if (args.element === "Cryo" && hasActorStatusById(PLAYER_SOLIDIFICATION_STATUS_ID, args.slot)) {
      return;
    }
    const existing = getActorInflictionStatus(args.slot, args.element);
    const addedStacks = Math.max(1, Math.round(args.stacks ?? 1));
    const nextStacks = Math.max(1, (existing?.stacks ?? 0) + addedStacks);
    const expiresAt = args.gameTime + args.durationSeconds;
    if (nextStacks >= 4) {
      removeActorStatusById({
        slot: args.slot,
        statusId: `${args.element.toLowerCase()}_infliction`,
        kind: "infliction",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        reason: "player_arts_infliction_consumed_for_reaction",
      });
      if (args.element === "Cryo") {
        const solidificationDurationSeconds = (
          activeContractVariantIds.has("frozen_duration_heat")
          || activeContractVariantIds.has("frozen_duration_nature")
          || activeContractVariantIds.has("frozen_duration_electric")
          || activeContractVariantIds.has("frozen_duration_physical")
        ) ? 15 : 5.75;
        setActorStatusById({
          slot: args.slot,
          statusId: PLAYER_SOLIDIFICATION_STATUS_ID,
          label: "Solidification",
          expiresAt: args.gameTime + solidificationDurationSeconds,
          timeScale: "game",
          kind: "reaction_status",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          reason: "player_solidification_applied",
        });
      } else if (args.element === "Heat") {
        setActorStatusById({
          slot: args.slot,
          statusId: PLAYER_COMBUSTION_STATUS_ID,
          label: "Combustion",
          expiresAt: args.gameTime + 8,
          timeScale: "game",
          kind: "reaction_status",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          reason: "player_combustion_applied",
          metadata: {
            nextTickAtGameTime: args.gameTime + 1,
          },
        });
        applyEnemyDamageToActor({
          slot: args.slot,
          maxHpRatio: 0.04,
          time: args.time,
          gameTime: args.gameTime,
          stepId: `${args.stepId}:player_combustion_initial`,
        });
      }
      return;
    }
    setActorStatusById({
      slot: args.slot,
      statusId: `${args.element.toLowerCase()}_infliction`,
      label: `${args.element} Infliction`,
      expiresAt,
      timeScale: "game",
      kind: "infliction",
      stacks: nextStacks,
      metadata: {
        element: args.element,
      },
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      reason: "player_arts_infliction_applied",
    });
  };

  const applyEnemyPhysicalInflictionEffect = (args: {
    stacks?: number;
    durationSeconds?: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
  }) => {
    const enemySlotId = currentEnemyResolutionSlotId ?? getResolvedEnemySlotId();
    if (resolvedContracts.barrierInflictionIntervalSeconds != null && resolvedContracts.barrierInflictionIntervalSeconds > 0) {
      const blocked = hasUnifiedStatus({
        statusId: "contract_barrier_vulnerability",
        target: "enemy",
        realTime: args.time,
        gameTime: args.gameTime,
      });
      if (blocked) {
        return false;
      }
    }
    const currentStacks = Math.max(0, getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0);
    const addedStacks = Math.max(0, args.stacks ?? 1);
    const nextStacks = Math.max(1, Math.min(4, currentStacks + addedStacks));
    const durationSeconds = Math.max(0.001, args.durationSeconds ?? ARTS_INFLICTION_DURATION_SECONDS);
    setEnemyPhysicalInfliction({
      stacks: nextStacks,
      expiresAtGameTime: args.gameTime + durationSeconds,
    }, enemySlotId, {
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
    });
    const event: RotationCombatEvent = {
      type: "ENEMY_DEBUFF_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      target: "enemy",
      enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      label: "Vulnerability Applied",
      commandAttackType: args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
      enemyHadVulnerability: currentStacks > 0,
    };
    emitEvent(event);
    dispatchPassiveListeners(event, args.triggerSlots);
    if (resolvedContracts.barrierInflictionIntervalSeconds != null && resolvedContracts.barrierInflictionIntervalSeconds > 0) {
      addEnemyStatusById({
        statusId: "contract_barrier_vulnerability",
        label: "Barrier Immunity",
        expiresAt: args.gameTime + resolvedContracts.barrierInflictionIntervalSeconds,
        timeScale: "game",
      });
    }
    return true;
  };

  const applyEnemyArtsInflictionEffect = (args: {
    element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
    stacks?: number;
    durationSeconds?: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandId?: string;
    sourceCommandName?: string;
    sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
    linkSourceStepId?: string;
  }) => {
    const enemySlotId = currentEnemyResolutionSlotId ?? getResolvedEnemySlotId();
    if (resolvedContracts.barrierInflictionIntervalSeconds != null && resolvedContracts.barrierInflictionIntervalSeconds > 0) {
      const immunityId = `contract_barrier_arts_${args.element.toLowerCase()}`;
      const blocked = hasUnifiedStatus({
        statusId: immunityId,
        target: "enemy",
        realTime: args.time,
        gameTime: args.gameTime,
      });
      if (blocked) {
        return false;
      }
    }
    const stacks = Math.max(1, args.stacks ?? 1);
    const durationSeconds = args.durationSeconds ?? ARTS_INFLICTION_DURATION_SECONDS;
    const currentInfliction = getEnemyArtsInfliction(enemySlotId);
    let inflictionApplied = false;
    if (!currentInfliction) {
      setEnemyArtsInfliction({
        element: args.element,
        stacks,
        expiresAtGameTime: args.gameTime + durationSeconds,
      }, enemySlotId, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      inflictionApplied = true;
    } else if (currentInfliction.element === args.element) {
      queueArtsBurstFromInfliction({
        element: args.element,
        sourceSlot: args.sourceSlot,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        triggerSlots: args.triggerSlots,
        sourceCommandId: args.sourceCommandId,
        sourceCommandName: args.sourceCommandName,
      });
      setEnemyArtsInfliction({
        element: args.element,
        stacks: Math.min(4, currentInfliction.stacks + stacks),
        expiresAtGameTime: args.gameTime + durationSeconds,
      }, enemySlotId, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      inflictionApplied = true;
    } else {
      const previousStacks = currentInfliction.stacks;
      const inflictionConsumedEvent: RotationCombatEvent = {
        type: "ARTS_INFLICTION_CONSUMED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: `${currentInfliction.element} Infliction Consumed`,
        consumedElement: currentInfliction.element,
        consumedStacks: previousStacks,
      };
      emitEvent(inflictionConsumedEvent);
      dispatchPassiveListeners(inflictionConsumedEvent, args.triggerSlots);
      setEnemyArtsInfliction(null, enemySlotId, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });

      if (args.element === "Heat") {
        applyReaction({
          reaction: "Combustion",
          level: previousStacks,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.sourceSlot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        triggerReactionDamageFromConsumedInflictions({
          reaction: "Combustion",
          consumedStacks: previousStacks,
          sourceSlot: args.sourceSlot,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          linkSourceStepId: args.linkSourceStepId,
        });
      } else if (args.element === "Cryo") {
        applyReaction({
          reaction: "Solidification",
          level: previousStacks,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.sourceSlot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        triggerReactionDamageFromConsumedInflictions({
          reaction: "Solidification",
          consumedStacks: previousStacks,
          sourceSlot: args.sourceSlot,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          linkSourceStepId: args.linkSourceStepId,
        });
      } else if (args.element === "Electric") {
        applyReaction({
          reaction: "Electrification",
          level: previousStacks,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.sourceSlot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        triggerReactionDamageFromConsumedInflictions({
          reaction: "Electrification",
          consumedStacks: previousStacks,
          sourceSlot: args.sourceSlot,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          linkSourceStepId: args.linkSourceStepId,
        });
      } else if (args.element === "Nature") {
        applyReaction({
          reaction: "Corrosion",
          level: previousStacks,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.sourceSlot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        triggerReactionDamageFromConsumedInflictions({
          reaction: "Corrosion",
          consumedStacks: previousStacks,
          sourceSlot: args.sourceSlot,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          linkSourceStepId: args.linkSourceStepId,
        });
      }
    }

    if (inflictionApplied) {
      const inflictionEvent: RotationCombatEvent = {
        type: "ARTS_INFLICTION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: `${args.element} Infliction Applied`,
        commandAttackType: args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
        consumedElement: args.element,
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
      };
      emitEvent(inflictionEvent);
      dispatchPassiveListeners(inflictionEvent, args.triggerSlots);
      if (resolvedContracts.barrierInflictionIntervalSeconds != null && resolvedContracts.barrierInflictionIntervalSeconds > 0) {
        addEnemyStatusById({
          statusId: `contract_barrier_arts_${args.element.toLowerCase()}`,
          label: "Barrier Immunity",
          expiresAt: args.gameTime + resolvedContracts.barrierInflictionIntervalSeconds,
          timeScale: "game",
        });
      }

      if (args.element === "Heat") {
        emitEvent({
          type: "HEAT_INFLICTION_APPLIED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          target: "enemy",
          enemySlotId,
          affectedEnemySlotIds: [enemySlotId],
          label: "Heat Infliction Applied",
        });
      }
    }
    return inflictionApplied;
  };

  let nextEnemyActionStartEffectWindowIndex = resumeCheckpoint?.runtime.nextEnemyActionStartEffectWindowIndex ?? 0;
  let nextEnemyActionEndEffectWindowIndex = resumeCheckpoint?.runtime.nextEnemyActionEndEffectWindowIndex ?? 0;
  let nextEnemyInterruptedCommandWindowIndex = resumeCheckpoint?.runtime.nextEnemyInterruptedCommandWindowIndex ?? 0;
  const triggerExecutionKeys = new Set<string>();
  const triggerStatusLabelById = new Map(CUSTOM_TRIGGER_STATUS_OPTIONS.map((entry) => [entry.id, entry.label.en]));
  const resolveTriggerStatusLabel = (statusId: string) =>
    getCombatStatusDefinition(statusId)?.label.en
    ?? triggerStatusLabelById.get(statusId as typeof CUSTOM_TRIGGER_STATUS_OPTIONS[number]["id"])
    ?? statusId;
  const resolveTriggerStatusEffects = (
    action: Extract<TriggerAction, { type: "APPLY_STATUS" }>,
    event: RotationCombatEvent,
    trigger: CustomCombatTrigger,
  ): Partial<ModifierStats> => {
    const resolved: Partial<ModifierStats> = {};
    for (const entry of action.statEntries ?? []) {
      const rawValue = evaluateTriggerValueExpression(entry.value, event, trigger);
      if (typeof rawValue !== "number" || !Number.isFinite(rawValue) || rawValue === 0) {
        continue;
      }
      const statKey = entry.statKind === "basic"
        ? (entry.statKey === "ATK" ? "FLAT_ATK" : "FLAT_HP")
        : entry.statKey;
      resolved[statKey as ModifierStatKey] = (resolved[statKey as ModifierStatKey] ?? 0) + rawValue;
    }
    return resolved;
  };

  const isEnemyInvulnerableAt = (time: number, enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    enemyActionWindows.some((window) =>
      window.enemySlotId === enemySlotId
      && window.interrupted !== true
      && window.invulnerable
      && time >= window.startTime
      && time < window.endTime);
  const ENEMY_CROWD_CONTROL_STATUS_IDS = new Set([
    "lift",
    "knockdown",
    "solidification",
    "endministrator_originium_crystal",
  ]);
  const isEnemyRankSubjectToCrowdControl = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) => {
    const rank = getCurrentEnemyBase(enemySlotId).rank;
    return rank === "common" || rank === "advanced";
  };
  const hasOldenStareFieldAt = (time: number, gameTime: number, sourceSlot: CharacterCombatSnapshot["slot"] = controlledOperatorSlot) =>
    hasUnifiedStatus({
      statusId: "tangtang_olden_stare",
      target: "field",
      sourceSlot,
      realTime: time,
      gameTime,
    });
  const isEnemyUnderCrowdControlAt = (args: {
    time: number;
    gameTime: number;
    enemySlotId?: EnemySlotId;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return false;
    }
    if (getEnemyStatuses(enemySlotId).some((status) => status.id === TANGTANG_OLDEN_STARE_CROWD_CONTROL_STATUS_ID)) {
      return true;
    }
    if (!isEnemyRankSubjectToCrowdControl(enemySlotId)) {
      return false;
    }
    return getEnemyStatuses(enemySlotId).some((status) => ENEMY_CROWD_CONTROL_STATUS_IDS.has(status.id));
  };
  const canHitEnemyBeforeBattleStart = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
  }) =>
    hasUnifiedStatus({
      statusId: TANGTANG_ULTIMATE_STATUS_ID,
      target: "field",
      sourceSlot: args.sourceSlot,
      realTime: args.time,
      gameTime: args.gameTime,
    });
  const applyTangtangOldenStareCrowdControlToActiveEnemies = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId: string;
    time: number;
    gameTime: number;
    durationSeconds?: number;
  }) => {
    const durationSeconds = Math.max(0.001, args.durationSeconds ?? 0.5);
    for (const enemySlotId of normalizedEnemySlots
      .map((slot) => slot.slotId)
      .filter((slotId) => isEnemyPresent(slotId))) {
      addEnemyStatusById({
        statusId: TANGTANG_OLDEN_STARE_CROWD_CONTROL_STATUS_ID,
        label: "Olden Stare",
        expiresAt: args.gameTime + durationSeconds,
        timeScale: "game",
        kind: ENEMY_STATUS_KIND,
        enemySlotId,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
    }
  };
  const getContractRegenerationHealPctPerSecond = () => {
    if (activeContractVariantIds.has("controlled_healing_2")) {
      return 0.15;
    }
    if (activeContractVariantIds.has("controlled_healing_1")) {
      return 0.05;
    }
    return 0;
  };
  const applyEnemyRegenerationStatus = (args: {
    enemySlotId?: EnemySlotId;
    time: number;
    gameTime: number;
    stepId?: string;
    durationSeconds: number;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const healPctPerSecond = getContractRegenerationHealPctPerSecond();
    if (!(healPctPerSecond > 0)) {
      return;
    }
    const existingStatus = getEnemyStatuses(enemySlotId).find((status) => status.id === "contract_regeneration") ?? null;
    const nextStatus: TimedEnemyStatus = {
      instanceId: existingStatus?.instanceId,
      id: "contract_regeneration",
      label: "Edit: Regeneration",
      expiresAt: args.gameTime + args.durationSeconds,
      timeScale: "game",
      nextTickAtGameTime: existingStatus?.nextTickAtGameTime ?? (args.gameTime + 1),
      healPctPerSecond,
    };
    const nextStatuses = [
      ...getEnemyStatuses(enemySlotId).filter((status) => status.id !== "contract_regeneration"),
      nextStatus,
    ];
    setEnemyStatuses(nextStatuses, {
      reason: "apply_contract_regeneration",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: existingStatus ? "refreshed" : "added",
    }, enemySlotId);
  };
  const isEnemyHitBlocked = (args: {
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId?: string;
    commandId?: string;
    time: number;
    gameTime: number;
    enemySlotId?: EnemySlotId;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    const blockedByNormalInvulnerability =
      !shouldIgnoreEnemyInvulnerability({ stepId: args.stepId, commandId: args.commandId })
      && isEnemyInvulnerableAt(args.time, enemySlotId);
    if (args.gameTime < PRE_BATTLE_START_GAME_TIME) {
      return !canHitEnemyBeforeBattleStart(args) || blockedByNormalInvulnerability;
    }
    return blockedByNormalInvulnerability;
  };
  const shouldIgnoreEnemyInvulnerability = (args: { stepId?: string; commandId?: string }) =>
    (args.stepId != null && enemyActionWindowIds.has(args.stepId))
    || (args.commandId != null && enemyActionCommandIds.has(args.commandId));

  const hasEnemyStatusById = (statusId: string, enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    isEnemyPresent(enemySlotId) && runtimeStatuses.some((status) =>
      status.scope === "enemy"
      && status.kind === ENEMY_STATUS_KIND
      && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
      && status.id === statusId,
    );
  const hasActorStatusById = (statusId: string, slot: CharacterCombatSnapshot["slot"]) =>
    runtimeStatuses.some((status) =>
      status.scope === "actor"
      && status.targetSlot === slot
      && status.kind !== ACTOR_BUFF_KIND
      && status.id === statusId,
    );
  const hasTeamStatusById = (statusId: string) =>
    runtimeStatuses.some((status) =>
      status.scope === "team" && status.kind === "team_status" && status.id === statusId,
    );
  const hasCharacterPotentialAtLeast = (characterId: string, level: number) =>
    party.some((member) => member.characterId === characterId && member.potentialLevel >= level);

  const addEnemyStatusById = (args: {
    statusId: string;
    label: string;
    expiresAt: number;
    timeScale: TimeScale;
    kind?: UnifiedStatusKind;
    hidden?: boolean;
    stacks?: number;
    enemySlotId?: EnemySlotId;
    time?: number;
    gameTime?: number;
    stepId?: string;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const previousStatuses = runtimeStatuses.map(cloneStatusForLog);
    const nextStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy"
        && status.kind === (args.kind ?? ENEMY_STATUS_KIND)
        && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
        && status.id === args.statusId),
    );
    nextStatuses.push(normalizeStatus({
      id: args.statusId,
      label: args.label,
      scope: "enemy",
      kind: args.kind ?? ENEMY_STATUS_KIND,
      enemySlotId,
      expiresAt: args.expiresAt,
      timeScale: args.timeScale,
      hidden: args.hidden,
      stacks: args.stacks,
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: "enemy_status_set",
      changeType: "replaced",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
      previousStatuses,
    });
  };

  const removeEnemyStatusById = (
    statusId: string,
    logArgs?: { time?: number; gameTime?: number; stepId?: string; reason?: string },
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
  ) => {
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    replaceRuntimeStatuses(runtimeStatuses.filter((status) =>
      !(status.scope === "enemy"
        && status.kind === ENEMY_STATUS_KIND
        && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
        && status.id === statusId),
    ), {
      reason: logArgs?.reason ?? "enemy_status_removed",
      changeType: "removed",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  const getActorInflictionStatus = (slot: CharacterCombatSnapshot["slot"], element: PlayerArtsElement) =>
    runtimeStatuses.find((status) =>
      status.scope === "actor"
      && status.kind === "infliction"
      && status.targetSlot === slot
      && (
        status.metadata?.element === element
        || status.id === `${element.toLowerCase()}_infliction`
      ),
    ) ?? null;

  const setActorStatusById = (args: {
    slot: CharacterCombatSnapshot["slot"];
    statusId: string;
    label: string;
    expiresAt: number;
    timeScale: TimeScale;
    kind?: UnifiedStatusKind;
    hidden?: boolean;
    stacks?: number;
    metadata?: Record<string, unknown>;
    time?: number;
    gameTime?: number;
    stepId?: string;
    reason: string;
  }) => {
    const previousStatuses = runtimeStatuses.map(cloneStatusForLog);
    const kind = args.kind ?? ACTOR_STATUS_KIND;
    const existingStatus = runtimeStatuses.find((status) =>
      status.scope === "actor"
      && status.targetSlot === args.slot
      && status.kind === kind
      && status.id === args.statusId,
    );
    const nextStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "actor"
        && status.targetSlot === args.slot
        && status.kind === kind
        && status.id === args.statusId),
    );
    nextStatuses.push(normalizeStatus({
      instanceId: existingStatus?.instanceId,
      id: args.statusId,
      label: args.label,
      scope: "actor",
      kind,
      ownerSlot: args.slot,
      targetSlot: args.slot,
      expiresAt: args.expiresAt,
      timeScale: args.timeScale,
      hidden: args.hidden,
      stacks: args.stacks,
      metadata: args.metadata,
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: args.reason,
      changeType: existingStatus ? "replaced" : "added",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
      previousStatuses,
    });
  };

  const removeActorStatusById = (args: {
    slot: CharacterCombatSnapshot["slot"];
    statusId: string;
    kind?: UnifiedStatusKind;
    time?: number;
    gameTime?: number;
    stepId?: string;
    reason: string;
  }) => {
    const kind = args.kind;
    replaceRuntimeStatuses(runtimeStatuses.filter((status) =>
      !(status.scope === "actor"
        && status.targetSlot === args.slot
        && status.id === args.statusId
        && (kind == null || status.kind === kind)),
    ), {
      reason: args.reason,
      changeType: "removed",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
    });
  };

  const clearEnemyStaggerStatuses = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) => {
    removeEnemyStatusById(ENEMY_STAGGERED_STATUS_ID, undefined, enemySlotId);
    removeEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID, undefined, enemySlotId);
  };

  const clearFieldEffectStatuses = (args: { time: number; gameTime: number }) => {
    const effectStatuses = getEffectStatuses();
    const removed = effectStatuses.filter((status) => status.fieldStatus === true);
    if (removed.length <= 0) {
      return;
    }
    for (const status of removed) {
      const sourceActor = partyBySlot.get(status.sourceSlot);
      if (sourceActor && (status.removeEffects?.length ?? 0) > 0) {
        applyHitEffects({
          effects: status.removeEffects,
          time: args.time,
          gameTime: args.gameTime,
          stepId: status.sourceStepId,
          actor: sourceActor,
          triggerSlots: [],
          linkSourceStepId: status.linkSourceStepId,
        });
      }
      if (status.target === "enemy") {
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
          debuff.buffId !== status.id);
      }
    }
    setEffectStatuses(effectStatuses.filter((status) => status.fieldStatus !== true), {
      reason: "clear_field_effect_statuses",
      time: args.time,
      gameTime: args.gameTime,
      changeType: "removed",
    });
  };

  const resetEnemyStagger = (args: { time: number; gameTime: number; enemySlotId?: EnemySlotId }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    withEnemyResolutionSlot(enemySlotId, () => {
      advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime, skipPendingEffectWindows: true });
      const runtime = getCurrentEnemyRuntimeState();
      runtime.currentStaggerForEvents = 0;
      runtime.isStaggeredForEvents = false;
      runtime.reachedStaggerNodeThresholds.clear();
      clearEnemyStaggerStatuses(enemySlotId);
      runtime.staggerLastUpdateTime = args.time;
    });
  };

  const clearActorCryoDebuffs = (args: {
    slot: CharacterCombatSnapshot["slot"];
    time: number;
    gameTime: number;
    stepId: string;
    reason: string;
  }) => {
    removeActorStatusById({
      slot: args.slot,
      statusId: "cryo_infliction",
      kind: "infliction",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      reason: args.reason,
    });
    removeActorStatusById({
      slot: args.slot,
      statusId: PLAYER_SOLIDIFICATION_STATUS_ID,
      kind: "reaction_status",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      reason: args.reason,
    });
    recordActorState(args.slot, args.time, args.gameTime);
  };

  const clearTeamCryoDebuffs = (args: {
    time: number;
    gameTime: number;
    stepId: string;
    reason: string;
  }) => {
    for (const teammate of party) {
      clearActorCryoDebuffs({
        slot: teammate.slot,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        reason: args.reason,
      });
    }
  };

  const transformEnemy = (effectArgs: {
    enemyId: string;
    resetHp?: boolean;
    level?: number;
    noDeath?: boolean;
    time: number;
    gameTime: number;
    enemySlotId?: EnemySlotId;
    lifecycleType?: "replace" | "transform";
  }) => {
    const nextEnemyBase = enemyById.get(effectArgs.enemyId);
    if (!nextEnemyBase) {
      return;
    }
    const enemySlotId = getResolvedEnemySlotId(effectArgs.enemySlotId);
    const runtime = enemyRuntimeBySlot.get(enemySlotId);
    if (!runtime) {
      return;
    }
    const hadActiveEnemyBefore = runtime.isPresent === true && runtime.isDead !== true;
    const hadConfiguredOccupantBefore = runtime.hasConfiguredEnemy === true;
    if (hadConfiguredOccupantBefore) {
      clearEnemyRuntimeEffects(enemySlotId);
    }
    withEnemyResolutionSlot(enemySlotId, () => {
      const currentRuntime = getCurrentEnemyRuntimeState();
      currentRuntime.hasConfiguredEnemy = true;
      currentRuntime.isPresent = true;
      currentRuntime.isDead = false;
      currentRuntime.deadAt = undefined;
      if (typeof effectArgs.level === "number" && Number.isFinite(effectArgs.level) && effectArgs.level > 0) {
        currentRuntime.level = Math.round(effectArgs.level);
      }
      if (typeof effectArgs.noDeath === "boolean") {
        currentRuntime.noDeath = effectArgs.noDeath;
      }
      currentRuntime.base = nextEnemyBase;
      currentRuntime.stats = calculateEnemyStats(nextEnemyBase, currentRuntime.level);
      currentRuntime.modifierBase = makeEnemyModifierSnapshot({
        resistances: {
          PHYSICAL_RESIST_PCT: currentRuntime.stats.resistances.Physical,
          HEAT_RESIST_PCT: currentRuntime.stats.resistances.Heat,
          CRYO_RESIST_PCT: currentRuntime.stats.resistances.Cryo,
          ELECTRIC_RESIST_PCT: currentRuntime.stats.resistances.Electric,
          NATURE_RESIST_PCT: currentRuntime.stats.resistances.Nature,
          AETHER_RESIST_PCT: currentRuntime.stats.resistances.Aether,
        },
      });
      if (effectArgs.resetHp !== false) {
        currentRuntime.damageTaken = 0;
      }
      currentRuntime.damageTaken = Math.min(getCurrentEnemyMaxHp(enemySlotId), currentRuntime.damageTaken);
      currentRuntime.currentStaggerForEvents = 0;
      currentRuntime.isStaggeredForEvents = false;
      currentRuntime.reachedStaggerNodeThresholds.clear();
      clearEnemyStaggerStatuses(enemySlotId);
      currentRuntime.staggerLastUpdateTime = effectArgs.time;
      enemyHpDeltaHistoryBySlot.set(enemySlotId, []);
      appendEnemyHpHistory(enemySlotId, {
        time: effectArgs.time,
        hp: Math.max(0, getCurrentEnemyMaxHp(enemySlotId) - currentRuntime.damageTaken),
        maxHp: getCurrentEnemyMaxHp(enemySlotId),
      });
    });
    pushEnemyLifecycleEntry({
      enemySlotId,
      time: effectArgs.time,
      gameTime: effectArgs.gameTime,
      enemyId: nextEnemyBase.id,
      type:
        effectArgs.lifecycleType === "transform"
          ? "transformed"
          : hadActiveEnemyBefore
            ? "replaced"
            : "spawned",
    });
    if (!hadActiveEnemyBefore) {
      applyContractEnemyModifiersToSlot(enemySlotId, effectArgs.time, effectArgs.gameTime);
      emitEnemySpawnedEvent(enemySlotId, effectArgs.time, effectArgs.gameTime, nextEnemyBase.id);
    } else if (effectArgs.lifecycleType === "replace") {
      emitEnemyReplacedEvent(enemySlotId, effectArgs.time, effectArgs.gameTime, nextEnemyBase.id);
    }
  };

  const applyEnemyActionEffects = (args: {
    effects: EnemyActionWindow["startEffects"] | EnemyActionWindow["endEffects"];
    time: number;
    gameTime: number;
    stepId?: string;
    enemySlotId: EnemySlotId;
  }) => {
    for (const effect of args.effects ?? []) {
      if (effect.type === "INTERRUPT_ONGOING_COMMANDS") {
        interruptOngoingCommandsAt(args.time);
        continue;
      }
      if (effect.type === "RESET_STAGGER") {
        resetEnemyStagger({ time: args.time, gameTime: args.gameTime, enemySlotId: args.enemySlotId });
        continue;
      }
      if (effect.type === "CLEAR_FIELD_EFFECTS") {
        clearFieldEffectStatuses({ time: args.time, gameTime: args.gameTime });
        continue;
      }
      if (effect.type === "REINITIALIZE_COMBAT") {
        initializeCombat({
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId ?? "__combat_reinit",
          label: "Combat Reinitialized",
        });
        continue;
      }
      if (effect.type === "SET_TARGET_ENEMY") {
        currentTargetedEnemySlotId = args.enemySlotId;
        continue;
      }
      if (effect.type === "TRANSFORM_ENEMY") {
        transformEnemy({
          enemyId: effect.enemyId,
          resetHp: effect.resetHp,
          time: args.time,
          gameTime: args.gameTime,
          enemySlotId: args.enemySlotId,
          lifecycleType: "transform",
        });
      }
    }
  };

  const runEnemyDefinitionListeners = (args: {
    enemySlotId: EnemySlotId;
    enemyId: string;
    eventType: RotationCombatEvent["type"];
    time: number;
    gameTime: number;
    stepId?: string;
  }) => {
    const listenerOwner = enemyById.get(args.enemyId);
    if (!listenerOwner?.listeners?.length) {
      return;
    }
    for (const listener of listenerOwner.listeners) {
      if (listener.eventType !== args.eventType) {
        continue;
      }
      if (listener.actionWindow) {
        const actionWindow = listener.actionWindow;
        const endTime = args.time + Math.max(0, actionWindow.durationSeconds);
        const endGameTime = timeContext.toGameTime(endTime);
        enemyTransitionTimeline.push({
          enemySlotId: args.enemySlotId,
          time: args.time,
          gameTime: args.gameTime,
          endTime,
          endGameTime,
          commandId: actionWindow.commandId,
          label: actionWindow.label,
          tintColor: actionWindow.tintColor,
        });
        if ((actionWindow.startEffects?.length ?? 0) > 0) {
          withEnemyResolutionSlot(args.enemySlotId, () => {
            applyEnemyActionEffects({
              effects: actionWindow.startEffects,
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
              enemySlotId: args.enemySlotId,
            });
          });
          recordEnemyState(args.time, args.gameTime);
        }
        if ((actionWindow.endEffects?.length ?? 0) > 0) {
          const endEffects = actionWindow.endEffects ?? [];
          pendingEnemyListenerWindowEnds.push({
            enemySlotId: args.enemySlotId,
            executionTime: endTime,
            executionGameTime: endGameTime,
            effects: deepClone(endEffects),
          });
        }
      }
      if ((listener.effects?.length ?? 0) > 0) {
        withEnemyResolutionSlot(args.enemySlotId, () => {
          applyEnemyActionEffects({
            effects: listener.effects,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            enemySlotId: args.enemySlotId,
          });
        });
        recordEnemyState(args.time, args.gameTime);
      }
    }
  };

  const processEnemyActionStartEffectsUpTo = (args: { time: number; gameTime: number }) => {
    syncEnemyPresenceToTime(args.time);
    while (nextEnemyActionStartEffectWindowIndex < enemyActionWindows.length) {
      const window = enemyActionWindows[nextEnemyActionStartEffectWindowIndex];
      if (!window) {
        nextEnemyActionStartEffectWindowIndex += 1;
        continue;
      }
      if (window.startTime > args.time + 0.0001) {
        break;
      }
      const effectRealTime = window.startTime;
      const effectGameTime = timeContext.toGameTime(window.startTime);
      if (!window.interrupted && isEnemyPresent(window.enemySlotId) && window.commandId !== "phase_transition" && isEnemyUnderCrowdControlAt({
        time: effectRealTime,
        gameTime: effectGameTime,
        enemySlotId: window.enemySlotId,
      })) {
        window.interrupted = true;
      }
      if (window.interrupted || !window.startEffects?.length) {
        nextEnemyActionStartEffectWindowIndex += 1;
        continue;
      }
      nextEnemyActionStartEffectWindowIndex += 1;
      if (!isEnemyPresent(window.enemySlotId)) {
        continue;
      }
      withEnemyResolutionSlot(window.enemySlotId, () => {
        applyEnemyActionEffects({
          effects: window.startEffects,
          time: effectRealTime,
          gameTime: effectGameTime,
          stepId: `__enemy_action_start:${window.id}`,
          enemySlotId: window.enemySlotId,
        });
      });
      recordEnemyState(effectRealTime, effectGameTime);
    }
  };

  const processEnemyActionEndEffectsUpTo = (args: { time: number; gameTime: number }) => {
    syncEnemyPresenceToTime(args.time);
    while (nextEnemyActionEndEffectWindowIndex < enemyActionWindows.length) {
      const window = enemyActionWindows[nextEnemyActionEndEffectWindowIndex];
      if (!window) {
        nextEnemyActionEndEffectWindowIndex += 1;
        continue;
      }
      if (window.endTime > args.time + 0.0001) {
        break;
      }
      const effectRealTime = window.endTime;
      const effectGameTime = timeContext.toGameTime(window.endTime);
      if (!window.interrupted && isEnemyPresent(window.enemySlotId) && window.commandId !== "phase_transition" && isEnemyUnderCrowdControlAt({
        time: effectRealTime,
        gameTime: effectGameTime,
        enemySlotId: window.enemySlotId,
      })) {
        window.interrupted = true;
      }
      if (window.interrupted || !window.endEffects?.length) {
        nextEnemyActionEndEffectWindowIndex += 1;
        continue;
      }
      nextEnemyActionEndEffectWindowIndex += 1;
      if (!isEnemyPresent(window.enemySlotId)) {
        continue;
      }
      withEnemyResolutionSlot(window.enemySlotId, () => {
        applyEnemyActionEffects({
          effects: window.endEffects,
          time: effectRealTime,
          gameTime: effectGameTime,
          stepId: `__enemy_action_end:${window.id}`,
          enemySlotId: window.enemySlotId,
        });
      });
      recordEnemyState(effectRealTime, effectGameTime);
    }
  };

  const advanceEnemyStaggerTo = (args: { time: number; gameTime: number; skipPendingEffectWindows?: boolean }) => {
    syncEnemyPresenceToTime(args.time);
    if (!args.skipPendingEffectWindows) {
      processEnemyActionStartEffectsUpTo(args);
      processEnemyActionEndEffectsUpTo(args);
    }
    if (!isEnemyPresent()) {
      return;
    }
    const runtime = getCurrentEnemyRuntimeState();
    const processDecay = (fromTime: number, toTime: number) => {
      const staggerDecayRate = getCurrentEnemyStaggerDecayRate();
      if (!runtime.isStaggeredForEvents || staggerDecayRate <= 0 || toTime <= fromTime) {
        return;
      }
      runtime.currentStaggerForEvents = Math.max(0, runtime.currentStaggerForEvents - (toTime - fromTime) * staggerDecayRate);
      if (runtime.currentStaggerForEvents <= 0.0001) {
        runtime.currentStaggerForEvents = 0;
        runtime.isStaggeredForEvents = false;
        runtime.reachedStaggerNodeThresholds.clear();
        clearEnemyStaggerStatuses();
      }
    };

    processDecay(runtime.staggerLastUpdateTime, args.time);
    runtime.staggerLastUpdateTime = args.time;
  };

  const advanceAllEnemyStaggerTo = (args: { time: number; gameTime: number; skipPendingEffectWindows?: boolean }) => {
    syncEnemyPresenceToTime(args.time);
    if (!args.skipPendingEffectWindows) {
      processEnemyActionStartEffectsUpTo(args);
      processEnemyActionEndEffectsUpTo(args);
    }
    for (const slot of normalizedEnemySlots) {
      if (!isEnemyPresent(slot.slotId)) {
        continue;
      }
      withEnemyResolutionSlot(slot.slotId, () => {
        const runtime = getCurrentEnemyRuntimeState();
        const staggerDecayRate = getCurrentEnemyStaggerDecayRate();
        if (!runtime.isStaggeredForEvents || staggerDecayRate <= 0 || args.time <= runtime.staggerLastUpdateTime) {
          runtime.staggerLastUpdateTime = args.time;
          return;
        }
        runtime.currentStaggerForEvents = Math.max(
          0,
          runtime.currentStaggerForEvents - (args.time - runtime.staggerLastUpdateTime) * staggerDecayRate,
        );
        if (runtime.currentStaggerForEvents <= 0.0001) {
          runtime.currentStaggerForEvents = 0;
          runtime.isStaggeredForEvents = false;
          runtime.reachedStaggerNodeThresholds.clear();
          clearEnemyStaggerStatuses(slot.slotId);
        }
        runtime.staggerLastUpdateTime = args.time;
      });
    }
  };

  const applyEnemyStaggerFromHit = (args: {
    rawStagger: number;
    time: number;
    gameTime: number;
    stepId: string;
    enemySlotId?: EnemySlotId;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }): number => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
    const baseStagger = Math.max(0, args.rawStagger);
    const sourceActor = args.sourceSlot != null ? partyBySlot.get(args.sourceSlot) : undefined;
    const sourceMods = sourceActor ? getEffectiveActorMods(sourceActor, args.time, args.gameTime) : undefined;
    const staggerEfficiencyMultiplier = Math.max(0, 1 + (sourceMods?.STAGGER_EFFICIENCY_PCT ?? 0));
    const effectiveStagger = baseStagger * staggerEfficiencyMultiplier;
    const maxStagger = getCurrentEnemyStaggerGauge();
    const runtime = getCurrentEnemyRuntimeState();
    if (effectiveStagger <= 0 || runtime.isStaggeredForEvents || maxStagger <= 0) {
      return 0;
    }

    const previousStagger = runtime.currentStaggerForEvents;
    const nextStagger = Math.min(maxStagger, previousStagger + effectiveStagger);
    runtime.currentStaggerForEvents = nextStagger;

    for (const threshold of getCurrentEnemyStaggerNodeThresholds()) {
      if (runtime.reachedStaggerNodeThresholds.has(threshold)) {
        continue;
      }
      if (previousStagger < threshold - 0.0001 && nextStagger >= threshold - 0.0001) {
        runtime.reachedStaggerNodeThresholds.add(threshold);
        const nodeEvent: RotationCombatEvent = {
          type: "STAGGER_NODE_REACHED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          target: "enemy",
          enemySlotId,
          affectedEnemySlotIds: [enemySlotId],
          label: "Stagger Node Reached",
          amount: threshold,
        };
        emitEvent(nodeEvent);
        dispatchPassiveListeners(nodeEvent, args.triggerSlots);
      }
    }

    if (runtime.currentStaggerForEvents >= maxStagger - 0.0001) {
      runtime.currentStaggerForEvents = maxStagger;
      runtime.isStaggeredForEvents = true;
      runtime.reachedStaggerNodeThresholds.clear();
      const staggerRecoverySeconds = getCurrentEnemyStaggerRecoverySeconds();
      addEnemyStatusById({
        statusId: ENEMY_STAGGERED_STATUS_ID,
        label: "Staggered",
        expiresAt: args.time + Math.max(0.001, staggerRecoverySeconds),
        timeScale: "real",
        enemySlotId,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      addEnemyStatusById({
        statusId: ENEMY_FINISHER_AVAILABLE_STATUS_ID,
        label: "Finisher Available",
        expiresAt: args.time + Math.max(0.001, staggerRecoverySeconds),
        timeScale: "real",
        enemySlotId,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      const staggeredEvent: RotationCombatEvent = {
        type: "ENEMY_STAGGERED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
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
    const safeGameTime = Number.isFinite(gameTime) ? gameTime : 0;
    const totalFreeze = timeExtensions.reduce((sum, ext) => {
      const amount = Number.isFinite(ext.amount) ? Math.max(0, ext.amount) : 0;
      return sum + amount;
    }, 0);
    if (!Number.isFinite(totalFreeze)) {
      return safeGameTime;
    }
    let low = safeGameTime - totalFreeze - 10;
    let high = safeGameTime + totalFreeze + 10;
    for (let index = 0; index < 80; index += 1) {
      const mid = (low + high) / 2;
      const midGameTime = toGameTimeFromExtensions(mid);
      if (!Number.isFinite(midGameTime)) {
        return safeGameTime;
      }
      if (midGameTime < safeGameTime) {
        low = mid;
      } else {
        high = mid;
      }
    }
    const resolved = (low + high) / 2;
    return Number.isFinite(resolved) ? resolved : safeGameTime;
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

  const rebuildTimeExtensions = () => {
    const sanitized = timeExtensions.filter((ext) =>
      Number.isFinite(ext.time)
      && Number.isFinite(ext.amount)
      && ext.amount > 0,
    );
    timeExtensions.length = 0;
    timeExtensions.push(...sanitized);
    timeExtensions.sort((left, right) => left.time - right.time);
    let cumulative = 0;
    for (const ext of timeExtensions) {
      ext.cumulativeFreezeTime = cumulative;
      ext.gameTime = ext.time - cumulative;
      cumulative += Math.max(0, ext.amount);
    }
  };

  const addTimeFreezeExtension = (args: {
    time: number;
    amount: number;
    sourceStepId: string;
    cutscene?: boolean;
  }) => {
    const time = Number.isFinite(args.time) ? args.time : 0;
    const duration = Number.isFinite(args.amount) ? Math.max(0, args.amount) : 0;
    if (duration <= 0) {
      return;
    }
    timeExtensions.push({
      time,
      gameTime: time,
      amount: duration,
      sourceStepId: args.sourceStepId,
      sourceStepIds: [args.sourceStepId],
      cumulativeFreezeTime: 0,
      cutscene: args.cutscene ?? false,
    });
    rebuildTimeExtensions();
  };

  const getRootStepId = (stepId: string) => stepId.split(":")[0] ?? stepId;
  const getInterruptCutoffForStep = (stepId: string) => interruptedAtByStepId.get(getRootStepId(stepId));
  const isInterruptedAtOrAfter = (stepId: string, time: number) => {
    const cutoff = getInterruptCutoffForStep(stepId);
    return cutoff != null && time >= cutoff - 0.0001;
  };

  const flushEnemyInterruptedCommandEventsUpTo = (args: { time: number }) => {
    syncEnemyPresenceToTime(args.time);
    while (
      nextEnemyInterruptedCommandWindowIndex < enemyInterruptedCommandWindows.length
      && (enemyInterruptedCommandWindows[nextEnemyInterruptedCommandWindowIndex]?.startTime ?? Number.POSITIVE_INFINITY) <= args.time + 0.0001
    ) {
      const window = enemyInterruptedCommandWindows[nextEnemyInterruptedCommandWindowIndex]!;
      if (!isEnemyPresent(window.enemySlotId)) {
        nextEnemyInterruptedCommandWindowIndex += 1;
        continue;
      }
      const eventTime = window.startTime;
      const eventGameTime = timeContext.toGameTime(eventTime);
      const amount = Math.max(0, window.interruptedSpGain ?? 0);
      const interruptedStagger = Math.max(0, window.interruptedStagger ?? 0);
      if (amount > 0) {
        const interruptedSpEvent: RotationCombatEvent = {
          type: "ENEMY_COMMAND_INTERRUPTED",
          time: eventTime,
          gameTime: eventGameTime,
          enemySlotId: window.enemySlotId,
          affectedEnemySlotIds: [window.enemySlotId],
          target: "enemy",
          label: `${window.label} Interrupted`,
          amount,
        };
        emitEvent(interruptedSpEvent);
      }
      if (interruptedStagger > 0) {
        withEnemyResolutionSlot(window.enemySlotId, () => {
          applyEnemyStaggerFromHit({
            rawStagger: interruptedStagger,
            time: eventTime,
            gameTime: eventGameTime,
            stepId: window.id,
          });
        });
      }
      nextEnemyInterruptedCommandWindowIndex += 1;
    }
  };

  const getEnemyArtsInfliction = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()): EnemyArtsInflictionState | null => {
    if (!isEnemyPresent(enemySlotId)) {
      return null;
    }
    const status = runtimeStatuses.find((entry) =>
      entry.id === ARTS_INFLICTION_STATUS_ID
      && entry.scope === "enemy"
      && entry.kind === "infliction"
      && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId
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

  const setEnemyArtsInfliction = (
    value: EnemyArtsInflictionState | null,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
    logArgs?: { time?: number; gameTime?: number; stepId?: string; reason?: string },
  ) => {
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const existingStatus = runtimeStatuses.find((entry) =>
      entry.id === ARTS_INFLICTION_STATUS_ID
      && entry.scope === "enemy"
      && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId);
    const nextStatuses = runtimeStatuses.filter((entry) =>
      !(entry.id === ARTS_INFLICTION_STATUS_ID
        && entry.scope === "enemy"
        && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId));
    if (!value) {
      replaceRuntimeStatuses(nextStatuses, {
        reason: logArgs?.reason ?? "enemy_arts_infliction_cleared",
        changeType: "removed",
        time: logArgs?.time ?? 0,
        gameTime: logArgs?.gameTime ?? 0,
        stepId: logArgs?.stepId,
      });
      return;
    }
    nextStatuses.push(normalizeStatus({
      instanceId: existingStatus?.instanceId,
      id: ARTS_INFLICTION_STATUS_ID,
      label: `${value.element} Infliction`,
      scope: "enemy",
      kind: "infliction",
      enemySlotId,
      expiresAt: value.expiresAtGameTime,
      timeScale: "game",
      stacks: Math.max(1, Math.floor(value.stacks)),
      metadata: {
        element: value.element,
      },
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: logArgs?.reason ?? "enemy_arts_infliction_set",
      changeType: "replaced",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  const getEnemyPhysicalInfliction = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()): EnemyPhysicalInflictionState | null => {
    if (!isEnemyPresent(enemySlotId)) {
      return null;
    }
    const status = runtimeStatuses.find((entry) =>
      entry.id === VULNERABILITY_STATUS_ID
      && entry.scope === "enemy"
      && entry.kind === "infliction"
      && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId
    );
    if (!status) {
      return null;
    }
    return {
      stacks: Math.max(1, Math.floor(status.stacks ?? 1)),
      expiresAtGameTime: status.expiresAt,
    };
  };

  const setEnemyPhysicalInfliction = (
    value: EnemyPhysicalInflictionState | null,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
    logArgs?: { time?: number; gameTime?: number; stepId?: string; reason?: string },
  ) => {
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const existingStatus = runtimeStatuses.find((entry) =>
      entry.id === VULNERABILITY_STATUS_ID
      && entry.scope === "enemy"
      && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId);
    const nextStatuses = runtimeStatuses.filter((entry) =>
      !(entry.id === VULNERABILITY_STATUS_ID
        && entry.scope === "enemy"
        && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId));
    if (!value) {
      replaceRuntimeStatuses(nextStatuses, {
        reason: logArgs?.reason ?? "enemy_physical_infliction_cleared",
        changeType: "removed",
        time: logArgs?.time ?? 0,
        gameTime: logArgs?.gameTime ?? 0,
        stepId: logArgs?.stepId,
      });
      return;
    }
    nextStatuses.push(normalizeStatus({
      instanceId: existingStatus?.instanceId,
      id: VULNERABILITY_STATUS_ID,
      label: "Vulnerability",
      scope: "enemy",
      kind: "infliction",
      enemySlotId,
      expiresAt: value.expiresAtGameTime,
      timeScale: "game",
      stacks: Math.max(1, Math.floor(value.stacks)),
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: logArgs?.reason ?? "enemy_physical_infliction_set",
      changeType: "replaced",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  const getEnemySpecialStackStatus = (statusId: string, enemySlotId: EnemySlotId) =>
    !isEnemyPresent(enemySlotId)
      ? null
      :
    runtimeStatuses.find((entry) =>
      entry.id === statusId
      && entry.scope === "enemy"
      && entry.kind === "special_stack"
      && resolveEnemyStatusSlotId(entry.enemySlotId) === enemySlotId,
    ) ?? null;

  const setEnemySpecialStackStatus = (args: {
    statusId: string;
    label: string;
    enemySlotId: EnemySlotId;
    stacks: number;
    expiresAt: number;
    timeScale: TimeScale;
    hidden?: boolean;
    metadata?: Record<string, unknown>;
    time: number;
    gameTime: number;
    stepId?: string;
    reason: string;
  }) => {
    if (!isEnemyPresent(args.enemySlotId)) {
      return;
    }
    const previousStatuses = runtimeStatuses.map(cloneStatusForLog);
    const nextStatuses = runtimeStatuses.filter((entry) =>
      !(entry.id === args.statusId
        && entry.scope === "enemy"
        && entry.kind === "special_stack"
        && resolveEnemyStatusSlotId(entry.enemySlotId) === args.enemySlotId));
    if (args.stacks > 0) {
      const existingStatus = getEnemySpecialStackStatus(args.statusId, args.enemySlotId);
      nextStatuses.push(normalizeStatus({
        instanceId: existingStatus?.instanceId,
        id: args.statusId,
        label: args.label,
        scope: "enemy",
        kind: "special_stack",
        enemySlotId: args.enemySlotId,
        expiresAt: args.expiresAt,
        timeScale: args.timeScale,
        stacks: args.stacks,
        hidden: args.hidden,
        metadata: args.metadata,
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: args.reason,
      changeType: "updated",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      previousStatuses,
    });
  };

  const updateEnemyEncasementStatuses = (args: {
    enemySlotId: EnemySlotId;
    time: number;
    gameTime: number;
    stepId?: string;
  }) => {
    if (!isEnemyPresent(args.enemySlotId)) {
      return;
    }
    const artsInfliction = getEnemyArtsInfliction(args.enemySlotId);
    const vulnerabilityStacks = Math.max(0, getEnemyPhysicalInfliction(args.enemySlotId)?.stacks ?? 0);
    const targetStacks: Record<Extract<ElementType, "Physical" | "Heat" | "Cryo" | "Electric" | "Nature">, number> = {
      Physical: vulnerabilityStacks,
      Heat: artsInfliction?.element === "Heat" ? artsInfliction.stacks : 0,
      Cryo: artsInfliction?.element === "Cryo" ? artsInfliction.stacks : 0,
      Electric: artsInfliction?.element === "Electric" ? artsInfliction.stacks : 0,
      Nature: artsInfliction?.element === "Nature" ? artsInfliction.stacks : 0,
    };
    const effectTime = args.time;
    const effectGameTime = args.gameTime;
    for (const damageType of Object.keys(targetStacks) as Array<Extract<ElementType, "Physical" | "Heat" | "Cryo" | "Electric" | "Nature">>) {
      const statusId = ENCASEMENT_STATUS_IDS[damageType];
      const residualStatusId = ENCASEMENT_RESIDUAL_STATUS_IDS[damageType];
      const previousBaseStacks = Math.max(0, getEnemySpecialStackStatus(statusId, args.enemySlotId)?.stacks ?? 0);
      const nextBaseStacks = Math.max(0, targetStacks[damageType]);
      const removedStacks = Math.max(0, previousBaseStacks - nextBaseStacks);
      if (removedStacks > 0) {
        const existingResidualStacks = Math.max(0, getEnemySpecialStackStatus(residualStatusId, args.enemySlotId)?.stacks ?? 0);
        setEnemySpecialStackStatus({
          statusId: residualStatusId,
          label: `Encasement Residual: ${damageType}`,
          enemySlotId: args.enemySlotId,
          stacks: existingResidualStacks + removedStacks,
          expiresAt: effectGameTime + 0.1,
          timeScale: "game",
          hidden: true,
          metadata: { damageType, encasementResidual: true },
          time: effectTime,
          gameTime: effectGameTime,
          stepId: args.stepId,
          reason: "encasement_residual_updated",
        });
      }
      setEnemySpecialStackStatus({
        statusId,
        label: `Encasement: ${damageType}`,
        enemySlotId: args.enemySlotId,
        stacks: nextBaseStacks,
        expiresAt: Number.POSITIVE_INFINITY,
        timeScale: "game",
        metadata: { damageType, encasementBase: true },
        time: effectTime,
        gameTime: effectGameTime,
        stepId: args.stepId,
        reason: "encasement_base_updated",
      });
    }
  };

  const getMeltingFlameStacks = (slot: CharacterCombatSnapshot["slot"]) => {
    const status = runtimeStatuses.find((entry) =>
      entry.id === MELTING_FLAME_STATUS_ID && entry.scope === "actor" && entry.targetSlot === slot
    );
    return Math.max(0, Math.floor(status?.stacks ?? 0));
  };

  const setMeltingFlameStacks = (slot: CharacterCombatSnapshot["slot"], stacks: number) => {
    const nextStatuses = runtimeStatuses.filter((entry) =>
      !(entry.id === MELTING_FLAME_STATUS_ID && entry.scope === "actor" && entry.targetSlot === slot),
    );
    if (stacks <= 0) {
      replaceRuntimeStatuses(nextStatuses, {
        reason: "melting_flame_cleared",
        changeType: "removed",
        time: 0,
        gameTime: 0,
      });
      return;
    }
    nextStatuses.push(normalizeStatus({
      id: MELTING_FLAME_STATUS_ID,
      label: "Melting Flame",
      scope: "actor",
      kind: "special_stack",
      expiresAt: Number.POSITIVE_INFINITY,
      timeScale: "game",
      ownerSlot: slot,
      targetSlot: slot,
      stacks: Math.max(1, Math.floor(stacks)),
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: "melting_flame_set",
      changeType: "replaced",
      time: 0,
      gameTime: 0,
    });
  };

  const decodeEnemyStatus = (status: UnifiedCombatStatus): TimedEnemyStatus => ({
    instanceId: status.instanceId,
    id: status.id,
    label: status.label,
    expiresAt: status.expiresAt,
    timeScale: status.timeScale,
    applierSlot: status.ownerSlot,
    level: typeof status.metadata?.level === "number" ? status.metadata.level : status.stacks,
    nextTickAtGameTime:
      typeof status.metadata?.nextTickAtGameTime === "number" ? status.metadata.nextTickAtGameTime : undefined,
    finalAmount: typeof status.metadata?.finalAmount === "number" ? status.metadata.finalAmount : undefined,
    baseTickMultiplier:
      typeof status.metadata?.baseTickMultiplier === "number" ? status.metadata.baseTickMultiplier : undefined,
    currentReduction:
      typeof status.metadata?.currentReduction === "number" ? status.metadata.currentReduction : undefined,
    nextRampAtGameTime:
      typeof status.metadata?.nextRampAtGameTime === "number" ? status.metadata.nextRampAtGameTime : undefined,
    healPctPerSecond:
      typeof status.metadata?.healPctPerSecond === "number" ? status.metadata.healPctPerSecond : undefined,
  });

  const getEnemyStatuses = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    !isEnemyPresent(enemySlotId)
      ? []
      : runtimeStatuses
        .filter((status) =>
          status.scope === "enemy"
          && status.kind === ENEMY_STATUS_KIND
          && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId)
        .map(decodeEnemyStatus);

  const setEnemyStatuses = (
    statuses: TimedEnemyStatus[],
    logArgs?: StatusMutationLogArgs,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
  ) => {
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const nextStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy"
        && status.kind === ENEMY_STATUS_KIND
        && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId));
    for (const status of statuses) {
      nextStatuses.push(normalizeStatus({
        instanceId: status.instanceId,
        id: status.id,
        label: status.label,
        scope: "enemy",
        kind: ENEMY_STATUS_KIND,
        enemySlotId,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
        ownerSlot: status.applierSlot,
        stacks: status.level,
        metadata: {
          level: status.level,
          nextTickAtGameTime: status.nextTickAtGameTime,
          finalAmount: status.finalAmount,
          baseTickMultiplier: status.baseTickMultiplier,
          currentReduction: status.currentReduction,
          nextRampAtGameTime: status.nextRampAtGameTime,
          healPctPerSecond: status.healPctPerSecond,
        },
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: logArgs?.reason ?? "enemy_statuses_set",
      changeType: logArgs?.changeType ?? "updated",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  const decodeEffectStatus = (status: UnifiedCombatStatus): TimedEffectStatus => ({
    instanceId: status.instanceId,
    id: status.id,
    label: status.label,
    sourceSlot: (status.ownerSlot ?? 0) as CharacterCombatSnapshot["slot"],
    sourceStepId: (status.metadata?.sourceStepId as string) ?? "",
    linkSourceStepId: typeof status.metadata?.linkSourceStepId === "string"
      ? status.metadata.linkSourceStepId
      : undefined,
    target: status.scope === "enemy" ? "enemy" : status.scope === "global" ? "global" : "self",
    enemySlotId: status.scope === "enemy" ? resolveEnemyStatusSlotId(status.enemySlotId) : undefined,
    expiresAt: status.expiresAt,
    timeScale: status.timeScale,
    hidden: status.hidden,
    fieldStatus: status.fieldStatus,
    periods: typeof status.metadata?.periods === "number" ? status.metadata.periods : 1,
    maxPeriods: typeof status.metadata?.maxPeriods === "number" ? status.metadata.maxPeriods : undefined,
    periodsExecuted: typeof status.metadata?.periodsExecuted === "number" ? status.metadata.periodsExecuted : 0,
    periodInterval: typeof status.metadata?.periodInterval === "number" ? status.metadata.periodInterval : 0,
    nextPeriodAt: typeof status.metadata?.nextPeriodAt === "number" ? status.metadata.nextPeriodAt : undefined,
    periodicEffects: (status.metadata?.periodicEffects as CommandHitEffectDefinition[]) ?? [],
    expireEffects: (status.metadata?.expireEffects as CommandHitEffectDefinition[]) ?? [],
    removeEffects: (status.metadata?.removeEffects as CommandHitEffectDefinition[]) ?? [],
    pauseStatusIds: Array.isArray(status.metadata?.pauseStatusIds)
      ? (status.metadata?.pauseStatusIds as string[])
      : undefined,
  });

  const getEffectStatuses = () =>
    runtimeStatuses
      .filter((status) => status.kind === EFFECT_STATUS_KIND)
      .map(decodeEffectStatus);

  const setEffectStatuses = (statuses: TimedEffectStatus[], logArgs?: StatusMutationLogArgs) => {
    const nextStatuses = runtimeStatuses.filter((status) => status.kind !== EFFECT_STATUS_KIND);
    for (const status of statuses) {
      nextStatuses.push(normalizeStatus({
        instanceId: status.instanceId,
        id: status.id,
        label: status.label,
        scope: status.target === "self" ? "actor" : status.target,
        kind: EFFECT_STATUS_KIND,
        enemySlotId: status.target === "enemy" ? status.enemySlotId : undefined,
        expiresAt: status.expiresAt,
        timeScale: status.timeScale,
        ownerSlot: status.sourceSlot,
        targetSlot: status.target === "self" ? status.sourceSlot : undefined,
        hidden: status.hidden,
        fieldStatus: status.fieldStatus,
        metadata: {
          sourceStepId: status.sourceStepId,
          linkSourceStepId: status.linkSourceStepId,
          effects: status.effects,
          periods: status.periods,
          maxPeriods: status.maxPeriods,
          periodsExecuted: status.periodsExecuted,
          periodInterval: status.periodInterval,
          nextPeriodAt: status.nextPeriodAt,
          periodicEffects: status.periodicEffects,
          expireEffects: status.expireEffects,
          removeEffects: status.removeEffects,
          pauseStatusIds: status.pauseStatusIds,
        },
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: logArgs?.reason ?? "effect_statuses_set",
      changeType: logArgs?.changeType ?? "updated",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  const decodeActorBuff = (status: UnifiedCombatStatus): TimedActorBuff => ({
    instanceId: status.instanceId,
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

  const setActorBuffs = (buffs: TimedActorBuff[], logArgs?: StatusMutationLogArgs) => {
    const nextStatuses = runtimeStatuses.filter((status) => status.kind !== ACTOR_BUFF_KIND);
    for (const buff of buffs) {
      nextStatuses.push(normalizeStatus({
        instanceId: buff.instanceId,
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
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: logArgs?.reason ?? "actor_buffs_set",
      changeType: logArgs?.changeType ?? "updated",
      time: logArgs?.time ?? 0,
      gameTime: logArgs?.gameTime ?? 0,
      stepId: logArgs?.stepId,
    });
  };

  let cleanupStateDepth = 0;

  const cleanupStateAt = (realTime: number, gameTime: number) => {
    cleanupStateDepth += 1;
    try {
      syncEnemyPresenceToTime(realTime);
      advanceAllEnemyStaggerTo({ time: realTime, gameTime });

      timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
        debuff.timeScale === "real" ? debuff.expiresAt > realTime : debuff.expiresAt > gameTime,
      );

      const previousStatuses = runtimeStatuses.map(cloneStatusForLog);
      const expiredOrCleared = previousStatuses.filter((status) => {
        if (status.stacks != null && status.stacks <= 0) {
          return true;
        }
        return status.timeScale === "real" ? status.expiresAt <= realTime : status.expiresAt <= gameTime;
      });
      if (expiredOrCleared.length > 0) {
        const expiredIds = new Set(expiredOrCleared.map((status) => status.instanceId));
        runtimeStatuses = runtimeStatuses.filter((status) => !expiredIds.has(status.instanceId));
        for (const status of expiredOrCleared) {
          pushStatusChangeLog({
            changeType: status.stacks != null && status.stacks <= 0 ? "removed" : "expired",
            reason: status.stacks != null && status.stacks <= 0 ? "cleanup_zero_stacks" : "cleanup_expired",
            time: realTime,
            gameTime,
            status,
          });
        }
        for (const status of expiredOrCleared) {
          const changeType = status.stacks != null && status.stacks <= 0 ? "removed" : "expired";
          const reason = status.stacks != null && status.stacks <= 0 ? "cleanup_zero_stacks" : "cleanup_expired";
        const event = buildStatusUpdatedEvent(status, {
          time: realTime,
          gameTime,
          reason,
          changeType,
        });
          appendStatusUpdatedEvent(event);
          observeStatusUpdatedEvent(event);
        }
      }

      for (const [slot, window] of activeComboWindowBySlot.entries()) {
        if (window.consumedAt != null || window.expiresAt <= realTime) {
          activeComboWindowBySlot.delete(slot);
        }
      }

      for (const member of party) {
        const slot = member.slot;
        const intervals = comboCooldownPauseIntervalsBySlot.get(slot);
        if (intervals) {
          const remainingIntervals = intervals.filter((interval) => interval.endTime > realTime + 0.0001);
          if (remainingIntervals.length > 0) {
            comboCooldownPauseIntervalsBySlot.set(slot, remainingIntervals);
          } else {
            comboCooldownPauseIntervalsBySlot.delete(slot);
          }
        }
        const pending = pendingComboCooldownBySlot.get(slot);
        if (!pending || activeComboWindowBySlot.has(slot)) {
          continue;
        }
        const now = pending.timeScale === "real" ? realTime : gameTime;
        const remainingPauseDuration = getRemainingComboCooldownPauseDuration(slot, realTime);
        comboCooldownUntilBySlot.set(slot, now + pending.durationSeconds + remainingPauseDuration);
        pendingComboCooldownBySlot.delete(slot);
      }
    } finally {
      cleanupStateDepth = Math.max(0, cleanupStateDepth - 1);
    }
  };

  const emitEvent = (event: RotationCombatEvent) => {
    const normalizedEvent: RotationCombatEvent = {
      ...event,
      enemyHpRatio: event.enemyHpRatio ?? getEnemyHpRatioAtTime(event.time, event.enemySlotId),
    };
    events.push(normalizedEvent);
    for (const member of party) {
      recordActorState(member.slot, normalizedEvent.time, normalizedEvent.gameTime);
    }
    recordEnemyState(normalizedEvent.time, normalizedEvent.gameTime);
  };

  const getActorHpRatio = (slot: PartySlot) => {
    const maxHp = actorMaxHpBySlot.get(slot) ?? partyBySlot.get(slot)?.maxHp ?? 0;
    const currentHp = actorCurrentHpBySlot.get(slot) ?? maxHp;
    return Math.max(0, Math.min(1, currentHp / Math.max(1, maxHp)));
  };

  const getPrimaryTriggerEventEnemySlotId = (event: RotationCombatEvent) =>
    event.enemySlotId ?? event.affectedEnemySlotIds?.[0] ?? null;

  const getTriggerEventOperatorSlot = (event: RotationCombatEvent): PartySlot | null =>
    event.slot ?? event.sourceSlot ?? null;

  const resolveTriggerOperatorRef = (
    ref: TriggerOperatorReferenceExpression,
    event: RotationCombatEvent,
  ): PartySlot | null => {
    if (ref.type === "controlled_operator") {
      return controlledOperatorSlot;
    }
    return getTriggerEventOperatorSlot(event);
  };

  const evaluateTriggerNumericSource = (
    source: TriggerNumericSource,
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): number | null => {
    if (source.type === "number_literal") {
      return Math.max(1, Math.round(source.value));
    }
    const resolved = evaluateTriggerValueExpression(
      { type: "variable_ref", variableId: source.variableId, variableType: source.variableType },
      event,
      currentTrigger,
    );
    return typeof resolved === "number" && Number.isFinite(resolved)
      ? Math.max(1, Math.round(resolved))
      : null;
  };

  const resolveTriggerEnemyRef = (
    ref: TriggerEnemyReferenceExpression,
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): EnemySlotId | null => {
    switch (ref.type) {
      case "alias_enemy":
        return getPrimaryTriggerEventEnemySlotId(event);
      case "enemy_in_slot": {
        const slotNumber = evaluateTriggerNumericSource(ref.slotNumber, event, currentTrigger);
        const entry = slotNumber != null ? normalizedEnemySlots[slotNumber - 1] : null;
        return entry?.slotId ?? null;
      }
      case "enemy_from_group": {
        const index = evaluateTriggerNumericSource(ref.index, event, currentTrigger);
        return index != null ? event.affectedEnemySlotIds?.[index - 1] ?? null : null;
      }
      default:
        return null;
    }
  };

  const resolveTriggerReference = (
    ref: TriggerReferenceExpression,
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): { kind: "operator"; slot: PartySlot } | { kind: "enemy"; enemySlotId: EnemySlotId } | null => {
    if (ref.type === "alias_operator" || ref.type === "controlled_operator") {
      const slot = resolveTriggerOperatorRef(ref, event);
      return slot != null ? { kind: "operator", slot } : null;
    }
    const enemySlotId = resolveTriggerEnemyRef(ref, event, currentTrigger);
    return enemySlotId ? { kind: "enemy", enemySlotId } : null;
  };

  const resolveTriggerStatusTarget = (
    ref: TriggerAction["type"] extends never ? never : Extract<TriggerAction, { type: "APPLY_STATUS" | "REMOVE_STATUS" }>["target"],
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): { kind: "operator"; slot: PartySlot } | { kind: "enemy"; enemySlotId: EnemySlotId } | { kind: "team" } | { kind: "global" } | null => {
    if (ref.type === "team") {
      return { kind: "team" };
    }
    if (ref.type === "global") {
      return { kind: "global" };
    }
    return resolveTriggerReference(ref, event, currentTrigger);
  };

  const evaluateTriggerValueExpression = (
    expression: TriggerValueExpression,
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): string | number | boolean | null => {
    const getEnemyLifecycleState = (enemySlotId: EnemySlotId): "not_spawned" | "active" | "dead" => {
      const runtime = enemyRuntimeBySlot.get(enemySlotId);
      if (!runtime) {
        return "not_spawned";
      }
      if (runtime.isDead) {
        return "dead";
      }
      if (runtime.isPresent) {
        return "active";
      }
      return "not_spawned";
    };
    const getActorStatusStackCount = (slot: PartySlot, statusId: string) => {
      if (statusId === "heat_infliction" || statusId === "cryo_infliction" || statusId === "electric_infliction" || statusId === "nature_infliction") {
        const element = statusId === "heat_infliction"
          ? "Heat"
          : statusId === "cryo_infliction"
            ? "Cryo"
            : statusId === "electric_infliction"
              ? "Electric"
              : "Nature";
        return Math.max(0, getActorInflictionStatus(slot, element)?.stacks ?? 0);
      }
      const actorStatusStacks = runtimeStatuses
        .filter((status) =>
          status.scope === "actor"
          && status.targetSlot === slot
          && status.kind !== ACTOR_BUFF_KIND
          && status.id === statusId,
        )
        .reduce((sum, status) => sum + Math.max(1, Math.floor(status.stacks ?? 1)), 0);
      if (actorStatusStacks > 0) {
        return actorStatusStacks;
      }
      return getActorBuffs()
        .filter((buff) => buff.slot === slot && (buff.id === statusId || buff.id.startsWith(`${statusId}:`)))
        .length;
    };
    const getEnemyStatusStackCount = (enemySlotId: EnemySlotId, statusId: string) => {
      if (statusId === "vulnerability") {
        return Math.max(0, getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0);
      }
      if (statusId === "heat_infliction" || statusId === "cryo_infliction" || statusId === "electric_infliction" || statusId === "nature_infliction") {
        const infliction = getEnemyArtsInfliction(enemySlotId);
        const expectedElement = statusId === "heat_infliction"
          ? "Heat"
          : statusId === "cryo_infliction"
            ? "Cryo"
            : statusId === "electric_infliction"
              ? "Electric"
              : "Nature";
        return infliction?.element === expectedElement ? Math.max(0, infliction.stacks) : 0;
      }
      return runtimeStatuses
        .filter((status) =>
          status.scope === "enemy"
          && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
          && status.id === statusId,
        )
        .reduce((sum, status) => sum + Math.max(1, Math.floor(status.stacks ?? 1)), 0);
    };
    const getTeamStatusStackCount = (statusId: string) => runtimeStatuses
      .filter((status) =>
        status.scope === "team"
        && status.id === statusId,
      )
      .reduce((sum, status) => sum + Math.max(1, Math.floor(status.stacks ?? 1)), 0);
    const getGlobalStatusStackCount = (statusId: string) => {
      const effectStatusCount = getEffectStatuses()
        .filter((status) => status.target === "global" && status.id === statusId)
        .length;
      const runtimeGlobalCount = runtimeStatuses
        .filter((status) => status.scope === "global" && status.id === statusId)
        .reduce((sum, status) => sum + Math.max(1, Math.floor(status.stacks ?? 1)), 0);
      return runtimeGlobalCount + effectStatusCount;
    };
    switch (expression.type) {
      case "string_literal":
        return expression.value;
      case "number_literal":
        return expression.value;
      case "boolean_literal":
        return expression.value;
      case "variable_ref": {
        const value = triggerVariableValuesById.get(expression.variableId);
        const fallbackVariable = customTriggerVariables.find((entry) => entry.id === expression.variableId) ?? null;
        const fallbackValue = fallbackVariable
          ? (
              fallbackVariable.initialValue.type === "string_literal"
                ? fallbackVariable.initialValue.value
                : fallbackVariable.initialValue.type === "boolean_literal"
                  ? fallbackVariable.initialValue.value
                  : fallbackVariable.initialValue.value
            )
          : null;
        const resolvedValue = value ?? fallbackValue;
        const resolvedVariableType = fallbackVariable?.type ?? expression.variableType;
        if (resolvedVariableType === "string") {
          return typeof resolvedValue === "string" ? resolvedValue : "";
        }
        if (resolvedVariableType === "boolean") {
          return typeof resolvedValue === "boolean" ? resolvedValue : false;
        }
        return typeof resolvedValue === "number" ? resolvedValue : 0;
      }
      case "status_id_literal":
        return expression.statusId;
      case "event_status_id":
        return event.statusId ?? event.buffId ?? null;
      case "event_status_duration":
        return event.statusDurationSeconds ?? event.durationSeconds ?? null;
      case "event_damage_type":
        return event.damageType ?? null;
      case "damage_type_literal":
        return expression.damageType;
      case "enemy_id_literal":
        return expression.enemyId;
      case "enemy_identity": {
        const enemySlotId = resolveTriggerEnemyRef(expression.enemy, event, currentTrigger);
        if (!enemySlotId) {
          return null;
        }
        return enemyRuntimeBySlot.get(enemySlotId)?.base.id ?? null;
      }
      case "enemy_rank": {
        const enemySlotId = resolveTriggerEnemyRef(expression.enemy, event, currentTrigger);
        if (!enemySlotId) {
          return null;
        }
        return getCurrentEnemyBase(enemySlotId).rank;
      }
      case "enemy_rank_literal":
        return expression.rank;
      case "operator_hp_ratio": {
        const slot = resolveTriggerOperatorRef(expression.target, event);
        return slot != null ? getActorHpRatio(slot) : null;
      }
      case "enemy_hp_ratio": {
        const enemySlotId = resolveTriggerEnemyRef(expression.target, event, currentTrigger);
        return enemySlotId ? getEnemyHpRatioAtTime(event.time, enemySlotId) : null;
      }
      case "status_stack_count": {
        const target = resolveTriggerStatusTarget(expression.target, event, currentTrigger);
        const statusId = evaluateTriggerValueExpression(expression.status, event, currentTrigger);
        if (!target || typeof statusId !== "string") {
          return null;
        }
        if (target.kind === "operator") {
          return getActorStatusStackCount(target.slot, statusId);
        }
        if (target.kind === "enemy") {
          return getEnemyStatusStackCount(target.enemySlotId, statusId);
        }
        if (target.kind === "team") {
          return getTeamStatusStackCount(statusId);
        }
        return getGlobalStatusStackCount(statusId);
      }
      case "contract_enabled":
        return activeContractVariantIds.has(expression.variantId);
      case "enemy_state_count":
        return normalizedEnemySlots.reduce((count, entry) => (
          getEnemyLifecycleState(entry.slotId) === expression.state ? count + 1 : count
        ), 0);
      case "enemy_state": {
        const enemySlotId = resolveTriggerEnemyRef(expression.enemy, event, currentTrigger);
        return enemySlotId ? getEnemyLifecycleState(enemySlotId) === expression.state : null;
      }
      case "trigger_enabled": {
        const triggerId = currentTrigger
          ? resolveTriggerControlRef(expression.trigger, currentTrigger, event)
          : expression.trigger.type === "trigger_in_slot"
            ? (() => {
                const slotNumber = evaluateTriggerNumericSource(expression.trigger.slotNumber, event, currentTrigger);
                return slotNumber != null ? customTriggers[slotNumber - 1]?.id ?? null : null;
              })()
            : null;
        return triggerId ? customTriggerRuntimeEnabledById.get(triggerId) !== false : null;
      }
      default:
        return null;
    }
  };

  const evaluateTriggerCondition = (
    condition: TriggerConditionNode,
    event: RotationCombatEvent,
    currentTrigger?: CustomCombatTrigger,
  ): boolean => {
    if (condition.kind === "logic") {
      const results = condition.conditions.map((entry) => evaluateTriggerCondition(entry, event, currentTrigger));
      switch (condition.operator) {
        case "AND":
          return results.every(Boolean);
        case "OR":
          return results.some(Boolean);
        case "XOR":
          return results.filter(Boolean).length === 1;
        default:
          return false;
      }
    }

    const left = evaluateTriggerValueExpression(condition.left, event, currentTrigger);
    const right = evaluateTriggerValueExpression(condition.right, event, currentTrigger);
    switch (condition.comparator) {
      case "equals":
        return left === right;
      case "not_equals":
        return left !== right;
      case "gt":
        return typeof left === "number" && typeof right === "number" && left > right;
      case "gte":
        return typeof left === "number" && typeof right === "number" && left >= right;
      case "lt":
        return typeof left === "number" && typeof right === "number" && left < right;
      case "lte":
        return typeof left === "number" && typeof right === "number" && left <= right;
      default:
        return false;
    }
  };

  const resolveTriggerControlRef = (
    ref: TriggerControlReference,
    trigger: CustomCombatTrigger,
    event?: RotationCombatEvent,
  ): string | null => {
    if (ref.type === "self") {
      return trigger.id;
    }
    const slotNumber = evaluateTriggerNumericSource(ref.slotNumber, (event ?? ({
      type: "NO_EVENT",
      time: 0,
      gameTime: 0,
      label: "Trigger Control",
    } as unknown as RotationCombatEvent)), trigger);
    return slotNumber != null ? customTriggers[slotNumber - 1]?.id ?? null : null;
  };

  const setTriggerRuntimeEnabled = (
    triggerId: string | null,
    enabled: boolean,
  ) => {
    if (!triggerId) {
      return;
    }
    customTriggerRuntimeEnabledById.set(triggerId, enabled);
  };

  const executeTriggerAction = (
    trigger: CustomCombatTrigger,
    instanceId: string,
    action: TriggerAction,
    event: RotationCombatEvent,
    executionTime: number,
    executionGameTime: number,
  ): { shouldPause: boolean; shouldBreak?: boolean } => {
    const stepId = event.stepId ?? `__trigger:${trigger.id}`;
    if (action.type === "SET_TARGET_ENEMY") {
      const enemySlotId = resolveTriggerEnemyRef(action.target, event, trigger);
      if (!enemySlotId || !isEnemyPresent(enemySlotId)) {
        return { shouldPause: false };
      }
      currentTargetedEnemySlotId = enemySlotId;
      return { shouldPause: false };
    }
    if (action.type === "EXECUTE_HIT") {
      const sourceSlot = resolveTriggerOperatorRef(action.source, event);
      const targetEnemySlotId = resolveTriggerEnemyRef(action.target, event, trigger);
      const multiplier = evaluateTriggerValueExpression(action.multiplier, event, trigger);
      const flatAmount = evaluateTriggerValueExpression(action.flatAmount, event, trigger);
      const stagger = evaluateTriggerValueExpression(action.stagger, event, trigger);
      if (sourceSlot == null || typeof multiplier !== "number" || typeof flatAmount !== "number" || typeof stagger !== "number") {
        return { shouldPause: false };
      }
      const hit: ResolvedCommandHitAtLevel = {
        name: action.hitName,
        multiplier,
        flatAmount,
        scalingStat: "ATK",
        stagger,
        spGenerated: 0,
        spReturned: 0,
        requiresControlledOperator: false,
        offsetFrames: 0,
        registerOffsetFrames: 0,
        times: 1,
        repeatIntervalFrames: 0,
        repeatRegisterOffsetWithInterval: false,
        energyReturn: 0,
        ignoreUltimateGainEfficiency: false,
        attackType: action.attackType,
        damageType: action.damageType,
        targets: action.targets,
        ignoreEnemyInvulnerability: action.ignoreEnemyInvulnerability === true,
        noCrit: action.noCrit === true,
        effects: [],
        postEffects: [],
      };
      const targetEnemySlotIdsOverride =
        action.targets === "targeted_enemy"
          ? (targetEnemySlotId && isEnemyPresent(targetEnemySlotId) ? [targetEnemySlotId] : [])
          : undefined;
      pushResolvedTimelineHit({
        sourceSlot,
        stepId,
        commandId: `__trigger_execute_hit:${trigger.id}`,
        commandName: trigger.name,
        hitIndex: 0,
        hit,
        hitName: action.hitName,
        time: executionTime,
        gameTime: executionGameTime,
        applySourceCommandModifiers: false,
        targetEnemySlotIdsOverride,
      });
      const affectedEnemySlotIds = (targetEnemySlotIdsOverride ?? resolveAffectedEnemySlotIds(hit.targets)).filter((enemySlotId) =>
        isEnemyPresent(enemySlotId) && withEnemyResolutionSlot(enemySlotId, () =>
          !isEnemyHitBlocked({
            sourceSlot,
            stepId,
            commandId: `__trigger_execute_hit:${trigger.id}`,
            time: executionTime,
            gameTime: executionGameTime,
          })),
      );
      if (affectedEnemySlotIds.length <= 0) {
        return { shouldPause: false };
      }
      const hitEventType = action.attackType === "BATTLE_SKILL"
        ? "BATTLE_SKILL_HIT"
        : action.attackType === "COMBO_SKILL"
          ? "COMBO_SKILL_HIT"
          : action.attackType === "ULTIMATE"
            ? "ULTIMATE_HIT"
            : null;
      if (!hitEventType) {
        return { shouldPause: false };
      }
      const triggerHitEvent: RotationCombatEvent = {
        type: hitEventType,
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        slot: sourceSlot,
        sourceSlot,
        enemySlotId: affectedEnemySlotIds[0],
        affectedEnemySlotIds,
        target: "enemy",
        label: action.hitName,
        commandAttackType: action.attackType,
        damageType: action.damageType,
        expectedCritCount: Math.max(0, getEffectiveActorMods(partyBySlot.get(sourceSlot)!, executionTime, executionGameTime).CRIT_RATE_PCT),
      };
      emitEvent(triggerHitEvent);
      dispatchPassiveListeners(triggerHitEvent);
      return { shouldPause: false };
    }
    if (action.type === "WAIT" || action.type === "COUNTDOWN") {
      return { shouldPause: true };
    }
    if (action.type === "RELAY_ROTATION") {
      pushRelayEntry({
        time: executionTime,
        gameTime: executionGameTime,
        triggerId: trigger.id,
        triggerName: trigger.name,
        instanceId,
      });
      captureSimulationCheckpoint(executionTime, executionGameTime);
      return { shouldPause: false };
    }
    if (action.type === "BREAK") {
      stopTriggerInstance(trigger.id, instanceId);
      return { shouldPause: false, shouldBreak: true };
    }
    if (action.type === "FIRE_TRIGGER") {
      const targetTriggerId = resolveTriggerControlRef(action.target, trigger, event);
      const targetTrigger = targetTriggerId ? allRuntimeTriggers.find((entry) => entry.id === targetTriggerId) : null;
      const checkEnabled = evaluateTriggerValueExpression(action.checkEnabled, event, trigger);
      const checkCondition = evaluateTriggerValueExpression(action.checkCondition, event, trigger);
      if (!targetTrigger) {
        return { shouldPause: false };
      }
      runCustomTrigger(targetTrigger, event, {
        executionTime,
        executionGameTime,
        checkEventType: false,
        checkEnabled: typeof checkEnabled === "boolean" ? checkEnabled : true,
        checkConditions: typeof checkCondition === "boolean" ? checkCondition : true,
      });
      return { shouldPause: false };
    }
    if (action.type === "SET_TRIGGER_ENABLED") {
      const targetTriggerId = resolveTriggerControlRef(action.target, trigger, event);
      setTriggerRuntimeEnabled(targetTriggerId, action.operation === "enable");
      return { shouldPause: false };
    }
    if (action.type === "STOP_TRIGGER") {
      const targetTriggerId = resolveTriggerControlRef(action.target, trigger, event);
      stopAllTriggerInstances(targetTriggerId);
      return { shouldPause: false, shouldBreak: stoppedTriggerInstanceIds.has(instanceId) };
    }
    if (action.type === "REPLACE_ENEMY") {
      const enemySlotId = resolveTriggerEnemyRef(action.target, event, trigger);
      const enemyId = evaluateTriggerValueExpression(action.enemyId, event, trigger);
      const resetHp = evaluateTriggerValueExpression(action.resetHp, event, trigger);
      const level = evaluateTriggerValueExpression(action.level, event, trigger);
      const noDeath = evaluateTriggerValueExpression(action.noDeath, event, trigger);
      if (!enemySlotId || typeof enemyId !== "string") {
        return { shouldPause: false };
      }
      transformEnemy({
        enemyId,
        resetHp: typeof resetHp === "boolean" ? resetHp : true,
        level: typeof level === "number" && Number.isFinite(level) && level > 0 ? level : undefined,
        noDeath: typeof noDeath === "boolean" ? noDeath : undefined,
        time: executionTime,
        gameTime: executionGameTime,
        enemySlotId,
        lifecycleType: "replace",
      });
      return { shouldPause: false };
    }
    if (action.type === "MODIFY_HP") {
      const target = resolveTriggerReference(action.target, event, trigger);
      const amount = evaluateTriggerValueExpression(action.amount, event, trigger);
      if (!target || typeof amount !== "number" || !(amount > 0)) {
        return { shouldPause: false };
      }
      if (target.kind === "operator") {
        applyActorFlatHpChange({
          slot: target.slot,
          amount,
          operation: action.operation,
        });
        return { shouldPause: false };
      }
      if (!isEnemyPresent(target.enemySlotId)) {
        return { shouldPause: false };
      }
      if (action.operation === "heal") {
        applyEnemyHealing(amount, target.enemySlotId, {
          time: executionTime,
        });
        return { shouldPause: false };
      }
      applyEnemyDamage(amount, target.enemySlotId, {
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
        commandId: event.commandId,
        commandName: event.commandName,
        hitName: trigger.name,
      });
      return { shouldPause: false };
    }
    if (action.type === "MODIFY_VARIABLE") {
      const nextValue = evaluateTriggerValueExpression(action.value, event, trigger);
      if (action.variableType === "number") {
        const current = triggerVariableValuesById.get(action.variableId);
        const currentNumber = typeof current === "number" ? current : 0;
        const resolvedNumber = typeof nextValue === "number" ? nextValue : 0;
        triggerVariableValuesById.set(
          action.variableId,
          action.operation === "add"
            ? currentNumber + resolvedNumber
            : action.operation === "subtract"
              ? currentNumber - resolvedNumber
              : resolvedNumber,
        );
        return { shouldPause: false };
      }
      if (action.variableType === "boolean") {
        if (action.operation === "set" && typeof nextValue === "boolean") {
          triggerVariableValuesById.set(action.variableId, nextValue);
        }
        return { shouldPause: false };
      }
      if (action.operation === "set" && typeof nextValue === "string") {
        triggerVariableValuesById.set(action.variableId, nextValue);
      }
      return { shouldPause: false };
    }
    if (action.type !== "APPLY_STATUS" && action.type !== "REMOVE_STATUS") {
      return { shouldPause: false };
    }

    const target = resolveTriggerStatusTarget(action.target, event, trigger);
    if (!target) {
      return { shouldPause: false };
    }
    const statusId = evaluateTriggerValueExpression(action.status, event, trigger);
    if (typeof statusId !== "string") {
      return { shouldPause: false };
    }
    const statusDefinition = getCombatStatusDefinition(statusId);
    if (action.type === "REMOVE_STATUS") {
      if (target.kind === "operator") {
        if (statusDefinition?.operatorApplicationModel === "actor_arts_infliction") {
          removeActorStatusById({
            slot: target.slot,
            statusId,
            kind: "infliction",
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
            reason: "trigger_remove_status",
          });
        } else if (statusDefinition?.operatorApplicationModel === "actor_status") {
          removeActorStatusById({
            slot: target.slot,
            statusId,
            kind: statusDefinition.defaultKind,
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
            reason: "trigger_remove_status",
          });
        } else {
          removeActorBuff({
            slot: target.slot,
            buffId: statusId,
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
          });
        }
        return { shouldPause: false };
      }
      if (target.kind === "team") {
        const teamKind = statusDefinition?.operatorApplicationModel === "team_link_status"
          ? "link_status"
          : "team_status";
        removeTeamRuntimeStatus({
          statusId,
          kind: teamKind,
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
        });
        return { shouldPause: false };
      }
      if (target.kind === "global") {
        removeTimedStatus({
          statusId,
          sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
          target: "global",
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
        });
        return { shouldPause: false };
      }
      const enemySlotId = target.enemySlotId;
      if (!isEnemyPresent(enemySlotId)) {
        return { shouldPause: false };
      }
      if (statusDefinition?.enemyApplicationModel === "enemy_vulnerability" || statusId === "vulnerability") {
        setEnemyPhysicalInfliction(null, enemySlotId, {
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
          reason: "trigger_remove_status",
        });
        return { shouldPause: false };
      }
      if (statusDefinition?.enemyApplicationModel === "enemy_arts_infliction") {
        setEnemyArtsInfliction(null, enemySlotId, {
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
          reason: "trigger_remove_status",
        });
        return { shouldPause: false };
      }
      removeEnemyStatusById(statusId, {
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        reason: "trigger_remove_status",
      }, enemySlotId);
      return { shouldPause: false };
    }

    const durationSeconds = evaluateTriggerValueExpression(action.durationSeconds, event, trigger);
    const stacks = evaluateTriggerValueExpression(action.stacks, event, trigger);
    const maxStacksValue = action.maxStacks ? evaluateTriggerValueExpression(action.maxStacks, event, trigger) : null;
    if (
      typeof durationSeconds !== "number"
      || typeof stacks !== "number"
      || (action.maxStacks != null && typeof maxStacksValue !== "number")
    ) {
      return { shouldPause: false };
    }
    const useDefault = action.useDefault === true;
    const allowPermanent = statusDefinition?.allowPermanent !== false;
    const permanent = !useDefault && allowPermanent && action.permanent === true;
    const resolvedDurationSeconds = permanent
      ? Number.POSITIVE_INFINITY
      : (
          useDefault
            ? (statusDefinition?.defaultDurationSeconds ?? durationSeconds)
            : (durationSeconds > 0 ? durationSeconds : (statusDefinition?.defaultDurationSeconds ?? 0))
        );
    if (!(resolvedDurationSeconds > 0)) {
      return { shouldPause: false };
    }
    const resolvedStacks = Math.max(1, Math.round(useDefault ? 1 : stacks));
    const resolvedMaxStacks = Math.max(
      1,
      Math.round(useDefault
        ? (statusDefinition?.maxStacks ?? Number.POSITIVE_INFINITY)
        : (typeof maxStacksValue === "number" ? maxStacksValue : (statusDefinition?.maxStacks ?? Number.POSITIVE_INFINITY))),
    );
    const cappedStacks = Math.max(
      1,
      Math.min(resolvedMaxStacks, resolvedStacks),
    );
    const hidden = useDefault ? (statusDefinition?.defaultHidden === true) : (action.hidden === true || statusDefinition?.defaultHidden === true);
    const label = resolveTriggerStatusLabel(statusId);
    const stackingRule = useDefault ? "default" : (action.stackingRule ?? "default");
    const refreshExistingStacks = useDefault ? true : action.refreshExistingStacks !== false;
    const independentStacks = useDefault ? false : action.independentStacks === true;
    const customEffects = useDefault ? {} : resolveTriggerStatusEffects(action, event, trigger);
    const hasCustomEffects = Object.values(customEffects).some((value) => typeof value === "number" && value !== 0);
    if (target.kind === "operator") {
      if (statusDefinition?.operatorApplicationModel === "actor_arts_infliction" && statusDefinition.element) {
        if (stackingRule === "replace") {
          removeActorStatusById({
            slot: target.slot,
            statusId,
            kind: "infliction",
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
            reason: "trigger_apply_status_replace",
          });
        }
        applyActorArtsInfliction({
          slot: target.slot,
          element: statusDefinition.element,
          durationSeconds: resolvedDurationSeconds,
          stacks: cappedStacks,
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
        });
      } else if (statusDefinition?.operatorApplicationModel === "actor_status") {
        if (stackingRule === "replace") {
          setActorStatusById({
            slot: target.slot,
            statusId,
            label,
            expiresAt: permanent ? Number.POSITIVE_INFINITY : executionGameTime + resolvedDurationSeconds,
            timeScale: statusDefinition.defaultTimeScale ?? "game",
            kind: statusDefinition.defaultKind,
            hidden,
            stacks: cappedStacks,
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
            reason: "trigger_apply_status",
          });
        } else {
          setActorStatusById({
            slot: target.slot,
            statusId,
            label,
            expiresAt: permanent ? Number.POSITIVE_INFINITY : executionGameTime + resolvedDurationSeconds,
            timeScale: statusDefinition.defaultTimeScale ?? "game",
            kind: statusDefinition.defaultKind,
            hidden,
            stacks: stackingRule === "additive"
              ? Math.min(
                resolvedMaxStacks,
                (runtimeStatuses.find((status) =>
                  status.scope === "actor"
                  && status.targetSlot === target.slot
                  && status.id === statusId
                  && status.kind === (statusDefinition.defaultKind ?? ACTOR_STATUS_KIND),
                )?.stacks ?? 0) + cappedStacks,
              )
              : cappedStacks,
            time: executionTime,
            gameTime: executionGameTime,
            stepId,
            reason: "trigger_apply_status",
          });
        }
      } else {
        const stackApplications = stackingRule === "additive" || independentStacks ? cappedStacks : 1;
        for (let index = 0; index < stackApplications; index += 1) {
          applyActorBuff({
            slot: target.slot,
            sourceSlot: target.slot,
            stepId,
            time: executionTime,
            gameTime: executionGameTime,
            buffId: statusId,
            label,
            hidden,
            durationSeconds: resolvedDurationSeconds,
            infiniteDuration: permanent,
            timeScale: statusDefinition?.defaultTimeScale ?? "game",
            effects: hasCustomEffects ? customEffects : {},
            stackGroup: stackingRule === "additive" || independentStacks ? statusId : undefined,
            maxStacks: resolvedMaxStacks,
            refreshExistingStacks,
          });
        }
      }
      return { shouldPause: false };
    }
    if (target.kind === "team") {
      const teamKind = statusDefinition?.operatorApplicationModel === "team_link_status"
        ? "link_status"
        : "team_status";
      applyTeamRuntimeStatus({
        statusId,
        label,
        kind: teamKind,
        durationSeconds: resolvedDurationSeconds,
        infiniteDuration: permanent,
        timeScale: statusDefinition?.defaultTimeScale ?? "game",
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        hidden,
        stacks: cappedStacks,
        maxStacks: resolvedMaxStacks,
        refreshExistingStacks,
        stackingRule,
      });
      return { shouldPause: false };
    }
    if (target.kind === "global") {
      applyTimedStatus({
        effect: {
          type: "APPLY_STATUS",
          target: "global",
          statusId,
          label,
          durationSeconds: resolvedDurationSeconds,
          timeScale: statusDefinition?.defaultTimeScale ?? "game",
          hidden,
          fieldStatus: true,
          stacks: cappedStacks,
          maxStacks: resolvedMaxStacks,
          refreshExistingStacks,
          independentStacks,
          effects: hasCustomEffects ? customEffects : {},
        },
        sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
        stepId,
        time: executionTime,
        gameTime: executionGameTime,
        triggerSlots: [],
      });
      return { shouldPause: false };
    }
    const enemySlotId = target.enemySlotId;
    if (!isEnemyPresent(enemySlotId)) {
      return { shouldPause: false };
    }
    if (statusId === "contract_regeneration") {
      applyEnemyRegenerationStatus({
        enemySlotId,
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        durationSeconds: resolvedDurationSeconds,
      });
      return { shouldPause: false };
    }
    if (statusDefinition?.enemyApplicationModel === "enemy_vulnerability" || statusId === "vulnerability") {
      withEnemyResolutionSlot(enemySlotId, () => {
        applyEnemyPhysicalInflictionEffect({
          stacks: cappedStacks,
          durationSeconds: resolvedDurationSeconds,
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
          sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
          triggerSlots: [],
        });
      });
      return { shouldPause: false };
    }
    if (statusDefinition?.enemyApplicationModel === "enemy_arts_infliction" && statusDefinition.element) {
      const inflictionElement = statusDefinition.element;
      withEnemyResolutionSlot(enemySlotId, () => {
        applyEnemyArtsInflictionEffect({
          element: inflictionElement,
          stacks: cappedStacks,
          durationSeconds: resolvedDurationSeconds,
          time: executionTime,
          gameTime: executionGameTime,
          stepId,
          sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
          triggerSlots: [],
        });
      });
      return { shouldPause: false };
    }
    if (hasCustomEffects) {
      applyEnemyBuff({
        buffId: statusId,
        label,
        effects: customEffects,
        durationSeconds: resolvedDurationSeconds,
        timeScale: statusDefinition?.defaultTimeScale ?? "game",
        time: executionTime,
        gameTime: executionGameTime,
        stepId,
        sourceSlot: event.slot ?? event.sourceSlot ?? controlledOperatorSlot,
        enemySlotId,
      });
      return { shouldPause: false };
    }
    addEnemyStatusById({
      statusId,
      label,
      expiresAt: permanent ? Number.POSITIVE_INFINITY : executionGameTime + resolvedDurationSeconds,
      timeScale: statusDefinition?.defaultTimeScale ?? "game",
      kind: statusDefinition?.defaultKind,
      hidden,
      stacks: stackingRule === "additive"
        ? Math.min(
          resolvedMaxStacks,
          (runtimeStatuses.find((status) =>
            status.scope === "enemy"
            && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
            && status.id === statusId
            && status.kind === (statusDefinition?.defaultKind ?? ENEMY_STATUS_KIND),
          )?.stacks ?? 0) + cappedStacks,
        )
        : cappedStacks,
      enemySlotId,
      time: executionTime,
      gameTime: executionGameTime,
      stepId,
    });
    return { shouldPause: false };
  };

  const runTriggerActionsFromIndex = (
    trigger: CustomCombatTrigger,
    instanceId: string,
    event: RotationCombatEvent,
    actions: TriggerAction[],
    startActionIndex: number,
    executionTime: number,
    executionGameTime: number,
  ): { paused: boolean; completed: boolean } => {
    for (let actionIndex = startActionIndex; actionIndex < actions.length; actionIndex += 1) {
      if (stoppedTriggerInstanceIds.has(instanceId)) {
        return { paused: false, completed: false };
      }
      const action = actions[actionIndex];
      if (!action) {
        continue;
      }
      if (action.type === "IF_THEN_ELSE") {
        const branchActions = evaluateTriggerCondition(action.ifCondition, event, trigger)
          ? action.thenActions
          : action.elseActions;
        const combinedActions = [...branchActions, ...actions.slice(actionIndex + 1)];
        return runTriggerActionsFromIndex(
          trigger,
          instanceId,
          event,
          combinedActions,
          0,
          executionTime,
          executionGameTime,
        );
      }
      const result = executeTriggerAction(trigger, instanceId, action, event, executionTime, executionGameTime);
      if (action.type === "WAIT" || action.type === "COUNTDOWN") {
        const waitSeconds = evaluateTriggerValueExpression(action.durationSeconds, event, trigger);
        const hasRemainingActions = actionIndex + 1 < actions.length;
        if (typeof waitSeconds === "number" && waitSeconds > 0) {
          if (action.type === "COUNTDOWN") {
            pushCountdownEntries({
              triggerId: trigger.id,
              triggerName: trigger.name,
              instanceId,
              executionTime,
              executionGameTime,
              durationSeconds: waitSeconds,
            });
          }
          if (hasRemainingActions) {
            pendingTriggerResumes.push({
              instanceId,
              triggerId: trigger.id,
              event,
              actions,
              nextActionIndex: actionIndex + 1,
              executionTime: executionTime + waitSeconds,
              executionGameTime: executionGameTime + waitSeconds,
            });
          }
        }
        if (hasRemainingActions && typeof waitSeconds === "number" && waitSeconds > 0) {
          return { paused: true, completed: false };
        }
        return { paused: false, completed: true };
      }
      if (result.shouldPause) {
        return { paused: true, completed: false };
      }
      if (result.shouldBreak) {
        return { paused: false, completed: false };
      }
    }
    return { paused: false, completed: !stoppedTriggerInstanceIds.has(instanceId) };
  };

  const runCustomTrigger = (
    trigger: CustomCombatTrigger,
    event: RotationCombatEvent,
    options?: {
      executionTime?: number;
      executionGameTime?: number;
      checkEventType?: boolean;
      checkEnabled?: boolean;
      checkConditions?: boolean;
    },
  ) => {
    const executionTime = options?.executionTime ?? event.time;
    const executionGameTime = options?.executionGameTime ?? event.gameTime;
    const shouldCheckEnabled = options?.checkEnabled !== false;
    const shouldCheckEventType = options?.checkEventType !== false;
    const shouldCheckConditions = options?.checkConditions !== false;

    if (shouldCheckEnabled && customTriggerRuntimeEnabledById.get(trigger.id) === false) {
      return;
    }
    if (shouldCheckEventType && !matchesCustomTriggerEventType(trigger.event.type, event)) {
      return;
    }
    if (shouldCheckConditions && !trigger.conditions.every((condition) => evaluateTriggerCondition(condition, event, trigger))) {
      return;
    }
    if (activeTriggerRunIds.has(trigger.id)) {
      return;
    }
    registerTriggerExecution(executionTime);
    if (!canExecuteTriggerAt(executionTime)) {
      return;
    }
    const instanceId = makeTriggerInstanceId(trigger.id);
    registerTriggerInstance(trigger.id, instanceId);
    activeTriggerRunIds.add(trigger.id);
    try {
      const result = runTriggerActionsFromIndex(
        trigger,
        instanceId,
        event,
        trigger.actions,
        0,
        executionTime,
        executionGameTime,
      );
      if (!result.paused) {
        unregisterTriggerInstance(trigger.id, instanceId);
      }
      for (const member of party) {
        recordActorState(member.slot, executionTime, executionGameTime);
      }
      recordEnemyState(executionTime, executionGameTime);
    } finally {
      activeTriggerRunIds.delete(trigger.id);
    }
  };

  const dispatchCustomTriggers = (event: RotationCombatEvent) => {
    if (allRuntimeTriggers.length <= 0) {
      return;
    }
    if (!canExecuteTriggerAt(event.time)) {
      return;
    }
    for (const trigger of allRuntimeTriggers) {
      if (!matchesCustomTriggerEventType(trigger.event.type, event)) {
        continue;
      }
      const executionKey = [
        trigger.id,
        event.type,
        event.time,
        event.stepId ?? "",
        event.enemySlotId ?? "",
        event.affectedEnemySlotIds?.join(",") ?? "",
        event.slot ?? "",
        event.sourceSlot ?? "",
        event.commandId ?? "",
        event.hitName ?? "",
      ].join(":");
      if (triggerExecutionKeys.has(executionKey)) {
        continue;
      }
      triggerExecutionKeys.add(executionKey);
      try {
        runCustomTrigger(trigger, event);
      } finally {
        triggerExecutionKeys.delete(executionKey);
      }
    }
  };

  const getEnemyHpRatioAtTime = (time: number, enemySlotId?: EnemySlotId) => {
    return withEnemyResolutionSlot(getResolvedEnemySlotId(enemySlotId), () => {
      if (cleanupStateDepth <= 0) {
        cleanupStateAt(time, timeContext.toGameTime(time));
      }
      if (!isEnemyPresent()) {
        return 0;
      }
      const maxHp = getCurrentEnemyMaxHp();
      return Math.max(0, Math.min(1, getCurrentEnemyHp() / Math.max(1, maxHp)));
    });
  };

  const applyTeamRuntimeStatus = (args: {
    statusId: string;
    label: string;
    kind: UnifiedStatusKind;
    durationSeconds: number;
    infiniteDuration?: boolean;
    timeScale: TimeScale;
    time: number;
    gameTime: number;
    stepId?: string;
    hidden?: boolean;
    stacks: number;
    maxStacks: number;
    refreshExistingStacks: boolean;
    stackingRule: "default" | "additive" | "replace";
  }) => {
    cleanupStateAt(args.time, args.gameTime);
    const now = args.timeScale === "real" ? args.time : args.gameTime;
    const existingStatuses = runtimeStatuses
      .filter((status) => status.scope === "team" && status.kind === args.kind && status.id === args.statusId)
      .sort((left, right) => left.expiresAt - right.expiresAt);
    const existingCount = existingStatuses.length;
    const resolvedExpiresAt = args.infiniteDuration ? Number.POSITIVE_INFINITY : now + args.durationSeconds;
    if (args.refreshExistingStacks) {
      for (const status of existingStatuses) {
        status.label = args.label;
        status.expiresAt = resolvedExpiresAt;
        status.timeScale = args.timeScale;
        status.hidden = args.hidden;
      }
    }
    const nextStatuses = [...runtimeStatuses];
    if (args.stackingRule === "replace") {
      const filtered = runtimeStatuses.filter((status) =>
        !(status.scope === "team" && status.kind === args.kind && status.id === args.statusId),
      );
      for (let index = 0; index < Math.min(args.maxStacks, args.stacks); index += 1) {
        filtered.push(normalizeStatus({
          id: args.statusId,
          label: args.label,
          scope: "team",
          kind: args.kind,
          expiresAt: resolvedExpiresAt,
          timeScale: args.timeScale,
          hidden: args.hidden,
          stacks: 1,
        }));
      }
      replaceRuntimeStatuses(filtered, {
        reason: "trigger_apply_team_status",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "replaced",
      });
      return;
    }
    const available = Math.max(0, args.maxStacks - existingCount);
    const toApply = Math.min(available, args.stacks);
    if (toApply <= 0 && !args.refreshExistingStacks) {
      return;
    }
    for (let index = 0; index < toApply; index += 1) {
      nextStatuses.push(normalizeStatus({
        id: args.statusId,
        label: args.label,
        scope: "team",
        kind: args.kind,
        expiresAt: resolvedExpiresAt,
        timeScale: args.timeScale,
        hidden: args.hidden,
        stacks: 1,
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: "trigger_apply_team_status",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: args.refreshExistingStacks ? "updated" : "added",
    });
  };

  const removeTeamRuntimeStatus = (args: {
    statusId: string;
    kind: UnifiedStatusKind;
    time: number;
    gameTime: number;
    stepId?: string;
  }) => {
    replaceRuntimeStatuses(runtimeStatuses.filter((status) =>
      !(status.scope === "team" && status.kind === args.kind && status.id === args.statusId),
    ), {
      reason: "trigger_remove_team_status",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: "removed",
    });
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
    const nextStatuses = [...runtimeStatuses];
    for (let i = 0; i < toApply; i += 1) {
      nextStatuses.push(normalizeStatus({
        id: "team_link",
        label: "Link",
        scope: "team",
        kind: "link_status",
        expiresAt: now + args.durationSeconds,
        timeScale,
        stacks: 1,
      }));
    }
    if (toApply > 0) {
      replaceRuntimeStatuses(nextStatuses, {
        reason: "gain_team_link_stacks",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "added",
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
    replaceRuntimeStatuses(runtimeStatuses.filter((status) =>
      !(status.scope === "team" && status.kind === "link_status" && status.id === "team_link"),
    ), {
      reason: "consume_team_link_stacks",
      time: args.time,
      gameTime: args.gameTime,
      changeType: "removed",
    });
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

    const nextStatuses = [...runtimeStatuses];
    for (let i = 0; i < toApply; i += 1) {
      nextStatuses.push(normalizeStatus({
        id: args.statusId,
        label: args.label,
        scope: "team",
        kind: "team_status",
        expiresAt: now + args.durationSeconds,
        timeScale,
        stacks: 1,
      }));
    }
    replaceRuntimeStatuses(nextStatuses, {
      reason: "gain_team_status_stacks",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: shouldRefreshExisting ? "updated" : "added",
    });

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
    replaceRuntimeStatuses(runtimeStatuses.filter((_, index) => !removeIndices.has(index)), {
      reason: "consume_team_status_stacks",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: "removed",
    });
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
      sequence: stateSnapshotSequence++,
      slot,
      time,
      gameTime,
      activeBuildVariant: activeBuildVariantBySlot.get(slot) ?? 0,
      currentHp: actorCurrentHpBySlot.get(slot) ?? 0,
      maxHp: actorMaxHpBySlot.get(slot) ?? 0,
      meltingFlameStacks: getMeltingFlameStacks(slot),
      activeBuffs: getActorBuffs()
        .filter((buff) => buff.slot === slot)
        .map((buff) => ({
          instanceId: buff.instanceId,
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
      activeStatuses: [
        ...runtimeStatuses
          .filter((status) =>
            status.scope === "actor"
            && status.targetSlot === slot
            && status.kind !== ACTOR_BUFF_KIND,
          )
          .map((status) => ({
            instanceId: status.instanceId,
            id: status.id,
            label: status.label,
            hidden: status.hidden,
            expiresAt: status.expiresAt,
            timeScale: status.timeScale,
            fieldStatus: status.fieldStatus,
            stacks: typeof status.stacks === "number" ? status.stacks : undefined,
          })),
        ...getEffectStatuses()
          .filter((status) => status.target === "self" && status.sourceSlot === slot)
          .map((status) => ({
            instanceId: status.instanceId,
            id: status.id,
            label: status.label,
            hidden: status.hidden,
            expiresAt: status.expiresAt,
            timeScale: status.timeScale,
            fieldStatus: status.fieldStatus,
          })),
      ].map((status) => ({
          instanceId: status.instanceId,
          id: status.id,
          label: status.label,
          hidden: status.hidden,
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
          fieldStatus: status.fieldStatus,
          stacks: "stacks" in status && typeof status.stacks === "number" ? status.stacks : undefined,
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
    const healerAttrs = getEffectiveActorAttrs(args.sourceActor, healerMods);
    const scalingBase = args.hit.scalingStat === "WIL"
      ? healerAttrs.WIL
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

  const restoreHpToSlot = (args: {
    sourceActor: CharacterCombatSnapshot;
    targetSlot: PartySlot;
    baseAmount: number;
    label?: string;
    time: number;
    gameTime: number;
    stepId: string;
  }): number => {
    if (args.baseAmount <= 0) {
      return 0;
    }
    const targetActor = partyBySlot.get(args.targetSlot);
    if (!targetActor) {
      return 0;
    }
    const healerMods = getEffectiveActorMods(args.sourceActor, args.time, args.gameTime);
    const targetMods = getEffectiveActorMods(targetActor, args.time, args.gameTime);
    const healing = calculateHealingAmount({
      baseAmount: args.baseAmount,
      healerMods,
      targetHealingReceivedBonus: targetMods.HEALING_RECEIVED_PCT,
    });
    const currentHp = actorCurrentHpBySlot.get(args.targetSlot) ?? targetActor.maxHp;
    const maxHp = actorMaxHpBySlot.get(args.targetSlot) ?? targetActor.maxHp;
    const applied = Math.max(0, Math.min(healing, maxHp - currentHp));
    if (applied > 0) {
      actorCurrentHpBySlot.set(args.targetSlot, currentHp + applied);
    }
    const healingEvent: RotationCombatEvent = {
      type: "HEALING_HIT_EXECUTED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      slot: args.targetSlot,
      sourceSlot: args.sourceActor.slot,
      label: args.label ?? "Healing",
      healedAmount: applied,
    };
    emitEvent(healingEvent);
    dispatchPassiveListeners(healingEvent);
    return applied;
  };

  const applyStatusToSlot = (args: {
    sourceActor: CharacterCombatSnapshot;
    targetSlot: PartySlot;
    statusId: string;
    label?: string;
    effects?: Partial<ModifierStats>;
    blocksOperatorArtsInflictionElements?: Array<"Heat" | "Cryo" | "Electric" | "Nature">;
    durationSeconds: number;
    timeScale?: TimeScale;
    hidden?: boolean;
    stacks?: number;
    maxStacks?: number;
    refreshExistingStacks?: boolean;
    independentStacks?: boolean;
    pauseStatusIds?: string[];
    periods?: number;
    maxPeriods?: number;
    initialEffects?: CommandHitEffectDefinition[];
    periodicEffects?: CommandHitEffectDefinition[];
    expireEffects?: CommandHitEffectDefinition[];
    removeEffects?: CommandHitEffectDefinition[];
    time: number;
    gameTime: number;
    stepId: string;
    sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
  }) => {
    const targetActor = partyBySlot.get(args.targetSlot);
    if (!targetActor) {
      return;
    }
    applyTimedStatus({
      effect: {
        type: "APPLY_STATUS",
        target: "self",
        statusId: args.statusId,
        label: args.label,
        effects: args.effects,
        blocksOperatorArtsInflictionElements: args.blocksOperatorArtsInflictionElements,
        durationSeconds: args.durationSeconds,
        timeScale: args.timeScale,
        hidden: args.hidden,
        stacks: args.stacks,
        maxStacks: args.maxStacks,
        refreshExistingStacks: args.refreshExistingStacks,
        independentStacks: args.independentStacks,
        pauseStatusIds: args.pauseStatusIds,
        periods: args.periods,
        maxPeriods: args.maxPeriods,
        initialEffects: args.initialEffects,
        periodicEffects: args.periodicEffects,
        expireEffects: args.expireEffects,
        removeEffects: args.removeEffects,
      },
      sourceSlot: args.targetSlot,
      stepId: args.stepId,
      time: args.time,
      gameTime: args.gameTime,
      triggerSlots: [],
      sourceCommandAttackType: args.sourceCommandAttackType,
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
    for (const slot of normalizedEnemySlots) {
      const runtime = enemyRuntimeBySlot.get(slot.slotId);
      if (!runtime) {
        continue;
      }
      if (!runtime.isPresent) {
        enemyStateTimeline.push({
          sequence: stateSnapshotSequence++,
          time,
          gameTime,
          enemySlotId: slot.slotId,
          isPresent: false,
          isDead: runtime.isDead,
          deadAt: runtime.deadAt,
          enemyId: runtime.base.id,
          enemyName: runtime.base.name,
          baseMaxHp: runtime.stats.hp,
          currentHp: 0,
          maxHp: runtime.stats.hp,
          currentDamageTaken: runtime.isDead ? runtime.stats.hp : 0,
          staggerGauge: Math.max(0, runtime.base.staggerGauge),
          staggerNodes: runtime.base.staggerNodes ?? [],
          staggerDecayRate: runtime.base.staggerRecoverySeconds > 0 ? runtime.base.staggerGauge / runtime.base.staggerRecoverySeconds : 0,
          currentStagger: 0,
          isStaggered: false,
          activeDebuffs: [],
          activeStatuses: [],
          artsInfliction: null,
        });
        continue;
      }
      const slotDebuffs = timedEnemyDebuffs.filter((debuff) => resolveEnemyDebuffSlotId(debuff.enemySlotId) === slot.slotId);
      const slotHpPctModifier = slotDebuffs
        .filter((debuff) => debuff.stat === "HP_PCT")
        .reduce((sum, debuff) => sum + debuff.value, 0);
      const slotMaxHp = Math.max(1, runtime.stats.hp * (1 + slotHpPctModifier));
      const slotCurrentHp = Math.max(0, slotMaxHp - runtime.damageTaken);
      const slotEnemyStatuses = runtimeStatuses
        .filter((status) =>
          status.scope === "enemy"
          && (status.kind === ENEMY_STATUS_KIND || status.kind === "special_stack")
          && resolveEnemyStatusSlotId(status.enemySlotId) === slot.slotId)
        .map((status) => decodeEnemyStatus(status));
      const vulnerability = getEnemyPhysicalInfliction(slot.slotId);
      enemyStateTimeline.push({
        sequence: stateSnapshotSequence++,
        time,
        gameTime,
        enemySlotId: slot.slotId,
        isPresent: true,
        isDead: false,
        deadAt: undefined,
        enemyId: runtime.base.id,
        enemyName: runtime.base.name,
        baseMaxHp: runtime.stats.hp,
        currentHp: slotCurrentHp,
        maxHp: slotMaxHp,
        currentDamageTaken: runtime.damageTaken,
        staggerGauge: Math.max(0, runtime.base.staggerGauge),
        staggerNodes: runtime.base.staggerNodes ?? [],
        staggerDecayRate: runtime.base.staggerRecoverySeconds > 0 ? runtime.base.staggerGauge / runtime.base.staggerRecoverySeconds : 0,
        currentStagger: runtime.currentStaggerForEvents,
        isStaggered: runtime.isStaggeredForEvents,
        activeDebuffs: slotDebuffs.map((debuff) => ({
          enemySlotId: resolveEnemyDebuffSlotId(debuff.enemySlotId),
          label: debuff.label,
          stat: debuff.stat,
          value: debuff.value,
          expiresAt: debuff.expiresAt,
          timeScale: debuff.timeScale,
        })),
        activeStatuses: slotEnemyStatuses.map((status) => ({
          enemySlotId: slot.slotId,
          instanceId: status.instanceId,
          id: status.id,
          label: status.label,
          stacks: status.level,
          hidden: runtimeStatuses.find((entry) => entry.instanceId === status.instanceId)?.hidden,
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
        })).concat(
          vulnerability
            ? [{
                enemySlotId: slot.slotId,
                instanceId: undefined,
                id: VULNERABILITY_STATUS_ID,
                label: "Vulnerability",
                stacks: vulnerability.stacks,
                hidden: false,
                expiresAt: vulnerability.expiresAtGameTime,
                timeScale: "game" as const,
              }]
            : [],
          getEffectStatuses()
            .filter((status) => status.target !== "self")
            .map((status) => ({
              enemySlotId: slot.slotId,
              instanceId: status.instanceId,
              id: status.id,
              label: status.label,
              stacks: undefined,
              hidden: status.hidden,
              expiresAt: status.expiresAt,
              timeScale: status.timeScale,
            })),
        ),
        artsInfliction: getEnemyArtsInfliction(slot.slotId),
      });
    }
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
    const activeWindow = activeComboWindowBySlot.get(args.slot);

    const cooldownOwnerId = comboCommand.comboCooldownOwnerCommandId ?? comboCommand.id;
    const comboTriggerId = comboCommand.comboTriggerId ?? comboCommand.id;
    const cooldownOwnerCommand = getComboCommandById(actor, cooldownOwnerId);
    const cooldownUntilEntry = comboCooldownUntilBySlot.get(args.slot);
    const cooldownUntil = cooldownUntilEntry ?? 0;
    const pendingCooldown = pendingComboCooldownBySlot.get(args.slot);
    const currentTime =
      (cooldownOwnerCommand?.comboCooldownTimeScale ?? comboCommand.comboCooldownTimeScale) === "real"
        ? args.time
        : args.gameTime;

    if (
      comboCommand.id === cooldownOwnerId
      && (pendingCooldown != null || (cooldownUntilEntry != null && currentTime < cooldownUntil))
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

    if (activeWindow) {
      const lastTriggerTime = lastComboTriggerTimeBySlot.get(args.slot) ?? Number.NEGATIVE_INFINITY;
      if (args.time < lastTriggerTime + COMBO_READY_RETRIGGER_ICD_SECONDS - 0.0001) {
        comboTriggerDebug.push({
          ...baseDebugEntry,
          currentTime: comboCommand.comboCooldownTimeScale === "real" ? args.time : args.gameTime,
          comboTimeScale: comboCommand.comboCooldownTimeScale,
          hasActiveComboWindow: true,
          triggered: false,
          blockReason: "ACTIVE_COMBO_WINDOW_TRIGGER_ICD",
        });
        return false;
      }
    }

    const readyAt = args.time + Math.max(0, comboCommand.comboWindowDelaySeconds);
    const windowDuration = Math.max(0, comboCommand.comboWindowDurationSeconds || COMBO_READY_TIMEOUT_SECONDS);
    const perfectTimingDelaySeconds = Math.max(
      0,
      comboCommand.perfectTimingDelaySeconds,
    );
    const perfectTimingDurationSeconds = Math.max(
      0,
      comboCommand.perfectTimingDurationSeconds,
    );
    const perfectTimingStartAt = perfectTimingDurationSeconds > 0
      ? args.time + perfectTimingDelaySeconds
      : undefined;
    const perfectTimingEndAt = perfectTimingStartAt != null
      ? perfectTimingStartAt + perfectTimingDurationSeconds
      : undefined;
    const window: ComboTriggerWindow = activeWindow ?? {
      slot: args.slot,
      commandId: comboCommand.id,
      triggerId: comboTriggerId,
      readyAt,
      expiresAt: readyAt + windowDuration,
      perfectTimingStartAt,
      perfectTimingEndAt,
      sourceStepId: args.sourceStepId,
      sourceEventType: args.sourceEventType,
    };
    window.commandId = comboCommand.id;
    window.triggerId = comboTriggerId;
    window.readyAt = readyAt;
    window.expiresAt = readyAt + windowDuration;
    window.perfectTimingStartAt = perfectTimingStartAt;
    window.perfectTimingEndAt = perfectTimingEndAt;
    window.perfectTimingTriggered = undefined;
    window.consumedAt = undefined;
    window.sourceStepId = args.sourceStepId;
    window.sourceEventType = args.sourceEventType;

    if (!activeWindow) {
      comboWindows.push(window);
    }
    activeComboWindowBySlot.set(args.slot, window);
    lastComboTriggerTimeBySlot.set(args.slot, args.time);
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

  const shortenComboCooldownByRatio = (args: {
    slot: CharacterCombatSnapshot["slot"];
    ratio: number;
    time: number;
    gameTime: number;
  }) => {
    const clampedRatio = Math.max(0, Math.min(1, args.ratio));
    if (clampedRatio <= 0) {
      return;
    }
    const actor = partyBySlot.get(args.slot);
    const comboCommand = actor ? getComboCommand(actor) : undefined;
    if (!comboCommand) {
      return;
    }

    cleanupStateAt(args.time, args.gameTime);

    const pending = pendingComboCooldownBySlot.get(args.slot);
    if (pending) {
      pendingComboCooldownBySlot.set(args.slot, {
        ...pending,
        durationSeconds: Math.max(0, pending.durationSeconds * (1 - clampedRatio)),
      });
      return;
    }

    const cooldownUntil = comboCooldownUntilBySlot.get(args.slot);
    if (cooldownUntil == null) {
      return;
    }
    const now = comboCommand.comboCooldownTimeScale === "real" ? args.time : args.gameTime;
    const remaining = Math.max(0, cooldownUntil - now);
    const shortenedRemaining = Math.max(0, remaining * (1 - clampedRatio));
    comboCooldownUntilBySlot.set(args.slot, now + shortenedRemaining);
  };

  const getComboCooldownDurationSeconds = (args: {
    actor: CharacterCombatSnapshot;
    command: ResolvedCommandAtLevel;
    time: number;
    gameTime: number;
  }) => {
    const effectiveMods = getEffectiveActorMods(args.actor, args.time, args.gameTime);
    const cooldownRate = Math.max(0.05, effectiveMods.COMBO_COOLDOWN_RATE ?? 1);
    const cooldownTotalMultiplier = Math.max(0.05, 1 + (effectiveMods.COMBO_COOLDOWN_TOTAL ?? 0));
    return Math.max(0, (args.command.comboCooldownSeconds * cooldownTotalMultiplier) / cooldownRate);
  };

  const getRemainingComboCooldownPauseDuration = (
    slot: CharacterCombatSnapshot["slot"],
    realTime: number,
  ) => {
    const intervals = comboCooldownPauseIntervalsBySlot.get(slot) ?? [];
    return intervals.reduce((sum, interval) =>
      sum + Math.max(0, interval.endTime - Math.max(realTime, interval.startTime)), 0);
  };

  const addComboCooldownPauseInterval = (args: {
    slot: CharacterCombatSnapshot["slot"];
    startTime: number;
    durationSeconds: number;
  }) => {
    const durationSeconds = Math.max(0, args.durationSeconds);
    if (durationSeconds <= 0) {
      return;
    }

    const startTime = args.startTime;
    const endTime = startTime + durationSeconds;
    const existingIntervals = comboCooldownPauseIntervalsBySlot.get(args.slot) ?? [];
    const totalDurationBefore = existingIntervals.reduce((sum, interval) => sum + (interval.endTime - interval.startTime), 0);
    const mergedIntervals = [...existingIntervals, { startTime, endTime }]
      .sort((left, right) => left.startTime - right.startTime)
      .reduce<Array<{ startTime: number; endTime: number }>>((merged, interval) => {
        const previous = merged.length > 0 ? merged[merged.length - 1] : undefined;
        if (!previous || interval.startTime > previous.endTime + 0.0001) {
          merged.push({ ...interval });
          return merged;
        }
        previous.endTime = Math.max(previous.endTime, interval.endTime);
        return merged;
      }, []);
    const totalDurationAfter = mergedIntervals.reduce((sum, interval) => sum + (interval.endTime - interval.startTime), 0);
    const addedDuration = Math.max(0, totalDurationAfter - totalDurationBefore);
    comboCooldownPauseIntervalsBySlot.set(args.slot, mergedIntervals);

    const cooldownUntil = comboCooldownUntilBySlot.get(args.slot);
    if (cooldownUntil != null && addedDuration > 0) {
      comboCooldownUntilBySlot.set(args.slot, cooldownUntil + addedDuration);
    }
  };

  const pauseTeamComboCooldowns = (args: {
    durationSeconds: number;
    time: number;
  }) => {
    for (const member of party) {
      addComboCooldownPauseInterval({
        slot: member.slot,
        startTime: args.time,
        durationSeconds: args.durationSeconds,
      });
    }
  };

  type RuntimeTeamSpState = { generated: number; returned: number };

  const addReturnedSpToRuntime = (state: RuntimeTeamSpState, amount: number) => {
    if (amount <= 0) {
      return;
    }
    const space = TEAM_SP_MAX - (state.generated + state.returned);
    state.returned += Math.min(space, amount);
  };

  const addGeneratedSpToRuntime = (state: RuntimeTeamSpState, amount: number, cap = TEAM_SP_MAX) => {
    if (amount <= 0) {
      return;
    }
    const directSpace = cap - (state.generated + state.returned);
    const directAdded = Math.min(directSpace, amount);
    state.generated += directAdded;
    let remaining = amount - directAdded;

    if (remaining > 0 && state.returned > 0) {
      const converted = Math.min(state.returned, remaining);
      state.returned -= converted;
      state.generated += converted;
    }
  };

  const consumeTeamSpFromRuntime = (state: RuntimeTeamSpState, amount: number): number => {
    let remaining = Math.max(0, amount);
    const consumedReturned = Math.min(state.returned, remaining);
    state.returned -= consumedReturned;
    remaining -= consumedReturned;

    const consumedGenerated = Math.min(state.generated, remaining);
    state.generated -= consumedGenerated;
    return consumedGenerated;
  };

  const getRuntimeCommandForAction = (action: CompiledRotationAction): ResolvedCommandAtLevel | null =>
    partyBySlot.get(action.slot)?.commands.find((command) => command.id === action.commandId) ?? null;

  const getRuntimeSimulationView = (): RotationSimulationResult =>
    ({
      timeExtensions,
      actorStateTimeline,
    } as RotationSimulationResult);

  const hasRuntimeTeamEncumberedAtTime = (time: number): boolean => {
    const actorState = getActorStateAtTime(getRuntimeSimulationView(), 0, time);
    const activeTeamStatusIds = new Set(actorState.activeTeamStatuses.map((status) => status.id));
    return activeTeamStatusIds.has("team_encumbered") && !activeTeamStatusIds.has("team_encumbered_suppression");
  };

  const canGainRuntimeEnergyFromSource = (args: {
    targetSlot: PartySlot;
    sourceType: "command" | "other";
    sourceSlot?: PartySlot;
    sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
  }): boolean => {
    const actor = partyBySlot.get(args.targetSlot);
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
  };

  const hasRuntimeNoEnergyGainBuffAtTime = (slot: PartySlot, time: number): boolean =>
    getActorStateAtTime(getRuntimeSimulationView(), slot, time).activeBuffs.some((buff) => buff.id === "no_energy_gain");

  const getRuntimeUltEnergyGainMultiplierAtTime = (slot: PartySlot, time: number): number => {
    const actor = partyBySlot.get(slot);
    if (!actor) {
      return 1;
    }
    const actorState = getActorStateAtTime(getRuntimeSimulationView(), slot, time);
    let multiplier = actor.mods.ULT_GAIN_PCT ?? 1;
    for (const buff of actorState.activeBuffs) {
      multiplier += buff.effects?.ULT_GAIN_PCT ?? 0;
    }
    return Math.max(0, multiplier);
  };

  const applyRuntimeUltimateEnergyGain = (args: {
    energyBySlot: Map<PartySlot, number>;
    energyMaxBySlot: Map<PartySlot, number>;
    targetSlot: PartySlot;
    time: number;
    rawAmount: number;
    sourceType: "command" | "other";
    sourceSlot?: PartySlot;
    sourceCommandAttackType?: CharacterCombatSnapshot["commands"][number]["attackType"];
    ignoreUltimateGainEfficiency?: boolean;
  }) => {
    if (args.rawAmount <= 0) {
      return;
    }
    const gameTime = toGameTimeFromExtensions(args.time);
    if (gameTime < 0) {
      return;
    }
    if (hasRuntimeNoEnergyGainBuffAtTime(args.targetSlot, args.time)) {
      return;
    }
    if (!canGainRuntimeEnergyFromSource(args)) {
      return;
    }
    const gainMultiplier = args.ignoreUltimateGainEfficiency
      ? 1
      : getRuntimeUltEnergyGainMultiplierAtTime(args.targetSlot, args.time);
    const gained = args.rawAmount * gainMultiplier;
    if (gained <= 0) {
      return;
    }
    const energyMax = args.energyMaxBySlot.get(args.targetSlot) ?? 0;
    const currentEnergy = args.energyBySlot.get(args.targetSlot) ?? 0;
    args.energyBySlot.set(args.targetSlot, Math.min(energyMax, currentEnergy + gained));
  };

  const addRuntimePassiveSpRegenSegment = (state: RuntimeTeamSpState, fromTime: number, toTime: number) => {
    const start = Math.min(fromTime, toTime);
    const end = Math.max(fromTime, toTime);
    if (end <= start + 0.0001) {
      return;
    }

    const slotZeroStateTimes = actorStateTimeline
      .filter((entry) => entry.slot === 0 && entry.time > start && entry.time < end)
      .map((entry) => entry.time);
    const boundaries = [start, ...slotZeroStateTimes, end];

    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const segmentStart = boundaries[index]!;
      const segmentEnd = boundaries[index + 1]!;
      if (segmentEnd <= segmentStart + 0.0001) {
        continue;
      }
      if (hasRuntimeTeamEncumberedAtTime(segmentStart)) {
        continue;
      }

      const startGameTime = toGameTimeFromExtensions(segmentStart);
      const endGameTime = toGameTimeFromExtensions(segmentEnd);
      if (endGameTime <= startGameTime) {
        continue;
      }

      if (startGameTime < 0 && endGameTime > 0) {
        addGeneratedSpToRuntime(state, (0 - startGameTime) * PRE_BATTLE_SP_REGEN_RATE, PRE_BATTLE_SP_MAX);
        addGeneratedSpToRuntime(state, endGameTime * initialResources.spRegenRate, TEAM_SP_MAX);
        continue;
      }

      const rules = startGameTime < 0
        ? { cap: PRE_BATTLE_SP_MAX, regen: PRE_BATTLE_SP_REGEN_RATE }
        : { cap: TEAM_SP_MAX, regen: initialResources.spRegenRate };
      addGeneratedSpToRuntime(state, (endGameTime - startGameTime) * rules.regen, rules.cap);
    }
  };

  const computeRuntimeResourcesAtTime = (targetTime: number): RotationSimulationInitialResourceState => {
    const energyBySlot = new Map(initialResources.energyBySlot);
    const energyMaxBySlot = new Map(initialResources.energyMaxBySlot);
    const teamSp: RuntimeTeamSpState = {
      generated: initialResources.teamSpGenerated,
      returned: initialResources.teamSpReturned,
    };
    let controlledSlot: PartySlot = resumeCheckpoint?.runtime.controlledOperatorSlot ?? 0;

    const resourceEvents: Array<
      | { time: number; type: "action-start"; action: CompiledRotationAction; command: ResolvedCommandAtLevel }
      | { time: number; type: "action-end"; action: CompiledRotationAction; command: ResolvedCommandAtLevel }
      | { time: number; type: "hit"; hit: DamageTimelineEntry }
      | { time: number; type: "bonus-return"; amount: number }
      | { time: number; type: "bonus-generated"; amount: number }
      | { time: number; type: "skill-return"; amount: number }
    > = [];

    for (const action of actions) {
      const command = getRuntimeCommandForAction(action);
      if (!command) {
        continue;
      }
      if (!action.nullified && action.realStartTime <= targetTime + 0.0001) {
        resourceEvents.push({ time: action.realStartTime, type: "action-start", action, command });
      }
      if (!action.nullified && !action.interrupted && action.realEndTime <= targetTime + 0.0001) {
        resourceEvents.push({ time: action.realEndTime, type: "action-end", action, command });
      }
    }

    for (const hit of timeline) {
      if (hit.time > targetTime + 0.0001) {
        break;
      }
      resourceEvents.push({ time: hit.time, type: "hit", hit });
    }

    for (const event of events) {
      if ((event.amount ?? 0) <= 0 || event.time > targetTime + 0.0001) {
        continue;
      }
      if (event.type === "ENEMY_COMMAND_INTERRUPTED") {
        resourceEvents.push({ time: event.time, type: "bonus-return", amount: event.amount ?? 0 });
      } else if (event.type === "SP_RETURNED") {
        resourceEvents.push({ time: event.time, type: "skill-return", amount: event.amount ?? 0 });
      } else if (event.type === "SP_GENERATED") {
        resourceEvents.push({ time: event.time, type: "bonus-generated", amount: event.amount ?? 0 });
      }
    }

    resourceEvents.sort((left, right) => {
      if (left.time !== right.time) {
        return left.time - right.time;
      }
      const order = { "action-start": 0, "bonus-return": 1, "bonus-generated": 1, "skill-return": 1, hit: 2, "action-end": 3 } as const;
      return order[left.type] - order[right.type];
    });

    let lastSpTime = Math.min(targetTime, resumeCheckpoint?.time ?? 0, 0);
    for (const event of resourceEvents) {
      const clampedTime = Math.min(event.time, targetTime);
      addRuntimePassiveSpRegenSegment(teamSp, lastSpTime, clampedTime);

      if (event.type === "bonus-return" || event.type === "skill-return") {
        addReturnedSpToRuntime(teamSp, event.amount);
      } else if (event.type === "bonus-generated") {
        addGeneratedSpToRuntime(teamSp, event.amount);
      } else if (event.type === "hit") {
        if (!event.hit.requiresControlledOperator || event.hit.slot === controlledSlot) {
          addGeneratedSpToRuntime(teamSp, event.hit.spGenerated);
        }
        addReturnedSpToRuntime(teamSp, event.hit.spReturned);
        applyRuntimeUltimateEnergyGain({
          energyBySlot,
          energyMaxBySlot,
          targetSlot: event.hit.slot,
          time: event.time,
          rawAmount: event.hit.energyReturn,
          sourceType: "command",
          sourceSlot: event.hit.slot,
          sourceCommandAttackType: event.hit.calculationContext?.attackType,
          ignoreUltimateGainEfficiency: event.hit.ignoreUltimateGainEfficiency,
        });
      } else if (event.type === "action-end") {
        applyRuntimeUltimateEnergyGain({
          energyBySlot,
          energyMaxBySlot,
          targetSlot: event.action.slot,
          time: event.time,
          rawAmount: event.command.energyGain,
          sourceType: "command",
          sourceSlot: event.action.slot,
          sourceCommandAttackType: event.command.attackType,
        });
        addGeneratedSpToRuntime(teamSp, event.command.spGeneratedOnEnd);
        addReturnedSpToRuntime(teamSp, event.command.spReturnedOnEnd);
      } else if (event.type === "action-start") {
        if (event.command.energyCost > 0) {
          const currentEnergy = energyBySlot.get(event.action.slot) ?? 0;
          energyBySlot.set(event.action.slot, Math.max(0, currentEnergy - event.command.energyCost));
        }
        const generatedConsumed = consumeTeamSpFromRuntime(teamSp, event.command.spCost);
        if (generatedConsumed > 0) {
          for (const slot of energyMaxBySlot.keys()) {
            applyRuntimeUltimateEnergyGain({
              energyBySlot,
              energyMaxBySlot,
              targetSlot: slot,
              time: event.time,
              rawAmount: generatedConsumed * GENERATED_SP_TEAM_ENERGY_RATE,
              sourceType: "command",
              sourceSlot: event.action.slot,
              sourceCommandAttackType: event.command.attackType,
            });
          }
        }
        if (event.command.genericActionType === "switch" && event.action.slot !== controlledSlot) {
          controlledSlot = event.action.slot;
        }
      }

      lastSpTime = clampedTime;
    }

    if (targetTime > lastSpTime) {
      addRuntimePassiveSpRegenSegment(teamSp, lastSpTime, targetTime);
    }

    return {
      teamSpGenerated: teamSp.generated,
      teamSpReturned: teamSp.returned,
      spRegenRate: initialResources.spRegenRate,
      energyBySlot,
      energyMaxBySlot,
    };
  };

  let actorBuffInstanceCounter = 0;
  let nextSimulationCheckpointTime = 0;

  const captureSimulationCheckpoint = (time: number, gameTime: number) => {
    const lastCheckpoint = simulationCheckpoints[simulationCheckpoints.length - 1];
    if (lastCheckpoint && Math.abs(lastCheckpoint.time - time) <= 1e-9 && Math.abs(lastCheckpoint.gameTime - gameTime) <= 1e-9) {
      return;
    }
    const resourceState = computeRuntimeResourcesAtTime(time);
    simulationCheckpoints.push({
      chunkIndex: Math.max(0, Math.ceil(Math.max(0, time) / SIMULATION_CHECKPOINT_CHUNK_SECONDS)),
      time,
      gameTime,
      outputCounts: {
        totalDamage,
        riggedCritCount,
        timelineCount: timeline.length,
        eventCount: events.length,
        comboWindowCount: comboWindows.length,
        enemyLifecycleCount: enemyLifecycleTimeline.length,
        countdownCount: countdownTimeline.length,
        relayCount: relayTimeline.length,
        enemyTransitionCount: enemyTransitionTimeline.length,
        actorStateCount: actorStateTimeline.length,
        enemyStateCount: enemyStateTimeline.length,
        comboTriggerDebugCount: comboTriggerDebug.length,
        passiveListenerDebugCount: passiveListenerDebug.length,
        statusChangeLogCount: statusChangeLog.length,
      },
      sequences: {
        stateSnapshotSequence,
        statusInstanceSequence,
        statusChangeSequence,
        triggerInstanceSequence,
        actorBuffInstanceCounter,
      },
      runtime: {
        damageBySlot: deepClone(damageBySlot),
        timedEnemyDebuffs: deepClone(timedEnemyDebuffs),
        runtimeStatuses: deepClone(runtimeStatuses),
        triggerVariableValuesById: deepClone(triggerVariableValuesById),
        customTriggerRuntimeEnabledById: deepClone(customTriggerRuntimeEnabledById),
        comboCooldownUntilBySlot: deepClone(comboCooldownUntilBySlot),
        pendingComboCooldownBySlot: deepClone(pendingComboCooldownBySlot),
        comboCooldownPauseIntervalsBySlot: deepClone(comboCooldownPauseIntervalsBySlot),
        activeComboWindowBySlot: deepClone(activeComboWindowBySlot),
        lastComboTriggerTimeBySlot: deepClone(lastComboTriggerTimeBySlot),
        perfectTimingStepIds: deepClone(perfectTimingStepIds),
        repeatedHitKeys: deepClone(repeatedHitKeys),
        terminatedRepeatHitChains: deepClone(terminatedRepeatHitChains),
        setTriggerFlags: deepClone(setTriggerFlags),
        listenerCooldowns: deepClone(listenerCooldowns),
        listenerCounters: deepClone(listenerCounters),
        commandModifierByStepId: deepClone(commandModifierByStepId),
        bladebreakingPendingBySlot: deepClone(bladebreakingPendingBySlot),
        stepContractDamageMultiplierByStepId: deepClone(stepContractDamageMultiplierByStepId),
        timedContractDamageModifiers: deepClone(timedContractDamageModifiers),
        critThresholdProgressBySlot: deepClone(critThresholdProgressBySlot),
        commandLinkedStacksByStepId: deepClone(commandLinkedStacksByStepId),
        commandAttackTypeByStepId: deepClone(commandAttackTypeByStepId),
        castEventEmittedByStepId: deepClone(castEventEmittedByStepId),
        interruptedAtByStepId: deepClone(interruptedAtByStepId),
        pendingArtsBursts: deepClone(pendingArtsBursts),
        pendingExecuteHits: deepClone(pendingExecuteHits),
        pendingTriggerResumes: deepClone(pendingTriggerResumes) as RotationSimulationCheckpoint["runtime"]["pendingTriggerResumes"],
        pendingEnemyListenerWindowEnds: deepClone(pendingEnemyListenerWindowEnds),
        triggerExecutionBlockedUntil,
        triggerExecutionGloballyBlocked,
        triggerExecutionTotalCount,
        recentTriggerExecutionTimes: deepClone(recentTriggerExecutionTimes),
        activeTriggerRunIds: deepClone(activeTriggerRunIds),
        stoppedTriggerInstanceIds: deepClone(stoppedTriggerInstanceIds),
        triggerInstanceIdsByTriggerId: deepClone(triggerInstanceIdsByTriggerId),
        actorMaxHpBySlot: deepClone(actorMaxHpBySlot),
        actorCurrentHpBySlot: deepClone(actorCurrentHpBySlot),
        teamSpGenerated: resourceState.teamSpGenerated,
        teamSpReturned: resourceState.teamSpReturned,
        spRegenRate: resourceState.spRegenRate,
        energyBySlot: deepClone(resourceState.energyBySlot),
        energyMaxBySlot: deepClone(resourceState.energyMaxBySlot),
        controlledOperatorSlot,
        activeBuildVariantBySlot: deepClone(activeBuildVariantBySlot),
        switchBackLockedUntilBySlot: deepClone(switchBackLockedUntilBySlot),
        enemyRuntimeBySlot: deepClone(enemyRuntimeBySlot),
        enemyHpHistoryBySlot: deepClone(enemyHpHistoryBySlot),
        enemyHpDeltaHistoryBySlot: deepClone(enemyHpDeltaHistoryBySlot),
        currentTargetedEnemySlotId,
        nextEnemyActionStartEffectWindowIndex,
        nextEnemyActionEndEffectWindowIndex,
        nextEnemyInterruptedCommandWindowIndex,
      },
    });
  };

  const flushSimulationCheckpointsUpTo = (realTime: number) => {
    while (nextSimulationCheckpointTime <= realTime + 0.0001) {
      const checkpointTime = nextSimulationCheckpointTime;
      const checkpointGameTime = timeContext.toGameTime(checkpointTime);
      flushEnemyInterruptedCommandEventsUpTo({ time: checkpointTime });
      processPendingSimulationEventsUpTo({ realTime: checkpointTime, gameTime: checkpointGameTime });
      cleanupStateAt(checkpointTime, checkpointGameTime);
      captureSimulationCheckpoint(checkpointTime, checkpointGameTime);
      nextSimulationCheckpointTime += SIMULATION_CHECKPOINT_CHUNK_SECONDS;
    }
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
    if (
      args.buffId === "heat_infliction"
      || args.buffId === "cryo_infliction"
      || args.buffId === "electric_infliction"
      || args.buffId === "nature_infliction"
    ) {
      const element: PlayerArtsElement =
        args.buffId === "heat_infliction"
          ? "Heat"
          : args.buffId === "cryo_infliction"
            ? "Cryo"
            : args.buffId === "electric_infliction"
              ? "Electric"
              : "Nature";
      applyActorArtsInfliction({
        slot: args.slot,
        element,
        durationSeconds: args.durationSeconds,
        stacks: 1,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      return;
    }

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

    const createdInstanceSequence = actorBuffInstanceCounter++;
    const buffInstanceId = args.stackGroup
      ? `${args.buffId}:stack:${createdInstanceSequence}`
      : args.buffId;

    actorBuffs.push({
      instanceId: `${args.buffId}:instance:${createdInstanceSequence}`,
      id: buffInstanceId,
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
    setActorBuffs(actorBuffs, {
      reason: "apply_actor_buff",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
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
      durationSeconds: args.infiniteDuration ? undefined : args.durationSeconds,
      timeScale: args.timeScale,
    };
    emitEvent(event);
    dispatchPassiveListeners(event);
  };

  const removeActorBuff = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
    time?: number;
    gameTime?: number;
    stepId?: string;
  }) => {
    const nextBuffs = getActorBuffs().filter((buff) =>
      !(buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`))),
    );
    setActorBuffs(nextBuffs, {
      reason: "remove_actor_buff",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
      changeType: "removed",
    });
  };

  const getActorBuffStackCount = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
  }) =>
    getActorBuffs().filter((buff) =>
      buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`)),
    ).length;

  const getActorBuffRemainingSeconds = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
    time: number;
    gameTime: number;
  }) =>
    getActorBuffs()
      .filter((buff) =>
        buff.slot === args.slot && (buff.id === args.buffId || buff.id.startsWith(`${args.buffId}:`)),
      )
      .reduce((remaining, buff) => {
        const currentTime = buff.timeScale === "real" ? args.time : args.gameTime;
        return Math.max(remaining, Math.max(0, buff.expiresAt - currentTime));
      }, 0);

  const removeActorBuffStacks = (args: {
    slot: CharacterCombatSnapshot["slot"];
    buffId: string;
    stacks: number;
    time?: number;
    gameTime?: number;
    stepId?: string;
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
    const nextBuffs = actorBuffs.filter((buff) => !(buff.slot === args.slot && removeIds.has(buff.id)));
    setActorBuffs(nextBuffs, {
      reason: "remove_actor_buff_stacks",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
      changeType: "removed",
    });
  };

  const removeEnemyStatus = (args: {
    statusId: string;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    enemySlotId?: EnemySlotId;
    commandAttackType?: RotationCombatEvent["commandAttackType"];
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    const enemyStatuses = getEnemyStatuses(enemySlotId);
    const matchingStatuses = enemyStatuses.filter((status) => status.id === args.statusId);
    const hadStatus = matchingStatuses.length > 0;
    if (!hadStatus) {
      return;
    }
    setEnemyStatuses(enemyStatuses.filter((status) => status.id !== args.statusId), {
      reason: "remove_enemy_status",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: "removed",
    }, enemySlotId);
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      !(resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId && debuff.buffId === args.statusId));

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
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: `${reactionName} Consumed Arts Reaction`,
        consumedElement,
        consumedStacks: Math.max(1, matchingStatuses[0]?.level ?? 1),
        commandAttackType:
          args.commandAttackType
          ?? commandAttackTypeByStepId.get(args.stepId)
          ?? commandAttackTypeByStepId.get(getRootStepId(args.stepId)),
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);
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
    enemySlotId?: EnemySlotId;
    singleEventPerStep?: boolean;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (!isEnemyPresent(enemySlotId)) {
      return;
    }
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      !(resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId && debuff.buffId === args.buffId));
    const nextStatuses = runtimeStatuses.filter((status) =>
      !(status.scope === "enemy"
        && resolveEnemyStatusSlotId(status.enemySlotId) === enemySlotId
        && status.id === args.buffId),
    );
    nextStatuses.push(normalizeStatus({
      id: args.buffId,
      label: args.label,
      scope: "enemy",
      kind: ENEMY_STATUS_KIND,
      enemySlotId,
      expiresAt: (args.timeScale === "real" ? args.time : args.gameTime) + args.durationSeconds,
      timeScale: args.timeScale,
      ownerSlot: args.sourceSlot,
      metadata: {
        sourceStepId: args.stepId,
      },
    }));
    replaceRuntimeStatuses(nextStatuses, {
      reason: "apply_enemy_buff",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: "replaced",
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
        enemySlotId,
      });

      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: args.label,
        debuffStat: stat,
        durationSeconds: args.durationSeconds,
        timeScale: args.timeScale,
      };
      if (shouldEmitSingleStepEvent({
        stepId: args.stepId,
        eventType: event.type,
        label: event.label,
        sourceSlot: args.sourceSlot,
        enabled: args.singleEventPerStep,
      })) {
        emitEvent(event);
        dispatchPassiveListeners(event);
      }
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
    enemySlotId?: EnemySlotId;
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
      enemySlotId: args.enemySlotId,
    });
  };

  const dispatchPassiveListeners = (
    event: RotationCombatEvent,
    triggerSlots?: CharacterCombatSnapshot["slot"][],
    options?: {
      memberSlots?: Set<PartySlot>;
      includeCombatHooks?: boolean;
      includeGearSet?: boolean;
      includeWeapon?: boolean;
    },
  ) => {
    dispatchCustomTriggers(event);
    const primaryEventEnemySlotId = event.enemySlotId ?? event.affectedEnemySlotIds?.[0] ?? null;
    const getEventEnemySlotId = (enemySlotId?: EnemySlotId) =>
      enemySlotId ?? primaryEventEnemySlotId ?? currentTargetedEnemySlotId;
    const resolveEventHookEnemySlotId = (enemyRef?: CombatHookEnemyRef) => {
      if (typeof enemyRef === "string") {
        return getEventEnemySlotId(enemyRef);
      }
      if (isCombatHookEnemyRefObject(enemyRef) && enemyRef.enemySlotId) {
        return getEventEnemySlotId(enemyRef.enemySlotId);
      }
      const enemySelector: CombatHookEnemySelector | undefined =
        isCombatHookEnemyRefObject(enemyRef) ? enemyRef.enemy : undefined;
      if (enemySelector === "targeted") {
        return currentTargetedEnemySlotId;
      }
      return getEventEnemySlotId();
    };
    if (
      resolvedContracts.bladebreakingUltimateDmgPct != null
      && event.type === "ULTIMATE_CAST"
      && event.slot != null
    ) {
      const hadPending = bladebreakingPendingBySlot.get(event.slot) === true;
      if (hadPending && event.stepId) {
        addStepContractDamageModifier(event.stepId, resolvedContracts.bladebreakingUltimateDmgPct);
      }
      bladebreakingPendingBySlot.set(event.slot, true);
      const bladebreakingVariant = getActiveContractVariant("bladebreaking");
      if (bladebreakingVariant) {
        applyContractTokenBuff({
          slot: event.slot,
          buffId: "contract_bladebreaking",
          label: bladebreakingVariant.name,
          time: event.time,
          gameTime: event.gameTime,
          stepId: event.stepId ?? "__contract_bladebreaking",
        });
      }
    }

    if (
      resolvedContracts.suppressionOnInflictionEffects.length > 0
      && event.sourceSlot != null
    ) {
      const suppressionStat = getSuppressionDebuffStatFromEvent(event);
      if (suppressionStat) {
        const suppressionDamageType = getSuppressionDamageTypeFromStat(suppressionStat);
        const suppressionEffect = resolvedContracts.suppressionOnInflictionEffects.reduce<
          { value: number; durationSeconds: number; timeScale: TimeScale } | null
        >((lowest, candidate) => {
          if (!lowest || candidate.value < lowest.value) {
            return candidate;
          }
          return lowest;
        }, null);
        if (suppressionDamageType && suppressionEffect) {
          addTimedContractDamageModifier({
            slot: event.sourceSlot,
            value: suppressionEffect.value,
            damageType: suppressionDamageType,
            durationSeconds: suppressionEffect.durationSeconds,
            timeScale: suppressionEffect.timeScale,
            time: event.time,
            gameTime: event.gameTime,
          });
          const restraintVariant = getActiveContractVariant("suppression_on_infliction");
          if (restraintVariant) {
            applyContractTokenBuff({
              slot: event.sourceSlot,
              buffId: `contract_restraint_${suppressionDamageType.toLowerCase()}`,
              label: `${restraintVariant.name}: ${suppressionDamageType}`,
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId ?? "__contract_restraint",
              durationSeconds: suppressionEffect.durationSeconds,
              infiniteDuration: false,
              timeScale: suppressionEffect.timeScale,
            });
          }
        }
      }
    }

    if (resolvedContracts.encasementActive) {
      const shouldRefreshEncasement =
        event.type === "ARTS_INFLICTION_APPLIED"
        || (event.type === "ENEMY_DEBUFF_APPLIED" && event.label === "Vulnerability Applied");
      if (shouldRefreshEncasement) {
        const enemySlotIds = event.affectedEnemySlotIds?.length
          ? event.affectedEnemySlotIds
          : event.enemySlotId
            ? [event.enemySlotId]
            : [];
        for (const enemySlotId of enemySlotIds) {
          updateEnemyEncasementStatuses({
            enemySlotId,
            time: event.time,
            gameTime: event.gameTime,
            stepId: event.stepId,
          });
        }
      }
    }

    const logPassiveListener = (args: {
      member: CharacterCombatSnapshot;
      listenerKind: PassiveListenerDebugEntry["listenerKind"];
      listenerPresent: boolean;
    }) => {
      passiveListenerDebug.push({
        time: event.time,
        gameTime: event.gameTime,
        eventType: event.type,
        eventLabel: event.label,
        eventStepId: event.stepId,
        eventCommandId: event.commandId,
        eventCommandAttackType: event.commandAttackType,
        listenerKind: args.listenerKind,
        slot: args.member.slot,
        characterId: args.member.characterId,
        characterName: args.member.characterName,
        listenerPresent: args.listenerPresent,
      });
    };

    for (const baseMember of party) {
      if (options?.memberSlots && !options.memberSlots.has(baseMember.slot)) {
        continue;
      }
      const member = getRuntimeActorBySlot(baseMember.slot) ?? baseMember;
      const combatHooks = member.combatHooks;
      if (options?.includeCombatHooks !== false) {
        logPassiveListener({
          member,
          listenerKind: "COMBAT_HOOK",
          listenerPresent: typeof combatHooks?.onEvent === "function",
        });
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
          effectTree: event.effectTree,
          stepId: event.stepId,
          enemySlotId: event.enemySlotId,
          affectedEnemySlotIds: event.affectedEnemySlotIds,
          commandId: event.commandId,
          commandName: event.commandName,
          hitName: event.hitName,
          dealsDamage: event.dealsDamage,
          slot: event.slot,
          sourceSlot: event.sourceSlot,
          label: event.label,
          commandAttackType: event.commandAttackType,
          amount: event.amount,
          consumedElement: event.consumedElement,
          consumedStacks: event.consumedStacks,
          enemyHpRatio: event.enemyHpRatio,
          enemyHadOriginiumCrystal: event.enemyHadOriginiumCrystal,
          enemyHadPhysicalSusceptibility: event.enemyHadPhysicalSusceptibility,
          enemyWasStaggered: event.enemyWasStaggered,
        },
        state: {
          getPrimaryEnemySlotId: () => primaryEventEnemySlotId,
          getActiveEnemySlotIds: () =>
            normalizedEnemySlots
              .map((slot) => slot.slotId)
              .filter((slotId) => isEnemyPresent(slotId)),
          getAffectedEnemySlotIds: () => [...(event.affectedEnemySlotIds ?? [])],
          getEnemyArtsInfliction: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyArtsInfliction(resolveEventHookEnemySlotId(enemyRef)),
          getEnemyHpRatio: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyHpRatioAtTime(event.time, resolveEventHookEnemySlotId(enemyRef)),
          getEnemyVulnerabilityStacks: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyPhysicalInfliction(resolveEventHookEnemySlotId(enemyRef))?.stacks ?? 0,
          hasSelfBuff: (buffId: string) => {
            cleanupStateAt(event.time, event.gameTime);
            return getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            );
          },
          getSelfBuffStackCount: (buffId: string) => {
            cleanupStateAt(event.time, event.gameTime);
            return getActorBuffStackCount({
              slot: member.slot,
              buffId,
            });
          },
          getSelfBuffRemainingSeconds: (buffId: string) =>
            getActorBuffRemainingSeconds({
              slot: member.slot,
              buffId,
              time: event.time,
              gameTime: event.gameTime,
            }),
          isSelfUniqueTalentEnabled: (key: string) =>
            isUniqueTalentEnabled(key, {
              ascensionStage: member.ascensionStage,
              uniqueTalentToggles: member.uniqueTalentToggles,
              uniqueTalentConditions: member.uniqueTalentConditions,
              uniqueTalentDefaults: member.uniqueTalentDefaults,
            }),
          isSelfPotentialActive: (level: number) => member.potentialLevel >= level,
          getSelfAttr: (attr: "STR" | "AGI" | "INT" | "WIL") => member.attrs[attr],
          getActorModifierValue: ({ slot, stat }) => {
            const actor = getRuntimeActorBySlot(slot) ?? partyBySlot.get(slot);
            if (!actor) {
              return 0;
            }
            return getEffectiveActorMods(actor, event.time, event.gameTime)[stat] ?? 0;
          },
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
            for (const teammateBase of party) {
              const teammate = getRuntimeActorBySlot(teammateBase.slot) ?? teammateBase;
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
          applyBuffToSlot: (args) => {
            applyActorBuff({
              slot: args.slot,
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
          clearTeamCryoDebuffs: () => {
            clearTeamCryoDebuffs({
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId ?? "",
              reason: "hook_clear_team_cryo_debuffs",
            });
          },
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
          restoreHpToSlot: (args) =>
            restoreHpToSlot({
              sourceActor: member,
              targetSlot: args.slot,
              baseAmount: args.baseAmount,
              label: args.label,
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId ?? "",
            }),
          applyStatusToSlot: (args) =>
            applyStatusToSlot({
              sourceActor: member,
              targetSlot: args.slot,
              statusId: args.statusId,
              label: args.label,
              effects: args.effects,
              blocksOperatorArtsInflictionElements: args.blocksOperatorArtsInflictionElements,
              durationSeconds: args.durationSeconds,
              timeScale: args.timeScale,
              hidden: args.hidden,
              stacks: args.stacks,
              maxStacks: args.maxStacks,
              refreshExistingStacks: args.refreshExistingStacks,
              independentStacks: args.independentStacks,
              pauseStatusIds: args.pauseStatusIds,
              periods: args.periods,
              maxPeriods: args.maxPeriods,
              initialEffects: args.initialEffects,
              periodicEffects: args.periodicEffects,
              expireEffects: args.expireEffects,
              removeEffects: args.removeEffects,
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId ?? "",
              sourceCommandAttackType: event.commandAttackType,
            }),
          grantReturnedSp: (amount: number, label: string) => {
            if (amount <= 0) {
              return;
            }
            const spReturnedEvent: RotationCombatEvent = {
              type: "SP_RETURNED",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: event.commandAttackType,
            };
            emitEvent(spReturnedEvent);
            dispatchPassiveListeners(spReturnedEvent, triggerSlots);
          },
          grantGeneratedSp: (amount: number, label: string) => {
            if (amount <= 0) {
              return;
            }
            const spGeneratedEvent: RotationCombatEvent = {
              type: "SP_GENERATED",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: event.commandAttackType,
            };
            emitEvent(spGeneratedEvent);
            dispatchPassiveListeners(spGeneratedEvent, triggerSlots);

            const spRecoveredEvent: RotationCombatEvent = {
              type: "SKILL_SP_RECOVERED",
              time: event.time,
              gameTime: event.gameTime,
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: event.commandAttackType,
            };
            emitEvent(spRecoveredEvent);
            dispatchPassiveListeners(spRecoveredEvent, triggerSlots);
          },
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
          shortenSelfComboCooldownByRatio: (ratio: number) => {
            shortenComboCooldownByRatio({
              slot: member.slot,
              ratio,
              time: event.time,
              gameTime: event.gameTime,
            });
          },
          pauseTeamComboCooldowns: (args) => {
            pauseTeamComboCooldowns({
              durationSeconds: args.durationSeconds,
              time: event.time,
            });
          },
          hasStatus: (hookArgs) =>
            hasUnifiedStatus({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveEventHookEnemySlotId(hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy }),
              realTime: event.time,
              gameTime: event.gameTime,
            }),
          getStatusSourceStepId: (hookArgs) => {
            const target = hookArgs.target ?? "self";
            const resolvedEnemySlotId = resolveEventHookEnemySlotId(
              hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
            );
            const statuses = getUnifiedStatuses({
              realTime: event.time,
              gameTime: event.gameTime,
            });
            const matched = statuses.find((status) =>
              status.id === hookArgs.statusId
              && (
                (target === "enemy" && status.scope === "enemy" && resolveEnemyStatusSlotId(status.enemySlotId) === resolvedEnemySlotId)
                || (target === "field" && status.fieldStatus === true)
                || (target === "global" && status.scope === "global")
                || (target === "self" && status.scope === "actor" && status.targetSlot === member.slot)
              ),
            );
            const sourceStepId = matched?.metadata?.sourceStepId;
            return typeof sourceStepId === "string" && sourceStepId.length > 0 ? sourceStepId : null;
          },
          getStatusRemainingSeconds: (hookArgs) =>
            getUnifiedStatusRemainingSeconds({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveEventHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: event.time,
              gameTime: event.gameTime,
            }),
          getStatusStackCount: (hookArgs) =>
            getUnifiedStatusStackCount({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveEventHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: event.time,
              gameTime: event.gameTime,
            }),
          getActorStatusStackCount: ({ slot, statusId }) =>
            runtimeStatuses.filter((status) =>
              status.scope === "actor" && status.targetSlot === slot && status.id === statusId,
            ).length,
          consumeEnemyStatusStacks: (hookArgs) =>
            consumeEnemyStatusForAccumulator({
              statusId: hookArgs.statusId,
              maxConsumed: hookArgs.maxConsumed,
              useLevelAsStacks: hookArgs.useLevelAsStacks ?? false,
              enemySlotId: resolveEventHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: event.time,
              gameTime: event.gameTime,
              sourceSlot: member.slot,
              stepId: event.stepId,
              commandAttackType: event.commandAttackType,
              triggerSlots,
            }),
          emitEvent: (hookArgs) => {
            emitEvent({
              type: hookArgs.type as RotationCombatEvent["type"],
              time: event.time,
              gameTime: event.gameTime,
              effectTree: extendMemberEffectTree({
                tree: event.effectTree,
                kind: "character_hook",
                member,
                stepId: event.stepId ?? "",
              }),
              stepId: event.stepId,
              slot: member.slot,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: hookArgs.target === "enemy" ? primaryEventEnemySlotId ?? undefined : undefined,
              affectedEnemySlotIds: hookArgs.target === "enemy" && primaryEventEnemySlotId ? [primaryEventEnemySlotId] : undefined,
              label: hookArgs.label,
              stackDelta: hookArgs.stackDelta,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale,
            });
          },
          applyEffects: (hookArgs) => {
            withEnemyResolutionSlot(getEventEnemySlotId(), () => {
              applyHitEffects({
                effects: hookArgs.effects,
                time: event.time,
                gameTime: event.gameTime,
                stepId: hookArgs.stepId ?? event.stepId ?? "",
                actor: member,
                triggerSlots: [],
                sourceCommandId: event.commandId,
                sourceCommandName: event.commandName,
                effectTree: hookArgs.effectTree ?? extendMemberEffectTree({
                  tree: event.effectTree,
                  kind: "character_hook",
                  member,
                  stepId: hookArgs.stepId ?? event.stepId ?? "",
                }),
                critRigStepId: event.stepId ?? "",
              });
            });
          },
          applyEffectsToEnemySlot: (hookArgs) => {
            withEnemyResolutionSlot(hookArgs.enemySlotId, () => {
              applyHitEffects({
                effects: hookArgs.effects,
                time: event.time,
                gameTime: event.gameTime,
                stepId: hookArgs.stepId ?? event.stepId ?? "",
                actor: member,
                triggerSlots: [],
                sourceCommandId: event.commandId,
                sourceCommandName: event.commandName,
                effectTree: hookArgs.effectTree ?? extendMemberEffectTree({
                  tree: event.effectTree,
                  kind: "character_hook",
                  member,
                  stepId: hookArgs.stepId ?? event.stepId ?? "",
                }),
                critRigStepId: event.stepId ?? "",
              });
            });
          },
        },
      });
      }

      if (options?.includeGearSet !== false) {
        logPassiveListener({
          member,
          listenerKind: "GEAR_SET",
          listenerPresent: member.activeGearSet != null,
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
            for (const teammateBase of party) {
              const teammate = getRuntimeActorBySlot(teammateBase.slot) ?? teammateBase;
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
              effectTree: extendMemberEffectTree({
                tree: event.effectTree,
                kind: "gear_set",
                member,
                stepId: event.stepId ?? "",
                sourceName: member.activeGearSet?.name,
              }),
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
          hasSelfBuff: (buffId: string) => {
            cleanupStateAt(event.time, event.gameTime);
            return getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            );
          },
          removeSelfBuff: (buffId: string) => {
            removeActorBuff({
              slot: member.slot,
              buffId,
            });
          },
          getSelfBuffStackCount: (buffId: string) => {
            cleanupStateAt(event.time, event.gameTime);
            return getActorBuffStackCount({
              slot: member.slot,
              buffId,
            });
          },
          getEnemyVulnerabilityStacks: () => getEnemyPhysicalInfliction(getEventEnemySlotId())?.stacks ?? 0,
          consumeThreshold: ({ key, amount, threshold = 1 }) => {
            const current = listenerCounters.get(key) ?? 0;
            const next = current + amount;
            const triggerCount = Math.floor(next / threshold);
            listenerCounters.set(key, next - triggerCount * threshold);
            return triggerCount;
          },
          applyCommandModifierToStep: (args) => {
            applyCommandModifierToStep(args.stepId, args.effects);
          },
          applyEffects: (args) => {
            withEnemyResolutionSlot(getEventEnemySlotId(), () => {
              applyHitEffects({
                effects: args.effects,
                time: event.time,
                gameTime: event.gameTime,
                stepId: args.stepId ?? event.stepId ?? "",
                actor: member,
                triggerSlots: [],
                effectTree: args.effectTree ?? extendMemberEffectTree({
                  tree: event.effectTree,
                  kind: "gear_set",
                  member,
                  stepId: args.stepId ?? event.stepId ?? "",
                  sourceName: member.activeGearSet?.name,
                }),
              });
            });
          },
        },
      });
      }

      if (options?.includeWeapon !== false) {
        logPassiveListener({
          member,
          listenerKind: "WEAPON",
          listenerPresent: !!member.weaponId,
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
            for (const teammateBase of party) {
              const teammate = getRuntimeActorBySlot(teammateBase.slot) ?? teammateBase;
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
            for (const teammateBase of party) {
              const teammate = getRuntimeActorBySlot(teammateBase.slot) ?? teammateBase;
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
              enemySlotId: primaryEventEnemySlotId ?? undefined,
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
              enemySlotId: primaryEventEnemySlotId ?? undefined,
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
          getSelfBuffStackCount: (buffId: string) => {
            cleanupStateAt(event.time, event.gameTime);
            return getActorBuffStackCount({
              slot: member.slot,
              buffId,
            });
          },
          removeSelfBuff: (buffId: string) => {
            removeActorBuff({
              slot: member.slot,
              buffId,
            });
          },
        },
      });
      }
    }
  };

  const initializeSnapshotForSlot = (args: {
    slot: PartySlot;
    time: number;
    gameTime: number;
    includeGearSet: boolean;
    includeWeapon: boolean;
  }) => {
    if (!args.includeGearSet && !args.includeWeapon) {
      return;
    }
    const event: RotationCombatEvent = {
      type: "SNAPSHOT_INITIALIZED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: "__snapshot_init",
      slot: args.slot,
      sourceSlot: args.slot,
      label: "Snapshot Initialized",
    };
    emitEvent(event);
    dispatchPassiveListeners(
      event,
      [],
      {
        memberSlots: new Set<PartySlot>([args.slot]),
        includeCombatHooks: false,
        includeGearSet: args.includeGearSet,
        includeWeapon: args.includeWeapon,
      },
    );
  };

  const initializeCombat = (args: {
    time: number;
    gameTime: number;
    stepId: string;
    label?: string;
    memberSlots?: Set<PartySlot>;
  }) => {
    const targetSlots = args.memberSlots ?? new Set<PartySlot>(party.map((member) => member.slot));
    const label = args.label ?? "Combat Initialized";
    for (const slot of targetSlots) {
      const event: RotationCombatEvent = {
        type: "COMBAT_INITIALIZED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot,
        sourceSlot: slot,
        label,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, [], {
        memberSlots: new Set<PartySlot>([slot]),
        includeCombatHooks: true,
        includeGearSet: true,
        includeWeapon: true,
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
    const effectiveAttrs = getEffectiveActorAttrs(actor, mods);
    const effectiveAttributeBonus =
      (effectiveAttrs.STR * (actor.attributeScaling.STR ?? 0))
      + (effectiveAttrs.AGI * (actor.attributeScaling.AGI ?? 0))
      + (effectiveAttrs.INT * (actor.attributeScaling.INT ?? 0))
      + (effectiveAttrs.WIL * (actor.attributeScaling.WIL ?? 0));

    const rawAtk = actor.baseAtk + actor.weaponAtk;
    const modAtk = rawAtk * (mods.ATK_PCT ?? 0);
    const flatAtk = mods.FLAT_ATK ?? 0;
    return Math.floor((rawAtk + modAtk + flatAtk) * (1 + effectiveAttributeBonus));
  };

  const getEffectiveActorAttrs = (actor: CharacterCombatSnapshot, mods: ModifierStats) => {
    const character = characterById.get(actor.characterId);
    const mainAttr = character?.mainAttr;
    const secondaryAttr = character?.secondaryAttr;
    const attrKeys: Array<"STR" | "AGI" | "INT" | "WIL"> = ["STR", "AGI", "INT", "WIL"];
    return Object.fromEntries(attrKeys.map((key) => {
      const baseValue = actor.attrs[key];
      const allMul = 1 + (mods.ALL_ATTR_PCT ?? 0);
      const perAttrMul = key === "STR"
        ? 1 + (mods.STR_PCT ?? 0)
        : key === "AGI"
          ? 1 + (mods.AGI_PCT ?? 0)
          : key === "INT"
            ? 1 + (mods.INT_PCT ?? 0)
            : 1 + (mods.WIL_PCT ?? 0);
      const mainSecondaryMul = key === mainAttr
        ? 1 + (mods.MAIN_ATTR_PCT ?? 0)
        : key === secondaryAttr
          ? 1 + (mods.SECONDARY_ATTR_PCT ?? 0)
          : 1;
      const scaled = baseValue * allMul * perAttrMul * mainSecondaryMul;
      return [key, scaled >= 0 ? Math.ceil(scaled) : Math.floor(scaled)];
    })) as Record<"STR" | "AGI" | "INT" | "WIL", number>;
  };

  const getEffectiveEnemyMods = (
    _actor: CharacterCombatSnapshot,
    realTime: number,
    gameTime: number,
    enemySlotId: EnemySlotId = getResolvedEnemySlotId(),
  ) => {
    cleanupStateAt(realTime, gameTime);

    return timedEnemyDebuffs
      .filter((debuff) => resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId)
      .reduce(
      (mods, debuff) => addModifierDelta(mods, { [debuff.stat]: debuff.value }),
      { ...getCurrentEnemyModifierBase() },
    );
  };

  const emittedSingleStepEventKeys = new Set<string>();
  const shouldEmitSingleStepEvent = (args: {
    stepId?: string;
    eventType: RotationCombatEvent["type"];
    label: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    enabled?: boolean;
  }) => {
    if (args.enabled !== true) {
      return true;
    }
    const stepId = args.stepId ?? "__step__";
    const key = `${stepId}:${args.sourceSlot}:${args.eventType}:${args.label}`;
    if (emittedSingleStepEventKeys.has(key)) {
      return false;
    }
    emittedSingleStepEventKeys.add(key);
    return true;
  };

  const hasEnemyVulnerability = (enemySlotId: EnemySlotId = getResolvedEnemySlotId()) =>
    (getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0) > 0;

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
    return 10;
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
    enemySlotId?: EnemySlotId;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
      !(resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId && debuff.buffId === args.buffId));
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
        enemySlotId,
      });
    }
  };

  const applyCorrosionDebuffFromStatus = (status: TimedEnemyStatus, enemySlotId: EnemySlotId = getResolvedEnemySlotId()) => {
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
      enemySlotId,
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
    enemySlotId?: EnemySlotId;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    if (
      isEnemyHitBlocked({
        sourceSlot: args.sourceSlot,
        stepId: args.stepId,
        commandId: args.commandId,
        time: args.time,
        gameTime: args.gameTime,
        enemySlotId,
      })
    ) {
      return;
    }
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }

    const triggeredComboSlots: CharacterCombatSnapshot["slot"][] = [];
    const effectiveActorMods = getEffectiveActorMods(actor, args.time, args.gameTime);
    const effectiveFinalAtk = getEffectiveFinalAtk(actor, effectiveActorMods);
    const linkedStacks = args.linkSourceStepId
      ? (commandLinkedStacksByStepId.get(args.linkSourceStepId) ?? 0)
      : 0;
    const linkMultiplier = getLinkBonusForAttackType(linkedStacks, "REACTION");
    const critRigMode = args.noCrit
      ? undefined
      : getCritRigMode(args.linkSourceStepId ?? args.stepId, CRIT_RIG_HIT_INDEX_REACTION, 0);
    let effectiveEnemyMods = makeBaseModifierStats();
    let noCritDamage = 0;
    let critDamage = 0;
    let averageDamage = 0;
    let damage = 0;
    let contractFlatModifier = 0;
    let appliedStagger = 0;
    let staggeredMultiplier = 1;
    let contractDamageMultiplier = 1;

    withEnemyResolutionSlot(enemySlotId, () => {
      effectiveEnemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime, enemySlotId);
      const damageBreakdown = calculateReactionDamage({
        finalAtk: effectiveFinalAtk,
        damageType: args.damageType,
        baseMultiplier: args.baseMultiplier,
        attackerMods: effectiveActorMods,
        enemyMods: effectiveEnemyMods,
        enemyStats: getCurrentEnemyStats(enemySlotId),
        applierLevel: actor.level,
        reactionCategory: args.reactionCategory ?? "arts",
        noCrit: args.noCrit,
      });
      contractDamageMultiplier = getContractDamageMultiplier({
        slot: actor.slot,
        attackType: "REACTION",
        damageType: args.damageType,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        enemySlotId,
      });
      advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
      const isEnemyStaggered = getCurrentEnemyRuntimeState().isStaggeredForEvents;
      staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
      noCritDamage = damageBreakdown.noCritDamage * contractDamageMultiplier * (1 + linkMultiplier) * staggeredMultiplier;
      critDamage = damageBreakdown.critDamage * contractDamageMultiplier * (1 + linkMultiplier) * staggeredMultiplier;
      averageDamage = damageBreakdown.averageDamage * contractDamageMultiplier * (1 + linkMultiplier) * staggeredMultiplier;
      damage = args.noCrit
        ? noCritDamage
        : critRigMode === "force_crit"
          ? critDamage
          : critRigMode === "force_non_crit"
            ? noCritDamage
            : averageDamage;
      const noCritClamp = getEnemyDamageClampResult(noCritDamage, enemySlotId, args.time);
      const critClamp = getEnemyDamageClampResult(critDamage, enemySlotId, args.time);
      const averageClamp = getEnemyDamageClampResult(averageDamage, enemySlotId, args.time);
      const damageClamp = getEnemyDamageClampResult(damage, enemySlotId, args.time);
      noCritDamage = noCritClamp.allowedDamage;
      critDamage = critClamp.allowedDamage;
      averageDamage = averageClamp.allowedDamage;
      damage = damageClamp.allowedDamage;
      contractFlatModifier = damageClamp.contractFlatModifier;
      appliedStagger = applyEnemyStaggerFromHit({
        rawStagger: args.stagger ?? 0,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        sourceSlot: args.sourceSlot,
        triggerSlots: triggeredComboSlots,
        enemySlotId,
      });
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
      averageDamage,
      damage,
      stagger: appliedStagger,
      spGenerated: 0,
      spReturned: 0,
      energyReturn: 0,
      requiresControlledOperator: false,
      triggeredComboSlots,
      critRigMode,
      riggedCrit: critRigMode === "force_crit",
      targetEnemySlotId: enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      calculationContext: {
        finalAtk: effectiveFinalAtk,
        attackType: "REACTION",
        attackerMods: { ...effectiveActorMods },
        enemyMods: { ...effectiveEnemyMods },
        enemyDef: getCurrentEnemyStats(enemySlotId).def,
        hitTimes: 1,
        linkMultiplier,
        reactionBaseMultiplier: args.baseMultiplier,
        applierLevel: actor.level,
        isPhysicalReaction: (args.reactionCategory ?? "arts") === "physical",
        contractDamageMultiplier,
        contractFlatModifier,
        staggeredMultiplier,
        finisherBonusMultiplier: 1,
        totalEnemyMultiplier: staggeredMultiplier,
      },
    });

    const damageApplication = applyEnemyDamage(damage, enemySlotId, {
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      sourceSlot: actor.slot,
      commandId: args.commandId,
      commandName: args.commandName,
      hitName: args.hitName,
      damageType: args.damageType,
      commandAttackType: "REACTION",
    });
    totalDamage += damageApplication.appliedDamage;
    damageBySlot.set(actor.slot, (damageBySlot.get(actor.slot) ?? 0) + damageApplication.appliedDamage);
    if (critRigMode === "force_crit") {
      riggedCritCount += 1;
    }

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

  const doesHitConsumeDamageIntoReaction = (hit: ResolvedCommandHitAtLevel) =>
    hit.effects.some((effect) => effect.type === "APPLY_REACTION" && effect.consumeSourceHitDamage === true);

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
    critRigStepId?: string;
    effectTree?: CombatEffectTree;
    applySourceCommandModifiers?: boolean;
    triggerSlots?: CharacterCombatSnapshot["slot"][];
    targetEnemySlotIdsOverride?: EnemySlotId[];
    rigHitIndexOverride?: number;
    rigRepeatIndex?: number;
    executeCritRigId?: string;
  }) => {
    const actor = partyBySlot.get(args.sourceSlot);
    if (!actor) {
      return;
    }

    const triggeredComboSlots = args.triggerSlots ?? [];
    const affectedEnemySlotIds = args.hit.damageType === "Healing"
      ? []
      : (args.targetEnemySlotIdsOverride ?? resolveAffectedEnemySlotIds(args.hit.targets));
    const effectiveEnemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime);
    const sourceCommand = actor.commands.find((command) => command.id === args.commandId);
    const baseActorMods = getEffectiveActorMods(actor, args.time, args.gameTime);
    const injectedCommandModifiers = args.stepId
      ? (commandModifierByStepId.get(args.stepId) ?? {})
      : {};
    const effectiveActorMods = args.applySourceCommandModifiers === false
      ? baseActorMods
      : addModifierDelta(
          addModifierDelta(baseActorMods, sourceCommand?.commandModifiers ?? {}),
          injectedCommandModifiers,
        );
    const effectiveFinalAtk = getEffectiveFinalAtk(actor, effectiveActorMods);
    const linkedStacks = args.linkSourceStepId
      ? (commandLinkedStacksByStepId.get(args.linkSourceStepId) ?? 0)
      : 0;
    const linkMultiplier = getLinkBonusForAttackType(linkedStacks, args.hit.attackType);
    const isFinisherHit = sourceCommand?.attackType === "BASIC_ATTACK" && sourceCommand?.basicAttackVariant === "finisher";
    const critRigStepId = args.critRigStepId ?? args.effectTree?.root.stepId ?? args.stepId;
    const critRigMode = args.hit.noCrit
      ? undefined
      : getCritRigMode(
          critRigStepId,
          args.rigHitIndexOverride ?? args.hitIndex,
          args.rigRepeatIndex ?? 0,
          args.executeCritRigId,
        );
    if (args.hit.damageType === "Healing") {
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
        averageDamage: 0,
        damage: 0,
        stagger: 0,
        spGenerated: args.hit.spGenerated,
        spReturned: args.hit.spReturned,
        energyReturn: args.hit.energyReturn,
        ignoreUltimateGainEfficiency: args.hit.ignoreUltimateGainEfficiency,
        requiresControlledOperator: args.hit.requiresControlledOperator,
        triggeredComboSlots,
        critRigMode,
        riggedCrit: false,
        calculationContext: {
          finalAtk: effectiveFinalAtk,
          attackType: args.hit.attackType,
          basicAttackVariant: sourceCommand?.basicAttackVariant,
          attackerMods: { ...effectiveActorMods },
          enemyMods: makeBaseModifierStats(),
          enemyDef: 0,
          hitTimes: 1,
          linkMultiplier,
          staggeredMultiplier: 1,
          finisherBonusMultiplier: 1,
          totalEnemyMultiplier: 1,
        },
      });
    } else {
      for (const [affectedEnemyIndex, enemySlotId] of affectedEnemySlotIds.entries()) {
        withEnemyResolutionSlot(enemySlotId, () => {
          if (isEnemyHitBlocked({
            sourceSlot: args.sourceSlot,
            stepId: args.stepId,
            commandId: args.commandId,
            time: args.time,
            gameTime: args.gameTime,
          })) {
            return;
          }
          const enemyMods = getEffectiveEnemyMods(actor, args.time, args.gameTime);
          const damageBreakdown = calculateResolvedHitDamage({
            finalAtk: effectiveFinalAtk,
            attackType: args.hit.attackType,
            basicAttackVariant: sourceCommand?.basicAttackVariant,
            damageType: args.hit.damageType,
            hit: args.hit,
            attackerMods: effectiveActorMods,
            enemyMods,
            enemyStats: getCurrentEnemyStats(),
            noCrit: args.hit.noCrit,
          });
          advanceEnemyStaggerTo({ time: args.time, gameTime: args.gameTime });
          const isEnemyStaggered = getCurrentEnemyRuntimeState().isStaggeredForEvents;
          const finisherAvailable = hasEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
          const finisherBonusMultiplier =
            isEnemyStaggered && isFinisherHit && finisherAvailable ? getCurrentEnemyFinisherMultiplier() : 1;
          const staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
          const totalEnemyMultiplier = staggeredMultiplier * finisherBonusMultiplier;
          const contractDamageMultiplier = getContractDamageMultiplier({
            slot: actor.slot,
            attackType: args.hit.attackType,
            damageType: args.hit.damageType,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            enemySlotId,
          });
          const noCritDamage = damageBreakdown.noCritDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          const critDamage = damageBreakdown.critDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          const averageDamage = damageBreakdown.averageDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          let damage = critRigMode === "force_crit"
            ? critDamage
            : critRigMode === "force_non_crit"
              ? noCritDamage
              : averageDamage;
          const noCritClamp = getEnemyDamageClampResult(noCritDamage, enemySlotId, args.time);
          const critClamp = getEnemyDamageClampResult(critDamage, enemySlotId, args.time);
          const averageClamp = getEnemyDamageClampResult(averageDamage, enemySlotId, args.time);
          const damageClamp = getEnemyDamageClampResult(damage, enemySlotId, args.time);
          const clampedNoCritDamage = noCritClamp.allowedDamage;
          const clampedCritDamage = critClamp.allowedDamage;
          const clampedAverageDamage = averageClamp.allowedDamage;
          damage = damageClamp.allowedDamage;
          const contractFlatModifier = damageClamp.contractFlatModifier;
          const finisherBonusSp =
            isEnemyStaggered && isFinisherHit && finisherAvailable ? getCurrentEnemyFinisherSpGain() : 0;
          const appliedStagger = applyEnemyStaggerFromHit({
            rawStagger: args.hit.stagger,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            sourceSlot: args.sourceSlot,
            triggerSlots: triggeredComboSlots,
          });
          if (isEnemyStaggered && isFinisherHit && finisherAvailable) {
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
            targetEnemySlotId: enemySlotId,
            affectedEnemySlotIds,
            damageType: args.hit.damageType,
            multiplier: args.hit.multiplier,
            noCritDamage: clampedNoCritDamage,
            critDamage: clampedCritDamage,
            averageDamage: clampedAverageDamage,
            damage,
            stagger: appliedStagger,
            spGenerated: args.hit.spGenerated + finisherBonusSp,
            spReturned: args.hit.spReturned,
            energyReturn: affectedEnemyIndex === 0 ? args.hit.energyReturn : 0,
            ignoreUltimateGainEfficiency: args.hit.ignoreUltimateGainEfficiency,
            requiresControlledOperator: args.hit.requiresControlledOperator,
            triggeredComboSlots,
            critRigMode,
            riggedCrit: critRigMode === "force_crit",
            calculationContext: {
              finalAtk: effectiveFinalAtk,
              attackType: args.hit.attackType,
              basicAttackVariant: sourceCommand?.basicAttackVariant,
              attackerMods: { ...effectiveActorMods },
              enemyMods: { ...enemyMods },
              enemyDef: getCurrentEnemyStats().def,
              hitTimes: 1,
              linkMultiplier,
              contractDamageMultiplier,
              contractFlatModifier,
              staggeredMultiplier,
              finisherBonusMultiplier,
              totalEnemyMultiplier,
            },
          });
          const damageApplication = applyEnemyDamage(damage, enemySlotId, {
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            sourceSlot: actor.slot,
            commandId: args.commandId,
            commandName: args.commandName,
            hitName: args.hitName,
            damageType: args.hit.damageType,
            commandAttackType: args.hit.attackType,
          });
          totalDamage += damageApplication.appliedDamage;
          damageBySlot.set(actor.slot, (damageBySlot.get(actor.slot) ?? 0) + damageApplication.appliedDamage);
          if (critRigMode === "force_crit") {
            riggedCritCount += 1;
          }
        });
      }
    }

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
      averageDamage: 0,
      damage: 0,
      stagger: 0,
      spGenerated: args.hit.spGenerated,
      spReturned: args.hit.spReturned,
      energyReturn: args.hit.energyReturn,
      ignoreUltimateGainEfficiency: args.hit.ignoreUltimateGainEfficiency,
      requiresControlledOperator: args.hit.requiresControlledOperator,
      triggeredComboSlots: args.triggerSlots ?? [],
      calculationContext: {
        finalAtk: 0,
        attackType: args.hit.attackType,
        basicAttackVariant: undefined,
        attackerMods: makeBaseModifierStats(),
        enemyMods: makeBaseModifierStats(),
        enemyDef: getCurrentEnemyStats().def,
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
    critRigStepId?: string;
    effectTree?: CombatEffectTree;
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
    const sourceCommand = args.actor.commands.find((entry) => entry.id === sourceCommandId);
    const repeatTimes = Math.max(1, Math.floor(args.effect.times ?? 1));
    const repeatIntervalSeconds = Math.max(0, args.effect.repeatIntervalFrames ?? 0) / 60;
    const executeDelaySeconds = Math.max(0, args.effect.executeDelayFrames ?? 0) / 60;
    const executeDelayTimeScale = args.effect.executeDelayTimeScale ?? "real";
    const registerOffsetSeconds = Math.max(0, args.effect.registerOffsetFrames ?? 0) / 60;
    const repeatRegisterOffsetWithInterval = args.effect.repeatRegisterOffsetWithInterval ?? true;
    const registerAtInitialTime = args.effect.registerAtInitialTime ?? false;
    const inheritSourceBonuses = args.effect.inheritSourceBonuses ?? true;
    const critRigStepId =
      args.critRigStepId
      ?? args.effectTree?.root.stepId
      ?? args.linkSourceStepId
      ?? args.stepId;
    const executeEffectTree = withEffectTreeTarget(args.effectTree, { type: "enemy" });

    for (let repeatIndex = 0; repeatIndex < repeatTimes; repeatIndex += 1) {
      const executionOffsetSeconds = executeDelaySeconds + repeatIndex * repeatIntervalSeconds;
      const executionGameTime = executeDelayTimeScale === "game"
        ? args.gameTime + executionOffsetSeconds
        : timeContext.toGameTime(timeContext.getShiftedEndTime(args.time, executionOffsetSeconds, args.stepId));
      const executionTime = executeDelayTimeScale === "game"
        ? toRealTimeFromExtensions(executionGameTime)
        : timeContext.getShiftedEndTime(args.time, executionOffsetSeconds, args.stepId);
      if (isInterruptedAtOrAfter(args.stepId, executionTime)) {
        continue;
      }
      const registerOffsetWithRepeat = registerAtInitialTime
        ? registerOffsetSeconds
        : registerOffsetSeconds + (repeatRegisterOffsetWithInterval ? executionOffsetSeconds : 0);
      const registerTime = timeContext.getShiftedEndTime(args.time, registerOffsetWithRepeat, args.stepId);
      const registerGameTime = timeContext.toGameTime(registerTime);

      const shouldDeferExecution = executionTime > args.time + 0.0001;
      const resolvedHitName = repeatTimes > 1
        ? `${args.effect.hitName ?? hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
        : (args.effect.hitName ?? hit.name);
      const executeCritRigId = resolveExecuteCritRigId(
        sourceCommand?.executeHitCritRigOptions,
        {
          hitRefId: args.effect.hitRefId,
          hitName: args.effect.hitName ?? hit.name,
        },
      );
      const affectedEnemySlotIds = hit.damageType === "Healing"
        ? []
        : resolveAffectedEnemySlotIds(hit.targets);
      const eligibleEnemySlotIds = hit.executeCondition && hit.damageType !== "Healing"
        ? filterEnemySlotIdsByExecuteCondition({
            executeCondition: hit.executeCondition,
            actor: args.actor,
            enemySlotIds: affectedEnemySlotIds,
            realTime: executionTime,
            gameTime: executionGameTime,
            stepId: args.stepId,
            isCommandHit: false,
          })
        : affectedEnemySlotIds;
      if (hit.executeCondition && hit.damageType === "Healing") {
        const passesHealingExecuteCondition = filterEnemySlotIdsByExecuteCondition({
          executeCondition: hit.executeCondition,
          actor: args.actor,
          enemySlotIds: [currentTargetedEnemySlotId],
          realTime: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
          isCommandHit: false,
        }).length > 0;
        if (!passesHealingExecuteCondition) {
          continue;
        }
      }
      if (hit.executeCondition && hit.damageType !== "Healing" && eligibleEnemySlotIds.length <= 0) {
        continue;
      }
      if (shouldDeferExecution) {
        pendingExecuteHits.push({
          actor: args.actor,
          hit,
          hitIndex,
          repeatIndex,
          hitName: resolvedHitName,
          executeCritRigId,
          critRigStepId,
          sourceCommandId,
          sourceCommandName: args.effect.commandName ?? sourceCommandName,
          sourceCommandAttackType: hit.attackType,
          stepId: args.stepId,
          executionTime,
          executionGameTime,
          registerTime,
          registerGameTime,
          triggerSlots: [...args.triggerSlots],
          linkSourceStepId: args.linkSourceStepId,
          applySourceCommandModifiers: inheritSourceBonuses,
          effectTree: executeEffectTree,
        });
        continue;
      }

      const unblockedEnemySlotIds: EnemySlotId[] = [];
      if (hit.damageType === "Healing") {
        applyHitEffects({
          effects: hit.effects,
          time: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
          actor: args.actor,
          triggerSlots: args.triggerSlots,
          sourceCommandId,
          sourceCommandName,
          sourceCommandAttackType: hit.attackType,
          linkSourceStepId: args.linkSourceStepId,
          critRigStepId,
          effectTree: executeEffectTree,
          sourceHit: hit,
          blockEnemyTargetEffects: false,
        });
      } else {
        for (const enemySlotId of eligibleEnemySlotIds) {
          const blockedEnemyHit = withEnemyResolutionSlot(enemySlotId, () =>
            !hit.ignoreEnemyInvulnerability
            && isEnemyHitBlocked({
              sourceSlot: args.actor.slot,
              stepId: args.stepId,
              commandId: sourceCommandId,
              time: executionTime,
              gameTime: executionGameTime,
            }));
          withEnemyResolutionSlot(enemySlotId, () => {
            applyHitEffects({
              effects: hit.effects,
              time: executionTime,
              gameTime: executionGameTime,
              stepId: args.stepId,
              actor: args.actor,
              triggerSlots: args.triggerSlots,
              sourceCommandId,
              sourceCommandName,
              sourceCommandAttackType: hit.attackType,
              linkSourceStepId: args.linkSourceStepId,
              critRigStepId,
              effectTree: executeEffectTree,
              sourceHit: hit,
              blockEnemyTargetEffects: blockedEnemyHit,
            });
          });
          if (blockedEnemyHit) {
            withEnemyResolutionSlot(enemySlotId, () => {
              applyHitEffects({
                effects: hit.postEffects ?? [],
                time: executionTime,
                gameTime: executionGameTime,
                stepId: args.stepId,
                actor: args.actor,
                triggerSlots: args.triggerSlots,
                sourceCommandId,
                sourceCommandName,
                sourceCommandAttackType: hit.attackType,
                linkSourceStepId: args.linkSourceStepId,
                critRigStepId,
                effectTree: executeEffectTree,
                blockEnemyTargetEffects: true,
              });
            });
            continue;
          }
          unblockedEnemySlotIds.push(enemySlotId);
        }
        if (unblockedEnemySlotIds.length <= 0) {
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
      }

      const consumesHitDamageIntoReaction = doesHitConsumeDamageIntoReaction(hit);
      if (!consumesHitDamageIntoReaction) {
        pushResolvedTimelineHit({
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          commandId: sourceCommandId,
          commandName: args.effect.commandName ?? sourceCommandName,
          hitIndex,
          hit,
          hitName: resolvedHitName,
          time: executionTime,
          gameTime: executionGameTime,
          registerTime,
          registerGameTime,
          linkSourceStepId: inheritSourceBonuses ? args.linkSourceStepId : undefined,
          critRigStepId,
          applySourceCommandModifiers: inheritSourceBonuses,
          effectTree: executeEffectTree,
          triggerSlots: args.triggerSlots,
          targetEnemySlotIdsOverride: hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds,
          rigHitIndexOverride: CRIT_RIG_HIT_INDEX_EXECUTE,
          rigRepeatIndex: repeatIndex,
          executeCritRigId,
        });
      }

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

      if (hit.damageType === "Healing") {
        applyHitEffects({
          effects: hit.postEffects ?? [],
          time: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
          actor: args.actor,
          triggerSlots: args.triggerSlots,
          sourceCommandId,
          sourceCommandName,
          sourceCommandAttackType: hit.attackType,
          linkSourceStepId: args.linkSourceStepId,
          critRigStepId,
          effectTree: executeEffectTree,
          blockEnemyTargetEffects: false,
        });
      } else {
        for (const enemySlotId of unblockedEnemySlotIds) {
          withEnemyResolutionSlot(enemySlotId, () => {
            applyHitEffects({
              effects: hit.postEffects ?? [],
              time: executionTime,
              gameTime: executionGameTime,
              stepId: args.stepId,
              actor: args.actor,
              triggerSlots: args.triggerSlots,
              sourceCommandId,
              sourceCommandName,
              sourceCommandAttackType: hit.attackType,
              linkSourceStepId: args.linkSourceStepId,
              critRigStepId,
              effectTree: executeEffectTree,
              blockEnemyTargetEffects: false,
            });
          });
        }
      }

      const hitDealsDamage = !consumesHitDamageIntoReaction && (hit.multiplier > 0 || hit.flatAmount > 0);
      if (
        hitDealsDamage
        && (
        hit.attackType === "BATTLE_SKILL"
        || hit.attackType === "COMBO_SKILL"
        || hit.attackType === "ULTIMATE"
        )
      ) {
        const hitEvent: RotationCombatEvent = {
          type:
            hit.attackType === "BATTLE_SKILL"
              ? "BATTLE_SKILL_HIT"
              : hit.attackType === "COMBO_SKILL"
                ? "COMBO_SKILL_HIT"
                : "ULTIMATE_HIT",
          time: executionTime,
          gameTime: executionGameTime,
          stepId: args.stepId,
          commandId: sourceCommandId,
          commandName: args.effect.commandName ?? sourceCommandName,
          hitName:
            repeatTimes > 1
              ? `${args.effect.hitName ?? hit.name ?? `Hit ${hitIndex + 1}`} #${repeatIndex + 1}`
              : (args.effect.hitName ?? hit.name),
          dealsDamage: hitDealsDamage,
          enemySlotId: hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds[0],
          affectedEnemySlotIds: hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: `${args.actor.characterName} ${
            hit.attackType === "BATTLE_SKILL"
              ? "Battle"
              : hit.attackType === "COMBO_SKILL"
                ? "Combo"
                : "Ultimate"
          } Hit`,
          commandAttackType: hit.attackType,
          damageType: hit.damageType,
          effectTree: executeEffectTree,
        };
        emitEvent(hitEvent);
        dispatchPassiveListeners(hitEvent, args.triggerSlots);
      }

      runResolvedHitHooksForSource({
        time: executionTime,
        gameTime: executionGameTime,
        stepId: args.stepId,
        effectTree: executeEffectTree,
        triggerSlots: args.triggerSlots,
        isControlledOperatorHit: args.actor.slot === controlledOperatorSlot,
        affectedEnemySlotIds: hit.damageType === "Healing" ? [] : unblockedEnemySlotIds,
        source: {
          slot: args.actor.slot,
          characterId: args.actor.characterId,
          characterName: args.actor.characterName,
          commandId: sourceCommandId,
          commandName: args.effect.commandName ?? sourceCommandName,
          hitIndex,
          hitName: resolvedHitName ?? hit.name,
        },
        flags: {
          isFinalStrikeOfBasicSequence: false,
          isFinisherHit: false,
          dealsDamage: hitDealsDamage,
        },
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

      const affectedEnemySlotIds = next.hit.damageType === "Healing"
        ? []
        : resolveAffectedEnemySlotIds(next.hit.targets);
      const eligibleEnemySlotIds = next.hit.executeCondition && next.hit.damageType !== "Healing"
        ? filterEnemySlotIdsByExecuteCondition({
            executeCondition: next.hit.executeCondition,
            actor: next.actor,
            enemySlotIds: affectedEnemySlotIds,
            realTime: next.executionTime,
            gameTime: next.executionGameTime,
            stepId: next.stepId,
            isCommandHit: false,
          })
        : affectedEnemySlotIds;
      if (next.hit.executeCondition && next.hit.damageType === "Healing") {
        const passesHealingExecuteCondition = filterEnemySlotIdsByExecuteCondition({
          executeCondition: next.hit.executeCondition,
          actor: next.actor,
          enemySlotIds: [currentTargetedEnemySlotId],
          realTime: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
          isCommandHit: false,
        }).length > 0;
        if (!passesHealingExecuteCondition) {
          recordActorState(next.actor.slot, next.executionTime, next.executionGameTime);
          recordEnemyState(next.executionTime, next.executionGameTime);
          continue;
        }
      }
      if (next.hit.executeCondition && next.hit.damageType !== "Healing" && eligibleEnemySlotIds.length <= 0) {
        recordActorState(next.actor.slot, next.executionTime, next.executionGameTime);
        recordEnemyState(next.executionTime, next.executionGameTime);
        continue;
      }
      const unblockedEnemySlotIds: EnemySlotId[] = [];
      if (next.hit.damageType === "Healing") {
        applyHitEffects({
          effects: next.hit.effects,
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
          actor: next.actor,
          triggerSlots: next.triggerSlots,
          sourceCommandId: next.sourceCommandId,
          sourceCommandName: next.sourceCommandName,
          sourceCommandAttackType: next.sourceCommandAttackType,
          linkSourceStepId: next.linkSourceStepId,
          effectTree: next.effectTree,
          sourceHit: next.hit,
          blockEnemyTargetEffects: false,
        });
      } else {
        for (const enemySlotId of eligibleEnemySlotIds) {
          const blockedEnemyHit = withEnemyResolutionSlot(enemySlotId, () =>
            !next.hit.ignoreEnemyInvulnerability
            && isEnemyHitBlocked({
              sourceSlot: next.actor.slot,
              stepId: next.stepId,
              commandId: next.sourceCommandId,
              time: next.executionTime,
              gameTime: next.executionGameTime,
            }));
          withEnemyResolutionSlot(enemySlotId, () => {
            applyHitEffects({
              effects: next.hit.effects,
              time: next.executionTime,
              gameTime: next.executionGameTime,
              stepId: next.stepId,
              actor: next.actor,
              triggerSlots: next.triggerSlots,
              sourceCommandId: next.sourceCommandId,
              sourceCommandName: next.sourceCommandName,
              sourceCommandAttackType: next.sourceCommandAttackType,
              linkSourceStepId: next.linkSourceStepId,
              effectTree: next.effectTree,
              sourceHit: next.hit,
              blockEnemyTargetEffects: blockedEnemyHit,
            });
          });
          if (blockedEnemyHit) {
            withEnemyResolutionSlot(enemySlotId, () => {
              applyHitEffects({
                effects: next.hit.postEffects ?? [],
                time: next.executionTime,
                gameTime: next.executionGameTime,
                stepId: next.stepId,
                actor: next.actor,
                triggerSlots: next.triggerSlots,
                sourceCommandId: next.sourceCommandId,
                sourceCommandName: next.sourceCommandName,
                sourceCommandAttackType: next.sourceCommandAttackType,
                linkSourceStepId: next.linkSourceStepId,
                effectTree: next.effectTree,
                blockEnemyTargetEffects: true,
              });
            });
            continue;
          }
          unblockedEnemySlotIds.push(enemySlotId);
        }
        if (unblockedEnemySlotIds.length <= 0) {
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
      }

      const consumesExecutedHitDamageIntoReaction = doesHitConsumeDamageIntoReaction(next.hit);
      if (!consumesExecutedHitDamageIntoReaction) {
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
          critRigStepId: next.critRigStepId,
          effectTree: next.effectTree,
          applySourceCommandModifiers: next.applySourceCommandModifiers,
          triggerSlots: next.triggerSlots,
          targetEnemySlotIdsOverride: next.hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds,
          rigHitIndexOverride: CRIT_RIG_HIT_INDEX_EXECUTE,
          rigRepeatIndex: next.repeatIndex,
          executeCritRigId: next.executeCritRigId,
        });
      }
      simulationDebug?.onResolvedHit?.({
        time: next.executionTime,
        gameTime: next.executionGameTime,
        occurrence: {
          kind: "hit",
          time: next.executionTime,
          gameTime: next.executionGameTime,
          actor: next.actor,
          command: next.actor.commands.find((entry) => entry.id === next.sourceCommandId)
            ?? ({
              id: next.sourceCommandId,
              name: next.sourceCommandName,
              attackType: next.sourceCommandAttackType ?? next.hit.attackType,
              hits: [next.hit],
            } as ResolvedCommandAtLevel),
          action: {
            stepId: next.stepId,
            slot: next.actor.slot,
            characterName: next.actor.characterName,
            commandId: next.sourceCommandId,
            commandName: next.sourceCommandName,
            startTime: next.executionGameTime,
            endTime: next.executionGameTime,
            realStartTime: next.executionTime,
            realEndTime: next.executionTime,
            timeFreezeSeconds: 0,
            cutscene: false,
          },
          hit: next.hit,
          hitIndex: next.hitIndex,
          repeatIndex: 0,
          isFinalStrikeOfBasicSequence: false,
          isFinisherHit: false,
        },
        effectiveActorMods: getEffectiveActorMods(next.actor, next.executionTime, next.executionGameTime),
        effectiveEnemyMods: withEnemyResolutionSlot(
          next.hit.damageType === "Healing"
            ? currentTargetedEnemySlotId
            : (unblockedEnemySlotIds[0] ?? currentTargetedEnemySlotId),
          () => getEffectiveEnemyMods(next.actor, next.executionTime, next.executionGameTime),
        ),
        linkMultiplier: 0,
        actorBuffs: getActorBuffs().filter((buff) => buff.slot === next.actor.slot),
        enemyDebuffs: [...timedEnemyDebuffs],
        enemyStatuses: withEnemyResolutionSlot(
          next.hit.damageType === "Healing"
            ? currentTargetedEnemySlotId
            : (unblockedEnemySlotIds[0] ?? currentTargetedEnemySlotId),
          () => getEnemyStatuses(),
        ),
        teamLinkStacks: runtimeStatuses
          .filter((status) => status.scope === "team" && status.kind === "link_status" && status.id === "team_link")
          .map((status) => ({
            expiresAt: status.expiresAt,
            timeScale: status.timeScale,
          })),
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

      if (next.hit.damageType === "Healing") {
        applyHitEffects({
          effects: next.hit.postEffects ?? [],
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
          actor: next.actor,
          triggerSlots: next.triggerSlots,
          sourceCommandId: next.sourceCommandId,
          sourceCommandName: next.sourceCommandName,
          sourceCommandAttackType: next.sourceCommandAttackType,
          linkSourceStepId: next.linkSourceStepId,
          effectTree: next.effectTree,
          blockEnemyTargetEffects: false,
        });
      } else {
        for (const enemySlotId of unblockedEnemySlotIds) {
          withEnemyResolutionSlot(enemySlotId, () => {
            applyHitEffects({
              effects: next.hit.postEffects ?? [],
              time: next.executionTime,
              gameTime: next.executionGameTime,
              stepId: next.stepId,
              actor: next.actor,
              triggerSlots: next.triggerSlots,
              sourceCommandId: next.sourceCommandId,
              sourceCommandName: next.sourceCommandName,
              sourceCommandAttackType: next.sourceCommandAttackType,
              linkSourceStepId: next.linkSourceStepId,
              effectTree: next.effectTree,
              blockEnemyTargetEffects: false,
            });
          });
        }
      }
      const executedHitDealsDamage = !consumesExecutedHitDamageIntoReaction && (next.hit.multiplier > 0 || next.hit.flatAmount > 0);
      if (
        executedHitDealsDamage
        && (
        next.hit.attackType === "BATTLE_SKILL"
        || next.hit.attackType === "COMBO_SKILL"
        || next.hit.attackType === "ULTIMATE"
        )
      ) {
        const hitEvent: RotationCombatEvent = {
          type:
            next.hit.attackType === "BATTLE_SKILL"
              ? "BATTLE_SKILL_HIT"
              : next.hit.attackType === "COMBO_SKILL"
                ? "COMBO_SKILL_HIT"
                : "ULTIMATE_HIT",
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: next.stepId,
          commandId: next.sourceCommandId,
          commandName: next.sourceCommandName,
          hitName: next.hitName,
          dealsDamage: executedHitDealsDamage,
          enemySlotId: next.hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds[0],
          affectedEnemySlotIds: next.hit.damageType === "Healing" ? undefined : unblockedEnemySlotIds,
          slot: next.actor.slot,
          sourceSlot: next.actor.slot,
          label: `${next.actor.characterName} ${
            next.hit.attackType === "BATTLE_SKILL"
              ? "Battle"
              : next.hit.attackType === "COMBO_SKILL"
                ? "Combo"
                : "Ultimate"
          } Hit`,
          commandAttackType: next.hit.attackType,
          damageType: next.hit.damageType,
          effectTree: next.effectTree,
        };
        emitEvent(hitEvent);
        dispatchPassiveListeners(hitEvent, next.triggerSlots);
      }

      runResolvedHitHooksForSource({
        time: next.executionTime,
        gameTime: next.executionGameTime,
        stepId: next.stepId,
        effectTree: next.effectTree,
        triggerSlots: next.triggerSlots,
        isControlledOperatorHit: next.actor.slot === controlledOperatorSlot,
        affectedEnemySlotIds: next.hit.damageType === "Healing" ? [] : unblockedEnemySlotIds,
        source: {
          slot: next.actor.slot,
          characterId: next.actor.characterId,
          characterName: next.actor.characterName,
          commandId: next.sourceCommandId,
          commandName: next.sourceCommandName,
          hitIndex: next.hitIndex,
          hitName: next.hitName ?? next.hit.name,
        },
        flags: {
          isFinalStrikeOfBasicSequence: false,
          isFinisherHit: false,
          dealsDamage: executedHitDealsDamage,
        },
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
    enemySlotId?: EnemySlotId;
    triggerSlots?: CharacterCombatSnapshot["slot"][];
    sourceCommandId?: string;
    sourceCommandName?: string;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    const sourceCommand = args.sourceCommandId
      ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
      : undefined;
    const applyEvent: RotationCombatEvent = {
      type: "ARTS_BURST_APPLIED",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      commandId: args.sourceCommandId,
      commandName: args.sourceCommandName,
      slot: args.sourceSlot,
      sourceSlot: args.sourceSlot,
      target: "enemy",
      enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      label: `${args.element} Arts Burst Applied`,
      consumedElement: args.element,
      commandAttackType: sourceCommand?.attackType,
    };
    emitEvent(applyEvent);
    dispatchPassiveListeners(applyEvent, args.triggerSlots);

    pendingArtsBursts.push({
      executeGameTime: args.gameTime + 1,
      enemySlotId,
      sourceSlot: args.sourceSlot,
      element: args.element,
      stepId: args.stepId,
      sourceCommandId: args.sourceCommandId,
      sourceCommandName: args.sourceCommandName,
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

      const sourceCommand = next.sourceCommandId
        ? partyBySlot.get(next.sourceSlot)?.commands.find((command) => command.id === next.sourceCommandId)
        : undefined;

      withEnemyResolutionSlot(getResolvedEnemySlotId(next.enemySlotId), () => {
        pushReactionDamageHit({
          sourceSlot: next.sourceSlot,
          reactionName: `${next.element} Burst`,
          hitName: "Arts Burst",
          damageType: next.element,
          baseMultiplier: 1.6,
          time: executeRealTime,
          gameTime: next.executeGameTime,
          stepId: next.stepId,
          commandId: next.sourceCommandId ?? "__arts_burst",
          enemySlotId: next.enemySlotId,
        });
      });
      const event: RotationCombatEvent = {
        type: "ARTS_BURST_HIT",
        time: executeRealTime,
        gameTime: next.executeGameTime,
        stepId: next.stepId,
        commandId: next.sourceCommandId,
        commandName: next.sourceCommandName,
        slot: next.sourceSlot,
        sourceSlot: next.sourceSlot,
        target: "enemy",
        enemySlotId: getResolvedEnemySlotId(next.enemySlotId),
        affectedEnemySlotIds: [getResolvedEnemySlotId(next.enemySlotId)],
        label: `${next.element} Arts Burst`,
        consumedElement: next.element,
        commandAttackType: sourceCommand?.attackType,
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
    customBaseDebuffAmount?: number;
    customBaseTickMultiplier?: number;
    time: number;
    gameTime: number;
    stepId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandId?: string;
    sourceCommandName?: string;
    enemySlotId?: EnemySlotId;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    const reactionId = args.reaction.toLowerCase();
    const defaultDuration = getReactionDefaultDurationSeconds(args.reaction, args.level);
    const requestedDuration = args.durationSeconds ?? defaultDuration;

    if (args.reaction === "Corrosion") {
      const previousCorrosion = getEnemyStatuses(enemySlotId).find((status) => status.id === "corrosion");
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

      let nextEnemyStatuses = getEnemyStatuses(enemySlotId).filter((status) => status.id !== "corrosion");
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
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "apply_arts_reaction",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "replaced",
      }, enemySlotId);
      applyCorrosionDebuffFromStatus(corrosionStatus, enemySlotId);
    } else {
      let nextEnemyStatuses = getEnemyStatuses(enemySlotId).filter((status) => status.id !== reactionId);
      const status: TimedEnemyStatus = {
        id: reactionId,
        label: `${args.reaction} Lv${args.level}`,
        expiresAt: args.gameTime + requestedDuration,
        timeScale: "game",
        applierSlot: args.sourceSlot,
        level: args.level,
        nextTickAtGameTime: args.reaction === "Combustion" ? args.gameTime + 1 : undefined,
        baseTickMultiplier: args.reaction === "Combustion"
          ? (args.customBaseTickMultiplier ?? (0.12 + 0.12 * args.level))
          : undefined,
      };

      if (args.reaction === "Electrification") {
        const baseAmount = args.customBaseDebuffAmount ?? getReactionBaseAmount(args.level);
        status.finalAmount = getReactionScaledAmount(args.sourceSlot, baseAmount, args.time, args.gameTime)
          * (args.debuffScaleMultiplier ?? 1);
      }

      nextEnemyStatuses.push(status);
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "apply_arts_reaction",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "replaced",
      }, enemySlotId);

      if (args.reaction === "Electrification") {
        setReactionDebuff({
          buffId: "electrification",
          label: status.label,
          effects: {
            ARTS_DMG_TAKEN_PCT: status.finalAmount ?? 0,
          },
          expiresAt: status.expiresAt,
          timeScale: status.timeScale,
          enemySlotId,
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
      enemySlotId,
      affectedEnemySlotIds: [enemySlotId],
      label: `${args.reaction} Applied`,
      commandAttackType: sourceCommand?.attackType,
    };
    emitEvent(reactionAppliedEvent);
    dispatchPassiveListeners(reactionAppliedEvent, args.triggerSlots);

    if (args.reaction === "Combustion") {
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const event: RotationCombatEvent = {
        type: "COMBUSTION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: args.sourceCommandId,
        commandName: args.sourceCommandName,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: `Combustion Applied Lv${args.level}`,
        commandAttackType: sourceCommand?.attackType,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);

      return;
    }

    if (args.reaction === "Corrosion") {
      const corrosion = getEnemyStatuses(enemySlotId).find((status) => status.id === "corrosion");
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const event: RotationCombatEvent = {
        type: "CORROSION_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: args.sourceCommandId,
        commandName: args.sourceCommandName,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: `Corrosion Applied Lv${corrosion?.level ?? args.level}`,
        commandAttackType: sourceCommand?.attackType,
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
    useSourceCommandAsReactionHit?: boolean;
    reactionHitName?: string;
    stagger?: number;
    enemySlotId?: EnemySlotId;
    singleEventPerStep?: boolean;
  }) => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    const isBarrierActive =
      resolvedContracts.barrierInflictionIntervalSeconds != null
      && resolvedContracts.barrierInflictionIntervalSeconds > 0;
    const isVulnerabilityBarrierBlocked = () =>
      isBarrierActive
      && hasUnifiedStatus({
        statusId: "contract_barrier_vulnerability",
        target: "enemy",
        enemySlotId,
        realTime: args.time,
        gameTime: args.gameTime,
      });
    const applyVulnerabilityBarrier = () => {
      if (!isBarrierActive) {
        return;
      }
      addEnemyStatusById({
        statusId: "contract_barrier_vulnerability",
        label: "Barrier Immunity (Vulnerability)",
        expiresAt: args.gameTime + resolvedContracts.barrierInflictionIntervalSeconds!,
        timeScale: "game",
        enemySlotId,
      });
    };

    const getReactionHitCommandId = () =>
      args.useSourceCommandAsReactionHit && args.sourceCommandId
        ? args.sourceCommandId
        : "__physical_reaction_trigger";

    const getReactionHitCommandName = (fallbackName: string) =>
      args.useSourceCommandAsReactionHit && args.sourceCommandName
        ? args.sourceCommandName
        : fallbackName;

    const getMifuWorldSplitterMultiplierScale = () => {
      const actor = partyBySlot.get(args.sourceSlot);
      if (!actor || actor.characterId !== "MIFU" || args.sourceCommandId !== "mifu_battle_skill_world_splitter") {
        return 1;
      }
      const hasPhysicalSusceptibility =
        timedEnemyDebuffs.some((debuff) =>
          resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId
          && debuff.stat === "PHYSICAL_DMG_TAKEN_PCT")
        || getEnemyStatuses(enemySlotId).some((status) => status.id === "breach");
      const isEnemyStaggered = getCurrentEnemyRuntimeState().isStaggeredForEvents;
      if (!hasPhysicalSusceptibility && !isEnemyStaggered) {
        return 1;
      }
      if (isSelfUniqueTalentEnabled(actor, "mifu_talent_1_2")) {
        return actor.potentialLevel >= 5 ? 1.3 : 1.2;
      }
      if (isSelfUniqueTalentEnabled(actor, "mifu_talent_1_1")) {
        return actor.potentialLevel >= 5 ? 1.2 : 1.1;
      }
      return 1;
    };

    const emitPhysicalReactionAppliedEvent = (reaction: PhysicalReactionKind, amount = 1) => {
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const enemyHadPhysicalSusceptibility =
        timedEnemyDebuffs.some((debuff) =>
          resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId
          && debuff.stat === "PHYSICAL_DMG_TAKEN_PCT")
        || getEnemyStatuses(enemySlotId).some((status) => status.id === "breach");
      const enemyWasStaggered = getCurrentEnemyRuntimeState().isStaggeredForEvents;
      const enemyHadOriginiumCrystal = getEnemyStatuses(enemySlotId).some(
        (status) => status.id === "endministrator_originium_crystal",
      );
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
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: `${reaction} Applied`,
        commandAttackType: sourceCommand?.attackType,
        amount,
        enemyHadPhysicalSusceptibility,
        enemyWasStaggered,
        enemyHadOriginiumCrystal,
      };
      if (shouldEmitSingleStepEvent({
        stepId: args.stepId,
        eventType: event.type,
        label: event.label,
        sourceSlot: args.sourceSlot,
        enabled: args.singleEventPerStep,
      })) {
        emitEvent(event);
        dispatchPassiveListeners(event, args.triggerSlots);
      }
    };

    const emitVulnerabilityAppliedEvent = (enemyHadVulnerability: boolean) => {
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: "Vulnerability Applied",
        commandAttackType: sourceCommand?.attackType,
        enemyHadVulnerability,
      };
      if (shouldEmitSingleStepEvent({
        stepId: args.stepId,
        eventType: event.type,
        label: event.label,
        sourceSlot: args.sourceSlot,
        enabled: args.singleEventPerStep,
      })) {
        emitEvent(event);
        dispatchPassiveListeners(event, args.triggerSlots);
      }
    };

    const emitVulnerabilityConsumedEvent = (consumedStacks: number) => {
      const sourceCommand = args.sourceCommandId
        ? partyBySlot.get(args.sourceSlot)?.commands.find((command) => command.id === args.sourceCommandId)
        : undefined;
      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_CONSUMED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: "Vulnerability Consumed",
        commandAttackType: sourceCommand?.attackType,
        amount: consumedStacks,
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);
    };

    const triggerShatterIfSolidificationPresent = () => {
      const solidificationStatuses = getEnemyStatuses(enemySlotId).filter((status) => status.id === "solidification");
      if (solidificationStatuses.length <= 0) {
        return;
      }

      const solidificationLevel = Math.max(
        1,
        ...solidificationStatuses.map((status) => Math.max(1, status.level ?? 1)),
      );
      setEnemyStatuses(getEnemyStatuses(enemySlotId).filter((status) => status.id !== "solidification"), {
        reason: "consume_solidification_for_shatter",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "removed",
      }, enemySlotId);

      pushReactionDamageHit({
        sourceSlot: args.sourceSlot,
        reactionName: "Shatter",
        hitName: "Shatter Trigger",
        damageType: "Physical",
        baseMultiplier: 1.2 + 1.2 * solidificationLevel,
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: getReactionHitCommandId(),
        commandName: getReactionHitCommandName("Shatter"),
        reactionCategory: "arts",
        linkSourceStepId: args.linkSourceStepId,
        enemySlotId,
      });
    };

    if (!args.forceApply && (getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0) <= 0) {
      if (isVulnerabilityBarrierBlocked()) {
        return;
      }
      setEnemyPhysicalInfliction({
        stacks: 1,
        expiresAtGameTime: args.gameTime + ARTS_INFLICTION_DURATION_SECONDS,
      }, enemySlotId, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      emitVulnerabilityAppliedEvent(false);
      applyVulnerabilityBarrier();
      triggerShatterIfSolidificationPresent();
      return;
    }

    const actor = partyBySlot.get(args.sourceSlot);
    const artsIntensity = actor
      ? Math.max(0, getEffectiveActorMods(actor, args.time, args.gameTime).ARTS_INTENSITY)
      : 0;

    if (args.reaction === "Lift" || args.reaction === "Knockdown") {
      const currentStacks = getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0;
      const canApplyVulnerability = !isVulnerabilityBarrierBlocked();
      if (canApplyVulnerability) {
        setEnemyPhysicalInfliction({
          stacks: Math.max(1, Math.min(4, currentStacks + 1)),
          expiresAtGameTime: args.gameTime + ARTS_INFLICTION_DURATION_SECONDS,
        }, enemySlotId, {
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
        });
        emitVulnerabilityAppliedEvent(currentStacks > 0);
        applyVulnerabilityBarrier();
      }
      const reactionId = args.reaction.toLowerCase();
      const nextEnemyStatuses = getEnemyStatuses(enemySlotId).filter((status) => status.id !== reactionId);
      nextEnemyStatuses.push({
        id: reactionId,
        label: args.reaction,
        expiresAt: args.gameTime + 1.5,
        timeScale: "game",
        applierSlot: args.sourceSlot,
      });
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "apply_physical_reaction",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        changeType: "replaced",
      }, enemySlotId);

      if (args.reactionDamage) {
        pushReactionDamageHit({
          sourceSlot: args.sourceSlot,
          reactionName: args.reaction,
          hitName: args.reactionHitName ?? `${args.reaction} Trigger`,
          damageType: "Physical",
          baseMultiplier: args.baseMultiplier ?? 1.2,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          commandId: getReactionHitCommandId(),
          commandName: getReactionHitCommandName(args.reaction),
          reactionCategory: "physical",
          linkSourceStepId: args.linkSourceStepId,
          stagger: args.stagger ?? (10 * (1 + artsIntensity / 200)),
          enemySlotId,
        });
      }
      emitPhysicalReactionAppliedEvent(args.reaction, 1);
      triggerShatterIfSolidificationPresent();
      return;
    }

    const consumedStacks = Math.max(1, getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0);

    if (args.reaction === "Crush") {
      setEnemyPhysicalInfliction(null, enemySlotId, {
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
      });
      emitVulnerabilityConsumedEvent(consumedStacks);
      emitPhysicalReactionAppliedEvent("Crush", consumedStacks);
      if (args.reactionDamage) {
        const worldSplitterScale = getMifuWorldSplitterMultiplierScale();
        pushReactionDamageHit({
          sourceSlot: args.sourceSlot,
          reactionName: "Crush",
          hitName: args.reactionHitName ?? "Crush Trigger",
          damageType: "Physical",
          baseMultiplier: (args.baseMultiplier ?? (1.5 + 1.5 * consumedStacks)) * worldSplitterScale,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          commandId: getReactionHitCommandId(),
          commandName: getReactionHitCommandName("Crush"),
          reactionCategory: "physical",
          linkSourceStepId: args.linkSourceStepId,
          stagger: args.stagger,
          enemySlotId,
        });
      }
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
        hitName: args.reactionHitName ?? "Breach Trigger",
        damageType: "Physical",
        baseMultiplier: args.baseMultiplier ?? (0.5 + 0.5 * consumedStacks),
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        commandId: getReactionHitCommandId(),
        commandName: getReactionHitCommandName("Breach"),
        reactionCategory: "physical",
        linkSourceStepId: args.linkSourceStepId,
        stagger: args.stagger,
      });
    }

    const nextEnemyStatuses = getEnemyStatuses(enemySlotId).filter((status) => status.id !== "breach");
    nextEnemyStatuses.push({
      id: "breach",
      label: "Breach",
      expiresAt: args.gameTime + durationSeconds,
      timeScale: "game",
      applierSlot: args.sourceSlot,
      level: clampedStacks,
    });
    setEnemyStatuses(nextEnemyStatuses, {
      reason: "apply_physical_reaction",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: "replaced",
    }, enemySlotId);

    setReactionDebuff({
      buffId: "breach",
      label: `Breach Lv${clampedStacks}`,
      effects: {
        PHYSICAL_DMG_TAKEN_PCT: finalTakenPct,
      },
      expiresAt: args.gameTime + durationSeconds,
      timeScale: "game",
      enemySlotId,
    });

    setEnemyPhysicalInfliction(null, enemySlotId, {
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
    });
    emitVulnerabilityConsumedEvent(consumedStacks);
    emitPhysicalReactionAppliedEvent("Breach", consumedStacks);
    triggerShatterIfSolidificationPresent();
  };

  const getUnifiedStatuses = (args: { realTime: number; gameTime: number }): UnifiedCombatStatus[] => {
    cleanupStateAt(args.realTime, args.gameTime);

    const statuses: UnifiedCombatStatus[] = [...runtimeStatuses];

    return statuses;
  };
  const getUnifiedStatusRemainingSeconds = (args: {
    statusId: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global" | "field";
    enemySlotId?: EnemySlotId;
    realTime: number;
    gameTime: number;
  }) => {
    const statuses = getUnifiedStatuses({ realTime: args.realTime, gameTime: args.gameTime });
    return statuses.reduce((maxRemaining, status) => {
      if (status.id !== args.statusId) {
        return maxRemaining;
      }
      if (args.target === "enemy" && (status.scope !== "enemy" || resolveEnemyStatusSlotId(status.enemySlotId) !== getResolvedEnemySlotId(args.enemySlotId))) {
        return maxRemaining;
      }
      if (args.target === "self" && (status.scope !== "actor" || status.targetSlot !== args.sourceSlot)) {
        return maxRemaining;
      }
      if (args.target === "global" && status.scope !== "global") {
        return maxRemaining;
      }
      if (args.target === "field" && status.fieldStatus !== true) {
        return maxRemaining;
      }
      const now = status.timeScale === "real" ? args.realTime : args.gameTime;
      return Math.max(maxRemaining, Math.max(0, status.expiresAt - now));
    }, 0);
  };

  const hasUnifiedStatus = (args: {
    statusId: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global" | "field";
    enemySlotId?: EnemySlotId;
    realTime: number;
    gameTime: number;
  }) => {
    const statuses = getUnifiedStatuses({ realTime: args.realTime, gameTime: args.gameTime });
    return statuses.some((status) => {
      if (status.id !== args.statusId) {
        return false;
      }

      if (args.target === "enemy") {
        return status.scope === "enemy" && resolveEnemyStatusSlotId(status.enemySlotId) === getResolvedEnemySlotId(args.enemySlotId);
      }

      if (args.target === "self") {
        return status.scope === "actor" && status.targetSlot === args.sourceSlot;
      }

      if (args.target === "global") {
        return status.scope === "global";
      }

      if (args.target === "field") {
        return status.fieldStatus === true;
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

  const getUnifiedStatusStackCount = (args: {
    statusId: string;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global" | "field";
    enemySlotId?: EnemySlotId;
    realTime: number;
    gameTime: number;
  }) => {
    const statuses = getUnifiedStatuses({ realTime: args.realTime, gameTime: args.gameTime });
    return statuses.reduce((sum, status) => {
      if (status.id !== args.statusId) {
        return sum;
      }
      if (args.target === "enemy" && (status.scope !== "enemy" || resolveEnemyStatusSlotId(status.enemySlotId) !== getResolvedEnemySlotId(args.enemySlotId))) {
        return sum;
      }
      if (args.target === "self" && !(status.scope === "actor" && status.targetSlot === args.sourceSlot)) {
        return sum;
      }
      if (args.target === "global" && status.scope !== "global") {
        return sum;
      }
      if (args.target === "field" && status.fieldStatus !== true) {
        return sum;
      }
      if (typeof status.metadata?.level === "number") {
        return sum + Math.max(0, Math.floor(status.metadata.level));
      }
      return sum + Math.max(1, Math.floor(status.stacks ?? 1));
    }, 0);
  };

  const consumeEnemyStatusForAccumulator = (args: {
    statusId: string;
    maxConsumed: number;
    useLevelAsStacks: boolean;
    realTime: number;
    gameTime: number;
    enemySlotId?: EnemySlotId;
    sourceSlot?: CharacterCombatSnapshot["slot"];
    stepId?: string;
    commandAttackType?: RotationCombatEvent["commandAttackType"];
    triggerSlots?: CharacterCombatSnapshot["slot"][];
  }): number => {
    const enemySlotId = getResolvedEnemySlotId(args.enemySlotId);
    cleanupStateAt(args.realTime, args.gameTime);
    let remaining = Math.max(0, Math.floor(args.maxConsumed));
    if (remaining <= 0) {
      return 0;
    }

    const matched: Array<{ index: number; units: number }> = [];
    for (let index = 0; index < runtimeStatuses.length; index += 1) {
      const status = runtimeStatuses[index];
      if (
        !status
        || status.scope !== "enemy"
        || resolveEnemyStatusSlotId(status.enemySlotId) !== enemySlotId
        || status.id !== args.statusId
      ) {
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
      if (current.id === "electrification" && current.ownerSlot != null) {
        const nextBaseAmount = getReactionBaseAmount(nextUnits);
        nextMetadata.finalAmount = getReactionScaledAmount(
          current.ownerSlot,
          nextBaseAmount,
          args.realTime,
          args.gameTime,
        );
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

    if (args.statusId === "electrification") {
      const remainingElectrification = getEnemyStatuses(enemySlotId).find((status) => status.id === "electrification");
      if (remainingElectrification) {
        setReactionDebuff({
          buffId: "electrification",
          label: remainingElectrification.label,
          effects: {
            ARTS_DMG_TAKEN_PCT: remainingElectrification.finalAmount ?? 0,
          },
          expiresAt: remainingElectrification.expiresAt,
          timeScale: remainingElectrification.timeScale,
          enemySlotId,
        });
      } else {
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
          !(resolveEnemyDebuffSlotId(debuff.enemySlotId) === enemySlotId && debuff.buffId === "electrification"));
      }
    }

    if (consumedTotal > 0 && args.sourceSlot != null && (
      args.statusId === "combustion"
      || args.statusId === "corrosion"
      || args.statusId === "solidification"
      || args.statusId === "electrification"
    )) {
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
        time: args.realTime,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        enemySlotId,
        affectedEnemySlotIds: [enemySlotId],
        label: `${reactionName} Consumed Arts Reaction`,
        consumedElement,
        consumedStacks: consumedTotal,
        commandAttackType: args.commandAttackType ?? (args.stepId ? commandAttackTypeByStepId.get(args.stepId) : undefined),
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);
    }

    return consumedTotal;
  };

  const evaluateCombatCondition = (args: {
    condition: CombatCondition;
    actor: CharacterCombatSnapshot;
    enemySlotId?: EnemySlotId;
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
        enemySlotId: args.enemySlotId,
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
    if (condition.type === "require_vulnerability_stacks") {
      const stacks = Math.max(0, getEnemyPhysicalInfliction(args.enemySlotId)?.stacks ?? 0);
      if (condition.min != null && stacks < condition.min) {
        return false;
      }
      if (condition.max != null && stacks > condition.max) {
        return false;
      }
      return true;
    }
    if (condition.type === "require_enemy_modifier") {
      const value = getEffectiveEnemyMods(args.actor, args.realTime, args.gameTime, args.enemySlotId)[condition.stat] ?? 0;
      if (condition.min != null && value < condition.min) {
        return false;
      }
      if (condition.max != null && value > condition.max) {
        return false;
      }
      return true;
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

  const filterEnemySlotIdsByExecuteCondition = (args: {
    executeCondition: NonNullable<ResolvedCommandHitAtLevel["executeCondition"]>;
    actor: CharacterCombatSnapshot;
    enemySlotIds: EnemySlotId[];
    realTime: number;
    gameTime: number;
    stepId?: string;
    isCommandHit?: boolean;
  }): EnemySlotId[] => {
    const {
      executeCondition,
      actor,
      enemySlotIds,
      realTime,
      gameTime,
      stepId,
      isCommandHit,
    } = args;
    if (enemySlotIds.length <= 0) {
      return [];
    }

    if (executeCondition.requiresSelfBuffId) {
      const stackCount = getActorBuffStackCount({
        slot: actor.slot,
        buffId: executeCondition.requiresSelfBuffId,
      });
      if (executeCondition.requiresStacksExact != null && stackCount !== executeCondition.requiresStacksExact) {
        return [];
      }
      if (executeCondition.requiresStacksAtLeast != null && stackCount < executeCondition.requiresStacksAtLeast) {
        return [];
      }
    }

    if (executeCondition.requiresConsumedLink) {
      const consumedLinkStacks = stepId ? (commandLinkedStacksByStepId.get(stepId) ?? 0) : 0;
      if (consumedLinkStacks <= 0) {
        return [];
      }
    }

    return enemySlotIds.filter((enemySlotId) => {
      if (
        executeCondition.condition
        && !evaluateCombatCondition({
          condition: executeCondition.condition,
          actor,
          enemySlotId,
          realTime,
          gameTime,
          stepId,
          isCommandHit,
        })
      ) {
        return false;
      }

      if (
        executeCondition.requiresEnemyStatusId
        && !hasUnifiedStatus({
          statusId: executeCondition.requiresEnemyStatusId,
          target: "enemy",
          enemySlotId,
          sourceSlot: actor.slot,
          realTime,
          gameTime,
        })
      ) {
        return false;
      }

      return true;
    });
  };

  const removeTimedStatus = (args: {
    statusId: string;
    sourceSlot: CharacterCombatSnapshot["slot"];
    target?: "enemy" | "self" | "global" | "field";
    fieldStatus?: boolean;
    time?: number;
    gameTime?: number;
    stepId?: string;
    linkSourceStepId?: string;
  }): TimedEffectStatus[] => {
    const effectStatuses = getEffectStatuses();
    const removed = effectStatuses.filter((status) =>
      status.id === args.statusId
      && status.sourceSlot === args.sourceSlot
      && (args.fieldStatus == null || (status.fieldStatus ?? false) === args.fieldStatus)
      && (args.target == null || status.target === args.target),
    );
    if (removed.length <= 0) {
      return [];
    }
    for (const status of removed) {
      const sourceActor = partyBySlot.get(args.sourceSlot);
      if (
        sourceActor
        && args.time != null
        && args.gameTime != null
        && (status.removeEffects?.length ?? 0) > 0
      ) {
        applyHitEffects({
          effects: status.removeEffects,
          time: args.time,
          gameTime: args.gameTime,
          stepId: status.sourceStepId,
          actor: sourceActor,
          triggerSlots: [],
          linkSourceStepId: args.linkSourceStepId ?? status.linkSourceStepId,
        });
      }
      if (status.target === "enemy") {
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.buffId !== status.id);
      }
    }
    setEffectStatuses(effectStatuses.filter((status) => !removed.includes(status)), {
      reason: "remove_timed_status",
      time: args.time ?? 0,
      gameTime: args.gameTime ?? 0,
      stepId: args.stepId,
      changeType: "removed",
    });
    return removed;
  };

  const applyTimedStatus = (args: {
    effect: Extract<CommandHitEffectDefinition, { type: "APPLY_STATUS" }>;
    sourceSlot: CharacterCombatSnapshot["slot"];
    stepId: string;
    time: number;
    gameTime: number;
    triggerSlots: CharacterCombatSnapshot["slot"][];
    sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
    linkSourceStepId?: string;
  }) => {
    const timeScale = args.effect.timeScale ?? "game";
    const now = timeScale === "real" ? args.time : args.gameTime;
    const durationSeconds = Math.max(0, args.effect.durationSeconds);
    const resolvedEnemySlotId = args.effect.target === "enemy" ? getResolvedEnemySlotId() : undefined;
    if (durationSeconds <= 0) {
      return;
    }

    const periods = Math.max(0, Math.floor(args.effect.periods ?? 0));
    const maxPeriods = args.effect.maxPeriods == null
      ? undefined
      : Math.max(0, Math.floor(args.effect.maxPeriods));
    const periodInterval = periods > 0 ? durationSeconds / periods : 0;

    const existingStatuses = getEffectStatuses();
    const matchingStatuses = existingStatuses.filter((status) => (
      status.id === args.effect.statusId
      && status.sourceSlot === args.sourceSlot
      && status.target === args.effect.target
      && resolveEnemyStatusSlotId(status.enemySlotId) === resolvedEnemySlotId
      && (status.fieldStatus ?? false) === (args.effect.fieldStatus ?? false)
    ));
    const independentStacks = args.effect.independentStacks ?? false;
    const requestedStacks = Math.max(1, Math.floor(args.effect.stacks ?? 1));
    const maxStacks = Math.max(1, Math.floor(args.effect.maxStacks ?? Number.POSITIVE_INFINITY));
    const refreshExistingStacks = args.effect.refreshExistingStacks ?? true;
    let replacedStatuses: TimedEffectStatus[] = [];
    let effectStatuses = [...existingStatuses];
    if (!independentStacks) {
      replacedStatuses = matchingStatuses;
      effectStatuses = existingStatuses.filter((status) => !(
        status.id === args.effect.statusId
        && status.sourceSlot === args.sourceSlot
        && status.target === args.effect.target
        && resolveEnemyStatusSlotId(status.enemySlotId) === resolvedEnemySlotId
        && (status.fieldStatus ?? false) === (args.effect.fieldStatus ?? false)
      ));
    }
    if (args.effect.target === "enemy") {
      timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
        !(
          debuff.buffId === args.effect.statusId
          && resolveEnemyDebuffSlotId(debuff.enemySlotId) === resolvedEnemySlotId
        ));
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
          enemySlotId: resolvedEnemySlotId,
          stat,
          value,
          expiresAt,
          timeScale,
        });
      }
    }

    const makeStatus = (): TimedEffectStatus => ({
      id: args.effect.statusId,
      label: args.effect.label ?? args.effect.statusId,
      sourceSlot: args.sourceSlot,
      sourceStepId: args.stepId,
      linkSourceStepId: args.linkSourceStepId,
      target: args.effect.target,
      enemySlotId: resolvedEnemySlotId,
      expiresAt: now + durationSeconds,
      timeScale,
      hidden: args.effect.hidden,
      fieldStatus: args.effect.fieldStatus ?? false,
      blocksOperatorArtsInflictionElements: args.effect.blocksOperatorArtsInflictionElements,
      periods,
      maxPeriods,
      periodsExecuted: 0,
      periodInterval,
      nextPeriodAt: periods > 0 ? now + periodInterval : undefined,
      periodicEffects: args.effect.periodicEffects ?? [],
      expireEffects: args.effect.expireEffects ?? [],
      removeEffects: args.effect.removeEffects ?? [],
      pauseStatusIds: args.effect.pauseStatusIds,
      effects: args.effect.effects,
    });

    if (independentStacks) {
      if (refreshExistingStacks) {
        for (const status of matchingStatuses) {
          status.label = args.effect.label ?? args.effect.statusId;
          status.expiresAt = now + durationSeconds;
          status.timeScale = timeScale;
        }
      }
      const availableStacks = Math.max(0, maxStacks - matchingStatuses.length);
      const appliedStacks = Math.min(requestedStacks, availableStacks);
      for (let index = 0; index < appliedStacks; index += 1) {
        effectStatuses.push(makeStatus());
      }
    } else {
      effectStatuses.push(makeStatus());
    }

    if ((args.effect.pauseStatusIds?.length ?? 0) > 0) {
      const pauseIds = new Set(args.effect.pauseStatusIds);
      for (const status of runtimeStatuses) {
        if (!pauseIds.has(status.id) || status.kind !== ACTOR_BUFF_KIND) {
          continue;
        }
        status.expiresAt += durationSeconds;
      }
    }

    if (args.effect.statusId === "tangtang_olden_stare" && args.effect.target === "global") {
      applyTangtangOldenStareCrowdControlToActiveEnemies({
        sourceSlot: args.sourceSlot,
        stepId: args.stepId,
        time: args.time,
        gameTime: args.gameTime,
      });
    }
    setEffectStatuses(effectStatuses, {
      reason: "apply_timed_status",
      time: args.time,
      gameTime: args.gameTime,
      stepId: args.stepId,
      changeType: independentStacks ? "added" : "replaced",
    });

    if (replacedStatuses.length > 0) {
      const sourceActor = partyBySlot.get(args.sourceSlot);
      if (sourceActor) {
        for (const status of replacedStatuses) {
          if ((status.removeEffects?.length ?? 0) <= 0) {
            continue;
          }
          applyHitEffects({
            effects: status.removeEffects,
            time: args.time,
            gameTime: args.gameTime,
            stepId: status.sourceStepId,
            actor: sourceActor,
            triggerSlots: [],
            linkSourceStepId: status.linkSourceStepId,
          });
        }
      }
    }

    if (args.effect.target === "enemy") {
      const event: RotationCombatEvent = {
        type: "ENEMY_DEBUFF_APPLIED",
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        slot: args.sourceSlot,
        sourceSlot: args.sourceSlot,
        target: "enemy",
        label: args.effect.label ?? args.effect.statusId,
        commandAttackType: args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
      };
      emitEvent(event);
      dispatchPassiveListeners(event, args.triggerSlots);

      if (args.effect.statusId === "endministrator_originium_crystal") {
        const crystalEvent: RotationCombatEvent = {
          type: "ORIGINIUM_CRYSTAL_APPLIED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.sourceSlot,
          sourceSlot: args.sourceSlot,
          target: "enemy",
          label: args.effect.label ?? "Originium Crystal",
          commandAttackType: args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
        };
        emitEvent(crystalEvent);
        dispatchPassiveListeners(crystalEvent, args.triggerSlots);
      }
    }

    // Important ordering: status should exist before initial effects run so those
    // effects can query/benefit from the freshly-applied status in the same frame.
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
  };

  type PendingSimulationEventKind =
    | "timed_effect_status"
    | "reaction_tick"
    | "arts_burst"
    | "execute_hit"
    | "trigger_resume"
    | "enemy_listener_window_end";

  type PendingSimulationEventPoint = {
    kind: PendingSimulationEventKind;
    realTime: number;
    gameTime: number;
  };

  const comparePendingSimulationEventPoints = (
    left: PendingSimulationEventPoint,
    right: PendingSimulationEventPoint,
  ) => {
    if (left.realTime !== right.realTime) {
      return left.realTime - right.realTime;
    }
    const priority = (kind: PendingSimulationEventKind) => {
      if (kind === "timed_effect_status") return 0;
      if (kind === "reaction_tick") return 1;
      if (kind === "arts_burst") return 2;
      if (kind === "execute_hit") return 3;
      if (kind === "trigger_resume") return 4;
      return 5;
    };
    if (left.kind !== right.kind) {
      return priority(left.kind) - priority(right.kind);
    }
    return left.gameTime - right.gameTime;
  };

  const getNextTimedEffectStatusEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const status of getEffectStatuses()) {
      const candidates: PendingSimulationEventPoint[] = [];
      const interruptedAt = getInterruptCutoffForStep(status.sourceStepId);
      if (interruptedAt != null) {
        candidates.push({
          kind: "timed_effect_status",
          realTime: interruptedAt,
          gameTime: toGameTimeFromExtensions(interruptedAt),
        });
      }

      if (
        status.periodsExecuted < Math.min(status.periods, status.maxPeriods ?? status.periods)
        && status.nextPeriodAt != null
        && status.nextPeriodAt < status.expiresAt - 0.0001
      ) {
        const periodTime = status.nextPeriodAt;
        candidates.push({
          kind: "timed_effect_status",
          realTime: status.timeScale === "real" ? periodTime : toRealTimeFromExtensions(periodTime),
          gameTime: status.timeScale === "game" ? periodTime : toGameTimeFromExtensions(periodTime),
        });
      }

      candidates.push({
        kind: "timed_effect_status",
        realTime: status.timeScale === "real" ? status.expiresAt : toRealTimeFromExtensions(status.expiresAt),
        gameTime: status.timeScale === "game" ? status.expiresAt : toGameTimeFromExtensions(status.expiresAt),
      });

      for (const candidate of candidates) {
        if (
          nextPoint == null
          || comparePendingSimulationEventPoints(candidate, nextPoint) < 0
        ) {
          nextPoint = candidate;
        }
      }
    }
    return nextPoint;
  };

  const getNextReactionTickEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const slot of normalizedEnemySlots) {
      const enemyStatuses = getEnemyStatuses(slot.slotId);
      for (const status of enemyStatuses) {
        if (
          status.id === "combustion"
          && status.nextTickAtGameTime != null
          && status.nextTickAtGameTime < status.expiresAt - 0.0001
        ) {
          const candidate: PendingSimulationEventPoint = {
            kind: "reaction_tick",
            realTime: toRealTimeFromExtensions(status.nextTickAtGameTime),
            gameTime: status.nextTickAtGameTime,
          };
          if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
            nextPoint = candidate;
          }
        }
        if (
          status.id === "contract_regeneration"
          && status.healPctPerSecond != null
          && status.nextTickAtGameTime != null
          && status.nextTickAtGameTime < status.expiresAt - 0.0001
        ) {
          const candidate: PendingSimulationEventPoint = {
            kind: "reaction_tick",
            realTime: toRealTimeFromExtensions(status.nextTickAtGameTime),
            gameTime: status.nextTickAtGameTime,
          };
          if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
            nextPoint = candidate;
          }
        }
        if (
          status.id === "corrosion"
          && status.nextRampAtGameTime != null
          && status.nextRampAtGameTime < status.expiresAt - 0.0001
        ) {
          const candidate: PendingSimulationEventPoint = {
            kind: "reaction_tick",
            realTime: toRealTimeFromExtensions(status.nextRampAtGameTime),
            gameTime: status.nextRampAtGameTime,
          };
          if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
            nextPoint = candidate;
          }
        }
      }
    }
    return nextPoint;
  };

  const getNextPendingArtsBurstEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const entry of pendingArtsBursts) {
      const candidate: PendingSimulationEventPoint = {
        kind: "arts_burst",
        realTime: toRealTimeFromExtensions(entry.executeGameTime),
        gameTime: entry.executeGameTime,
      };
      if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
        nextPoint = candidate;
      }
    }
    return nextPoint;
  };

  const getNextPendingExecuteHitEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const entry of pendingExecuteHits) {
      const candidate: PendingSimulationEventPoint = {
        kind: "execute_hit",
        realTime: entry.executionTime,
        gameTime: entry.executionGameTime,
      };
      if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
        nextPoint = candidate;
      }
    }
    return nextPoint;
  };

  const getNextPendingTriggerResumeEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const entry of pendingTriggerResumes) {
      const candidate: PendingSimulationEventPoint = {
        kind: "trigger_resume",
        realTime: entry.executionTime,
        gameTime: entry.executionGameTime,
      };
      if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
        nextPoint = candidate;
      }
    }
    return nextPoint;
  };

  const getNextPendingEnemyListenerWindowEndEventPoint = (): PendingSimulationEventPoint | null => {
    let nextPoint: PendingSimulationEventPoint | null = null;
    for (const entry of pendingEnemyListenerWindowEnds) {
      const candidate: PendingSimulationEventPoint = {
        kind: "enemy_listener_window_end",
        realTime: entry.executionTime,
        gameTime: entry.executionGameTime,
      };
      if (nextPoint == null || comparePendingSimulationEventPoints(candidate, nextPoint) < 0) {
        nextPoint = candidate;
      }
    }
    return nextPoint;
  };

  const processPendingTriggerResumesUpTo = (args: { realTime: number; gameTime: number }) => {
    pendingTriggerResumes.sort((left, right) => left.executionTime - right.executionTime);
    while (pendingTriggerResumes.length > 0) {
      const next = pendingTriggerResumes[0];
      if (!next || next.executionTime > args.realTime + 0.0001 || next.executionGameTime > args.gameTime + 0.0001) {
        break;
      }
      pendingTriggerResumes.shift();
      const trigger = allRuntimeTriggers.find((entry) => entry.id === next.triggerId);
      if (!trigger || stoppedTriggerInstanceIds.has(next.instanceId) || !canExecuteTriggerAt(next.executionTime)) {
        continue;
      }
      registerTriggerExecution(next.executionTime);
      if (!canExecuteTriggerAt(next.executionTime)) {
        continue;
      }
      const result = runTriggerActionsFromIndex(
        trigger,
        next.instanceId,
        next.event,
        next.actions,
        next.nextActionIndex,
        next.executionTime,
        next.executionGameTime,
      );
      if (!result.paused) {
        unregisterTriggerInstance(trigger.id, next.instanceId);
      }
      for (const member of party) {
        recordActorState(member.slot, next.executionTime, next.executionGameTime);
      }
      recordEnemyState(next.executionTime, next.executionGameTime);
    }
  };

  const processPendingEnemyListenerWindowEndsUpTo = (args: { realTime: number; gameTime: number }) => {
    pendingEnemyListenerWindowEnds.sort((left, right) => left.executionTime - right.executionTime);
    while (pendingEnemyListenerWindowEnds.length > 0) {
      const next = pendingEnemyListenerWindowEnds[0];
      if (!next) {
        break;
      }
      if (next.executionTime > args.realTime + 0.0001 || next.executionGameTime > args.gameTime + 0.0001) {
        break;
      }
      pendingEnemyListenerWindowEnds.shift();
      withEnemyResolutionSlot(next.enemySlotId, () => {
        applyEnemyActionEffects({
          effects: next.effects,
          time: next.executionTime,
          gameTime: next.executionGameTime,
          stepId: "__enemy_listener_window_end",
          enemySlotId: next.enemySlotId,
        });
      });
      recordEnemyState(next.executionTime, next.executionGameTime);
    }
  };

  const processPendingSimulationEventsUpTo = (args: { realTime: number; gameTime: number }) => {
    for (let guard = 0; guard < 10_000; guard += 1) {
      const candidates = [
        getNextTimedEffectStatusEventPoint(),
        getNextReactionTickEventPoint(),
        getNextPendingArtsBurstEventPoint(),
        getNextPendingExecuteHitEventPoint(),
        getNextPendingTriggerResumeEventPoint(),
        getNextPendingEnemyListenerWindowEndEventPoint(),
      ].filter((entry): entry is PendingSimulationEventPoint => entry != null)
        .filter((entry) =>
          entry.realTime <= args.realTime + 0.0001
          && entry.gameTime <= args.gameTime + 0.0001,
        )
        .sort(comparePendingSimulationEventPoints);

      const next = candidates[0];
      if (!next) {
        break;
      }

      if (next.kind === "timed_effect_status") {
        processTimedEffectStatusesUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      } else if (next.kind === "reaction_tick") {
        processReactionTicksUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      } else if (next.kind === "arts_burst") {
        processPendingArtsBurstsUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      } else if (next.kind === "trigger_resume") {
        processPendingTriggerResumesUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      } else if (next.kind === "enemy_listener_window_end") {
        processPendingEnemyListenerWindowEndsUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      } else {
        processPendingExecuteHitsUpTo({ realTime: next.realTime, gameTime: next.gameTime });
      }

      cleanupStateAt(next.realTime, next.gameTime);
    }
  };

  const processTimedEffectStatusesUpTo = (args: { realTime: number; gameTime: number }) => {
    let effectStatuses = getEffectStatuses();
    for (const status of [...effectStatuses]) {
      const interruptedAt = getInterruptCutoffForStep(status.sourceStepId);
      if (interruptedAt != null && interruptedAt <= args.realTime + 0.0001) {
        const sourceActor = partyBySlot.get(status.sourceSlot);
        if (sourceActor && (status.removeEffects?.length ?? 0) > 0) {
          applyHitEffects({
            effects: status.removeEffects,
            time: interruptedAt,
            gameTime: toGameTimeFromExtensions(interruptedAt),
            stepId: status.sourceStepId,
            actor: sourceActor,
            triggerSlots: [],
            linkSourceStepId: status.linkSourceStepId,
          });
        }
        if (status.target === "enemy") {
          timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
            !(
              debuff.buffId === status.id
              && resolveEnemyDebuffSlotId(debuff.enemySlotId) === resolveEnemyStatusSlotId(status.enemySlotId)
            ));
        }
        effectStatuses = effectStatuses.filter((entry) => entry !== status);
        continue;
      }

      const sourceActor = partyBySlot.get(status.sourceSlot);
      if (!sourceActor) {
        effectStatuses = effectStatuses.filter((entry) => entry !== status);
        continue;
      }

      while (
        status.periodsExecuted < Math.min(status.periods, status.maxPeriods ?? status.periods)
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

        if (status.id === "tangtang_olden_stare" && status.target === "global") {
          applyTangtangOldenStareCrowdControlToActiveEnemies({
            sourceSlot: status.sourceSlot,
            stepId: `${status.sourceStepId}:${status.id}:period:${status.periodsExecuted + 1}`,
            time: periodRealTime,
            gameTime: periodGameTime,
          });
        }

        status.periodsExecuted += 1;
        status.nextPeriodAt = periodTime + Math.max(0.0001, status.periodInterval);
      }

      const expiresAtGameTime = status.timeScale === "game" ? status.expiresAt : toGameTimeFromExtensions(status.expiresAt);
      const expiresAtRealTime = status.timeScale === "real" ? status.expiresAt : toRealTimeFromExtensions(status.expiresAt);
      if (expiresAtRealTime > args.realTime + 0.0001 || expiresAtGameTime > args.gameTime + 0.0001) {
        continue;
      }
      if (isInterruptedAtOrAfter(status.sourceStepId, expiresAtRealTime)) {
        if ((status.removeEffects?.length ?? 0) > 0) {
          applyHitEffects({
            effects: status.removeEffects,
            time: expiresAtRealTime,
            gameTime: expiresAtGameTime,
            stepId: status.sourceStepId,
            actor: sourceActor,
            triggerSlots: [],
            linkSourceStepId: status.linkSourceStepId,
          });
        }
        if (status.target === "enemy") {
          timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
            !(
              debuff.buffId === status.id
              && resolveEnemyDebuffSlotId(debuff.enemySlotId) === resolveEnemyStatusSlotId(status.enemySlotId)
            ));
        }
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
        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) =>
          !(
            debuff.buffId === status.id
            && resolveEnemyDebuffSlotId(debuff.enemySlotId) === resolveEnemyStatusSlotId(status.enemySlotId)
          ));
      }

      effectStatuses = effectStatuses.filter((entry) => entry !== status);
    }
    setEffectStatuses(effectStatuses, {
      reason: "process_timed_effect_statuses",
      time: args.realTime,
      gameTime: args.gameTime,
      changeType: "updated",
    });
  };

  const processReactionTicksUpTo = (args: { realTime: number; gameTime: number }) => {
    while (true) {
      const combustionStatus = runtimeStatuses
        .filter((status) =>
          status.scope === "actor"
          && status.kind === "reaction_status"
          && status.id === PLAYER_COMBUSTION_STATUS_ID
          && typeof status.targetSlot === "number"
          && typeof status.metadata?.nextTickAtGameTime === "number"
          && status.metadata.nextTickAtGameTime <= args.gameTime + 0.0001
          && status.metadata.nextTickAtGameTime < status.expiresAt - 0.0001,
        )
        .sort((a, b) =>
          Number(a.metadata?.nextTickAtGameTime ?? Number.POSITIVE_INFINITY)
          - Number(b.metadata?.nextTickAtGameTime ?? Number.POSITIVE_INFINITY),
        )[0];

      if (!combustionStatus || typeof combustionStatus.targetSlot !== "number" || typeof combustionStatus.metadata?.nextTickAtGameTime !== "number") {
        break;
      }

      const tickGameTime = combustionStatus.metadata.nextTickAtGameTime;
      const tickRealTime = toRealTimeFromExtensions(tickGameTime);
      if (tickRealTime > args.realTime + 0.0001) {
        break;
      }

      const nextStatuses = runtimeStatuses.map((status) =>
        status.instanceId === combustionStatus.instanceId
          ? normalizeStatus({
              ...status,
              metadata: {
                ...(status.metadata ?? {}),
                nextTickAtGameTime: tickGameTime + 1,
              },
            })
          : status,
      );
      replaceRuntimeStatuses(nextStatuses, {
        reason: "process_player_combustion_ticks",
        changeType: "updated",
        time: tickRealTime,
        gameTime: tickGameTime,
      });
      applyEnemyDamageToActor({
        slot: combustionStatus.targetSlot,
        maxHpRatio: 0.02,
        time: tickRealTime,
        gameTime: tickGameTime,
        stepId: `player_combustion_tick:${combustionStatus.targetSlot}:${tickGameTime.toFixed(3)}`,
      });
    }

    while (true) {
      let combustionStatus: TimedEnemyStatus | undefined;
      let combustionEnemySlotId: EnemySlotId | undefined;
      for (const slot of normalizedEnemySlots) {
        const candidate = getEnemyStatuses(slot.slotId)
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
        if (
          candidate
          && (
            !combustionStatus
            || (candidate.nextTickAtGameTime ?? Number.POSITIVE_INFINITY) < (combustionStatus.nextTickAtGameTime ?? Number.POSITIVE_INFINITY)
          )
        ) {
          combustionStatus = candidate;
          combustionEnemySlotId = slot.slotId;
        }
      }

      if (
        !combustionStatus
        || combustionEnemySlotId == null
        || combustionStatus.nextTickAtGameTime == null
        || combustionStatus.level == null
        || combustionStatus.applierSlot == null
      ) {
        break;
      }

      const tickGameTime = combustionStatus.nextTickAtGameTime;
      const tickRealTime = toRealTimeFromExtensions(tickGameTime);
      if (tickRealTime > args.realTime + 0.0001) {
        break;
      }

      const nextEnemyStatuses = getEnemyStatuses(combustionEnemySlotId).map((status) =>
        status.instanceId === combustionStatus.instanceId
          ? {
              ...status,
              nextTickAtGameTime: (status.nextTickAtGameTime ?? tickGameTime) + 1,
            }
          : status,
      );
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "process_reaction_ticks",
        time: tickRealTime,
        gameTime: tickGameTime,
        changeType: "updated",
      }, combustionEnemySlotId);

      const tickMultiplier = combustionStatus.baseTickMultiplier ?? (0.12 + 0.12 * combustionStatus.level);
      pushReactionDamageHit({
        sourceSlot: combustionStatus.applierSlot,
        reactionName: "Combustion",
        hitName: "Combustion Tick",
        damageType: "Heat",
        baseMultiplier: tickMultiplier,
        time: tickRealTime,
        gameTime: tickGameTime,
        stepId: `combustion_tick:${combustionEnemySlotId}:${tickGameTime.toFixed(3)}`,
        commandId: "__combustion_tick",
        noCrit: true,
        enemySlotId: combustionEnemySlotId,
      });
    }

    while (true) {
      let corrosionStatus: TimedEnemyStatus | undefined;
      let corrosionEnemySlotId: EnemySlotId | undefined;
      for (const slot of normalizedEnemySlots) {
        const candidate = getEnemyStatuses(slot.slotId)
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
        if (
          candidate
          && (
            !corrosionStatus
            || (candidate.nextRampAtGameTime ?? Number.POSITIVE_INFINITY) < (corrosionStatus.nextRampAtGameTime ?? Number.POSITIVE_INFINITY)
          )
        ) {
          corrosionStatus = candidate;
          corrosionEnemySlotId = slot.slotId;
        }
      }

      if (
        !corrosionStatus
        || corrosionEnemySlotId == null
        || corrosionStatus.nextRampAtGameTime == null
        || corrosionStatus.finalAmount == null
        || corrosionStatus.currentReduction == null
      ) {
        break;
      }

      const rampGameTime = corrosionStatus.nextRampAtGameTime;
      const rampRealTime = toRealTimeFromExtensions(rampGameTime);
      if (rampRealTime > args.realTime + 0.0001) {
        break;
      }

      const stepIncrease = corrosionStatus.finalAmount * 0.07;
      const nextCorrosionStatus: TimedEnemyStatus = {
        ...corrosionStatus,
        currentReduction: Math.min(
          corrosionStatus.finalAmount,
          corrosionStatus.currentReduction + stepIncrease,
        ),
        nextRampAtGameTime: rampGameTime + 1,
      };
      const nextEnemyStatuses = getEnemyStatuses(corrosionEnemySlotId).map((status) =>
        status.instanceId === corrosionStatus.instanceId ? nextCorrosionStatus : status,
      );
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "process_reaction_ticks",
        time: rampRealTime,
        gameTime: rampGameTime,
        changeType: "updated",
      }, corrosionEnemySlotId);
      applyCorrosionDebuffFromStatus(nextCorrosionStatus, corrosionEnemySlotId);
    }

    while (true) {
      let regenerationStatus: TimedEnemyStatus | undefined;
      let regenerationEnemySlotId: EnemySlotId | undefined;
      for (const slot of normalizedEnemySlots) {
        const candidate = getEnemyStatuses(slot.slotId)
          .filter(
            (status) =>
              status.id === "contract_regeneration"
              && status.healPctPerSecond != null
              && status.nextTickAtGameTime != null
              && status.nextTickAtGameTime <= args.gameTime + 0.0001
              && status.nextTickAtGameTime < status.expiresAt - 0.0001,
          )
          .sort((a, b) => (a.nextTickAtGameTime ?? Number.POSITIVE_INFINITY) - (b.nextTickAtGameTime ?? Number.POSITIVE_INFINITY))[0];
        if (
          candidate
          && (
            !regenerationStatus
            || (candidate.nextTickAtGameTime ?? Number.POSITIVE_INFINITY) < (regenerationStatus.nextTickAtGameTime ?? Number.POSITIVE_INFINITY)
          )
        ) {
          regenerationStatus = candidate;
          regenerationEnemySlotId = slot.slotId;
        }
      }

      if (
        !regenerationStatus
        || regenerationEnemySlotId == null
        || regenerationStatus.nextTickAtGameTime == null
        || regenerationStatus.healPctPerSecond == null
      ) {
        break;
      }

      const tickGameTime = regenerationStatus.nextTickAtGameTime;
      const tickRealTime = toRealTimeFromExtensions(tickGameTime);
      if (tickRealTime > args.realTime + 0.0001) {
        break;
      }

      const nextEnemyStatuses = getEnemyStatuses(regenerationEnemySlotId).map((status) =>
        status.instanceId === regenerationStatus.instanceId
          ? {
              ...status,
              nextTickAtGameTime: (status.nextTickAtGameTime ?? tickGameTime) + 1,
            }
          : status,
      );
      setEnemyStatuses(nextEnemyStatuses, {
        reason: "process_contract_regeneration_ticks",
        time: tickRealTime,
        gameTime: tickGameTime,
        changeType: "updated",
      }, regenerationEnemySlotId);

      applyEnemyHealing(getCurrentEnemyMaxHp(regenerationEnemySlotId) * regenerationStatus.healPctPerSecond, regenerationEnemySlotId, {
        time: tickRealTime,
      });
    }
  };

  const resolveBuffEffectsForActor = (args: {
    effect: Extract<CommandHitEffectDefinition, { type: "APPLY_BUFF" }>;
    actor: CharacterCombatSnapshot;
    time: number;
    gameTime: number;
  }): Partial<ModifierStats> => {
    const resolvedEffects: Partial<ModifierStats> = {
      ...(args.effect.effects ?? {}),
    };
    const actorMods = getEffectiveActorMods(args.actor, args.time, args.gameTime);
    const actorAttrs = getEffectiveActorAttrs(args.actor, actorMods);

    for (const [statKey, scaling] of Object.entries(args.effect.effectAttributeScalings ?? {})) {
      if (!scaling) {
        continue;
      }
      const dynamicValue = actorAttrs[scaling.attribute] * scaling.ratio;
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
    sourceCommandAttackType?: RotationCombatEvent["commandAttackType"];
    linkSourceStepId?: string;
    critRigStepId?: string;
    effectTree?: CombatEffectTree;
    sourceHit?: ResolvedCommandHitAtLevel;
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
          effectTree: args.effectTree,
        });
        continue;
      }

      if (effect.type === "ADD_TIME_FREEZE") {
        addTimeFreezeExtension({
          time: args.time,
          amount: Math.max(0, effect.durationSeconds),
          sourceStepId: args.stepId,
          cutscene: effect.cutscene ?? false,
        });
        continue;
      }

      if (effect.type === "EMIT_EVENT") {
        const emittedEnemySlotId = currentEnemyResolutionSlotId ?? undefined;
        const event: RotationCombatEvent = {
          type: effect.eventType,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          enemySlotId: emittedEnemySlotId,
          affectedEnemySlotIds: emittedEnemySlotId ? [emittedEnemySlotId] : undefined,
          label: effect.label ?? effect.eventType,
          amount: effect.amount,
          commandAttackType: effect.commandAttackType ?? args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
          damageType: effect.damageType,
        };
        emitEvent(event);
        dispatchPassiveListeners(event, args.triggerSlots);
        continue;
      }

      if (effect.type === "FORCE_CONTROL_SWITCH") {
        trySwitchControlledOperator({
          nextSlot: args.actor.slot,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          label: effect.label ?? `${args.actor.characterName} Switched In`,
          ignoreCooldown: true,
        });
        continue;
      }

      if (effect.type === "APPLY_STATUS") {
        if (args.blockEnemyTargetEffects && effect.target === "enemy") {
          continue;
        }
        const statusDefinition = getCombatStatusDefinition(effect.statusId);
        if (effect.target === "self" && statusDefinition?.operatorApplicationModel === "actor_arts_infliction" && statusDefinition.element) {
          applyActorArtsInfliction({
            slot: args.actor.slot,
            element: statusDefinition.element,
            durationSeconds: effect.durationSeconds,
            stacks: effect.stacks,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
          });
          continue;
        }
        if (effect.target === "self" && statusDefinition?.operatorApplicationModel === "actor_status") {
          const expiresAt = (effect.timeScale ?? "game") === "real"
            ? args.time + effect.durationSeconds
            : args.gameTime + effect.durationSeconds;
          setActorStatusById({
            slot: args.actor.slot,
            statusId: effect.statusId,
            label: effect.label ?? statusDefinition.label.en,
            expiresAt,
            timeScale: effect.timeScale ?? statusDefinition.defaultTimeScale ?? "game",
            kind: statusDefinition.defaultKind,
            hidden: effect.hidden ?? statusDefinition.defaultHidden,
            stacks: effect.stacks != null ? Math.max(1, effect.stacks) : undefined,
            metadata: {
              blocksOperatorArtsInflictionElements: effect.blocksOperatorArtsInflictionElements ?? statusDefinition.blocksOperatorArtsInflictionElements,
            },
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            reason: "command_apply_actor_status",
          });
          continue;
        }
        applyTimedStatus({
          effect,
          sourceSlot: args.actor.slot,
          stepId: args.stepId,
          time: args.time,
          gameTime: args.gameTime,
          triggerSlots: args.triggerSlots,
          sourceCommandAttackType: args.sourceCommandAttackType ?? commandAttackTypeByStepId.get(args.stepId),
          linkSourceStepId: resolvedLinkSourceStepId,
        });
        continue;
      }

      if (effect.type === "APPLY_PHYSICAL_INFLICTION") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        applyEnemyPhysicalInflictionEffect({
          stacks: effect.stacks,
          durationSeconds: effect.durationSeconds,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          sourceCommandAttackType: args.sourceCommandAttackType,
        });
        continue;
      }

      if (effect.type === "APPLY_GILBERTA_GRAVITY_FIELD_SUS") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const targetEnemySlotIds = currentEnemyResolutionSlotId != null
          ? [currentEnemyResolutionSlotId]
          : normalizedEnemySlots
            .map((slot) => slot.slotId)
            .filter((slotId) => isEnemyPresent(slotId));
        const hasPotential2 = args.actor.characterId === "gilberta" && args.actor.potentialLevel >= 2;
        const baseSus = effect.baseSusPct ?? 0;
        const perStackSus = (effect.perStackSusPct ?? 0) * (hasPotential2 ? 2 : 1);
        const fourStackSus = effect.fourStackSusPct;

        for (const enemySlotId of targetEnemySlotIds) {
          withEnemyResolutionSlot(enemySlotId, () => {
            const vulnerabilityStacks = Math.max(0, getEnemyPhysicalInfliction(enemySlotId)?.stacks ?? 0);
            const effectiveStacks = hasPotential2
              ? Math.min(4, vulnerabilityStacks + 1)
              : Math.min(4, vulnerabilityStacks);
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
              enemySlotId,
            });
          });
        }
        continue;
      }

      if (effect.type === "GRANT_SP_FROM_VULNERABILITY_STACKS") {
        const vulnerabilityStacks = Math.max(0, Math.min(4, getEnemyPhysicalInfliction()?.stacks ?? 0));
        if (vulnerabilityStacks <= 0) {
          continue;
        }
        const amount =
          vulnerabilityStacks >= 4
            ? effect.amountAt4 ?? 0
            : vulnerabilityStacks === 3
              ? effect.amountAt3 ?? 0
              : vulnerabilityStacks === 2
                ? effect.amountAt2 ?? 0
                : effect.amountAt1 ?? 0;
        if (amount <= 0) {
          continue;
        }
        emitEvent({
          type: "SP_GENERATED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: effect.label ?? `${args.actor.characterName} Skill Generated SP`,
          amount,
          commandAttackType: args.sourceCommandAttackType,
        });
        emitEvent({
          type: "SKILL_SP_RECOVERED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: effect.label ?? `${args.actor.characterName} Skill Recovered SP`,
          amount,
          commandAttackType: args.sourceCommandAttackType,
        });
        continue;
      }

      if (effect.type === "GRANT_SP") {
        const amount = Math.max(0, effect.amount);
        if (amount <= 0) {
          continue;
        }
        emitEvent({
          type: "SP_GENERATED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: effect.label ?? `${args.actor.characterName} Skill Generated SP`,
          amount,
          commandAttackType: args.sourceCommandAttackType,
        });
        emitEvent({
          type: "SKILL_SP_RECOVERED",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          slot: args.actor.slot,
          sourceSlot: args.actor.slot,
          label: effect.label ?? `${args.actor.characterName} Skill Recovered SP`,
          amount,
          commandAttackType: args.sourceCommandAttackType,
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
        const statusDefinition = getCombatStatusDefinition(effect.statusId);
        if (effect.target === "self" && statusDefinition?.operatorApplicationModel === "actor_arts_infliction") {
          removeActorStatusById({
            slot: args.actor.slot,
            statusId: effect.statusId,
            kind: "infliction",
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            reason: "command_remove_actor_status",
          });
          continue;
        }
        if (effect.target === "self" && statusDefinition?.operatorApplicationModel === "actor_status") {
          removeActorStatusById({
            slot: args.actor.slot,
            statusId: effect.statusId,
            kind: statusDefinition.defaultKind,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
            reason: "command_remove_actor_status",
          });
          continue;
        }
        removeTimedStatus({
          statusId: effect.statusId,
          sourceSlot: args.actor.slot,
          target: effect.target,
          fieldStatus: effect.fieldStatus,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          linkSourceStepId: resolvedLinkSourceStepId,
        });
        continue;
      }

      if (effect.type === "APPLY_BUFF" && effect.requiresSelfBuffId) {
        const selfBuffStacks = getActorBuffStackCount({
          slot: args.actor.slot,
          buffId: effect.requiresSelfBuffId,
        });
        if (selfBuffStacks <= 0) {
          continue;
        }
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
        const resolvedEffects = resolveBuffEffectsForActor({ effect, actor: args.actor, time: args.time, gameTime: args.gameTime });
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
        const resolvedEffects = resolveBuffEffectsForActor({ effect, actor: args.actor, time: args.time, gameTime: args.gameTime });
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
              time: args.time,
              gameTime: args.gameTime,
              stepId: args.stepId,
            });
            continue;
          }
          removeActorBuff({
            slot: args.actor.slot,
            buffId: effect.buffId,
            time: args.time,
            gameTime: args.gameTime,
            stepId: args.stepId,
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
          triggerSlots: args.triggerSlots,
          commandAttackType:
            args.sourceCommandAttackType
            ?? commandAttackTypeByStepId.get(args.stepId)
            ?? commandAttackTypeByStepId.get(getRootStepId(args.stepId)),
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
          effects: resolveBuffEffectsForActor({ effect, actor: args.actor, time: args.time, gameTime: args.gameTime }),
          durationSeconds: effect.durationSeconds ?? 0,
          timeScale: effect.timeScale ?? "game",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          singleEventPerStep: effect.singleEventPerStep,
        });
        continue;
      }

      if (effect.type === "APPLY_ARTS_INFLICTION") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        applyEnemyArtsInflictionEffect({
          element: effect.element,
          stacks: effect.stacks,
          durationSeconds: effect.durationSeconds,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
          sourceCommandAttackType: args.sourceCommandAttackType,
          linkSourceStepId: resolvedLinkSourceStepId,
        });
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
            baseMultiplier: effect.useSourceHitMultiplier
              ? (args.sourceHit?.multiplier ?? effect.baseMultiplier)
              : effect.baseMultiplier,
            linkSourceStepId: resolvedLinkSourceStepId,
            sourceCommandId: args.sourceCommandId,
            sourceCommandName: args.sourceCommandName,
            useSourceCommandAsReactionHit: effect.useSourceCommandAsReactionHit,
            reactionHitName: effect.reactionHitName,
            stagger: effect.stagger,
            singleEventPerStep: effect.singleEventPerStep,
          });
          continue;
        }

        applyReaction({
          reaction: effect.reaction,
          level: effect.level ?? 1,
          durationSeconds: effect.durationSeconds,
          debuffScaleMultiplier: effect.debuffScaleMultiplier,
          customBaseDebuffAmount: effect.customBaseDebuffAmount,
          customBaseTickMultiplier: effect.customBaseTickMultiplier,
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
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
        continue;
      }

      if (effect.type === "APPLY_CUSTOM_REACTION" && effect.reactionId === "DAPAN_COMBO_CRUSH") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const vulnerabilityStacks = Math.max(0, getEnemyPhysicalInfliction()?.stacks ?? 0);
        if (vulnerabilityStacks <= 0) {
          continue;
        }
        const crushMultiplier = effect.crushMultiplier ?? 1;
        const baseMultiplier = (1.5 + 1.5 * vulnerabilityStacks) * crushMultiplier;
        applyPhysicalReaction({
          reaction: "Crush",
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
          sourceSlot: args.actor.slot,
          triggerSlots: args.triggerSlots,
          forceApply: true,
          reactionDamage: true,
          baseMultiplier,
          linkSourceStepId: resolvedLinkSourceStepId,
          sourceCommandId: args.sourceCommandId,
          sourceCommandName: args.sourceCommandName,
        });
        continue;
      }

      if (effect.type === "APPLY_CUSTOM_REACTION" && effect.reactionId === "YVONNE_BATTLE_SKILL_FREEZE") {
        if (args.blockEnemyTargetEffects) {
          continue;
        }
        const enemySlotId = getResolvedEnemySlotId();
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
        setEnemyArtsInfliction(null, enemySlotId, {
          time: args.time,
          gameTime: args.gameTime,
          stepId: args.stepId,
        });

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
          ignoreUltimateGainEfficiency: false,
          attackType: "BATTLE_SKILL",
          damageType: "Cryo",
          targets: "all_enemies",
          ignoreEnemyInvulnerability: false,
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

        const battleSkillHitEvent: RotationCombatEvent = {
          type: "BATTLE_SKILL_HIT",
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
        emitEvent(battleSkillHitEvent);
        dispatchPassiveListeners(battleSkillHitEvent, args.triggerSlots);

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

  const runResolvedHitHooksForSource = (args: {
    time: number;
    gameTime: number;
    stepId: string;
    effectTree?: CombatEffectTree;
    triggerSlots: CharacterCombatSnapshot["slot"][];
    isControlledOperatorHit: boolean;
    affectedEnemySlotIds?: EnemySlotId[];
    occurrence?: HitOccurrence;
    occurrenceIndex?: number;
    source: {
      slot: 0 | 1 | 2 | 3;
      characterId: string;
      characterName: string;
      commandId: string;
      commandName: string;
      hitIndex: number;
      hitName?: string;
    };
    flags: {
      isFinalStrikeOfBasicSequence: boolean;
      isFinisherHit: boolean;
      dealsDamage: boolean;
    };
  }) => {
    const hookTime = args.occurrence?.time ?? args.time;
    const hookGameTime = args.occurrence?.gameTime ?? args.gameTime;
    const hookStepId = args.occurrence?.action.stepId ?? args.stepId;
    const hookCommandAttackType =
      args.occurrence?.command.attackType
      ?? commandAttackTypeByStepId.get(args.stepId)
      ?? "GENERIC";
    const primaryHitEnemySlotId = args.affectedEnemySlotIds?.[0] ?? null;
    const getHitEnemySlotId = (enemySlotId?: EnemySlotId) =>
      enemySlotId ?? primaryHitEnemySlotId ?? currentTargetedEnemySlotId;
    const resolveHitHookEnemySlotId = (enemyRef?: CombatHookEnemyRef) => {
      if (typeof enemyRef === "string") {
        return getHitEnemySlotId(enemyRef);
      }
      if (isCombatHookEnemyRefObject(enemyRef) && enemyRef.enemySlotId) {
        return getHitEnemySlotId(enemyRef.enemySlotId);
      }
      const enemySelector: CombatHookEnemySelector | undefined =
        isCombatHookEnemyRefObject(enemyRef) ? enemyRef.enemy : undefined;
      if (enemySelector === "targeted") {
        return currentTargetedEnemySlotId;
      }
      return getHitEnemySlotId();
    };
    for (const baseMember of party) {
      const member = getRuntimeActorBySlot(baseMember.slot) ?? baseMember;
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
        time: args.time,
        gameTime: args.gameTime,
        stepId: args.stepId,
        effectTree: args.effectTree,
        source: {
          slot: args.source.slot,
          characterId: args.source.characterId,
          characterName: args.source.characterName,
          commandId: args.source.commandId,
          commandName: args.source.commandName,
          hitIndex: args.source.hitIndex,
          hitName: args.source.hitName,
          isControlledOperatorHit: args.isControlledOperatorHit,
        },
        enemySlotId: primaryHitEnemySlotId ?? undefined,
        affectedEnemySlotIds: [...(args.affectedEnemySlotIds ?? [])],
        flags: args.flags,
        state: {
          getPrimaryEnemySlotId: () => primaryHitEnemySlotId,
          getActiveEnemySlotIds: () =>
            normalizedEnemySlots
              .map((slot) => slot.slotId)
              .filter((slotId) => isEnemyPresent(slotId)),
          getAffectedEnemySlotIds: () => [...(args.affectedEnemySlotIds ?? [])],
          getEnemyArtsInfliction: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyArtsInfliction(resolveHitHookEnemySlotId(enemyRef)),
          getEnemyHpRatio: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyHpRatioAtTime(hookTime, resolveHitHookEnemySlotId(enemyRef)),
          getEnemyVulnerabilityStacks: (enemyRef?: CombatHookEnemyRef) =>
            getEnemyPhysicalInfliction(resolveHitHookEnemySlotId(enemyRef))?.stacks ?? 0,
          setEnemyArtsInfliction: (value: CombatHookEnemyArtsInflictionState | null, enemyRef?: CombatHookEnemyRef) => {
            setEnemyArtsInfliction(value ? { ...value } : null, resolveHitHookEnemySlotId(enemyRef), {
              time: hookTime,
              gameTime: hookGameTime,
              stepId: args.stepId,
            });
          },
          hasEnemyStatus: (statusId: string, enemyRef?: CombatHookEnemyRef) =>
            hasUnifiedStatus({
              statusId,
              target: "enemy",
              enemySlotId: resolveHitHookEnemySlotId(enemyRef),
              sourceSlot: member.slot,
              realTime: hookTime,
              gameTime: hookGameTime,
            }),
          hasStatus: (hookArgs) =>
            hasUnifiedStatus({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveHitHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: hookTime,
              gameTime: hookGameTime,
            }),
          getStatusSourceStepId: (hookArgs) => {
            const target = hookArgs.target ?? "self";
            const resolvedEnemySlotId = resolveHitHookEnemySlotId(
              hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
            );
            const statuses = getUnifiedStatuses({
              realTime: hookTime,
              gameTime: hookGameTime,
            });
            const matched = statuses.find((status) =>
              status.id === hookArgs.statusId
              && (
                (target === "enemy" && status.scope === "enemy" && resolveEnemyStatusSlotId(status.enemySlotId) === resolvedEnemySlotId)
                || (target === "field" && status.fieldStatus === true)
                || (target === "global" && status.scope === "global")
                || (target === "self" && status.scope === "actor" && status.targetSlot === member.slot)
              ),
            );
            const sourceStepId = matched?.metadata?.sourceStepId;
            return typeof sourceStepId === "string" && sourceStepId.length > 0 ? sourceStepId : null;
          },
          getStatusRemainingSeconds: (hookArgs) =>
            getUnifiedStatusRemainingSeconds({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveHitHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: hookTime,
              gameTime: hookGameTime,
            }),
          getStatusStackCount: (hookArgs) =>
            getUnifiedStatusStackCount({
              statusId: hookArgs.statusId,
              sourceSlot: member.slot,
              target: hookArgs.target,
              enemySlotId: resolveHitHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: hookTime,
              gameTime: hookGameTime,
            }),
          getActorStatusStackCount: ({ slot, statusId }) =>
            runtimeStatuses.filter((status) =>
              status.scope === "actor" && status.targetSlot === slot && status.id === statusId,
            ).length,
          consumeEnemyStatusStacks: (hookArgs) =>
            consumeEnemyStatusForAccumulator({
              statusId: hookArgs.statusId,
              maxConsumed: hookArgs.maxConsumed,
              useLevelAsStacks: hookArgs.useLevelAsStacks ?? false,
              enemySlotId: resolveHitHookEnemySlotId(
                hookArgs.enemySlotId ? hookArgs.enemySlotId : { enemy: hookArgs.enemy },
              ),
              realTime: hookTime,
              gameTime: hookGameTime,
              sourceSlot: member.slot,
              stepId: hookStepId,
              commandAttackType: hookCommandAttackType,
              triggerSlots: args.triggerSlots,
            }),
          hasSelfBuff: (buffId: string) => {
            cleanupStateAt(hookTime, hookGameTime);
            return getActorBuffs().some(
              (buff) =>
                buff.slot === member.slot &&
                (buff.id === buffId || buff.id.startsWith(`${buffId}:`)),
            );
          },
          getSelfBuffStackCount: (buffId: string) => {
            cleanupStateAt(hookTime, hookGameTime);
            return getActorBuffStackCount({
              slot: member.slot,
              buffId,
            });
          },
          getSelfBuffRemainingSeconds: (buffId: string) =>
            getActorBuffRemainingSeconds({
              slot: member.slot,
              buffId,
              time: hookTime,
              gameTime: hookGameTime,
            }),
          getSelfMeltingFlameStacks: () => getMeltingFlameStacks(member.slot),
          gainSelfMeltingFlameStacks: (stacks: number, label?: string) => {
            gainMeltingFlameStacks({
              slot: member.slot,
              stacks,
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
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
          getActorModifierValue: ({ slot, stat }) => {
            const actor = getRuntimeActorBySlot(slot) ?? partyBySlot.get(slot);
            if (!actor) {
              return 0;
            }
            return getEffectiveActorMods(actor, hookTime, hookGameTime)[stat] ?? 0;
          },
          getSelfCommandHit: (commandId: string, hitIndex: number) => {
            const command = member.commands.find((entry) => entry.id === commandId);
            return command?.hits[hitIndex] ?? null;
          },
          applySelfBuff: (hookArgs) => {
            applyActorBuff({
              slot: member.slot,
              sourceSlot: member.slot,
              stepId: hookStepId,
              time: hookTime,
              gameTime: hookGameTime,
              buffId: hookArgs.buffId,
              label: hookArgs.label,
              hidden: hookArgs.hidden,
              durationSeconds: hookArgs.durationSeconds,
              infiniteDuration: hookArgs.infiniteDuration,
              timeScale: hookArgs.timeScale ?? "game",
              effects: hookArgs.effects,
              stackGroup: hookArgs.stackGroup,
              maxStacks: hookArgs.maxStacks,
              refreshExistingStacks: hookArgs.refreshExistingStacks,
            });
          },
          applyOtherTeammatesBuff: (hookArgs) => {
            for (const teammateBase of party) {
              const teammate = getRuntimeActorBySlot(teammateBase.slot) ?? teammateBase;
              if (teammate.slot === member.slot) {
                continue;
              }
              if (hookArgs.classes && hookArgs.classes.length > 0 && !hookArgs.classes.includes(teammate.characterClass)) {
                continue;
              }

              applyActorBuff({
                slot: teammate.slot,
                sourceSlot: member.slot,
                stepId: hookStepId,
                time: hookTime,
                gameTime: hookGameTime,
                buffId: hookArgs.buffId,
                label: hookArgs.label,
                hidden: hookArgs.hidden,
                durationSeconds: hookArgs.durationSeconds,
                infiniteDuration: hookArgs.infiniteDuration,
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
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              sourceSlot: member.slot,
            });
          },
          grantReturnedSp: (amount: number, label: string) => {
            if (amount <= 0) {
              return;
            }
            const spReturnedEvent: RotationCombatEvent = {
              type: "SP_RETURNED",
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: hookCommandAttackType,
            };
            emitEvent(spReturnedEvent);
            dispatchPassiveListeners(spReturnedEvent);

            const event: RotationCombatEvent = {
              type: "SKILL_SP_RECOVERED",
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: hookCommandAttackType,
            };
            emitEvent(event);
            dispatchPassiveListeners(event);
          },
          grantGeneratedSp: (amount: number, label: string) => {
            if (amount <= 0) {
              return;
            }
            const spGeneratedEvent: RotationCombatEvent = {
              type: "SP_GENERATED",
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: hookCommandAttackType,
            };
            emitEvent(spGeneratedEvent);
            dispatchPassiveListeners(spGeneratedEvent);

            const spRecoveredEvent: RotationCombatEvent = {
              type: "SKILL_SP_RECOVERED",
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              slot: member.slot,
              sourceSlot: member.slot,
              label,
              amount,
              commandAttackType: hookCommandAttackType,
            };
            emitEvent(spRecoveredEvent);
            dispatchPassiveListeners(spRecoveredEvent);
          },
          gainTeamLinkStacks: (hookArgs) => {
            gainTeamLinkStacks({
              stacks: hookArgs.stacks,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale ?? "game",
              time: hookTime,
              gameTime: hookGameTime,
              sourceSlot: member.slot,
              stepId: hookStepId,
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
              time: hookTime,
              gameTime: hookGameTime,
              sourceSlot: member.slot,
              stepId: hookStepId,
            }),
          consumeTeamStatusStacks: (hookArgs) =>
            consumeTeamStatusStacks({
              statusId: hookArgs.statusId,
              stacks: hookArgs.stacks,
              time: hookTime,
              gameTime: hookGameTime,
              sourceSlot: member.slot,
              stepId: hookStepId,
            }),
          getTeamStatusStackCount: (statusId: string) =>
            runtimeStatuses.filter((status) =>
              status.scope === "team" && status.kind === "team_status" && status.id === statusId,
            ).length,
          clearTeamCryoDebuffs: () => {
            clearTeamCryoDebuffs({
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              reason: "hook_clear_team_cryo_debuffs",
            });
          },
          applyCommandHitHealing: (hookArgs) =>
            applyCommandHitHealing({
              sourceActor: member,
              commandId: hookArgs.commandId,
              hitIndex: hookArgs.hitIndex,
              target: hookArgs.target ?? "controlled",
              label: hookArgs.label,
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
            }),
          restoreHpToSlot: (hookArgs) =>
            restoreHpToSlot({
              sourceActor: member,
              targetSlot: hookArgs.slot,
              baseAmount: hookArgs.baseAmount,
              label: hookArgs.label,
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
            }),
          applyStatusToSlot: (hookArgs) =>
            applyStatusToSlot({
              sourceActor: member,
              targetSlot: hookArgs.slot,
              statusId: hookArgs.statusId,
              label: hookArgs.label,
              effects: hookArgs.effects,
              blocksOperatorArtsInflictionElements: hookArgs.blocksOperatorArtsInflictionElements,
              durationSeconds: hookArgs.durationSeconds,
              timeScale: hookArgs.timeScale,
              hidden: hookArgs.hidden,
              stacks: hookArgs.stacks,
              maxStacks: hookArgs.maxStacks,
              refreshExistingStacks: hookArgs.refreshExistingStacks,
              independentStacks: hookArgs.independentStacks,
              pauseStatusIds: hookArgs.pauseStatusIds,
              periods: hookArgs.periods,
              maxPeriods: hookArgs.maxPeriods,
              initialEffects: hookArgs.initialEffects,
              periodicEffects: hookArgs.periodicEffects,
              expireEffects: hookArgs.expireEffects,
              removeEffects: hookArgs.removeEffects,
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookStepId,
              sourceCommandAttackType: hookCommandAttackType,
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
            if (!args.occurrence || args.occurrenceIndex == null) {
              return false;
            }
            const repeatKey = `${hookStepId}:${member.slot}:${key}`;
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
              time: hookTime,
              gameTime: hookGameTime,
              sourceStepId: hookStepId,
              sourceEventType:
                (hookArgs?.sourceEventType as RotationCombatEvent["type"]) ?? "BATTLE_SKILL_HIT",
              label: hookArgs?.label ?? `${member.characterName} Combo Triggered`,
              comboCommandId: hookArgs?.comboCommandId,
            });
            if (triggered && !args.triggerSlots.includes(member.slot)) {
              args.triggerSlots.push(member.slot);
            }
            return triggered;
          },
          shortenSelfComboCooldownByRatio: (ratio: number) => {
            shortenComboCooldownByRatio({
              slot: member.slot,
              ratio,
              time: hookTime,
              gameTime: hookGameTime,
            });
          },
          pauseTeamComboCooldowns: (hookArgs) => {
            pauseTeamComboCooldowns({
              durationSeconds: hookArgs.durationSeconds,
              time: hookTime,
            });
          },
          emitEvent: (event) => {
            emitEvent({
              type: event.type as RotationCombatEvent["type"],
              time: hookTime,
              gameTime: hookGameTime,
              effectTree: extendMemberEffectTree({
                tree: args.effectTree,
                kind: "character_hook",
                member,
                stepId: hookStepId,
              }),
              stepId: hookStepId,
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
              time: hookTime,
              gameTime: hookGameTime,
              stepId: hookArgs.stepId ?? hookStepId,
              actor: member,
              triggerSlots: args.triggerSlots,
              effectTree: hookArgs.effectTree ?? extendMemberEffectTree({
                tree: args.effectTree,
                kind: "character_hook",
                member,
                stepId: hookArgs.stepId ?? hookStepId,
              }),
              critRigStepId: hookStepId,
            });
          },
          applyEffectsToEnemySlot: (hookArgs) => {
            withEnemyResolutionSlot(hookArgs.enemySlotId, () => {
              applyHitEffects({
                effects: hookArgs.effects,
                time: hookTime,
                gameTime: hookGameTime,
                stepId: hookArgs.stepId ?? hookStepId,
                actor: member,
                triggerSlots: args.triggerSlots,
                effectTree: hookArgs.effectTree ?? extendMemberEffectTree({
                  tree: args.effectTree,
                  kind: "character_hook",
                  member,
                  stepId: hookArgs.stepId ?? hookStepId,
                }),
                critRigStepId: hookStepId,
              });
            });
          },
        },
      });
    }
  };

  const runResolvedHitHooks = (args: {
    occurrence: HitOccurrence;
    isControlledOperatorHit: boolean;
    occurrenceIndex: number;
    triggerSlots: CharacterCombatSnapshot["slot"][];
    effectTree?: CombatEffectTree;
    affectedEnemySlotIds?: EnemySlotId[];
  }) => {
    runResolvedHitHooksForSource({
      time: args.occurrence.time,
      gameTime: args.occurrence.gameTime,
      stepId: args.occurrence.action.stepId,
      effectTree: args.effectTree,
      occurrence: args.occurrence,
      occurrenceIndex: args.occurrenceIndex,
      triggerSlots: args.triggerSlots,
      isControlledOperatorHit: args.isControlledOperatorHit,
      affectedEnemySlotIds: args.affectedEnemySlotIds,
      source: {
        slot: args.occurrence.actor.slot,
        characterId: args.occurrence.actor.characterId,
        characterName: args.occurrence.actor.characterName,
        commandId: args.occurrence.command.id,
        commandName: args.occurrence.command.name,
        hitIndex: args.occurrence.hitIndex,
        hitName: args.occurrence.hit.name,
      },
      flags: {
        isFinalStrikeOfBasicSequence: args.occurrence.isFinalStrikeOfBasicSequence,
        isFinisherHit: args.occurrence.isFinisherHit,
        dealsDamage: args.occurrence.hit.multiplier > 0 || args.occurrence.hit.flatAmount > 0,
      },
    });
  };

  const occurrences: Array<ActionOccurrence | ActionEndOccurrence | HitOccurrence> = [];
  const actionsInTimeOrder = [...actions].sort((left, right) => {
    if (left.realStartTime !== right.realStartTime) {
      return left.realStartTime - right.realStartTime;
    }
    return left.slot - right.slot;
  });
  const resumeOccurrenceThreshold = resumeCheckpoint
    ? resumeCheckpoint.time - 0.0001
    : Number.NEGATIVE_INFINITY;
  const actionsForOccurrenceBuild = resumeCheckpoint
    ? actionsInTimeOrder.filter((action) => action.realEndTime >= resumeOccurrenceThreshold)
    : actionsInTimeOrder;

  const firstAction = actionsInTimeOrder[0];
  const initialSnapshotRealTime = firstAction && firstAction.realStartTime < 0 ? firstAction.realStartTime : 0;
  const initialSnapshotGameTime = firstAction && firstAction.realStartTime < 0 ? firstAction.startTime : 0;

  if (!resumeCheckpoint) {
    for (const member of party) {
      activeBuildVariantBySlot.set(member.slot, Math.max(0, Math.min(3, args.initialVariantIndex ?? 0)));
      actorMaxHpBySlot.set(member.slot, member.maxHp);
      actorCurrentHpBySlot.set(member.slot, member.maxHp);
      initializeSnapshotForSlot({
        slot: member.slot,
        time: initialSnapshotRealTime,
        gameTime: initialSnapshotGameTime,
        includeGearSet: true,
        includeWeapon: true,
      });
      recordActorState(member.slot, initialSnapshotRealTime, initialSnapshotGameTime);
    }
    for (const enemySlot of normalizedEnemySlots) {
      const runtime = enemyRuntimeBySlot.get(enemySlot.slotId);
      if (!runtime) {
        continue;
      }
      enemyHpDeltaHistoryBySlot.set(enemySlot.slotId, []);
      enemyHpHistoryBySlot.set(enemySlot.slotId, [{
        time: initialSnapshotRealTime,
        hp: runtime.stats.hp,
        maxHp: runtime.stats.hp,
      }]);
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
        time: initialSnapshotRealTime,
        gameTime: initialSnapshotGameTime,
        buffId: `consumable:${consumable.id}`,
        label: consumable.name,
        durationSeconds: consumable.durationSeconds,
        timeScale: "game",
        effects: consumable.effects,
      });
    }
    for (const member of party) {
      if (Object.keys(resolvedContracts.operatorModifierEffects).length > 0) {
        applyActorBuff({
          slot: member.slot,
          sourceSlot: member.slot,
          stepId: "__contract_operator_modifiers",
          time: initialSnapshotRealTime,
          gameTime: initialSnapshotGameTime,
          buffId: "contract_operator_modifiers",
          label: "Contract Operator Modifiers",
          durationSeconds: 0,
          infiniteDuration: true,
          timeScale: "game",
          effects: resolvedContracts.operatorModifierEffects,
        });
      }
      const poorBasicsVariant = getActiveContractVariant("basic_attack_breakdown");
      if (poorBasicsVariant) {
        applyContractTokenBuff({
          slot: member.slot,
          buffId: "contract_token_poor_basics",
          label: poorBasicsVariant.name,
          time: initialSnapshotRealTime,
          gameTime: initialSnapshotGameTime,
          stepId: "__contract_token_poor_basics",
        });
      }
      const auxiliaryVariant = getActiveContractVariant("auxiliary_rebalance");
      if (auxiliaryVariant) {
        applyContractTokenBuff({
          slot: member.slot,
          buffId: `contract_token_${auxiliaryVariant.id}`,
          label: auxiliaryVariant.name,
          time: initialSnapshotRealTime,
          gameTime: initialSnapshotGameTime,
          stepId: `__contract_token_${auxiliaryVariant.id}`,
        });
      }
    }
    if (Object.keys(resolvedContracts.enemyModifierEffects).length > 0) {
      for (const enemySlot of normalizedEnemySlots) {
        withEnemyResolutionSlot(enemySlot.slotId, () => {
          applyEnemyBuff({
            buffId: "contract_enemy_modifiers",
            label: "Contract Enemy Modifiers",
            effects: resolvedContracts.enemyModifierEffects,
            durationSeconds: Number.POSITIVE_INFINITY,
            timeScale: "game",
            time: initialSnapshotRealTime,
            gameTime: initialSnapshotGameTime,
            stepId: "__contract_enemy_modifiers",
            sourceSlot: controlledOperatorSlot,
            enemySlotId: enemySlot.slotId,
          });
        });
      }
    }
    if (resolvedContracts.decapitationDamageTakenPct != null && resolvedContracts.decapitationDamageTakenPct > 0) {
      applyActorBuff({
        slot: controlledOperatorSlot,
        sourceSlot: controlledOperatorSlot,
        stepId: "__contract_decapitation_init",
        time: initialSnapshotRealTime,
        gameTime: initialSnapshotGameTime,
        buffId: "contract_decapitation_controlled",
        label: "Decapitation",
        durationSeconds: 0,
        infiniteDuration: true,
        timeScale: "game",
        effects: {
          DMG_TAKEN_PCT: resolvedContracts.decapitationDamageTakenPct,
        },
      });
    }
    initializeCombat({
      time: 0,
      gameTime: 0,
      stepId: "__combat_init",
    });
    recordEnemyState(initialSnapshotRealTime, initialSnapshotGameTime);
    captureSimulationCheckpoint(0, 0);
    nextSimulationCheckpointTime = SIMULATION_CHECKPOINT_CHUNK_SECONDS;
  } else {
    if (shouldEmitRotationRelayedEvent) {
      const relayStartTime = explicitRelayStartTime ?? resumeCheckpoint.time;
      const relayStartGameTime = explicitRelayStartGameTime
        ?? (explicitRelayStartTime != null ? timeContext.toGameTime(explicitRelayStartTime) : resumeCheckpoint.gameTime);
      const relayStartedEvent: RotationCombatEvent = {
        type: "ROTATION_RELAYED",
        time: relayStartTime,
        gameTime: relayStartGameTime,
        label: "Rotation Relayed",
      };
      emitEvent(relayStartedEvent);
      dispatchPassiveListeners(relayStartedEvent);
    }
    nextSimulationCheckpointTime = Math.max(
      SIMULATION_CHECKPOINT_CHUNK_SECONDS,
      (Math.floor(Math.max(0, resumeCheckpoint.time) / SIMULATION_CHECKPOINT_CHUNK_SECONDS) + 1)
        * SIMULATION_CHECKPOINT_CHUNK_SECONDS,
    );
  }

  for (const action of actionsForOccurrenceBuild) {
    const currentVariant = activeBuildVariantBySlot.get(action.slot) ?? 0;
    const actor = partyVariantsBySlot.get(action.slot)?.[currentVariant] ?? partyBySlot.get(action.slot);
    if (!actor) {
      continue;
    }

    const command = actor.commands.find((entry) => entry.id === action.commandId);
    if (!command) {
      continue;
    }
    if (
      command.genericActionType
      && resolvedContracts.disabledGenericActions.has(command.genericActionType)
    ) {
      action.missed = true;
    }

    if (action.realStartTime >= resumeOccurrenceThreshold) {
      occurrences.push({
        kind: "action-start",
        time: action.realStartTime,
        gameTime: action.startTime,
        actor,
        command,
        action,
      });
    }

    if (action.realEndTime >= resumeOccurrenceThreshold) {
      occurrences.push({
        kind: "action-end",
        time: action.realEndTime,
        gameTime: action.endTime,
        actor,
        command,
        action,
      });
    }

    if (action.missed || action.interrupted) {
      if (command.genericActionType === "switch_build") {
        const map = action.buildSwapMap ?? [1, 2, 3, 0];
        const nextVariant = map[currentVariant] ?? currentVariant;
        const clampedNextVariant = Math.max(0, Math.min(3, nextVariant));
        const previousActor = actor;
        activeBuildVariantBySlot.set(action.slot, clampedNextVariant);
        const nextActor = getRuntimeActorBySlot(action.slot) ?? previousActor;
        const gearChanged = (previousActor.activeGearSet?.name ?? "") !== (nextActor.activeGearSet?.name ?? "");
        const weaponChanged = previousActor.weaponId !== nextActor.weaponId;
        initializeSnapshotForSlot({
          slot: action.slot,
          time: action.realStartTime,
          gameTime: action.startTime,
          includeGearSet: gearChanged,
          includeWeapon: weaponChanged,
        });
      }
      continue;
    }

    if (command.genericActionType === "switch_build") {
      const map = action.buildSwapMap ?? [1, 2, 3, 0];
      const nextVariant = map[currentVariant] ?? currentVariant;
      const clampedNextVariant = Math.max(0, Math.min(3, nextVariant));
      const previousActor = actor;
      activeBuildVariantBySlot.set(action.slot, clampedNextVariant);
      const nextActor = getRuntimeActorBySlot(action.slot) ?? previousActor;
      const gearChanged = (previousActor.activeGearSet?.name ?? "") !== (nextActor.activeGearSet?.name ?? "");
      const weaponChanged = previousActor.weaponId !== nextActor.weaponId;
      initializeSnapshotForSlot({
        slot: action.slot,
        time: action.realStartTime,
        gameTime: action.startTime,
        includeGearSet: gearChanged,
        includeWeapon: weaponChanged,
      });
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
        if (hitTime < resumeOccurrenceThreshold) {
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

  const occurrenceStartIndex = resumeCheckpoint
    ? Math.max(
        0,
        occurrences.findIndex((occurrence) => occurrence.time >= resumeCheckpoint.time - 0.0001),
      )
    : 0;

  const actionsForInterruptProcessing = resumeCheckpoint
    ? actions.filter((action) => action.realEndTime >= resumeOccurrenceThreshold)
    : actions;

  for (const action of actionsForInterruptProcessing) {
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

  for (let occurrenceIndex = occurrenceStartIndex; occurrenceIndex < occurrences.length; occurrenceIndex += 1) {
    const occurrence = occurrences[occurrenceIndex]!;
    commandAttackTypeByStepId.set(occurrence.action.stepId, occurrence.command.attackType);
    flushSimulationCheckpointsUpTo(occurrence.time);
    flushEnemyInterruptedCommandEventsUpTo({ time: occurrence.time });
    processPendingSimulationEventsUpTo({ realTime: occurrence.time, gameTime: occurrence.gameTime });
    cleanupStateAt(occurrence.time, occurrence.gameTime);

    if (occurrence.kind === "action-start") {
      if (hasActorStatusById(PLAYER_SOLIDIFICATION_STATUS_ID, occurrence.actor.slot)) {
        occurrence.action.nullified = true;
        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
        continue;
      }
      if (occurrence.command.genericActionType === "switch_build") {
        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
        continue;
      }
      if (occurrence.command.genericActionType === "switch") {
        trySwitchControlledOperator({
          nextSlot: occurrence.actor.slot,
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          label: `${occurrence.actor.characterName} Switched In`,
        });
        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
        continue;
      }

      if (occurrence.command.attackType === "BATTLE_SKILL") {
        const linkStacks = consumeTeamLinkStacks({ time: occurrence.time, gameTime: occurrence.gameTime });
        if (linkStacks > 0) {
          commandLinkedStacksByStepId.set(occurrence.action.stepId, Math.min(4, linkStacks));
        }
        const commandEffectTree = createCommandEffectTree({
          actor: occurrence.actor,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
        });

        const skillEvent: RotationCombatEvent = {
          type: "SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Skill Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(skillEvent);
        dispatchPassiveListeners(skillEvent);

        const event: RotationCombatEvent = {
          type: "BATTLE_SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Battle Skill Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);
        const existing = castEventEmittedByStepId.get(occurrence.action.stepId) ?? { battleSkill: false, ultimate: false };
        existing.battleSkill = true;
        castEventEmittedByStepId.set(occurrence.action.stepId, existing);
      }

      if (occurrence.command.attackType === "ULTIMATE") {
        const linkStacks = consumeTeamLinkStacks({ time: occurrence.time, gameTime: occurrence.gameTime });
        if (linkStacks > 0) {
          commandLinkedStacksByStepId.set(occurrence.action.stepId, Math.min(4, linkStacks));
        }
        const commandEffectTree = createCommandEffectTree({
          actor: occurrence.actor,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
        });

        const skillEvent: RotationCombatEvent = {
          type: "SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Skill Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(skillEvent);
        dispatchPassiveListeners(skillEvent);

        const event: RotationCombatEvent = {
          type: "ULTIMATE_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Ultimate Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);
        const existing = castEventEmittedByStepId.get(occurrence.action.stepId) ?? { battleSkill: false, ultimate: false };
        existing.ultimate = true;
        castEventEmittedByStepId.set(occurrence.action.stepId, existing);

        recordActorState(occurrence.actor.slot, occurrence.time, occurrence.gameTime);
        recordEnemyState(occurrence.time, occurrence.gameTime);
      }

      if (occurrence.command.attackType === "COMBO_SKILL") {
        const commandEffectTree = createCommandEffectTree({
          actor: occurrence.actor,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
        });
        const skillEvent: RotationCombatEvent = {
          type: "SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Skill Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(skillEvent);
        dispatchPassiveListeners(skillEvent);

        const event: RotationCombatEvent = {
          type: "COMBO_SKILL_CAST",
          time: occurrence.time,
          gameTime: occurrence.gameTime,
          effectTree: commandEffectTree,
          stepId: occurrence.action.stepId,
          commandId: occurrence.command.id,
          commandName: occurrence.command.name,
          slot: occurrence.actor.slot,
          sourceSlot: occurrence.actor.slot,
          label: `${occurrence.actor.characterName} Combo Skill Cast`,
          commandAttackType: occurrence.command.attackType,
          damageType: occurrence.command.damageType,
        };
        emitEvent(event);
        dispatchPassiveListeners(event);

        const cooldownOwnerId = occurrence.command.comboCooldownOwnerCommandId ?? occurrence.command.id;
        if (
          occurrence.command.id === cooldownOwnerId
          && occurrence.command.comboCooldownSeconds > 0
          && occurrence.command.comboCooldownStartsAt === "start"
        ) {
          const cooldownStart = occurrence.command.comboCooldownTimeScale === "real"
            ? occurrence.action.realStartTime
            : occurrence.action.startTime;
          const cooldownDurationSeconds = getComboCooldownDurationSeconds({
            actor: occurrence.actor,
            command: occurrence.command,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
          });
          const remainingPauseDuration = getRemainingComboCooldownPauseDuration(
            occurrence.actor.slot,
            occurrence.time,
          );
          comboCooldownUntilBySlot.set(
            occurrence.actor.slot,
            cooldownStart + cooldownDurationSeconds + remainingPauseDuration,
          );
          pendingComboCooldownBySlot.delete(occurrence.actor.slot);
        }

        const activeWindow = activeComboWindowBySlot.get(occurrence.actor.slot);
        if (
          activeWindow
          && activeWindow.triggerId === (occurrence.command.comboTriggerId ?? occurrence.command.id)
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
          sourceCommandId: occurrence.command.id,
          sourceCommandName: occurrence.command.name,
          sourceCommandAttackType: occurrence.command.attackType,
          effectTree: createCommandEffectTree({
            actor: occurrence.actor,
            stepId: occurrence.action.stepId,
            commandId: occurrence.command.id,
            commandName: occurrence.command.name,
          }),
        });
      }

      continue;
    }

    if (occurrence.kind === "action-end") {
      if (occurrence.action.nullified) {
        continue;
      }
      const interruptedAt = interruptedAtByStepId.get(occurrence.action.stepId);
      if (interruptedAt != null && occurrence.time >= interruptedAt - 0.0001) {
        continue;
      }
      const castEmitted = castEventEmittedByStepId.get(occurrence.action.stepId);
      if (!occurrence.command.delayedEnd) {
        if (occurrence.command.attackType === "BATTLE_SKILL" && castEmitted?.battleSkill) {
          const endEvent: RotationCombatEvent = {
            type: "BATTLE_SKILL_END",
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            slot: occurrence.actor.slot,
            sourceSlot: occurrence.actor.slot,
            label: `${occurrence.actor.characterName} Battle Skill End`,
            commandId: occurrence.command.id,
            commandName: occurrence.command.name,
            commandAttackType: occurrence.command.attackType,
          };
          emitEvent(endEvent);
          dispatchPassiveListeners(endEvent);
        }
        if (occurrence.command.attackType === "ULTIMATE" && castEmitted?.ultimate) {
          const endEvent: RotationCombatEvent = {
            type: "ULTIMATE_END",
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            slot: occurrence.actor.slot,
            sourceSlot: occurrence.actor.slot,
            label: `${occurrence.actor.characterName} Ultimate End`,
            commandId: occurrence.command.id,
            commandName: occurrence.command.name,
            commandAttackType: occurrence.command.attackType,
          };
          emitEvent(endEvent);
          dispatchPassiveListeners(endEvent);
        }
      }
      if (occurrence.command.attackType === "COMBO_SKILL") {
        const cooldownOwnerId = occurrence.command.comboCooldownOwnerCommandId ?? occurrence.command.id;
        if (
          occurrence.command.id === cooldownOwnerId
          && occurrence.command.comboCooldownSeconds > 0
          && occurrence.command.comboCooldownStartsAt === "end"
        ) {
          const cooldownDurationSeconds = getComboCooldownDurationSeconds({
            actor: occurrence.actor,
            command: occurrence.command,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
          });
          pendingComboCooldownBySlot.set(occurrence.actor.slot, {
            durationSeconds: cooldownDurationSeconds,
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
    if (occurrence.action.nullified) {
      continue;
    }
    if (interruptedAt != null && occurrence.time >= interruptedAt - 0.0001) {
      continue;
    }

    const executeCondition = occurrence.hit.executeCondition;
    const repeatHitChainKey = `${occurrence.action.stepId}:${occurrence.command.id}:${occurrence.hitIndex}`;
    if (terminatedRepeatHitChains.has(repeatHitChainKey)) {
      continue;
    }

    const triggeredComboSlots: CharacterCombatSnapshot["slot"][] = [];
    const occurrenceEffectTree = createCommandEffectTree({
      actor: occurrence.actor,
      stepId: occurrence.action.stepId,
      commandId: occurrence.command.id,
      commandName: occurrence.command.name,
      target: occurrence.hit.damageType === "Healing"
        ? { type: "self", slot: occurrence.actor.slot }
        : { type: "enemy" },
    });
    const affectedEnemySlotIds = occurrence.hit.damageType === "Healing"
      ? []
      : resolveAffectedEnemySlotIds(occurrence.hit.targets);
    const eligibleEnemySlotIds = executeCondition && occurrence.hit.damageType !== "Healing"
      ? filterEnemySlotIdsByExecuteCondition({
          executeCondition,
          actor: occurrence.actor,
          enemySlotIds: affectedEnemySlotIds,
          realTime: occurrence.time,
          gameTime: occurrence.gameTime,
          stepId: occurrence.action.stepId,
          isCommandHit: true,
        })
      : affectedEnemySlotIds;
    if (executeCondition && occurrence.hit.damageType === "Healing") {
      const passesHealingExecuteCondition = filterEnemySlotIdsByExecuteCondition({
        executeCondition,
        actor: occurrence.actor,
        enemySlotIds: [currentTargetedEnemySlotId],
        realTime: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        isCommandHit: true,
      }).length > 0;
      if (!passesHealingExecuteCondition) {
        terminatedRepeatHitChains.add(repeatHitChainKey);
        continue;
      }
    }
    if (executeCondition && occurrence.hit.damageType !== "Healing" && eligibleEnemySlotIds.length <= 0) {
      terminatedRepeatHitChains.add(repeatHitChainKey);
      continue;
    }
    const unblockedEnemySlotIds: EnemySlotId[] = [];
    if (occurrence.hit.damageType === "Healing") {
      applyHitEffects({
        effects: occurrence.hit.effects,
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        actor: occurrence.actor,
        triggerSlots: triggeredComboSlots,
        sourceCommandId: occurrence.command.id,
        sourceCommandName: occurrence.command.name,
        sourceCommandAttackType: occurrence.command.attackType,
        linkSourceStepId: occurrence.action.stepId,
        effectTree: occurrenceEffectTree,
        isCommandHit: true,
        blockEnemyTargetEffects: false,
      });
    } else {
      for (const enemySlotId of eligibleEnemySlotIds) {
        const blockedByEnemyInvulnerability = withEnemyResolutionSlot(enemySlotId, () =>
          !occurrence.hit.ignoreEnemyInvulnerability
          && isEnemyHitBlocked({
            sourceSlot: occurrence.actor.slot,
            stepId: occurrence.action.stepId,
            commandId: occurrence.command.id,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
          }));
        withEnemyResolutionSlot(enemySlotId, () => {
          applyHitEffects({
            effects: occurrence.hit.effects,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            actor: occurrence.actor,
            triggerSlots: triggeredComboSlots,
            sourceCommandId: occurrence.command.id,
            sourceCommandName: occurrence.command.name,
            sourceCommandAttackType: occurrence.command.attackType,
            linkSourceStepId: occurrence.action.stepId,
            effectTree: occurrenceEffectTree,
            isCommandHit: true,
            blockEnemyTargetEffects: blockedByEnemyInvulnerability,
          });
        });
        if (blockedByEnemyInvulnerability) {
          withEnemyResolutionSlot(enemySlotId, () => {
            applyHitEffects({
              effects: occurrence.hit.postEffects ?? [],
              time: occurrence.time,
              gameTime: occurrence.gameTime,
              stepId: occurrence.action.stepId,
              actor: occurrence.actor,
              triggerSlots: triggeredComboSlots,
              sourceCommandId: occurrence.command.id,
              sourceCommandName: occurrence.command.name,
              sourceCommandAttackType: occurrence.command.attackType,
              linkSourceStepId: occurrence.action.stepId,
              effectTree: occurrenceEffectTree,
              isCommandHit: true,
              blockEnemyTargetEffects: true,
            });
          });
          continue;
        }
        unblockedEnemySlotIds.push(enemySlotId);
      }
      if (unblockedEnemySlotIds.length <= 0) {
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
    }

    let consumedArtsInflictionStacksForBonus = 0;
    let effectiveHitMultiplier = occurrence.hit.multiplier;
    let effectiveHitFlatAmount = occurrence.hit.flatAmount;
    let effectiveHitStagger = occurrence.hit.stagger;
    let effectiveHitSpGenerated = occurrence.hit.spGenerated;
    let effectiveHitSpReturned = occurrence.hit.spReturned;
    let effectiveHitEnergyReturn = occurrence.hit.energyReturn;
    if (occurrence.hit.accumulator?.type === "consume_enemy_status") {
      const slotsToConsumeFrom = occurrence.hit.damageType === "Healing" ? [] : unblockedEnemySlotIds;
      let consumed = 0;
      for (const enemySlotId of slotsToConsumeFrom) {
        const artsInflictionBeforeConsume =
          occurrence.hit.accumulator.statusId === ARTS_INFLICTION_STATUS_ID
            ? withEnemyResolutionSlot(enemySlotId, () => getEnemyArtsInfliction())
            : null;
        const consumedOnEnemy = withEnemyResolutionSlot(enemySlotId, () =>
          consumeEnemyStatusForAccumulator({
            statusId: occurrence.hit.accumulator!.statusId,
            maxConsumed: occurrence.hit.accumulator!.maxConsumed,
            useLevelAsStacks: occurrence.hit.accumulator!.useLevelAsStacks,
            realTime: occurrence.time,
            gameTime: occurrence.gameTime,
            sourceSlot: occurrence.actor.slot,
            stepId: occurrence.action.stepId,
            commandAttackType: occurrence.command.attackType,
            triggerSlots: triggeredComboSlots,
          }));
        consumed += consumedOnEnemy;
        if (consumedOnEnemy > 0 && occurrence.hit.accumulator.statusId === ARTS_INFLICTION_STATUS_ID) {
          consumedArtsInflictionStacksForBonus += consumedOnEnemy;
          const consumedElement = artsInflictionBeforeConsume?.element;
          if (consumedElement) {
            const inflictionConsumedEvent: RotationCombatEvent = {
              type: "ARTS_INFLICTION_CONSUMED",
              time: occurrence.time,
              gameTime: occurrence.gameTime,
              stepId: occurrence.action.stepId,
              slot: occurrence.actor.slot,
              sourceSlot: occurrence.actor.slot,
              enemySlotId,
              affectedEnemySlotIds: unblockedEnemySlotIds,
              target: "enemy",
              label: `${consumedElement} Infliction Consumed`,
              consumedElement,
              consumedStacks: consumedOnEnemy,
              effectTree: occurrenceEffectTree,
            };
            emitEvent(inflictionConsumedEvent);
            dispatchPassiveListeners(inflictionConsumedEvent);
          }
        }
      }
      if (consumed > 0) {
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
    const shouldApplyLastRitePot1FinalStrikeMutation =
      occurrence.actor.slot === controlledOperatorSlot
      && occurrence.command.attackType === "BASIC_ATTACK"
      && occurrence.command.basicAttackVariant === "final_strike"
      && hasTeamStatusById("lastrite_hypothermic_perfusion")
      && hasCharacterPotentialAtLeast("lastrite", 1);
    if (shouldApplyLastRitePot1FinalStrikeMutation) {
      effectiveHit.multiplier *= 1.2;
      effectiveHit.stagger += 5;
    }
    const baseActorMods = getEffectiveActorMods(
      occurrence.actor,
      occurrence.time,
      occurrence.gameTime,
    );
    const injectedCommandModifiers = commandModifierByStepId.get(occurrence.action.stepId) ?? {};
    const effectiveActorMods = addModifierDelta(
      addModifierDelta(baseActorMods, occurrence.command.commandModifiers ?? {}),
      injectedCommandModifiers,
    );
    const effectiveFinalAtk = getEffectiveFinalAtk(occurrence.actor, effectiveActorMods);
    const linkStacks = commandLinkedStacksByStepId.get(occurrence.action.stepId) ?? 0;
    const linkMultiplier = getLinkBonusForAttackType(linkStacks, occurrence.hit.attackType);

    args.debug?.onResolvedHit?.({
      time: occurrence.time,
      gameTime: occurrence.gameTime,
      occurrence,
      effectiveActorMods,
      effectiveEnemyMods: getEffectiveEnemyMods(
        occurrence.actor,
        occurrence.time,
        occurrence.gameTime,
      ),
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

    const isHealingHit = occurrence.hit.damageType === "Healing";
    const critRigMode = getCritRigMode(
      occurrence.action.stepId,
      occurrence.hitIndex,
      occurrence.repeatIndex,
    );
    if (isHealingHit) {
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
        noCritDamage: 0,
        critDamage: 0,
        averageDamage: 0,
        damage: 0,
        stagger: 0,
        spGenerated: effectiveHit.spGenerated,
        spReturned: effectiveHit.spReturned,
        energyReturn: effectiveHit.energyReturn,
        ignoreUltimateGainEfficiency: effectiveHit.ignoreUltimateGainEfficiency,
        requiresControlledOperator: occurrence.hit.requiresControlledOperator,
        triggeredComboSlots,
        critRigMode,
        riggedCrit: false,
        calculationContext: {
          finalAtk: effectiveFinalAtk,
          attackType: effectiveHit.attackType,
          basicAttackVariant: occurrence.command.basicAttackVariant,
          attackerMods: { ...effectiveActorMods },
          enemyMods: makeBaseModifierStats(),
          enemyDef: 0,
          hitTimes: 1,
          linkMultiplier,
          consumedArtsInflictionStacksForBonus,
          staggeredMultiplier: 1,
          finisherBonusMultiplier: 1,
          totalEnemyMultiplier: 1,
        },
      });
    } else {
      for (const [unblockedEnemyIndex, enemySlotId] of unblockedEnemySlotIds.entries()) {
        withEnemyResolutionSlot(enemySlotId, () => {
          const effectiveEnemyMods = getEffectiveEnemyMods(
            occurrence.actor,
            occurrence.time,
            occurrence.gameTime,
          );
          const damageBreakdown = calculateResolvedHitDamage({
            finalAtk: effectiveFinalAtk,
            attackType: effectiveHit.attackType,
            basicAttackVariant: occurrence.command.basicAttackVariant,
            damageType: effectiveHit.damageType,
            hit: effectiveHit,
            attackerMods: effectiveActorMods,
            enemyMods: effectiveEnemyMods,
            enemyStats: getCurrentEnemyStats(),
            noCrit: effectiveHit.noCrit,
          });
          advanceEnemyStaggerTo({ time: occurrence.time, gameTime: occurrence.gameTime });
          const isEnemyStaggered = getCurrentEnemyRuntimeState().isStaggeredForEvents;
          const finisherAvailable = hasEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
          const finisherBonusMultiplier =
            isEnemyStaggered && occurrence.isFinisherHit && finisherAvailable ? getCurrentEnemyFinisherMultiplier() : 1;
          const staggeredMultiplier = isEnemyStaggered ? ENEMY_STAGGERED_DAMAGE_MULTIPLIER : 1;
          const totalEnemyMultiplier = staggeredMultiplier * finisherBonusMultiplier;
          const contractDamageMultiplier = getContractDamageMultiplier({
            slot: occurrence.actor.slot,
            attackType: effectiveHit.attackType,
            damageType: effectiveHit.damageType,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            enemySlotId,
          });
          const noCritDamage = damageBreakdown.noCritDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          const critDamage = damageBreakdown.critDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          const averageDamage = damageBreakdown.averageDamage * contractDamageMultiplier * (1 + linkMultiplier) * totalEnemyMultiplier;
          let damage = critRigMode === "force_crit"
            ? critDamage
            : critRigMode === "force_non_crit"
              ? noCritDamage
              : averageDamage;
          const noCritClamp = getEnemyDamageClampResult(noCritDamage, enemySlotId, occurrence.time);
          const critClamp = getEnemyDamageClampResult(critDamage, enemySlotId, occurrence.time);
          const averageClamp = getEnemyDamageClampResult(averageDamage, enemySlotId, occurrence.time);
          const damageClamp = getEnemyDamageClampResult(damage, enemySlotId, occurrence.time);
          const clampedNoCritDamage = noCritClamp.allowedDamage;
          const clampedCritDamage = critClamp.allowedDamage;
          const clampedAverageDamage = averageClamp.allowedDamage;
          damage = damageClamp.allowedDamage;
          const contractFlatModifier = damageClamp.contractFlatModifier;
          const finisherBonusSp =
            isEnemyStaggered && occurrence.isFinisherHit && finisherAvailable
              ? getCurrentEnemyFinisherSpGain()
              : 0;
          const appliedStagger = applyEnemyStaggerFromHit({
            rawStagger: effectiveHit.stagger,
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            sourceSlot: occurrence.actor.slot,
            triggerSlots: triggeredComboSlots,
          });
          if (isEnemyStaggered && occurrence.isFinisherHit && finisherAvailable) {
            removeEnemyStatusById(ENEMY_FINISHER_AVAILABLE_STATUS_ID);
          }
          const damageApplication = applyEnemyDamage(damage, enemySlotId, {
            time: occurrence.time,
            gameTime: occurrence.gameTime,
            stepId: occurrence.action.stepId,
            sourceSlot: occurrence.actor.slot,
            commandId: occurrence.action.commandId,
            commandName: occurrence.action.commandName,
            hitName: effectiveHit.name,
            damageType: effectiveHit.damageType,
            commandAttackType: effectiveHit.attackType,
          });
          totalDamage += damageApplication.appliedDamage;
          if (critRigMode === "force_crit") {
            riggedCritCount += 1;
          }
          damageBySlot.set(occurrence.actor.slot, (damageBySlot.get(occurrence.actor.slot) ?? 0) + damageApplication.appliedDamage);
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
            targetEnemySlotId: enemySlotId,
            affectedEnemySlotIds: unblockedEnemySlotIds,
            damageType: occurrence.hit.damageType,
            multiplier: effectiveHit.multiplier,
            noCritDamage: clampedNoCritDamage,
            critDamage: clampedCritDamage,
            averageDamage: clampedAverageDamage,
            damage,
            stagger: appliedStagger,
            spGenerated: effectiveHit.spGenerated + finisherBonusSp,
            spReturned: effectiveHit.spReturned,
            energyReturn: unblockedEnemyIndex === 0 ? effectiveHit.energyReturn : 0,
            ignoreUltimateGainEfficiency: effectiveHit.ignoreUltimateGainEfficiency,
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
              enemyDef: getCurrentEnemyStats().def,
              hitTimes: 1,
              linkMultiplier,
              consumedArtsInflictionStacksForBonus,
              contractDamageMultiplier,
              contractFlatModifier,
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
            sourceCommandAttackType: occurrence.command.attackType,
            linkSourceStepId: occurrence.action.stepId,
            effectTree: occurrenceEffectTree,
            isCommandHit: true,
            blockEnemyTargetEffects: false,
          });
        });
      }
    }

    const isControlledOperatorHit = occurrence.actor.slot === controlledOperatorSlot;

    if (
      occurrence.command.attackType === "BATTLE_SKILL"
      || occurrence.command.attackType === "COMBO_SKILL"
      || occurrence.command.attackType === "ULTIMATE"
    ) {
      const battleOrComboEvent: RotationCombatEvent = {
        type:
          occurrence.command.attackType === "BATTLE_SKILL"
            ? "BATTLE_SKILL_HIT"
            : occurrence.command.attackType === "COMBO_SKILL"
              ? "COMBO_SKILL_HIT"
              : "ULTIMATE_HIT",
        time: occurrence.time,
        gameTime: occurrence.gameTime,
        stepId: occurrence.action.stepId,
        commandId: occurrence.command.id,
        commandName: occurrence.command.name,
        hitName: occurrence.hit.times > 1
          ? `${occurrence.hit.name ?? `Hit ${occurrence.hitIndex + 1}`} #${occurrence.repeatIndex + 1}`
          : occurrence.hit.name,
        dealsDamage: effectiveHit.multiplier > 0 || effectiveHit.flatAmount > 0,
        enemySlotId: isHealingHit ? undefined : unblockedEnemySlotIds[0],
        slot: occurrence.actor.slot,
        sourceSlot: occurrence.actor.slot,
        affectedEnemySlotIds: isHealingHit ? undefined : unblockedEnemySlotIds,
        label: `${occurrence.actor.characterName} ${
          occurrence.command.attackType === "BATTLE_SKILL"
            ? "Battle"
            : occurrence.command.attackType === "COMBO_SKILL"
              ? "Combo"
              : "Ultimate"
        } Hit`,
        commandAttackType: occurrence.command.attackType,
        damageType: occurrence.hit.damageType,
        expectedCritCount: occurrence.hit.noCrit ? 0 : effectiveActorMods.CRIT_RATE_PCT,
        effectTree: occurrenceEffectTree,
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
      effectTree: occurrenceEffectTree,
      affectedEnemySlotIds: isHealingHit ? [] : unblockedEnemySlotIds,
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
        enemySlotId: unblockedEnemySlotIds[0],
        affectedEnemySlotIds: unblockedEnemySlotIds,
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
        enemySlotId: unblockedEnemySlotIds[0],
        affectedEnemySlotIds: unblockedEnemySlotIds,
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
        enemySlotId: unblockedEnemySlotIds[0],
        affectedEnemySlotIds: unblockedEnemySlotIds,
        target: "enemy",
        label: `${occurrence.actor.characterName} Finisher Hit`,
      };
      emitEvent(finisherEvent);
      dispatchPassiveListeners(finisherEvent, triggeredComboSlots);
    }
  }

  const finalRealTime = actions.reduce((max, action) => Math.max(max, action.realEndTime), 0);
  const finalGameTime = actions.reduce((max, action) => Math.max(max, action.endTime), 0);
  const minimumFinalRealTime = explicitRelayStartTime ?? resumeCheckpoint?.time ?? 0;
  const minimumFinalGameTime = explicitRelayStartGameTime ?? resumeCheckpoint?.gameTime ?? 0;
  const finalStatusGameTime = getEffectStatuses().reduce(
    (max, status) => Math.max(
      max,
      status.timeScale === "game" ? status.expiresAt : toGameTimeFromExtensions(status.expiresAt),
    ),
    Math.max(finalGameTime, minimumFinalGameTime),
  );
  const finalPendingBurstGameTime = pendingArtsBursts.reduce(
    (max, entry) => Math.max(max, entry.executeGameTime),
    finalStatusGameTime,
  );
  const finalPendingExecuteGameTime = pendingExecuteHits.reduce(
    (max, entry) => Math.max(max, entry.executionGameTime),
    finalPendingBurstGameTime,
  );
  const finalPendingTriggerResumeGameTime = pendingTriggerResumes.reduce(
    (max, entry) => Math.max(max, entry.executionGameTime),
    finalPendingExecuteGameTime,
  );
  const finalCountdownGameTime = countdownTimeline.reduce(
    (max, entry) => Math.max(max, entry.gameTime),
    finalPendingTriggerResumeGameTime,
  );
  const finalRelayGameTime = relayTimeline.reduce(
    (max, entry) => Math.max(max, entry.gameTime),
    finalCountdownGameTime,
  );
  const finalReactionGameTime = normalizedEnemySlots.reduce((maxGameTime, slot) => {
    return getEnemyStatuses(slot.slotId).reduce((slotMax, status) => {
      const nextTickGameTime = status.nextTickAtGameTime ?? 0;
      const nextRampGameTime = status.nextRampAtGameTime ?? 0;
      return Math.max(slotMax, status.expiresAt, nextTickGameTime, nextRampGameTime);
    }, maxGameTime);
  }, finalRelayGameTime);
  if (battleTimeLimitSeconds != null && finalPendingExecuteGameTime > battleTimeLimitSeconds + 0.0001) {
    warnings.push("Time Limit Exceeded!");
  }
  const postActionProcessingRealTime = Math.max(0, finalRealTime) + POST_ACTION_SIMULATION_BUFFER_SECONDS;
  const postActionProcessingGameTime = toGameTimeFromExtensions(postActionProcessingRealTime);
  const finalProcessingGameTime = Math.min(
    finalReactionGameTime,
    Number.isFinite(postActionProcessingGameTime) ? postActionProcessingGameTime : finalReactionGameTime,
  );
  const resolvedFinalProcessingRealTime = toRealTimeFromExtensions(finalProcessingGameTime);
  const finalProcessingRealTime = Math.max(
    Number.isFinite(finalRealTime) ? finalRealTime : 0,
    minimumFinalRealTime,
    Number.isFinite(resolvedFinalProcessingRealTime) ? resolvedFinalProcessingRealTime : 0,
  );
  flushSimulationCheckpointsUpTo(finalProcessingRealTime);
  flushEnemyInterruptedCommandEventsUpTo({ time: finalProcessingRealTime });
  processPendingSimulationEventsUpTo({ realTime: finalProcessingRealTime, gameTime: finalProcessingGameTime });
  cleanupStateAt(finalProcessingRealTime, finalProcessingGameTime);
  captureSimulationCheckpoint(finalProcessingRealTime, finalProcessingGameTime);

  timeline.sort((left, right) => left.time - right.time);
  events.sort((left, right) => left.time - right.time);
  comboWindows.sort((left, right) => left.readyAt - right.readyAt);
  enemyLifecycleTimeline.sort((left, right) =>
    left.time !== right.time
      ? left.time - right.time
      : left.enemySlotId.localeCompare(right.enemySlotId),
  );
  countdownTimeline.sort((left, right) =>
    left.time !== right.time
      ? left.time - right.time
      : left.value - right.value,
  );
  relayTimeline.sort((left, right) => left.time - right.time);
  enemyTransitionTimeline.sort((left, right) =>
    left.time !== right.time
      ? left.time - right.time
      : left.endTime - right.endTime,
  );
  actorStateTimeline.sort((left, right) =>
    left.time === right.time
      ? (left.sequence ?? 0) - (right.sequence ?? 0)
      : left.time - right.time,
  );
  enemyStateTimeline.sort((left, right) =>
    left.time === right.time
      ? (left.sequence ?? 0) - (right.sequence ?? 0)
      : left.time - right.time,
  );
  const lastDamageEntry = [...timeline].reverse().find((entry) => entry.damage > 0);
  const totalDamageRealTime = Math.max(lastDamageEntry?.time ?? 0, finalProcessingRealTime, finalRealTime, minimumFinalRealTime);
  const totalDamageGameTime = Math.max(lastDamageEntry?.gameTime ?? 0, finalProcessingGameTime, finalGameTime, minimumFinalGameTime);

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
    totalGameTime: totalDamageGameTime,
    totalTime: totalDamageRealTime,
    timeline,
    actions,
    timeExtensions,
    events,
    comboWindows,
    enemyLifecycleTimeline,
    countdownTimeline,
    relayTimeline,
    enemyTransitionTimeline,
    relayStartTime: explicitRelayStartTime,
    relayStartGameTime: explicitRelayStartGameTime,
    displayTimeOffset,
    displayGameTimeOffset,
    initialResources,
    actorStateTimeline,
    enemyStateTimeline,
    enemyActionWindows,
    enemySlots: normalizedEnemySlots,
    targetedEnemySlotId: initialTargetedEnemySlotId,
    enemyStaggerDecayRate: getCurrentEnemyStaggerDecayRate(),
    riggedCritCount,
    comboTriggerDebug,
    passiveListenerDebug,
    statusChangeLog,
    simulationCheckpoints,
    warnings,
  };
}
