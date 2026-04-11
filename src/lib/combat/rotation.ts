import type { ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { ResolvedCommandAtLevel } from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { ModifierStatKey } from "@/lib/build/stats";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import type { BuildCondition } from "@/lib/build/buildConditions";
import type { AscensionStage, PotentialLevel } from "@/lib/build/progression";
import type { ActiveGearSetInfo } from "@/lib/combat/gearSetEffects";

export type PartySlot = 0 | 1 | 2 | 3;

export type RotationStep = {
  id: string;
  slot: PartySlot;
  commandId: string;
  startTime?: number;
  groupId?: string;
};

export type RotationGroup = {
  id: string;
  name: string;
};

export type Rotation = {
  steps: RotationStep[];
  groups?: RotationGroup[];
};

export type CharacterCombatSnapshot = {
  slot: PartySlot;
  characterId: string;
  characterName: string;
  level: number;
  weaponId: string;
  weaponSkillLevels: number[];
  ascensionStage: AscensionStage;
  potentialLevel: PotentialLevel;
  uniqueTalentToggles: Record<string, boolean>;
  uniqueTalentConditions?: Record<string, BuildCondition | undefined>;
  uniqueTalentDefaults?: Record<string, boolean | undefined>;

  finalAtk: number;
  mods: ModifierStats;
  activeGearSet?: ActiveGearSetInfo;

  commands: ResolvedCommandAtLevel[];
  combatHooks?: CharacterCombatHooks;
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
  damage: number;
  stagger: number;
  spGenerated: number;
  spReturned: number;
  energyReturn: number;
  requiresControlledOperator: boolean;
  triggeredComboSlots: PartySlot[];
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
};

export type ActorCombatStateSnapshot = {
  time: number;
  gameTime: number;
  slot: PartySlot;
  meltingFlameStacks: number;
  activeBuffs: ActorActiveBuffState[];
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
};

export type RotationCombatEventType =
  | "ULTIMATE_CAST"
  | "BASIC_ATTACK_FINAL_STRIKE_HIT"
  | "FINISHER_HIT"
  | "ENEMY_DEFEATED"
  | "HEAT_INFLICTION_APPLIED"
  | "COMBUSTION_APPLIED"
  | "CORROSION_APPLIED"
  | "BATTLE_SKILL_CAST"
  | "ENEMY_DEBUFF_APPLIED"
  | "MELTING_FLAME_GAINED"
  | "MELTING_FLAME_CONSUMED"
  | "MELTING_FLAME_FULL"
  | "COMBO_TRIGGERED"
  | "WEAPON_BUFF_APPLIED"
  | "ACTOR_BUFF_APPLIED"
  | "SKILL_SP_RECOVERED"
  | "BATTLE_OR_COMBO_HIT"
  | "ARTS_REACTION_CONSUMED";

export type RotationCombatEvent = {
  type: RotationCombatEventType;
  time: number;
  gameTime: number;
  stepId?: string;
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
};

export type ComboTriggerWindow = {
  slot: PartySlot;
  readyAt: number;
  expiresAt: number;
  consumedAt?: number;
  sourceStepId: string;
  sourceEventType: RotationCombatEventType;
};
