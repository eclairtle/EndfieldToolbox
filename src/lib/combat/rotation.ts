import type { ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { ResolvedCommandAtLevel, ResolvedCommandHitAtLevel, ResolvedExecuteHitAtLevel, TimeScale } from "@/lib/commands";
import type { AttackType } from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { CharacterClass } from "@/data/characters";
import type { ModifierStatKey } from "@/lib/build/stats";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import type { BuildCondition } from "@/lib/build/buildConditions";
import type { AscensionStage, PotentialLevel } from "@/lib/build/progression";
import type { ActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import type { CharacterConditionalModifierDefinition } from "@/data/characters";
import type { CombatEffectTree } from "@/lib/combat/effectTree";
import type { UnifiedCombatStatus, UnifiedStatusChangeLogEntry } from "@/lib/combat/statusModel";
import type { UnifiedStatusChangeType, UnifiedStatusKind, UnifiedStatusScope } from "@/lib/combat/statusModel";
import type { EnemyBase } from "@/data/enemies";

export type PartySlot = 0 | 1 | 2 | 3;
export type EnemySlotId = string;

export type EnemySlotState = {
  slotId: EnemySlotId;
  enemyId: string;
  level: number;
  spawnTimeEnabled?: boolean;
  spawnTime?: number;
  noDeath?: boolean;
};

export type RotationStep = {
  id: string;
  slot: PartySlot;
  commandId: string;
  startTime?: number;
  groupId?: string;
  missed?: boolean;
  missedEnemySlots?: number[];
  interrupted?: boolean;
  nullified?: boolean;
  buildSwapMap?: [number, number, number, number];
};

export type EnemyRotationStep = {
  id: string;
  enemySlotId: EnemySlotId;
  commandId: string;
  startTime: number;
  interrupted?: boolean;
  interruptedSpGain?: number;
  interruptedStagger?: number;
};

export type RotationGroup = {
  id: string;
  name: string;
};

export type CritRigMode = "force_crit" | "force_non_crit";
export const CRIT_RIG_HIT_INDEX_REACTION = -1;
export const CRIT_RIG_HIT_INDEX_EXECUTE = -2;

export type CritRiggingRule = {
  id: string;
  stepId: string;
  hitIndex: number;
  repeatIndex: number;
  executeCritRigId?: string;
  mode: CritRigMode;
  enabled?: boolean;
};

export type Rotation = {
  steps: RotationStep[];
  enemySteps?: EnemyRotationStep[];
  groups?: RotationGroup[];
  critRiggingRules?: CritRiggingRule[];
};

export type CharacterCombatSnapshot = {
  slot: PartySlot;
  characterId: string;
  characterName: string;
  characterClass: CharacterClass;
  level: number;
  weaponId: string;
  weaponSkillLevels: number[];
  ascensionStage: AscensionStage;
  potentialLevel: PotentialLevel;
  uniqueTalentToggles: Record<string, boolean>;
  uniqueTalentConditions?: Record<string, BuildCondition | undefined>;
  uniqueTalentDefaults?: Record<string, boolean | undefined>;
  conditionalModifiers: CharacterConditionalModifierDefinition[];

  finalAtk: number;
  maxHp: number;
  baseHp: number;
  finalDef: number;
  baseAtk: number;
  weaponAtk: number;
  attributeBonus: number;
  attributeScaling: {
    STR?: number;
    AGI?: number;
    INT?: number;
    WIL?: number;
  };
  attrs: {
    STR: number;
    AGI: number;
    INT: number;
    WIL: number;
  };
  mods: ModifierStats;
  activeGearSet?: ActiveGearSetInfo;

  commands: ResolvedCommandAtLevel[];
  executeHits: Record<string, ResolvedExecuteHitAtLevel>;
  combatHooks?: CharacterCombatHooks;
  restrictEnergyGainToOwnBattleOrComboCommands?: boolean;
};

export type DamageTimelineEntry = {
  time: number;
  gameTime: number;
  registerTime: number;
  registerGameTime: number;
  stepId: string;
  slot: PartySlot;
  characterName: string;
  commandId: string;
  commandName: string;
  hitIndex: number;
  hitName?: string;
  targetEnemySlotId?: EnemySlotId;
  affectedEnemySlotIds?: EnemySlotId[];

  damageType: ElementType;

  multiplier: number;
  noCritDamage: number;
  critDamage: number;
  averageDamage: number;
  damage: number;
  stagger: number;
  spGenerated: number;
  spReturned: number;
  energyReturn: number;
  ignoreUltimateGainEfficiency?: boolean;
  requiresControlledOperator: boolean;
  triggeredComboSlots: PartySlot[];
  critRigMode?: CritRigMode;
  riggedCrit?: boolean;
  calculationContext?: {
    finalAtk: number;
    attackType: AttackType;
    basicAttackVariant?: ResolvedCommandAtLevel["basicAttackVariant"];
    attackerMods: ModifierStats;
    enemyMods: ModifierStats;
    enemyDef: number;
    hitTimes: number;
    linkMultiplier: number;
    contractDamageMultiplier?: number;
    contractFlatModifier?: number;
    consumedArtsInflictionStacksForBonus?: number;
    reactionBaseMultiplier?: number;
    applierLevel?: number;
    isPhysicalReaction?: boolean;
    staggeredMultiplier?: number;
    finisherBonusMultiplier?: number;
    totalEnemyMultiplier?: number;
  };
};

export type EnemyOriginatedHitTimelineEntry = {
  time: number;
  gameTime: number;
  stepId: string;
  sourceEnemySlotId: EnemySlotId;
  targetEnemySlotId: EnemySlotId;
  hitType: "healing";
  hitName: string;
  amount: number;
  requestedAmount: number;
};

export type RotationTimeExtension = {
  time: number;
  gameTime: number;
  amount: number;
  sourceStepId: string;
  sourceStepIds: string[];
  cumulativeFreezeTime: number;
  cutscene: boolean;
};

export type CompiledRotationAction = {
  stepId: string;
  slot: PartySlot;
  characterName: string;
  commandId: string;
  commandName: string;
  startTime: number;
  endTime: number;
  realStartTime: number;
  realEndTime: number;
  timeFreezeSeconds: number;
  cutscene: boolean;
  missed?: boolean;
  missedEnemySlots?: number[];
  interrupted?: boolean;
  nullified?: boolean;
  resolvedComboCooldownSeconds?: number;
  buildSwapMap?: [number, number, number, number];
};

export type ActorActiveBuffState = {
  instanceId?: string;
  id: string;
  label: string;
  slot: PartySlot;
  hidden?: boolean;
  readyCommandId?: string;
  timeScale: "real" | "game";
  appliedAt: number;
  appliedAtGameTime: number;
  expiresAt: number;
  effects?: Partial<ModifierStats>;
};

export type TeamActiveStatusState = {
  instanceId?: string;
  id: string;
  label: string;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type ActorActiveStatusState = {
  instanceId?: string;
  id: string;
  label: string;
  hidden?: boolean;
  expiresAt: number;
  timeScale: "real" | "game";
  fieldStatus?: boolean;
  stacks?: number;
};

export type ActorCombatStateSnapshot = {
  sequence?: number;
  time: number;
  gameTime: number;
  slot: PartySlot;
  activeBuildVariant: number;
  currentHp: number;
  maxHp: number;
  meltingFlameStacks: number;
  activeBuffs: ActorActiveBuffState[];
  activeStatuses: ActorActiveStatusState[];
  activeTeamStatuses: TeamActiveStatusState[];
};

export type RotationSimulationInitialResourceState = {
  teamSpGenerated: number;
  teamSpReturned: number;
  spRegenRate: number;
  energyBySlot: Map<PartySlot, number>;
  energyMaxBySlot: Map<PartySlot, number>;
};

export type EnemyActiveDebuffState = {
  enemySlotId?: EnemySlotId;
  label?: string;
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type EnemyActiveStatusState = {
  enemySlotId?: EnemySlotId;
  instanceId?: string;
  id: string;
  label: string;
  stacks?: number;
  hidden?: boolean;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type EnemyCombatStateSnapshot = {
  sequence?: number;
  time: number;
  gameTime: number;
  enemySlotId?: EnemySlotId;
  isPresent?: boolean;
  isDead?: boolean;
  deadAt?: number;
  enemyId: string;
  enemyName: string;
  baseMaxHp: number;
  currentHp: number;
  maxHp: number;
  currentDamageTaken: number;
  staggerGauge: number;
  staggerNodes?: number[];
  staggerDecayRate: number;
  currentStagger: number;
  isStaggered: boolean;
  activeDebuffs: EnemyActiveDebuffState[];
  activeStatuses: EnemyActiveStatusState[];
  artsInfliction: {
    element: "Heat" | "Cryo" | "Electric" | "Nature";
    stacks: number;
    expiresAtGameTime: number;
  } | null;
};

export type EnemyActionEffect = {
  type: "RESET_STAGGER" | "INTERRUPT_ONGOING_COMMANDS" | "CLEAR_FIELD_EFFECTS" | "REINITIALIZE_COMBAT" | "SET_TARGET_ENEMY";
} | {
  type: "APPLY_BUFF";
  buffId: string;
  label: string;
  effects: Partial<ModifierStats>;
  durationSeconds: number;
  timeScale?: TimeScale;
  hidden?: boolean;
} | {
  type: "TRANSFORM_ENEMY";
  enemyId: string;
  resetHp?: boolean;
};

export type EnemyActionWindow = {
  id: string;
  enemySlotId?: EnemySlotId;
  commandId?: string;
  label: string;
  startTime: number;
  endTime: number;
  invulnerable?: boolean;
  tintColor?: string;
  startEffects?: EnemyActionEffect[];
  endEffects?: EnemyActionEffect[];
  interruptible?: boolean;
  interrupted?: boolean;
  interruptedSpGain?: number;
  interruptedStagger?: number;
};

export type RotationSimulationCheckpointTimedEnemyDebuff = {
  enemySlotId?: EnemySlotId;
  id?: string;
  buffId?: string;
  label?: string;
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
  timeScale: TimeScale;
};

export type RotationSimulationCheckpointTimedContractDamageModifier = {
  slot: PartySlot;
  value: number;
  attackType?: AttackType;
  damageType?: ElementType;
  expiresAt: number;
  timeScale: TimeScale;
};

export type RotationSimulationCheckpointPendingArtsBurst = {
  executeGameTime: number;
  enemySlotId?: EnemySlotId;
  sourceSlot: PartySlot;
  element: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  stepId: string;
  sourceCommandId?: string;
  sourceCommandName?: string;
  baseMultiplier?: number;
};

export type RotationSimulationCheckpointPendingExecuteHit = {
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
  triggerSlots: PartySlot[];
  linkSourceStepId?: string;
  applySourceCommandModifiers?: boolean;
};

export type RotationSimulationCheckpointPendingTriggerResume = {
  instanceId: string;
  triggerId: string;
  event: RotationCombatEvent;
  actions: Array<Record<string, unknown>>;
  nextActionIndex: number;
  executionTime: number;
  executionGameTime: number;
};

export type RotationSimulationCheckpointRuntimeEnemySlot = {
  slotId: EnemySlotId;
  level: number;
  spawnTime: number;
  hasConfiguredEnemy: boolean;
  isPresent: boolean;
  isDead: boolean;
  deadAt?: number;
  noDeath: boolean;
  base: EnemyBase;
  stats: EnemyResolvedStats;
  modifierBase: ModifierStats;
  damageTaken: number;
  currentStaggerForEvents: number;
  staggerLastUpdateTime: number;
  isStaggeredForEvents: boolean;
  reachedStaggerNodeThresholds: Set<number>;
};

export type RotationSimulationCheckpoint = {
  chunkIndex: number;
  time: number;
  gameTime: number;
  outputCounts: {
    totalDamage: number;
    riggedCritCount: number;
    timelineCount: number;
    enemyTimelineHitCount: number;
    eventCount: number;
    comboWindowCount: number;
    enemyLifecycleCount: number;
    enemyTargetCount: number;
    countdownCount: number;
    relayCount: number;
    enemyTransitionCount: number;
    actorStateCount: number;
    enemyStateCount: number;
    comboTriggerDebugCount: number;
    passiveListenerDebugCount: number;
    statusChangeLogCount: number;
  };
  sequences: {
    stateSnapshotSequence: number;
    statusInstanceSequence: number;
    statusChangeSequence: number;
    triggerInstanceSequence: number;
    actorBuffInstanceCounter: number;
  };
  runtime: {
    damageBySlot: Map<PartySlot, number>;
    timedEnemyDebuffs: RotationSimulationCheckpointTimedEnemyDebuff[];
    runtimeStatuses: UnifiedCombatStatus[];
    triggerVariableValuesById: Map<string, string | number | boolean>;
    customTriggerRuntimeEnabledById: Map<string, boolean>;
    comboCooldownUntilBySlot: Map<PartySlot, number>;
    pendingComboCooldownBySlot: Map<PartySlot, { durationSeconds: number; timeScale: TimeScale }>;
    comboCooldownPauseIntervalsBySlot: Map<PartySlot, Array<{ startTime: number; endTime: number }>>;
    activeComboWindowBySlot: Map<PartySlot, ComboTriggerWindow>;
    lastComboTriggerTimeBySlot: Map<PartySlot, number>;
    perfectTimingStepIds: Set<string>;
    repeatedHitKeys: Set<string>;
    terminatedRepeatHitChains: Set<string>;
    setTriggerFlags: Set<string>;
    listenerCooldowns: Map<string, { expiresAt: number; timeScale: TimeScale }>;
    listenerCounters: Map<string, number>;
    commandModifierByStepId: Map<string, Partial<ModifierStats>>;
    bladebreakingPendingBySlot: Map<PartySlot, boolean>;
    stepContractDamageMultiplierByStepId: Map<string, number>;
    timedContractDamageModifiers: RotationSimulationCheckpointTimedContractDamageModifier[];
    critThresholdProgressBySlot: Map<PartySlot, number>;
    commandLinkedStacksByStepId: Map<string, number>;
    commandAttackTypeByStepId: Map<string, ResolvedCommandAtLevel["attackType"]>;
    castEventEmittedByStepId: Map<string, { battleSkill: boolean; ultimate: boolean }>;
    interruptedAtByStepId: Map<string, number>;
    pendingArtsBursts: RotationSimulationCheckpointPendingArtsBurst[];
    pendingExecuteHits: RotationSimulationCheckpointPendingExecuteHit[];
    pendingTriggerResumes: RotationSimulationCheckpointPendingTriggerResume[];
    pendingEnemyListenerWindowEnds: Array<{
      enemySlotId: EnemySlotId;
      executionTime: number;
      executionGameTime: number;
      effects: EnemyActionEffect[];
    }>;
    triggerExecutionBlockedUntil: number;
    triggerExecutionGloballyBlocked: boolean;
    triggerExecutionTotalCount: number;
    recentTriggerExecutionTimes: number[];
    activeTriggerRunIds: Set<string>;
    stoppedTriggerInstanceIds: Set<string>;
    triggerInstanceIdsByTriggerId: Map<string, Set<string>>;
    actorMaxHpBySlot: Map<PartySlot, number>;
    actorCurrentHpBySlot: Map<PartySlot, number>;
    teamSpGenerated: number;
    teamSpReturned: number;
    spRegenRate: number;
    energyBySlot: Map<PartySlot, number>;
    energyMaxBySlot: Map<PartySlot, number>;
    controlledOperatorSlot: PartySlot;
    activeBuildVariantBySlot: Map<PartySlot, number>;
    switchBackLockedUntilBySlot: Map<PartySlot, number>;
    enemyRuntimeBySlot: Map<EnemySlotId, RotationSimulationCheckpointRuntimeEnemySlot>;
    enemyHpHistoryBySlot: Map<EnemySlotId, Array<{ time: number; hp: number; maxHp: number }>>;
    enemyHpDeltaHistoryBySlot: Map<EnemySlotId, Array<{ time: number; hpDelta: number }>>;
    currentTargetedEnemySlotId: EnemySlotId;
    nextEnemyActionStartEffectWindowIndex: number;
    nextEnemyActionEndEffectWindowIndex: number;
    nextEnemyInterruptedCommandWindowIndex: number;
  };
};

export type RotationSimulationInitialState = {
  startTime: number;
  startGameTime: number;
  displayTimeOffset: number;
  displayGameTimeOffset: number;
  initialResources: RotationSimulationInitialResourceState;
  sequences: RotationSimulationCheckpoint["sequences"];
  runtime: RotationSimulationCheckpoint["runtime"];
};

export type RotationSimulationResult = {
  totalDamage: number;
  damageBySlot: Array<{
    slot: PartySlot;
    characterName: string;
    damage: number;
  }>;
  linkEnhancedStepIds: string[];
  totalGameTime: number;
  totalTime: number;
  timeline: DamageTimelineEntry[];
  enemyTimelineHits: EnemyOriginatedHitTimelineEntry[];
  actions: CompiledRotationAction[];
  timeExtensions: RotationTimeExtension[];
  events: RotationCombatEvent[];
  comboWindows: ComboTriggerWindow[];
  actorStateTimeline: ActorCombatStateSnapshot[];
  enemyStateTimeline: EnemyCombatStateSnapshot[];
  enemyActionWindows: EnemyActionWindow[];
  enemyLifecycleTimeline: EnemyLifecycleTimelineEntry[];
  enemyTargetTimeline: EnemyTargetTimelineEntry[];
  countdownTimeline: CountdownTimelineEntry[];
  relayTimeline: RelayTimelineEntry[];
  enemyTransitionTimeline: EnemyTransitionTimelineEntry[];
  relayStartTime?: number | null;
  relayStartGameTime?: number | null;
  displayTimeOffset?: number;
  displayGameTimeOffset?: number;
  initialResources: RotationSimulationInitialResourceState;
  initialControlledOperatorSlot?: PartySlot;
  initialSwitchBackLockedUntilBySlot?: Map<PartySlot, number>;
  enemySlots?: EnemySlotState[];
  targetedEnemySlotId?: EnemySlotId;
  enemyStaggerDecayRate: number;
  riggedCritCount: number;
  comboTriggerDebug: ComboTriggerDebugEntry[];
  passiveListenerDebug: PassiveListenerDebugEntry[];
  statusChangeLog: UnifiedStatusChangeLogEntry[];
  simulationCheckpoints?: RotationSimulationCheckpoint[];
  warnings?: string[];
};

export type EnemyLifecycleTimelineEntry = {
  enemySlotId: EnemySlotId;
  time: number;
  gameTime: number;
  enemyId: string;
  type: "spawned" | "replaced" | "transformed" | "defeated";
};

export type EnemyTargetTimelineEntry = {
  time: number;
  gameTime: number;
  enemySlotId: EnemySlotId;
  previousEnemySlotId: EnemySlotId;
  reason: "set_target" | "target_defeated" | "enemy_spawned";
  succeeded: boolean;
  sourceId?: string;
  failureReason?: "enemy_not_active";
};

export type CountdownTimelineEntry = {
  time: number;
  gameTime: number;
  value: number;
  triggerId: string;
  triggerName: string;
  instanceId: string;
};

export type RelayTimelineEntry = {
  time: number;
  gameTime: number;
  triggerId: string;
  triggerName: string;
  instanceId: string;
  inherited?: boolean;
};

export type EnemyTransitionTimelineEntry = {
  enemySlotId: EnemySlotId;
  time: number;
  gameTime: number;
  endTime: number;
  endGameTime: number;
  commandId?: string;
  label: string;
  tintColor?: string;
};

export type PassiveListenerKind = "COMBAT_HOOK" | "GEAR_SET" | "WEAPON" | "CUSTOM_TRIGGER";

export type PassiveListenerDebugEntry = {
  time: number;
  gameTime: number;
  eventType: RotationCombatEventType;
  eventLabel: string;
  eventStepId?: string;
  eventCommandId?: string;
  eventCommandAttackType?: RotationCombatEvent["commandAttackType"];
  listenerKind: PassiveListenerKind;
  slot?: PartySlot;
  characterId?: string;
  characterName?: string;
  triggerId?: string;
  triggerName?: string;
  listenerPresent: boolean;
};

export type ComboTriggerDebugBlockReason =
  | "MISSING_ACTOR_OR_COMBO_COMMAND"
  | "ACTIVE_COMBO_WINDOW_EXISTS"
  | "ACTIVE_COMBO_WINDOW_TRIGGER_ICD"
  | "COMBO_ON_COOLDOWN";

export type ComboTriggerDebugEntry = {
  time: number;
  gameTime: number;
  slot: PartySlot;
  characterId?: string;
  characterName?: string;
  sourceStepId: string;
  sourceEventType: RotationCombatEventType;
  label: string;
  comboCommandId?: string;
  cooldownOwnerCommandId?: string;
  triggered: boolean;
  blockReason?: ComboTriggerDebugBlockReason;
  hasActiveComboWindow: boolean;
  hasPendingCooldown: boolean;
  currentTime: number;
  cooldownUntil: number;
  comboTimeScale: "real" | "game";
  readyAt?: number;
  expiresAt?: number;
};

export type RotationCombatEventType =
  | "STAGE_BEGIN"
  | "ROTATION_RELAYED"
  | "ENEMY_SPAWNED"
  | "ENEMY_REPLACED"
  | "ENEMY_TRANSFORMED"
  | "SKILL_CAST"
  | "ULTIMATE_CAST"
  | "ULTIMATE_END"
  | "CRIT_THRESHOLD_REACHED"
  | "BASIC_ATTACK_FINAL_STRIKE_HIT"
  | "DIVE_ATTACK_HIT"
  | "FINISHER_HIT"
  | "STAGGER_NODE_REACHED"
  | "STAGGER_POINTS_INFLICTED"
  | "ENEMY_STAGGERED"
  | "ENEMY_DEFEATED"
  | "HEAT_INFLICTION_APPLIED"
  | "COMBUSTION_APPLIED"
  | "CORROSION_APPLIED"
  | "BATTLE_SKILL_CAST"
  | "BATTLE_SKILL_END"
  | "COMBO_SKILL_CAST"
  | "ENEMY_DEBUFF_APPLIED"
  | "ENEMY_DEBUFF_CONSUMED"
  | "MELTING_FLAME_GAINED"
  | "MELTING_FLAME_CONSUMED"
  | "MELTING_FLAME_FULL"
  | "COMBO_TRIGGERED"
  | "SP_GENERATED"
  | "SP_RETURNED"
  | "ULTIMATE_ENERGY_MODIFIED"
  | "TEAM_LINK_GAINED"
  | "WEAPON_BUFF_APPLIED"
  | "ACTOR_BUFF_APPLIED"
  | "SKILL_SP_RECOVERED"
  | "BATTLE_SKILL_HIT"
  | "COMBO_SKILL_HIT"
  | "ULTIMATE_HIT"
  | "ARTS_INFLICTION_CONSUMED"
  | "ARTS_REACTION_CONSUMED"
  | "ARTS_REACTION_APPLIED"
  | "PHYSICAL_REACTION_APPLIED"
  | "ORIGINIUM_CRYSTAL_APPLIED"
  | "ARTS_INFLICTION_APPLIED"
  | "ARTS_BURST_TRIGGERED"
  | "ARTS_BURST_APPLIED"
  | "ARTS_BURST_HIT"
  | "STATUS_UPDATED"
  | "TEAM_STATUS_GAINED"
  | "TEAM_STATUS_CONSUMED"
  | "HEALING_HIT_EXECUTED"
  | "ENEMY_COMMAND_INTERRUPTED"
  | "ROSSI_VULNERABILITY_AND_ARTS_INFLICTION"
  | "SNAPSHOT_INITIALIZED"
  | "COMBAT_INITIALIZED"
  | "OPERATOR_SWITCHED";

export type RotationCombatEvent = {
  type: RotationCombatEventType;
  time: number;
  gameTime: number;
  enemySlotId?: EnemySlotId;
  enemyId?: string;
  affectedEnemySlotIds?: EnemySlotId[];
  effectTree?: CombatEffectTree;
  stepId?: string;
  commandId?: string;
  commandName?: string;
  hitName?: string;
  dealsDamage?: boolean;
  slot?: PartySlot;
  sourceSlot?: PartySlot;
  target?: "enemy";
  label: string;
  triggeredSlot?: PartySlot;
  buffId?: string;
  statusId?: string;
  statusScope?: UnifiedStatusScope;
  statusKind?: UnifiedStatusKind;
  statusChangeType?: UnifiedStatusChangeType;
  statusReason?: string;
  statusStacks?: number;
  statusDurationSeconds?: number;
  statusTargetSlot?: PartySlot;
  statusOwnerSlot?: PartySlot;
  debuffStat?: ModifierStatKey;
  durationSeconds?: number;
  timeScale?: "real" | "game";
  stackDelta?: number;
  spReturn?: number;
  amount?: number;
  commandAttackType?: ResolvedCommandAtLevel["attackType"];
  damageType?: ElementType;
  expectedCritCount?: number;
  consumedElement?: "Heat" | "Cryo" | "Electric" | "Nature";
  element?: "Heat" | "Cryo" | "Electric" | "Nature";
  consumedStacks?: number;
  healedAmount?: number;
  healingAmount?: number;
  enemyHpRatio?: number;
  enemyHadVulnerability?: boolean;
  enemyHadPhysicalSusceptibility?: boolean;
  enemyWasStaggered?: boolean;
  enemyHadOriginiumCrystal?: boolean;
  forcedReaction?: boolean;
  triggersReaction?: boolean;
  iteratorEnemySlotId?: EnemySlotId;
  iteratorOperatorSlot?: PartySlot;
  resourceOperation?: "add" | "set";
  resourceMode?: "flat" | "percent";
};

export type ComboTriggerWindow = {
  slot: PartySlot;
  commandId: string;
  triggerId: string;
  /** Combo-window timestamps use game time; combo cooldowns keep their command-defined clock. */
  readyAt: number;
  expiresAt: number;
  perfectTimingStartAt?: number;
  perfectTimingEndAt?: number;
  perfectTimingTriggered?: boolean;
  consumedAt?: number;
  sourceStepId: string;
  sourceEventType: RotationCombatEventType;
};
