import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats"; 
import type { CombatContext } from "./combat";
import type { ElementType } from "@/data/characters";
// or wherever your ModifierStats type currently lives

export type BuffTrigger =
  | "MANUAL"
  | "ON_ULTIMATE_USED"
  | "ON_SKILL_USED"
  | "ON_BATTLE_OR_COMBO_SKILL_USED"
  | "ON_CRIT_WITH_BATTLE_OR_COMBO"
  | "ON_HIT"
  | "ON_TAKING_DAMAGE"
  | "ON_HEALING_RECEIVED"
  | "ON_BUFF_GAINED"
  | "ON_BUFF_LOST"
  | "ON_ARTS_REACTION_CONSUMPTION"
  | "PASSIVE"; 

export type BuffEffect = {
  stat: ModifierStatKey;
  value: number;
};

export type BuffDefinition = {
  id: string;
  name: string;
  trigger: BuffTrigger;
  durationSeconds: number | null;
  effects: BuffEffect[];
};

export type BuffInstance = {
  id: string;
  active: boolean;
};

export function mergeModifierDelta(
  base: ModifierStats,
  delta: Partial<ModifierStats>,
): ModifierStats {
  const out: ModifierStats = { ...base };

  for (const [key, value] of Object.entries(delta)) {
    if (value == null) continue;
    out[key as ModifierStatKey] += value;
  }

  return out;
}

export function applyActiveBuffsToMods(
  mods: ModifierStats,
  buffDefs: BuffDefinition[],
  buffStates: BuffInstance[],
): ModifierStats {
  const out: ModifierStats = { ...mods };

  const activeIds = new Set(
    buffStates.filter((b) => b.active).map((b) => b.id),
  );

  for (const buff of buffDefs) {
    if (!activeIds.has(buff.id)) continue;

    for (const effect of buff.effects) {
      out[effect.stat] += effect.value;
    }
  }

  return out;
}

