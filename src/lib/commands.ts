import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";
import type { BuildCondition, BuildConditionState } from "@/lib/build/buildConditions";
import { isBuildConditionMet } from "@/lib/build/buildConditions";
import type { ElementType } from "@/data/characters";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";

export type AttackType =
  | "BASIC_ATTACK"
  | "BATTLE_SKILL"
  | "COMBO_SKILL"
  | "ULTIMATE"
  | "REACTION"
  | "GENERIC";

export type GenericActionType = "switch" | "dodge" | "jump";
export type CommandVariantType = "enhanced_basic_attack" | "enhanced_battle_skill";
export type CommandTransformRule = {
  toCommandId: string;
  requiresBuffId?: string;
  requiresMeltingFlameStacks?: number;
};

export type TimeScale = "game" | "real";

export type ScalingTable = number[]; // length 12, index 0 = Lv1

export type CommandHitEffectDefinition =
  | {
      type: "APPLY_ARTS_INFLICTION";
      element: "Heat" | "Cryo" | "Electric" | "Nature";
      stacks?: number;
      durationSeconds?: number;
    }
  | {
      type: "APPLY_REACTION";
      reaction: "Combustion" | "Corrosion" | "Solidification" | "Electrification";
      level?: number;
      durationSeconds?: number;
      reactionDamage?: boolean;
    }
  | {
      type: "APPLY_BUFF";
      target: "self" | "enemy";
      buffId: string;
      label?: string;
      hidden?: boolean;
      durationSeconds?: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      effectScalings?: Partial<Record<ModifierStatKey, ScalingTable>>;
      stacks?: number;
      requiresEnemyStatusId?: string;
    }
  | {
      type: "REMOVE_BUFF";
      target: "self" | "enemy";
      buffId: string;
      stacks?: number;
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
  energyReturn?: ScalingTable; //default 0
  attackType?: AttackType; //default to same as command
  damageType?: ElementType; //default to same as command
  effects?: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  targetDebuffs?: {
    stat: ModifierStatKey;
    value: ScalingTable;
    durationSeconds: number;
    timeScale?: TimeScale;
  }[];
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
  spGeneratedOnEnd?: ScalingTable;
  spReturnedOnEnd?: ScalingTable;
  hiddenInLibrary?: boolean;
  expandsToCommandIds?: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier?: boolean;
  splitHitMultiplierEvenly?: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms?: CommandTransformRule[];
  requiresControlledOperator?: boolean;
  condition?: BuildCondition;
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
  energyReturn: ScalingTable;
  attackType: AttackType;
  damageType: ElementType;
  effects: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  targetDebuffs: {
    stat: ModifierStatKey;
    value: ScalingTable;
    durationSeconds: number;
    timeScale: TimeScale;
  }[];
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
  spGeneratedOnEnd: ScalingTable;
  spReturnedOnEnd: ScalingTable;
  hiddenInLibrary: boolean;
  expandsToCommandIds: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms: CommandTransformRule[];
  requiresControlledOperator: boolean;
  condition?: BuildCondition;
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
    condition: command.condition,
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
      energyReturn: hit.energyReturn ?? flat12(0),
      attackType: hit.attackType ?? command.attackType,
      damageType: hit.damageType ?? command.damageType,
      effects: hit.effects ?? [],
      condition: hit.condition,
      targetDebuffs: (hit.targetDebuffs ?? []).map((debuff) => ({
        stat: debuff.stat,
        value: debuff.value,
        durationSeconds: debuff.durationSeconds,
        timeScale: debuff.timeScale ?? "game",
      })),
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
  energyReturn: number;
  attackType: AttackType;
  damageType: ElementType;
  effects: CommandHitEffectDefinition[];
  condition?: BuildCondition;
  targetDebuffs: {
    stat: ModifierStatKey;
    value: number;
    durationSeconds: number;
    timeScale: TimeScale;
  }[];
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
  spGeneratedOnEnd: number;
  spReturnedOnEnd: number;
  hiddenInLibrary: boolean;
  expandsToCommandIds: string[];
  basicAttackVariant?: "sequence" | "sequence_segment" | "final_strike" | "dive_attack";
  sequenceSegmentIndex?: number;
  sequenceSegmentTotal?: number;
  splitMultiplier: boolean;
  genericActionType?: GenericActionType;
  variant?: CommandVariantType;
  transforms: CommandTransformRule[];
  requiresControlledOperator: boolean;
  condition?: BuildCondition;
  hits: ResolvedCommandHitAtLevel[];
};

export type ResolveCommandBuildState = BuildConditionState;

function resolveTable(table: ScalingTable, level: number): number {
  const idx = Math.max(1, Math.min(12, level)) - 1;
  return table[idx] ?? table[table.length - 1] ?? 0;
}

function resolveHitEffectAtLevel(effect: CommandHitEffectDefinition, level: number): CommandHitEffectDefinition {
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
    condition: command.condition,
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
      energyReturn: hit.energyReturn ? resolveTable(hit.energyReturn, level) : 0,
      attackType: hit.attackType?? command.attackType,
      damageType: hit.damageType?? command.damageType,
      effects: (hit.effects ?? []).map((effect) => resolveHitEffectAtLevel(effect, level)),
      condition: hit.condition,
      targetDebuffs: (hit.targetDebuffs ?? []).map((debuff) => ({
        stat: debuff.stat,
        value: resolveTable(debuff.value, level),
        durationSeconds: debuff.durationSeconds,
        timeScale: debuff.timeScale ?? "game",
      })),
    })),
  };
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

  for (const rule of baseCommand.transforms) {
    if (rule.requiresBuffId && !state.activeBuffIds.includes(rule.requiresBuffId)) {
      continue;
    }

    if ((rule.requiresMeltingFlameStacks ?? 0) > state.meltingFlameStacks) {
      continue;
    }

    return commands.find((command) => command.id === rule.toCommandId) ?? baseCommand;
  }

  return baseCommand;
}

export function pct(values: number[]): number[] {
  return values.map((v) => v / 100);
}

export function flat12(value: number): number[] {
  return Array.from({ length: 12 }, () => value);
}
