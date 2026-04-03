import type {
  AttrKey,
  AttributeScaling,
  CharacterStats,
  FinalStats,
  LevelStatTable,
  ModifierStats
} from "@/lib/build/stats";
import type { CommandDefinition, ResolvedCommandAtLevel } from "@/lib/commands";
import { calculateCommandDamage, calculateHealingAmount } from "@/lib/combat/combatDamage";
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
  slot: CharacterBuildSlot;
  finalStats: FinalStats;
  mods: ModifierStats;
};

export type CharacterTalentEffect = {
  apply?: (ctx: CharacterRuntimeContext) => {
    modsDelta?: Partial<ModifierStats>;
    extra?: Record<string, number>;
  };
};

export type CharacterUniqueTalent = {
  name: string;
  effect?: CharacterTalentEffect;
};

export type CharacterPotentialEffect = {
  apply?: (ctx: CharacterRuntimeContext) => {
    modsDelta?: Partial<ModifierStats>;
    extra?: Record<string, number>;
  };
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

  uniqueTalents?: Record<string, CharacterTalentEffect>;
  uniqueTalentDefs?: Record<string, CharacterUniqueTalent>;
  potentialEffects?: Record<number, CharacterPotentialEffect>;
};

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


/**
 * Keep each array length exactly 90.
 * Index 0 = Lv1, index 89 = Lv90.
 */
export const CHARACTERS: CharacterBase[] = [
  GILBERTA, LAEVATAIN, YVONNE, 
  AKEKURI, ANTAL, ARDELIA, WULFGARD,
  ARCLIGHT, EMBER, LIFENG, SNOWSHINE, ENDMINISTRATOR,
];
