import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";
import type { BuildCondition, BuildConditionState } from "@/lib/build/buildConditions";
import { isBuildConditionMet } from "@/lib/build/buildConditions";
import type { ElementType } from "@/data/characters";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";

const COMBO_READY_TIMEOUT_SECONDS_FALLBACK = 10;

export type AttackType =
  | "BASIC_ATTACK"
  | "BATTLE_SKILL"
  | "COMBO_SKILL"
  | "ULTIMATE"
  | "TALENT"
  | "REACTION"
  | "GENERIC";

export type GenericActionType = "switch" | "dodge" | "jump";
export type CommandVariantType = "enhanced_basic_attack" | "enhanced_battle_skill";
export type CommandOverlapMode = "normal" | "transient";
export type CommandTransformRule = {
  toCommandId: string;
  requiresBuffId?: string;
  requiresBuffIdsAll?: string[];
  requiresMeltingFlameStacks?: number;
  requiresEnemyStatusId?: string;
};

export type TimeScale = "game" | "real";
export type ComboCooldownStartTiming = "start" | "end";

export type CombatCondition =
  | {
      type: "and";
      conditions: CombatCondition[];
    }
  | {
      type: "or";
      conditions: CombatCondition[];
    }
  | {
      type: "not";
      condition: CombatCondition;
    }
  | {
      type: "require_status";
      statusId: string;
      target?: "enemy" | "self" | "global";
    }
  | {
      type: "require_talent";
      talentKey: string;
      enabled?: boolean;
    }
  | {
      type: "require_perfect_timing";
    };

export type ScalingTable = number[]; // length 12, index 0 = Lv1

export type HitAccumulatorDefinition = {
  type: "consume_enemy_status";
  statusId: string;
  maxConsumed?: ScalingTable;
  useLevelAsStacks?: boolean;
  multiplier?: ScalingTable;
  flatAmount?: ScalingTable;
  stagger?: ScalingTable;
  spGenerated?: ScalingTable;
  spReturned?: ScalingTable;
  energyReturn?: ScalingTable;
};

export type ResolvedHitAccumulatorDefinition = {
  type: "consume_enemy_status";
  statusId: string;
  maxConsumed: ScalingTable;
  useLevelAsStacks: boolean;
  multiplier: ScalingTable;
  flatAmount: ScalingTable;
  stagger: ScalingTable;
  spGenerated: ScalingTable;
  spReturned: ScalingTable;
  energyReturn: ScalingTable;
};

export type ResolvedHitAccumulatorAtLevel = {
  type: "consume_enemy_status";
  statusId: string;
  maxConsumed: number;
  useLevelAsStacks: boolean;
  multiplier: number;
  flatAmount: number;
  stagger: number;
  spGenerated: number;
  spReturned: number;
  energyReturn: number;
};

type CommandHitEffectCore =
  | {
      type: "APPLY_ARTS_INFLICTION";
      element: "Heat" | "Cryo" | "Electric" | "Nature";
      stacks?: number;
      durationSeconds?: number;
    }
  | {
      type: "APPLY_REACTION";
      reaction:
        | "Combustion"
        | "Corrosion"
        | "Solidification"
        | "Electrification"
        | "Lift"
        | "Knockdown"
        | "Crush"
        | "Breach";
      level?: number;
      durationSeconds?: number;
      reactionDamage?: boolean;
      forceApply?: boolean;
      baseMultiplier?: number;
      debuffScaleMultiplier?: number;
    }
  | {
      type: "APPLY_CUSTOM_REACTION";
      reactionId: "YVONNE_BATTLE_SKILL_FREEZE";
      durationSeconds?: number;
      baseMultiplier?: number;
      baseMultiplierScaling?: ScalingTable;
      bonusMultiplierPerConsumedStack?: number;
      bonusMultiplierPerConsumedStackScaling?: ScalingTable;
      baseEnergyReturn?: number;
      baseEnergyReturnScaling?: ScalingTable;
      bonusEnergyReturnPerConsumedStack?: number;
      bonusEnergyReturnPerConsumedStackScaling?: ScalingTable;
      stagger?: number;
      staggerScaling?: ScalingTable;
    }
  | {
      type: "APPLY_GILBERTA_GRAVITY_FIELD_SUS";
      durationSeconds: number;
      baseSusPct?: number;
      baseSusPctScaling?: ScalingTable;
      perStackSusPct?: number;
      perStackSusPctScaling?: ScalingTable;
      fourStackSusPct?: number;
      fourStackSusPctScaling?: ScalingTable;
    }
  | {
      type: "APPLY_STATUS";
      target: "enemy" | "self" | "global";
      statusId: string;
      label?: string;
      effects?: Partial<ModifierStats>;
      durationSeconds: number;
      timeScale?: TimeScale;
      pauseStatusIds?: string[];
      periods?: number;
      initialEffects?: CommandHitEffectDefinition[];
      periodicEffects?: CommandHitEffectDefinition[];
      expireEffects?: CommandHitEffectDefinition[];
    }
  | {
      type: "APPLY_TEAM_STATUS";
      statusId: string;
      label: string;
      stacks?: number;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      durationSeconds: number;
      timeScale?: TimeScale;
    }
  | {
      type: "CONSUME_TEAM_STATUS";
      statusId: string;
      stacks?: number;
      label?: string;
    }
  | {
      type: "REMOVE_STATUS";
      target: "enemy" | "self" | "global";
      statusId: string;
    }
  | {
      type: "EXECUTE_HIT";
      hitRefId?: string;
      commandId?: string;
      hitIndex?: number;
      commandName?: string;
      hitName?: string;
      inheritSourceBonuses?: boolean;
      executeDelayFrames?: number;
      times?: number;
      repeatIntervalFrames?: number;
      registerOffsetFrames?: number;
      repeatRegisterOffsetWithInterval?: boolean;
      registerAtInitialTime?: boolean;
    }
  | {
      type: "APPLY_BUFF";
      target: "self" | "enemy" | "team";
      buffId: string;
      label?: string;
      hidden?: boolean;
      durationSeconds?: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      effectScalings?: Partial<Record<ModifierStatKey, ScalingTable>>;
      effectAttributeScalings?: Partial<
        Record<
          ModifierStatKey,
          {
            attribute: "STR" | "AGI" | "INT" | "WIL";
            ratio: number;
            max?: number;
          }
        >
      >;
      stacks?: number;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      requiresEnemyStatusId?: string;
      requiresSelfBuffId?: string;
      requiresSelfBuffStacksAtLeast?: number;
      requiresSelfBuffStacksExact?: number;
      requiresControlledOperatorFullHp?: boolean;
      requiresSelfPotentialAtLeast?: number;
    }
  | {
      type: "REMOVE_BUFF";
      target: "self" | "enemy";
      buffId: string;
      stacks?: number;
    }
  | {
      type: "APPLY_PHYSICAL_INFLICTION";
      stacks?: number;
      durationSeconds?: number;
    };

export type CommandHitEffectDefinition = CommandHitEffectCore & {
  condition?: CombatCondition;
  chance?: number;
};

export type CommandHitDefinition = {
  name?: string;
  multiplier: ScalingTable;
  flatAmount?: ScalingTable; // default 0, used by healing/flat formulas
  scalingStat?: "ATK" | "WIL"; // default ATK
  stagger?: ScalingTable; //default 0
  spGenerated?: ScalingTable; // default 0
  spReturned?: ScalingTable; // default 0
  requiresControlledOperator?: boolean;
  offsetFrames: ScalingTable; // hit timing from command start (60f = 1s)
  registerOffsetFrames?: ScalingTable; // when the hit becomes committed; defaults to offsetFrames
  times?: number; //default 1
  repeatIntervalFrames?: ScalingTable; // used when times > 1
  repeatRegisterOffsetWithInterval?: boolean; // default true; false keeps same register frame for repeats
  energyReturn?: ScalingTable; //default 0
  attackType?: AttackType; //default to same as command
  damageType?: ElementType; //default to same as command
  noCrit?: boolean;
  accumulator?: HitAccumulatorDefinition;
  effects?: CommandHitEffectDefinition[];
  postEffects?: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  executeCondition?: {
    requiresSelfBuffId?: string;
    requiresStacksAtLeast?: number;
    requiresStacksExact?: number;
    requiresEnemyStatusId?: string;
    condition?: CombatCondition;
  };
};

export type ExecuteHitDefinition = CommandHitDefinition & {
  id: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  commandId?: string;
  commandName?: string;
};

export type CommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;

  attackType: AttackType; 
  damageType: ElementType; 
  mode?: "single" | "cycling";
  durationFrames: ScalingTable;
  spCost: ScalingTable; // can also scale now
  energyCost?: ScalingTable; // for future use, if needed
  energyGain?: ScalingTable;
  timeFreezeSeconds?: ScalingTable;
  cutscene?: boolean;
  comboCooldownSeconds?: ScalingTable;
  comboCooldownTimeScale?: TimeScale;
  comboCooldownStartsAt?: ComboCooldownStartTiming;
  comboCooldownOwnerCommandId?: string;
  comboWindowDelaySeconds?: ScalingTable;
  comboWindowDurationSeconds?: ScalingTable;
  perfectTimingDelaySeconds?: ScalingTable;
  perfectTimingDurationSeconds?: ScalingTable;
  spGeneratedOnEnd?: ScalingTable;
  spReturnedOnEnd?: ScalingTable;
  hiddenInLibrary?: boolean;
  expandsToCommandIds?: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "finisher" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier?: boolean;
  splitHitMultiplierEvenly?: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms?: CommandTransformRule[];
  requiresControlledOperator?: boolean;
  showNameInHitTimeline?: boolean;
  overlapMode?: CommandOverlapMode;
  noFinisherTransform?: boolean;
  condition?: BuildCondition;
  commandModifiers?: Partial<ModifierStats>;
  initialEffects?: CommandHitEffectDefinition[];
  hits: CommandHitDefinition[];
};

export type ResolvedCommandHit = {
  name?: string;
  multiplier: ScalingTable;
  flatAmount: ScalingTable;
  scalingStat: "ATK" | "WIL";
  stagger: ScalingTable;
  spGenerated: ScalingTable;
  spReturned: ScalingTable;
  requiresControlledOperator: boolean;
  offsetFrames: ScalingTable;
  registerOffsetFrames: ScalingTable;
  times: number;
  repeatIntervalFrames: ScalingTable;
  repeatRegisterOffsetWithInterval: boolean;
  energyReturn: ScalingTable;
  attackType: AttackType;
  damageType: ElementType;
  noCrit: boolean;
  accumulator?: ResolvedHitAccumulatorDefinition;
  effects: CommandHitEffectDefinition[];
  postEffects: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  executeCondition?: {
    requiresSelfBuffId?: string;
    requiresStacksAtLeast?: number;
    requiresStacksExact?: number;
    requiresEnemyStatusId?: string;
    condition?: CombatCondition;
  };
};

export type ResolvedCommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode?: "single" | "cycling";
  durationFrames: ScalingTable;
  spCost: ScalingTable;
  energyCost: ScalingTable;
  energyGain: ScalingTable;
  timeFreezeSeconds: ScalingTable;
  cutscene: boolean;
  comboCooldownSeconds: ScalingTable;
  comboCooldownTimeScale: TimeScale;
  comboCooldownStartsAt: ComboCooldownStartTiming;
  comboCooldownOwnerCommandId?: string;
  comboWindowDelaySeconds: ScalingTable;
  comboWindowDurationSeconds: ScalingTable;
  perfectTimingDelaySeconds: ScalingTable;
  perfectTimingDurationSeconds: ScalingTable;
  spGeneratedOnEnd: ScalingTable;
  spReturnedOnEnd: ScalingTable;
  hiddenInLibrary: boolean;
  expandsToCommandIds: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "finisher" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms: CommandTransformRule[];
  requiresControlledOperator: boolean;
  showNameInHitTimeline: boolean;
  overlapMode: CommandOverlapMode;
  noFinisherTransform: boolean;
  condition?: BuildCondition;
  commandModifiers: Partial<ModifierStats>;
  initialEffects: CommandHitEffectDefinition[];
  hits: ResolvedCommandHit[];
};

export function resolveCommandDefinition(
  command: CommandDefinition,
): ResolvedCommandDefinition {
  const splitMultiplier = command.splitMultiplier ?? command.splitHitMultiplierEvenly ?? false;
  return {
    id: command.id,
    name: command.name,
    skill: command.skill,
    attackType: command.attackType,
    damageType: command.damageType,
    mode: command.mode,
    durationFrames: command.durationFrames,
    spCost: command.spCost,
    energyCost: command.energyCost ?? flat12(0),
    energyGain: command.energyGain ?? flat12(0),
    timeFreezeSeconds: command.timeFreezeSeconds ?? flat12(0),
    cutscene: command.cutscene ?? false,
    comboCooldownSeconds: command.comboCooldownSeconds ?? flat12(0),
    comboCooldownTimeScale: command.comboCooldownTimeScale ?? "real",
    comboCooldownStartsAt: command.comboCooldownStartsAt ?? "start",
    comboCooldownOwnerCommandId: command.comboCooldownOwnerCommandId,
    comboWindowDelaySeconds: command.comboWindowDelaySeconds ?? flat12(0),
    comboWindowDurationSeconds: command.comboWindowDurationSeconds ?? flat12(COMBO_READY_TIMEOUT_SECONDS_FALLBACK),
    perfectTimingDelaySeconds: command.perfectTimingDelaySeconds ?? flat12(0),
    perfectTimingDurationSeconds: command.perfectTimingDurationSeconds ?? flat12(0),
    spGeneratedOnEnd: command.spGeneratedOnEnd ?? flat12(0),
    spReturnedOnEnd: command.spReturnedOnEnd ?? flat12(0),
    hiddenInLibrary: command.hiddenInLibrary ?? false,
    expandsToCommandIds: command.expandsToCommandIds ?? [],
    basicAttackVariant: command.basicAttackVariant,
    sequenceSegmentIndex: command.sequenceSegmentIndex,
    sequenceSegmentTotal: command.sequenceSegmentTotal,
    splitMultiplier,
    genericActionType: command.genericActionType,
    variant: command.variant,
    transforms: command.transforms ?? [],
    requiresControlledOperator: command.requiresControlledOperator ?? false,
    showNameInHitTimeline: command.showNameInHitTimeline ?? false,
    overlapMode: command.overlapMode ?? "normal",
    noFinisherTransform: command.noFinisherTransform ?? false,
    condition: command.condition,
    commandModifiers: command.commandModifiers ?? {},
    initialEffects: command.initialEffects ?? [],
    hits: command.hits.map((hit) => ({
      name: hit.name,
      multiplier: hit.multiplier,
      flatAmount: hit.flatAmount ?? flat12(0),
      scalingStat: hit.scalingStat ?? "ATK",
      stagger: hit.stagger ?? flat12(0),
      spGenerated: hit.spGenerated ?? flat12(0),
      spReturned: hit.spReturned ?? flat12(0),
      requiresControlledOperator: hit.requiresControlledOperator ?? false,
      offsetFrames: hit.offsetFrames,
      registerOffsetFrames: hit.registerOffsetFrames ?? hit.offsetFrames,
      times: hit.times ?? 1,
      repeatIntervalFrames: hit.repeatIntervalFrames ?? flat12(0),
      repeatRegisterOffsetWithInterval: hit.repeatRegisterOffsetWithInterval ?? true,
      energyReturn: hit.energyReturn ?? flat12(0),
      attackType: hit.attackType ?? command.attackType,
      damageType: hit.damageType ?? command.damageType,
      noCrit: hit.noCrit ?? false,
      accumulator: hit.accumulator
        ? {
            type: hit.accumulator.type,
            statusId: hit.accumulator.statusId,
            maxConsumed: hit.accumulator.maxConsumed ?? flat12(99),
            useLevelAsStacks: hit.accumulator.useLevelAsStacks ?? true,
            multiplier: hit.accumulator.multiplier ?? flat12(0),
            flatAmount: hit.accumulator.flatAmount ?? flat12(0),
            stagger: hit.accumulator.stagger ?? flat12(0),
            spGenerated: hit.accumulator.spGenerated ?? flat12(0),
            spReturned: hit.accumulator.spReturned ?? flat12(0),
            energyReturn: hit.accumulator.energyReturn ?? flat12(0),
          }
        : undefined,
      effects: hit.effects ?? [],
      postEffects: hit.postEffects ?? [],
      condition: hit.condition,
      executeCondition: hit.executeCondition,
    })),
  };
}

export function resolveCommandsDefinition(
  commands: CommandDefinition[],
): ResolvedCommandDefinition[] {
  return commands.map(resolveCommandDefinition);
}

export type ResolvedCommandHitAtLevel = {
  name?: string;
  multiplier: number;
  flatAmount: number;
  scalingStat: "ATK" | "WIL";
  stagger: number;
  spGenerated: number;
  spReturned: number;
  requiresControlledOperator: boolean;
  offsetFrames: number;
  registerOffsetFrames: number;
  times: number;
  repeatIntervalFrames: number;
  repeatRegisterOffsetWithInterval: boolean;
  energyReturn: number;
  attackType: AttackType;
  damageType: ElementType;
  noCrit: boolean;
  accumulator?: ResolvedHitAccumulatorAtLevel;
  effects: CommandHitEffectDefinition[];
  postEffects: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  executeCondition?: {
    requiresSelfBuffId?: string;
    requiresStacksAtLeast?: number;
    requiresStacksExact?: number;
    requiresEnemyStatusId?: string;
    condition?: CombatCondition;
  };
};

export type ResolvedCommandAtLevel = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode?: "single" | "cycling";
  durationFrames: number;
  spCost: number;
  energyCost: number;
  energyGain: number;
  timeFreezeSeconds: number;
  cutscene: boolean;
  comboCooldownSeconds: number;
  comboCooldownTimeScale: TimeScale;
  comboCooldownStartsAt: ComboCooldownStartTiming;
  comboCooldownOwnerCommandId?: string;
  comboWindowDelaySeconds: number;
  comboWindowDurationSeconds: number;
  perfectTimingDelaySeconds: number;
  perfectTimingDurationSeconds: number;
  spGeneratedOnEnd: number;
  spReturnedOnEnd: number;
  hiddenInLibrary: boolean;
  expandsToCommandIds: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "finisher" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms: CommandTransformRule[];
  requiresControlledOperator: boolean;
  showNameInHitTimeline: boolean;
  overlapMode: CommandOverlapMode;
  noFinisherTransform: boolean;
  condition?: BuildCondition;
  commandModifiers: Partial<ModifierStats>;
  initialEffects: CommandHitEffectDefinition[];
  hits: ResolvedCommandHitAtLevel[];
};

export type ResolvedExecuteHitAtLevel = {
  id: string;
  skill: CharacterSkillKey;
  commandId?: string;
  commandName?: string;
  hit: ResolvedCommandHitAtLevel;
};

export type ResolveCommandBuildState = BuildConditionState;

function resolveTable(table: ScalingTable, level: number): number {
  const idx = Math.max(1, Math.min(12, level)) - 1;
  return table[idx] ?? table[table.length - 1] ?? 0;
}

function resolveHitEffectAtLevel(effect: CommandHitEffectDefinition, level: number): CommandHitEffectDefinition {
  if (effect.type === "APPLY_STATUS") {
    return {
      ...effect,
      initialEffects: effect.initialEffects?.map((nestedEffect) => resolveHitEffectAtLevel(nestedEffect, level)),
      periodicEffects: effect.periodicEffects?.map((nestedEffect) => resolveHitEffectAtLevel(nestedEffect, level)),
      expireEffects: effect.expireEffects?.map((nestedEffect) => resolveHitEffectAtLevel(nestedEffect, level)),
    };
  }

  if (effect.type === "APPLY_CUSTOM_REACTION") {
    return {
      ...effect,
      baseMultiplier: effect.baseMultiplierScaling ? resolveTable(effect.baseMultiplierScaling, level) : effect.baseMultiplier,
      bonusMultiplierPerConsumedStack: effect.bonusMultiplierPerConsumedStackScaling
        ? resolveTable(effect.bonusMultiplierPerConsumedStackScaling, level)
        : effect.bonusMultiplierPerConsumedStack,
      baseEnergyReturn: effect.baseEnergyReturnScaling ? resolveTable(effect.baseEnergyReturnScaling, level) : effect.baseEnergyReturn,
      bonusEnergyReturnPerConsumedStack: effect.bonusEnergyReturnPerConsumedStackScaling
        ? resolveTable(effect.bonusEnergyReturnPerConsumedStackScaling, level)
        : effect.bonusEnergyReturnPerConsumedStack,
      stagger: effect.staggerScaling ? resolveTable(effect.staggerScaling, level) : effect.stagger,
      baseMultiplierScaling: undefined,
      bonusMultiplierPerConsumedStackScaling: undefined,
      baseEnergyReturnScaling: undefined,
      bonusEnergyReturnPerConsumedStackScaling: undefined,
      staggerScaling: undefined,
    };
  }

  if (effect.type === "APPLY_GILBERTA_GRAVITY_FIELD_SUS") {
    return {
      ...effect,
      baseSusPct: effect.baseSusPctScaling ? resolveTable(effect.baseSusPctScaling, level) : effect.baseSusPct,
      perStackSusPct: effect.perStackSusPctScaling ? resolveTable(effect.perStackSusPctScaling, level) : effect.perStackSusPct,
      fourStackSusPct: effect.fourStackSusPctScaling ? resolveTable(effect.fourStackSusPctScaling, level) : effect.fourStackSusPct,
      baseSusPctScaling: undefined,
      perStackSusPctScaling: undefined,
      fourStackSusPctScaling: undefined,
    };
  }

  if (effect.type !== "APPLY_BUFF") {
    return effect;
  }

  const resolvedScalingEffects: Partial<ModifierStats> = {};
  for (const [key, values] of Object.entries(effect.effectScalings ?? {})) {
    if (!Array.isArray(values)) {
      continue;
    }
    resolvedScalingEffects[key as ModifierStatKey] = resolveTable(values, level);
  }

  return {
    ...effect,
    effects: {
      ...(effect.effects ?? {}),
      ...resolvedScalingEffects,
    },
    effectScalings: undefined,
  };
}

export function resolveCommandAtLevel(
  command: CommandDefinition,
  skillLevels: CharacterSkillLevels,
  buildState?: ResolveCommandBuildState,
): ResolvedCommandAtLevel | null {
  if (!isBuildConditionMet(command.condition, buildState ?? { ascensionStage: 0, uniqueTalentToggles: {} })) {
    return null;
  }

  const level = skillLevels[command.skill];
  const activeHits = command.hits.filter((hit) =>
    isBuildConditionMet(hit.condition, buildState ?? { ascensionStage: 0, uniqueTalentToggles: {} }),
  );
  const splitMultiplier = command.splitMultiplier ?? command.splitHitMultiplierEvenly ?? false;
  const splitHitCount = splitMultiplier
    ? Math.max(1, activeHits.reduce((sum, hit) => sum + (hit.times ?? 1), 0))
    : 1;

  return {
    id: command.id,
    name: command.name,
    skill: command.skill,
    attackType: command.attackType,
    damageType: command.damageType,
    mode: command.mode,
    durationFrames: resolveTable(command.durationFrames, level),
    spCost: command.spCost ? resolveTable(command.spCost, level) : 0,
    energyCost: command.energyCost ? resolveTable(command.energyCost, level) : 0,
    energyGain: command.energyGain ? resolveTable(command.energyGain, level) : 0,
    timeFreezeSeconds: command.timeFreezeSeconds
      ? resolveTable(command.timeFreezeSeconds, level)
      : 0,
    cutscene: command.cutscene ?? false,
    comboCooldownSeconds: command.comboCooldownSeconds
      ? resolveTable(command.comboCooldownSeconds, level)
      : 0,
    comboCooldownTimeScale: command.comboCooldownTimeScale ?? "real",
    comboCooldownStartsAt: command.comboCooldownStartsAt ?? "start",
    comboCooldownOwnerCommandId: command.comboCooldownOwnerCommandId,
    comboWindowDelaySeconds: command.comboWindowDelaySeconds
      ? resolveTable(command.comboWindowDelaySeconds, level)
      : 0,
    comboWindowDurationSeconds: command.comboWindowDurationSeconds
      ? resolveTable(command.comboWindowDurationSeconds, level)
      : COMBO_READY_TIMEOUT_SECONDS_FALLBACK,
    perfectTimingDelaySeconds: command.perfectTimingDelaySeconds
      ? resolveTable(command.perfectTimingDelaySeconds, level)
      : 0,
    perfectTimingDurationSeconds: command.perfectTimingDurationSeconds
      ? resolveTable(command.perfectTimingDurationSeconds, level)
      : 0,
    spGeneratedOnEnd: command.spGeneratedOnEnd
      ? resolveTable(command.spGeneratedOnEnd, level)
      : 0,
    spReturnedOnEnd: command.spReturnedOnEnd
      ? resolveTable(command.spReturnedOnEnd, level)
      : 0,
    hiddenInLibrary: command.hiddenInLibrary ?? false,
    expandsToCommandIds: command.expandsToCommandIds ?? [],
    basicAttackVariant: command.basicAttackVariant,
    sequenceSegmentIndex: command.sequenceSegmentIndex,
    sequenceSegmentTotal: command.sequenceSegmentTotal,
    splitMultiplier,
    genericActionType: command.genericActionType,
    variant: command.variant,
    transforms: command.transforms ?? [],
    requiresControlledOperator: command.requiresControlledOperator ?? false,
    showNameInHitTimeline: command.showNameInHitTimeline ?? false,
    overlapMode: command.overlapMode ?? "normal",
    noFinisherTransform: command.noFinisherTransform ?? false,
    condition: command.condition,
    commandModifiers: command.commandModifiers ?? {},
    initialEffects: (command.initialEffects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
    hits: activeHits.map((hit) => ({
      name: hit.name,
      multiplier: resolveTable(hit.multiplier, level) / splitHitCount,
      flatAmount: hit.flatAmount ? resolveTable(hit.flatAmount, level) : 0,
      scalingStat: hit.scalingStat ?? "ATK",
      stagger: hit.stagger ? resolveTable(hit.stagger, level) : 0,
      spGenerated: hit.spGenerated ? resolveTable(hit.spGenerated, level) : 0,
      spReturned: hit.spReturned ? resolveTable(hit.spReturned, level) : 0,
      requiresControlledOperator: hit.requiresControlledOperator ?? false,
      offsetFrames: resolveTable(hit.offsetFrames, level),
      registerOffsetFrames: resolveTable(hit.registerOffsetFrames ?? hit.offsetFrames, level),
      times: hit.times?? 1,
      repeatIntervalFrames: hit.repeatIntervalFrames ? resolveTable(hit.repeatIntervalFrames, level) : 0,
      repeatRegisterOffsetWithInterval: hit.repeatRegisterOffsetWithInterval ?? true,
      energyReturn: hit.energyReturn ? resolveTable(hit.energyReturn, level) : 0,
      attackType: hit.attackType?? command.attackType,
      damageType: hit.damageType?? command.damageType,
      noCrit: hit.noCrit ?? false,
      accumulator: hit.accumulator
        ? {
            type: hit.accumulator.type,
            statusId: hit.accumulator.statusId,
            maxConsumed: resolveTable(hit.accumulator.maxConsumed ?? flat12(99), level),
            useLevelAsStacks: hit.accumulator.useLevelAsStacks ?? true,
            multiplier: resolveTable(hit.accumulator.multiplier ?? flat12(0), level),
            flatAmount: resolveTable(hit.accumulator.flatAmount ?? flat12(0), level),
            stagger: resolveTable(hit.accumulator.stagger ?? flat12(0), level),
            spGenerated: resolveTable(hit.accumulator.spGenerated ?? flat12(0), level),
            spReturned: resolveTable(hit.accumulator.spReturned ?? flat12(0), level),
            energyReturn: resolveTable(hit.accumulator.energyReturn ?? flat12(0), level),
          }
        : undefined,
      effects: (hit.effects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
      postEffects: (hit.postEffects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
      condition: hit.condition,
      executeCondition: hit.executeCondition,
    })),
  };
}

export function resolveExecuteHitsAtLevel(
  executeHits: ExecuteHitDefinition[],
  skillLevels: CharacterSkillLevels,
  buildState?: ResolveCommandBuildState,
): Record<string, ResolvedExecuteHitAtLevel> {
  const resolved: Record<string, ResolvedExecuteHitAtLevel> = {};
  const fallbackBuildState = buildState ?? { ascensionStage: 0, uniqueTalentToggles: {} };

  for (const executeHit of executeHits) {
    if (!isBuildConditionMet(executeHit.condition, fallbackBuildState)) {
      continue;
    }
    const level = skillLevels[executeHit.skill];
    resolved[executeHit.id] = {
      id: executeHit.id,
      skill: executeHit.skill,
      commandId: executeHit.commandId,
      commandName: executeHit.commandName,
      hit: {
        name: executeHit.name,
        multiplier: resolveTable(executeHit.multiplier, level),
        flatAmount: executeHit.flatAmount ? resolveTable(executeHit.flatAmount, level) : 0,
        scalingStat: executeHit.scalingStat ?? "ATK",
        stagger: executeHit.stagger ? resolveTable(executeHit.stagger, level) : 0,
        spGenerated: executeHit.spGenerated ? resolveTable(executeHit.spGenerated, level) : 0,
        spReturned: executeHit.spReturned ? resolveTable(executeHit.spReturned, level) : 0,
        requiresControlledOperator: executeHit.requiresControlledOperator ?? false,
        offsetFrames: resolveTable(executeHit.offsetFrames, level),
        registerOffsetFrames: resolveTable(executeHit.registerOffsetFrames ?? executeHit.offsetFrames, level),
        times: executeHit.times ?? 1,
        repeatIntervalFrames: executeHit.repeatIntervalFrames ? resolveTable(executeHit.repeatIntervalFrames, level) : 0,
        repeatRegisterOffsetWithInterval: executeHit.repeatRegisterOffsetWithInterval ?? true,
        energyReturn: executeHit.energyReturn ? resolveTable(executeHit.energyReturn, level) : 0,
        attackType: executeHit.attackType,
        damageType: executeHit.damageType,
        noCrit: executeHit.noCrit ?? false,
        accumulator: executeHit.accumulator
          ? {
              type: executeHit.accumulator.type,
              statusId: executeHit.accumulator.statusId,
              maxConsumed: resolveTable(executeHit.accumulator.maxConsumed ?? flat12(99), level),
              useLevelAsStacks: executeHit.accumulator.useLevelAsStacks ?? true,
              multiplier: resolveTable(executeHit.accumulator.multiplier ?? flat12(0), level),
              flatAmount: resolveTable(executeHit.accumulator.flatAmount ?? flat12(0), level),
              stagger: resolveTable(executeHit.accumulator.stagger ?? flat12(0), level),
              spGenerated: resolveTable(executeHit.accumulator.spGenerated ?? flat12(0), level),
              spReturned: resolveTable(executeHit.accumulator.spReturned ?? flat12(0), level),
              energyReturn: resolveTable(executeHit.accumulator.energyReturn ?? flat12(0), level),
            }
          : undefined,
        effects: (executeHit.effects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
        postEffects: (executeHit.postEffects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
        condition: executeHit.condition,
        executeCondition: executeHit.executeCondition,
      },
    };
  }

  return resolved;
}

export function resolveCommandsAtLevel(
  commands: CommandDefinition[],
  skillLevels: CharacterSkillLevels,
  buildState?: ResolveCommandBuildState,
): ResolvedCommandAtLevel[] {
  return commands
    .map((cmd) => resolveCommandAtLevel(cmd, skillLevels, buildState))
    .filter((cmd): cmd is ResolvedCommandAtLevel => cmd != null);
}

export function applyCommandModifierStats(
  commands: ResolvedCommandAtLevel[],
  mods: ModifierStats,
): ResolvedCommandAtLevel[] {
  const ultimateCostReduction = Math.max(0, mods.ULTIMATE_COST_REDUCTION_PCT ?? 0);
  if (ultimateCostReduction <= 0) {
    return commands;
  }

  return commands.map((command) => {
    if (command.attackType !== "ULTIMATE" || command.energyCost <= 0) {
      return command;
    }

    return {
      ...command,
      energyCost: Math.max(0, command.energyCost * (1 - ultimateCostReduction)),
    };
  });
}

export type CommandTransformState = {
  activeBuffIds: string[];
  meltingFlameStacks: number;
  finisherAvailable?: boolean;
  enemyStatusIds?: string[];
  canUseFinisherTransform?: boolean;
};

export function resolveCommandTransform(
  commands: ResolvedCommandAtLevel[],
  commandId: string,
  state: CommandTransformState,
): ResolvedCommandAtLevel | null {
  const baseCommand = commands.find((command) => command.id === commandId) ?? null;
  if (!baseCommand) {
    return null;
  }

  let resolvedCommand: ResolvedCommandAtLevel = baseCommand;
  for (const rule of baseCommand.transforms) {
    if (rule.requiresBuffId && !state.activeBuffIds.includes(rule.requiresBuffId)) {
      continue;
    }
    if (rule.requiresBuffIdsAll && rule.requiresBuffIdsAll.some((buffId) => !state.activeBuffIds.includes(buffId))) {
      continue;
    }

    if ((rule.requiresMeltingFlameStacks ?? 0) > state.meltingFlameStacks) {
      continue;
    }
    if (
      rule.requiresEnemyStatusId
      && !(state.enemyStatusIds ?? []).includes(rule.requiresEnemyStatusId)
    ) {
      continue;
    }

    resolvedCommand = commands.find((command) => command.id === rule.toCommandId) ?? baseCommand;
    break;
  }

  // Enemy "finisher available" is a lower-priority transform than character-specific rules.
  if (
    resolvedCommand.id === baseCommand.id
    && state.finisherAvailable
    && state.canUseFinisherTransform !== false
    && baseCommand.attackType === "BASIC_ATTACK"
    && baseCommand.basicAttackVariant === "sequence"
    && !baseCommand.noFinisherTransform
  ) {
    const finisherCommand = commands.find((command) =>
      command.attackType === "BASIC_ATTACK" && command.basicAttackVariant === "finisher"
    );
    if (finisherCommand) {
      return finisherCommand;
    }
  }

  return resolvedCommand;
}

export function pct(values: number[]): number[] {
  return values.map((v) => v / 100);
}

export function flat12(value: number): number[] {
  return Array.from({ length: 12 }, () => value);
}
