// src/lib/gears.ts
import type { GearBase } from "@/data/gears";
import type { GearInstance } from "@/lib/build/gearInstances";
import type { Attrs, ModifierStats } from "@/lib/build/stats";
import { scaledGearSubValue } from "@/lib/build/gearScaling";

type GearApplyResult = {
  attrs: Attrs;
  defFlat: number;
  mods: ModifierStats;
};

function addAttr(attrs: Attrs, key: keyof Attrs, amount: number): Attrs {
  return { ...attrs, [key]: attrs[key] + amount };
}

function addMod(mods: ModifierStats, key: keyof ModifierStats, amount: number) {
  mods[key] += amount;
}

export function applyGears(args: {
  attrs: Attrs;
  gearBases: (GearBase | null)[];
  gearInstances: (GearInstance | null)[];
  mods: ModifierStats;
}): GearApplyResult {
  let attrs = args.attrs;
  let defFlat = 0;
  const mods = { ...args.mods };

  for (let gearIndex = 0; gearIndex < args.gearBases.length; gearIndex++) {
    const g = args.gearBases[gearIndex];
    const inst = args.gearInstances[gearIndex];
    if (!g || !inst) continue;

    defFlat += g.defFlat;

    for (let i = 0; i < g.subs.length; i++) {
      const sub = g.subs[i];

      if (!sub) continue;
      const lv = inst.subLevels[i] ?? 0;
      const scaled = scaledGearSubValue(sub.stat, sub.value, lv);

      switch (sub.stat) {
        case "STR":
          attrs = addAttr(attrs, "STR", scaled);
          break;
        case "AGI":
          attrs = addAttr(attrs, "AGI", scaled);
          break;
        case "INT":
          attrs = addAttr(attrs, "INT", scaled);
          break;
        case "WIL":
          attrs = addAttr(attrs, "WIL", scaled);
          break;

        case "MAIN_ATTR_PCT":
          addMod(mods, "MAIN_ATTR_PCT", scaled);
          break;
        case "CRIT_RATE_PCT":
          addMod(mods, "CRIT_RATE_PCT", scaled);
          break;
        case "ULT_GAIN_PCT":
          addMod(mods, "ULT_GAIN_PCT", scaled);
          break;
        case "BASIC_ATK_DMG_PCT":
          addMod(mods, "BASIC_ATK_DMG_PCT", scaled);
          break;
        case "SKILL_DMG_PCT":
          addMod(mods, "SKILL_DMG_PCT", scaled);
          break;
        case "BATTLE_SKILL_DMG_PCT":
          addMod(mods, "BATTLE_SKILL_DMG_PCT", scaled);
          break;
        case "HEAT_DMG_PCT":
          addMod(mods, "HEAT_DMG_PCT", scaled);
          break;
        default:
          break;
      }
    }
  }

  return { attrs, defFlat, mods };
}