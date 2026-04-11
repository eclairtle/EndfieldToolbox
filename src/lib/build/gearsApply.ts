// src/lib/gears.ts
import { isGearUpgradable, type GearBase } from "@/data/gears";
import type { GearInstance } from "@/lib/build/gearInstances";
import type { Attrs, ModifierStats } from "@/lib/build/stats";
import { effectiveGearSubLevel, scaledGearSubValue } from "@/lib/build/gearScaling";

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
      const lv = effectiveGearSubLevel(inst.subLevels[i] ?? 0, isGearUpgradable(g));
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
        case "HP":
          addMod(mods, "FLAT_HP", scaled);
          break;

        case "MAIN_ATTR_PCT":
          addMod(mods, "MAIN_ATTR_PCT", scaled);
          break;
        case "SECONDARY_ATTR_PCT":
        addMod(mods, "SECONDARY_ATTR_PCT", scaled);
        break;
        case "CRIT_RATE_PCT":
          addMod(mods, "CRIT_RATE_PCT", scaled);
          break;
        case "CRIT_DMG_PCT":
          addMod(mods, "CRIT_DMG_PCT", scaled);
          break;
        case "ULT_GAIN_PCT":
          addMod(mods, "ULT_GAIN_PCT", scaled);
          break;
        case "ARTS_INTENSITY":
          addMod(mods, "ARTS_INTENSITY", scaled);
          break;
        case "PHYSICAL_DMG_PCT":
          addMod(mods, "PHYSICAL_DMG_PCT", scaled);
          break;
        case "ARTS_DMG_PCT":
          addMod(mods, "ARTS_DMG_PCT", scaled);
          break;
        case "HEAT_NATURE_DMG_PCT":
          addMod(mods, "HEAT_DMG_PCT", scaled);
          addMod(mods, "NATURE_DMG_PCT", scaled);
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
        case "COMBO_SKILL_DMG_PCT":
          addMod(mods, "COMBO_SKILL_DMG_PCT", scaled);
          break;
        case "ULTIMATE_DMG_PCT":
          addMod(mods, "ULTIMATE_DMG_PCT", scaled);
          break;
        case "HEAT_DMG_PCT":
          addMod(mods, "HEAT_DMG_PCT", scaled);
          break;
        case "HEALING_PCT":
          addMod(mods, "HEALING_PCT", scaled);
          break;
        case "FINAL_DMG_REDUCTION_PCT":
          addMod(mods, "FINAL_DMG_REDUCTION_PCT", scaled);
          break;
        case "DMG_VS_STAGGERED_PCT":
          addMod(mods, "DMG_VS_STAGGERED_PCT", scaled);
          break;
        default:
          break;
      }
    }
  }

  return { attrs, defFlat, mods };
}
