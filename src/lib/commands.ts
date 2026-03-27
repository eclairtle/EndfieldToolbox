import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";
import type { ElementType } from "@/data/characters";

export type AttackType =
  | "BASIC_ATTACK"
  | "BATTLE_SKILL"
  | "COMBO_SKILL"
  | "ULTIMATE";

export type ScalingTable = number[]; // length 12, index 0 = Lv1

export type CommandHitDefinition = {
  name?: string;
  multiplier: ScalingTable;
  stagger?: ScalingTable; //default 0
  spReturn?: ScalingTable; // default 0
  frameData: ScalingTable; // per-hit now
  times?: number; //default 1
  energyReturn?: ScalingTable; //default 0
  attackType?: AttackType; //default to same as command
  damageType?: ElementType; //default to same as command
};

export type CommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;

  attackType: AttackType; 
  damageType: ElementType; 
  mode: "single" | "cycling";
  spCost: ScalingTable; // can also scale now
  energyCost?: ScalingTable; // for future use, if needed
  hits: CommandHitDefinition[];
};

export type ResolvedCommandHit = {
  name?: string;
  multiplier: ScalingTable;
  stagger: ScalingTable;
  spReturn: ScalingTable;
  frameData: ScalingTable;
  times: number;
  energyReturn: ScalingTable;
  attackType: AttackType;
  damageType: ElementType;
};

export type ResolvedCommandDefinition = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode: "single" | "cycling";
  spCost: ScalingTable;
  energyCost: ScalingTable;
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
    spCost: command.spCost,
    energyCost: command.energyCost ?? flat12(0),
    hits: command.hits.map((hit) => ({
      name: hit.name,
      multiplier: hit.multiplier,
      stagger: hit.stagger ?? flat12(0),
      spReturn: hit.spReturn ?? flat12(0),
      frameData: hit.frameData,
      times: hit.times ?? 1,
      energyReturn: hit.energyReturn ?? flat12(0),
      attackType: hit.attackType ?? command.attackType,
      damageType: hit.damageType ?? command.damageType,
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
  stagger: number;
  spReturn: number;
  frameData: number;
  times: number;
  energyReturn: number;
  attackType: AttackType;
  damageType: ElementType;
};

export type ResolvedCommandAtLevel = {
  id: string;
  name: string;
  skill: CharacterSkillKey;
  attackType: AttackType;
  damageType: ElementType;
  mode: "single" | "cycling";
  spCost: number;
  energyCost: number;
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
    spCost: command.spCost ? resolveTable(command.spCost, level) : 0,
    energyCost: command.energyCost ? resolveTable(command.energyCost, level) : 0,
    hits: command.hits.map((hit) => ({
      name: hit.name,
      multiplier: resolveTable(hit.multiplier, level),
      stagger: hit.stagger ? resolveTable(hit.stagger, level) : 0,
      spReturn: hit.spReturn ? resolveTable(hit.spReturn, level) : 0,
      frameData: resolveTable(hit.frameData, level),
      times: hit.times?? 1,
      energyReturn: hit.energyReturn ? resolveTable(hit.energyReturn, level) : 0,
      attackType: hit.attackType?? command.attackType,
      damageType: hit.damageType?? command.damageType,
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