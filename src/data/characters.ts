import type {
  AttrKey,
  Attrs,
  AttributeScaling,
  CharacterStats,
  FinalStats,
  LevelStatTable,
  ModifierStats
} from "@/lib/build/stats";
import type { CommandDefinition, ResolvedCommandAtLevel } from "@/lib/commands";
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
    extra?: Record<string, number>;
  };
};

export type CharacterCommandMutationContext = {
  buildState: BuildConditionState;
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
  potentialEffects?: Record<number, CharacterPotentialEffect>;
  mutateResolvedCommands?: (
    commands: ResolvedCommandAtLevel[],
    ctx: CharacterCommandMutationContext,
  ) => ResolvedCommandAtLevel[];
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

  return { attrs, mods, extra };
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


/**
 * Keep each array length exactly 90.
 * Index 0 = Lv1, index 89 = Lv90.
 */
export const CHARACTERS: CharacterBase[] = [
  GILBERTA, LAEVATAIN, YVONNE, 
  AKEKURI, ANTAL, ARDELIA, WULFGARD,
  ARCLIGHT, EMBER, LIFENG, SNOWSHINE, ENDMINISTRATOR,
  DAPAN, PERLICA, ESTELLA,
  FLUORITE, CATCHER, ALESH,
  LASTRITE, CHENQIANYU,
];
