import type { ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { ResolvedCommandAtLevel, ResolvedExecuteHitAtLevel } from "@/lib/commands";
import type { AttackType } from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { CharacterClass } from "@/data/characters";
import type { ModifierStatKey } from "@/lib/build/stats";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import type { BuildCondition } from "@/lib/build/buildConditions";
import type { AscensionStage, PotentialLevel } from "@/lib/build/progression";
import type { ActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import type { CharacterConditionalModifierDefinition } from "@/data/characters";

export type PartySlot = 0 | 1 | 2 | 3;

export type RotationStep = {
  id: string;
  slot: PartySlot;
  commandId: string;
  startTime?: number;
  groupId?: string;
  missed?: boolean;
  interrupted?: boolean;
  buildSwapMap?: [number, number, number, number];
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
  mode: CritRigMode;
  enabled?: boolean;
};

export type Rotation = {
  steps: RotationStep[];
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
    consumedArtsInflictionStacksForBonus?: number;
    reactionBaseMultiplier?: number;
    applierLevel?: number;
    isPhysicalReaction?: boolean;
    staggeredMultiplier?: number;
    finisherBonusMultiplier?: number;
    totalEnemyMultiplier?: number;
  };
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
  interrupted?: boolean;
  buildSwapMap?: [number, number, number, number];
};

export type ActorActiveBuffState = {
  id: string;
  label: string;
  slot: PartySlot;
  hidden?: boolean;
  timeScale: "real" | "game";
  appliedAt: number;
  appliedAtGameTime: number;
  expiresAt: number;
  effects?: Partial<ModifierStats>;
};

export type TeamActiveStatusState = {
  id: string;
  label: string;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type ActorCombatStateSnapshot = {
  time: number;
  gameTime: number;
  slot: PartySlot;
  activeBuildVariant: number;
  currentHp: number;
  maxHp: number;
  meltingFlameStacks: number;
  activeBuffs: ActorActiveBuffState[];
  activeTeamStatuses: TeamActiveStatusState[];
};

export type EnemyActiveDebuffState = {
  label?: string;
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type EnemyActiveStatusState = {
  id: string;
  label: string;
  stacks?: number;
  expiresAt: number;
  timeScale: "real" | "game";
};

export type EnemyCombatStateSnapshot = {
  time: number;
  gameTime: number;
  currentDamageTaken: number;
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
  type: "RESET_STAGGER" | "INTERRUPT_ONGOING_COMMANDS";
};

export type EnemyActionWindow = {
  id: string;
  commandId?: string;
  label: string;
  startTime: number;
  endTime: number;
  invulnerable?: boolean;
  tintColor?: string;
  effects?: EnemyActionEffect[];
  interruptible?: boolean;
  interrupted?: boolean;
  interruptedSpGain?: number;
  interruptedStagger?: number;
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
  actions: CompiledRotationAction[];
  timeExtensions: RotationTimeExtension[];
  events: RotationCombatEvent[];
  comboWindows: ComboTriggerWindow[];
  actorStateTimeline: ActorCombatStateSnapshot[];
  enemyStateTimeline: EnemyCombatStateSnapshot[];
  enemyActionWindows: EnemyActionWindow[];
  enemyStaggerDecayRate: number;
  riggedCritCount: number;
  comboTriggerDebug: ComboTriggerDebugEntry[];
  passiveListenerDebug: PassiveListenerDebugEntry[];
  warnings?: string[];
};

export type PassiveListenerKind = "COMBAT_HOOK" | "GEAR_SET" | "WEAPON";

export type PassiveListenerDebugEntry = {
  time: number;
  gameTime: number;
  eventType: RotationCombatEventType;
  eventLabel: string;
  eventStepId?: string;
  eventCommandId?: string;
  eventCommandAttackType?: RotationCombatEvent["commandAttackType"];
  listenerKind: PassiveListenerKind;
  slot: PartySlot;
  characterId: string;
  characterName: string;
  listenerPresent: boolean;
};

export type ComboTriggerDebugBlockReason =
  | "MISSING_ACTOR_OR_COMBO_COMMAND"
  | "ACTIVE_COMBO_WINDOW_EXISTS"
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
  | "ULTIMATE_CAST"
  | "ULTIMATE_END"
  | "CRIT_THRESHOLD_REACHED"
  | "BASIC_ATTACK_FINAL_STRIKE_HIT"
  | "DIVE_ATTACK_HIT"
  | "FINISHER_HIT"
  | "STAGGER_NODE_REACHED"
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
  | "ARTS_INFLICTION_APPLIED"
  | "ARTS_BURST_APPLIED"
  | "ARTS_BURST_HIT"
  | "TEAM_STATUS_GAINED"
  | "TEAM_STATUS_CONSUMED"
  | "HEALING_HIT_EXECUTED"
  | "ENEMY_COMMAND_INTERRUPTED"
  | "ROSSI_VULNERABILITY_AND_ARTS_INFLICTION"
  | "SNAPSHOT_INITIALIZED"
  | "OPERATOR_SWITCHED";

export type RotationCombatEvent = {
  type: RotationCombatEventType;
  time: number;
  gameTime: number;
  stepId?: string;
  commandId?: string;
  commandName?: string;
  slot?: PartySlot;
  sourceSlot?: PartySlot;
  target?: "enemy";
  label: string;
  triggeredSlot?: PartySlot;
  buffId?: string;
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
  consumedStacks?: number;
  healedAmount?: number;
};

export type ComboTriggerWindow = {
  slot: PartySlot;
  commandId: string;
  readyAt: number;
  expiresAt: number;
  perfectTimingStartAt?: number;
  perfectTimingEndAt?: number;
  perfectTimingTriggered?: boolean;
  consumedAt?: number;
  sourceStepId: string;
  sourceEventType: RotationCombatEventType;
};
