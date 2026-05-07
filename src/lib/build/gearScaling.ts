import type { GearSubLevel } from "@/lib/build/gearInstances";
import type { AttrKey, CharacterStatKey, ModifierStatKey } from "./stats";

const LEVEL_MULTIPLIERS: Record<GearSubLevel, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.2,
  3: 1.3,
};

export function scaledGearSubValue(
  stat: AttrKey | CharacterStatKey | ModifierStatKey,
  baseValue: number,
  level: GearSubLevel,
): number {
  const scaled = baseValue * LEVEL_MULTIPLIERS[level];

  if (stat.endsWith("_PCT")) {
    // Keep percent stats at 0.1% precision (stored as 0.001), rounded.
    return Math.round(scaled * 1000) / 1000;
  }

  // Attribute stats use floor; integer modifier stats use nearest integer.
  if (stat === "STR" || stat === "AGI" || stat === "INT" || stat === "WIL") {
    return Math.floor(scaled);
  }
  return Math.round(scaled);
}

export function effectiveGearSubLevel(level: GearSubLevel, upgradable: boolean): GearSubLevel {
  return upgradable ? level : 0;
}

export function formatGearSubValue(stat: AttrKey | CharacterStatKey | ModifierStatKey, value: number): string {
  if (stat.endsWith("_PCT")) {
    return `+${(value * 100).toFixed(1)}%`;
  }
  if (stat === "STR" || stat === "AGI" || stat === "INT" || stat === "WIL") {
    return `+${Math.floor(value)}`;
  }
  return `+${Math.round(value)}`;
}
