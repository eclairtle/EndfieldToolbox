import type {
  AttrKey,
  Attrs,
  AttributeScaling,
  CharacterStats,
  FinalStats,
  LevelStatTable,
  ModifierStats
} from "@/lib/build/stats";
import type { CommandDefinition, ExecuteHitDefinition, ResolvedCommandAtLevel, ResolvedExecuteHitAtLevel } from "@/lib/commands";
import { calculateCommandDamage, calculateHealingAmount } from "@/lib/combat/combatDamage";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { isBuildConditionMet, isUniqueTalentEnabled, type BuildCondition, type BuildConditionState } from "@/lib/build/buildConditions";
import type { PotentialLevel } from "@/lib/build/progression";
import type { WeaponType } from "./weapons";

export type ElementType =
  | "Physical"
  | "Heat"
  | "Electric"
  | "Nature"
  | "Cryo"
  | "Aether"
  | "Healing";

export type CharacterClass = "Striker" | "Vanguard" | "Guard" | "Caster" | "Supporter" | "Defender";

export type BenchmarkResult = {
  label: string;
  value: number;
  suffix?: string;
};

export type CharacterBenchmarkContext = {
  char: CharacterBase;
  finalStats: FinalStats;
  resolvedCommands: ResolvedCommandAtLevel[];
  slot?: CharacterBuildSlot;
};

export type CharacterBenchmark = {
  id: string;
  name: string;
  compute: (ctx: CharacterBenchmarkContext) => BenchmarkResult;
};

export function benchmarkCommandDamage(args: {
  id: string;
  name: string;
  commandId: string;
  label?: string;
}): CharacterBenchmark {
  return {
    id: args.id,
    name: args.name,
    compute: (ctx) => {
      const command = ctx.resolvedCommands.find((c) => c.id === args.commandId);
      if (!command) {
        return {
          label: args.label ?? args.name,
          value: 0,
        };
      }

      return {
        label: args.label ?? args.name,
        value: calculateCommandDamage({
          finalAtk: ctx.finalStats.statsCard.ATK,
          command,
          mods: ctx.finalStats.mods,
        }),
      };
    },
  };
}

export type CharacterRuntimeContext = {
  slot?: CharacterBuildSlot;
  char: CharacterBase;
  attrs: Attrs;
  mods: ModifierStats;
  buildState: BuildConditionState;
};

export type CharacterTalentEffect = {
  apply?: (ctx: CharacterRuntimeContext) => {
    attrsDelta?: Partial<Attrs>;
    modsDelta?: Partial<ModifierStats>;
    attributeScalingDelta?: Partial<AttributeScaling>;
    extra?: Record<string, number>;
  };
};

export type CharacterUniqueTalent = {
  name: string;
  condition?: BuildCondition;
  defaultEnabled?: boolean;
  effect?: CharacterTalentEffect;
};

export type CharacterPotentialEffect = {
  apply?: (ctx: CharacterRuntimeContext) => {
    attrsDelta?: Partial<Attrs>;
    modsDelta?: Partial<ModifierStats>;
    attributeScalingDelta?: Partial<AttributeScaling>;
    extra?: Record<string, number>;
  };
};

export type CharacterCommandMutationContext = {
  buildState: BuildConditionState;
};

export type CharacterConditionalModifierCondition = {
  requiresUniqueTalentsEnabled?: string[];
  requiresUniqueTalentsDisabled?: string[];
  enemyStatusIdsAny?: string[];
  enemyStatusIdsNone?: string[];
  enemyInflictionElementsAny?: Array<"Heat" | "Cryo" | "Electric" | "Nature">;
};

export type CharacterConditionalModifierDefinition = {
  id: string;
  label: string;
  condition: CharacterConditionalModifierCondition;
  effects: Partial<ModifierStats>;
};

export type PromotionCostItem = {
  resource: string;
  amount: number;
};

export type PromotionStageCost = {
  stage: 1 | 2 | 3 | 4;
  levelCap: 40 | 60 | 80 | 90;
  costs: PromotionCostItem[];
};

export type CharacterBase = {
  id: string;
  name: string;
  imagePath?: string;
  skillIconPaths?: {
    battleSkill?: string;
    comboSkill?: string;
    ultimate?: string;
  };
  rarity: number;
  element: ElementType;
  class: CharacterClass;
  scaling: AttributeScaling;
  mainAttr: AttrKey;
  secondaryAttr: AttrKey;
  levels: LevelStatTable;
  weaponType: WeaponType;
  commands?: CommandDefinition[];
  benchmarks?: CharacterBenchmark[];
  promotions?: PromotionStageCost[];
  combatHooks?: CharacterCombatHooks;

  uniqueTalents?: Record<string, CharacterTalentEffect>;
  uniqueTalentDefs?: Record<string, CharacterUniqueTalent>;
  conditionalModifiers?: CharacterConditionalModifierDefinition[];
  potentialEffects?: Record<number, CharacterPotentialEffect>;
  mutateResolvedCommands?: (
    commands: ResolvedCommandAtLevel[],
    ctx: CharacterCommandMutationContext,
  ) => ResolvedCommandAtLevel[];
  executeHits?: ExecuteHitDefinition[];
  restrictEnergyGainToOwnBattleOrComboCommands?: boolean;
  mutateResolvedExecuteHits?: (
    executeHits: Record<string, ResolvedExecuteHitAtLevel>,
    ctx: CharacterCommandMutationContext,
  ) => Record<string, ResolvedExecuteHitAtLevel>;
};

export function applyCharacterRuntimeEffects(args: {
  char: CharacterBase;
  slot?: CharacterBuildSlot;
  attrs: Attrs;
  mods: ModifierStats;
  buildState: BuildConditionState;
}) {
  let attrs = { ...args.attrs };
  let mods = { ...args.mods };
  let attributeScaling = { ...(args.char.scaling ?? {}) };
  const extra: Record<string, number> = {};

  const applyDelta = (result: ReturnType<NonNullable<CharacterTalentEffect["apply"]>> | ReturnType<NonNullable<CharacterPotentialEffect["apply"]>> | undefined) => {
    if (!result) {
      return;
    }

    for (const key of Object.keys(result.attrsDelta ?? {}) as AttrKey[]) {
      attrs[key] += result.attrsDelta?.[key] ?? 0;
    }

    for (const key of Object.keys(result.modsDelta ?? {}) as (keyof ModifierStats)[]) {
      mods[key] += result.modsDelta?.[key] ?? 0;
    }

    for (const key of Object.keys(result.attributeScalingDelta ?? {}) as AttrKey[]) {
      attributeScaling[key] = (attributeScaling[key] ?? 0) + (result.attributeScalingDelta?.[key] ?? 0);
    }

    Object.assign(extra, result.extra ?? {});
  };

  const runtimeContext: CharacterRuntimeContext = {
    slot: args.slot,
    char: args.char,
    attrs,
    mods,
    buildState: args.buildState,
  };

  for (const [key, effect] of Object.entries(args.char.uniqueTalents ?? {})) {
    if (!isUniqueTalentEnabled(key, args.buildState)) {
      continue;
    }
    applyDelta(effect.apply?.(runtimeContext));
  }

  const potentialLevel = args.buildState.potentialLevel ?? 0;
  for (let level = 1; level <= potentialLevel; level += 1) {
    applyDelta(args.char.potentialEffects?.[level]?.apply?.(runtimeContext));
  }

  return { attrs, mods, attributeScaling, extra };
}

export function benchmarkHealing(args: {
  id: string;
  name: string;
  commandId: string;
  label?: string;
  computeBaseAmount: (ctx: CharacterBenchmarkContext, command: ResolvedCommandAtLevel) => number;
  extraHealingMultiplier?: (ctx: CharacterBenchmarkContext) => number;
}): CharacterBenchmark {
  return {
    id: args.id,
    name: args.name,
    compute: (ctx) => {
      const command = ctx.resolvedCommands.find((c) => c.id === args.commandId);
      if (!command) return { label: args.label ?? args.name, value: 0 };

      const baseAmount = args.computeBaseAmount(ctx, command);
      const value =
        calculateHealingAmount({
          baseAmount,
          healerMods: ctx.finalStats.mods,
          targetHealingReceivedBonus: 0,
        }) * (args.extraHealingMultiplier?.(ctx) ?? 1);

      return {
        label: args.label ?? args.name,
        value,
      };
    },
  };
}

function getLevelStats(levels: LevelStatTable, level: number): CharacterStats {
  const i = Math.max(1, Math.min(90, level)) - 1;

  return {
    STR: levels.STR[i]!,
    AGI: levels.AGI[i]!,
    INT: levels.INT[i]!,
    WIL: levels.WIL[i]!,
    ATK: levels.ATK[i]!,
    HP: levels.HP[i]!,
  };
}

export const characterAtLevel = getLevelStats;


import { GILBERTA } from "./chars/gilberta";
import { LAEVATAIN } from "./chars/laevatain";
import { YVONNE } from "./chars/yvonne";
import { AKEKURI } from "./chars/akekuri";
import { ANTAL } from "./chars/antal";
import { ARDELIA } from "./chars/ardelia";
import type { CharacterBuildSlot } from "@/stores/buildStore";
import { WULFGARD } from "./chars/wulfgard";
import { ARCLIGHT } from "./chars/arclight";
import { AVYWENNA } from "./chars/avywenna";
import { EMBER } from "./chars/ember";
import { LIFENG } from "./chars/lifeng";
import { SNOWSHINE } from "./chars/snowshine";
import { ENDMINISTRATOR } from "./chars/endministrator";
import { DAPAN } from "./chars/dapan";
import { PERLICA } from "./chars/perlica";
import { ESTELLA } from "./chars/estella";
import { FLUORITE } from "./chars/fluorite";
import { CATCHER } from "./chars/catcher";
import { ALESH } from "./chars/alesh";
import { LASTRITE } from "./chars/lastrite";
import { CHENQIANYU } from "./chars/chenqianyu";
import { XAIHI } from "./chars/xaihi";
import { TANGTANG } from "./chars/tangtang";
import { ROSSI } from "./chars/rossi";
import { POGRANICHNIK } from "./chars/pogranichnik";
import { ZHUANGFANGYI } from "./chars/zhuangfangyi";


export const CHARACTERS: CharacterBase[] = [
  GILBERTA, LAEVATAIN, YVONNE, 
  AKEKURI, ANTAL, ARDELIA, WULFGARD,
  ARCLIGHT, AVYWENNA, EMBER, LIFENG, SNOWSHINE, ENDMINISTRATOR,
  DAPAN, PERLICA, ESTELLA,
  FLUORITE, CATCHER, ALESH,
  LASTRITE, CHENQIANYU,
  XAIHI, TANGTANG, ROSSI,
  POGRANICHNIK,
  ZHUANGFANGYI,
];
