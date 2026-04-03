import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";
import type { ElementType } from "@/data/characters";
import type { ModifierStatKey } from "@/lib/build/stats";

export type AttackType =
  | "BASIC_ATTACK"
  | "BATTLE_SKILL"
  | "COMBO_SKILL"
  | "ULTIMATE";

export type ScalingTable = number[]; // length 12, index 0 = Lv1

export type CommandHitDefinition = {
  name?: string;
  multiplier: ScalingTable;
  flatAmount?: ScalingTable; // default 0, used by healing/flat formulas
  scalingStat?: "ATK" | "WIL"; // default ATK
  stagger?: ScalingTable; //default 0
  spReturn?: ScalingTable; // default 0
  offsetFrames: ScalingTable; // hit timing from command start (60f = 1s)
  times?: number; //default 1
  repeatIntervalFrames?: ScalingTable; // used when times > 1
  energyReturn?: ScalingTable; //default 0
  attackType?: AttackType; //default to same as command
  damageType?: ElementType; //default to same as command
  targetDebuffs?: {
    stat: ModifierStatKey;
    value: ScalingTable;
    durationSeconds: number;
  }[];
};

export type CommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;

  attackType: AttackType; 
  damageType: ElementType; 
  mode: "single" | "cycling";
  durationFrames: ScalingTable;
  spCost: ScalingTable; // can also scale now
  energyCost?: ScalingTable; // for future use, if needed
  energyGain?: ScalingTable;
  hits: CommandHitDefinition[];
};

export type ResolvedCommandHit = {
  name?: string;
  multiplier: ScalingTable;
  flatAmount: ScalingTable;
  scalingStat: "ATK" | "WIL";
  stagger: ScalingTable;
  spReturn: ScalingTable;
  offsetFrames: ScalingTable;
  times: number;
  repeatIntervalFrames: ScalingTable;
  energyReturn: ScalingTable;
  attackType: AttackType;
  damageType: ElementType;
  targetDebuffs: {
    stat: ModifierStatKey;
    value: ScalingTable;
    durationSeconds: number;
  }[];
};

export type ResolvedCommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode: "single" | "cycling";
  durationFrames: ScalingTable;
  spCost: ScalingTable;
  energyCost: ScalingTable;
  energyGain: ScalingTable;
  hits: ResolvedCommandHit[];
};

export function resolveCommandDefinition(
  command: CommandDefinition,
): ResolvedCommandDefinition {
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
    hits: command.hits.map((hit) => ({
      name: hit.name,
      multiplier: hit.multiplier,
      flatAmount: hit.flatAmount ?? flat12(0),
      scalingStat: hit.scalingStat ?? "ATK",
      stagger: hit.stagger ?? flat12(0),
      spReturn: hit.spReturn ?? flat12(0),
      offsetFrames: hit.offsetFrames,
      times: hit.times ?? 1,
      repeatIntervalFrames: hit.repeatIntervalFrames ?? flat12(0),
      energyReturn: hit.energyReturn ?? flat12(0),
      attackType: hit.attackType ?? command.attackType,
      damageType: hit.damageType ?? command.damageType,
      targetDebuffs: hit.targetDebuffs ?? [],
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
  spReturn: number;
  offsetFrames: number;
  times: number;
  repeatIntervalFrames: number;
  energyReturn: number;
  attackType: AttackType;
  damageType: ElementType;
  targetDebuffs: {
    stat: ModifierStatKey;
    value: number;
    durationSeconds: number;
  }[];
};

export type ResolvedCommandAtLevel = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode: "single" | "cycling";
  durationFrames: number;
  spCost: number;
  energyCost: number;
  energyGain: number;
  hits: ResolvedCommandHitAtLevel[];
};

function resolveTable(table: ScalingTable, level: number): number {
  const idx = Math.max(1, Math.min(12, level)) - 1;
  return table[idx] ?? table[table.length - 1] ?? 0;
}

export function resolveCommandAtLevel(
  command: CommandDefinition,
  skillLevels: CharacterSkillLevels,
): ResolvedCommandAtLevel {
  const level = skillLevels[command.skill];

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
    hits: command.hits.map((hit) => ({
      name: hit.name,
      multiplier: resolveTable(hit.multiplier, level),
      flatAmount: hit.flatAmount ? resolveTable(hit.flatAmount, level) : 0,
      scalingStat: hit.scalingStat ?? "ATK",
      stagger: hit.stagger ? resolveTable(hit.stagger, level) : 0,
      spReturn: hit.spReturn ? resolveTable(hit.spReturn, level) : 0,
      offsetFrames: resolveTable(hit.offsetFrames, level),
      times: hit.times?? 1,
      repeatIntervalFrames: hit.repeatIntervalFrames ? resolveTable(hit.repeatIntervalFrames, level) : 0,
      energyReturn: hit.energyReturn ? resolveTable(hit.energyReturn, level) : 0,
      attackType: hit.attackType?? command.attackType,
      damageType: hit.damageType?? command.damageType,
      targetDebuffs: (hit.targetDebuffs ?? []).map((debuff) => ({
        stat: debuff.stat,
        value: resolveTable(debuff.value, level),
        durationSeconds: debuff.durationSeconds,
      })),
    })),
  };
}

export function resolveCommandsAtLevel(
  commands: CommandDefinition[],
  skillLevels: CharacterSkillLevels,
): ResolvedCommandAtLevel[] {
  return commands.map((cmd) => resolveCommandAtLevel(cmd, skillLevels));
}

export function pct(values: number[]): number[] {
  return values.map((v) => v / 100);
}

export function flat12(value: number): number[] {
  return Array.from({ length: 12 }, () => value);
}
