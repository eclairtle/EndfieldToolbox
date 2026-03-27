import type { EnemyBase } from "@/data/enemies";
import type { AppliedStatus } from "@/lib/status";
import { makeBaseModifierStats, type ModifierStats } from "@/lib/build/stats";


export function getBaseEnemyModifiers(base: EnemyBase): ModifierStats {
  const mods = makeBaseModifierStats();
  mods.HEAT_RESIST_PCT = base.resistances.Heat;
  mods.CRYO_RESIST_PCT = base.resistances.Cryo;
  mods.ELECTRIC_RESIST_PCT = base.resistances.Electric;
  mods.NATURE_RESIST_PCT = base.resistances.Nature;
  mods.AETHER_RESIST_PCT = base.resistances.Aether;
  return mods;
}
