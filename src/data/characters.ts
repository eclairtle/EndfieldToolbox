import type {
  AttrKey,
  AttributeScaling,
  CharacterStats,
  FinalStats,
  LevelStatTable,
  ModifierStats
} from "@/lib/build/stats";
import type { CommandDefinition, ResolvedCommandAtLevel } from "@/lib/commands";
import { calculateCommandDamage } from "@/lib/combat/combatDamage";
import type { WeaponType } from "./weapons";

export type ElementType =
  | "Physical"
  | "Heat"
  | "Electric"
  | "Nature"
  | "Cryo"
  | "Aether";

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
  potentialEffects?: Record<number, CharacterPotentialEffect>;
};

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


/**
 * Keep each array length exactly 90.
 * Index 0 = Lv1, index 89 = Lv90.
 */
export const CHARACTERS: CharacterBase[] = [
  GILBERTA, LAEVATAIN, YVONNE, 
  AKEKURI, ANTAL, ARDELIA, WULFGARD,
];
