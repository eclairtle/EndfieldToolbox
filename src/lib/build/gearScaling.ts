import type { GearSubLevel } from "@/lib/build/gearInstances";
import type { AttrKey, ModifierStatKey } from "./stats";

const LEVEL_MULTIPLIERS: Record<GearSubLevel, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.2,
  3: 1.3,
};

export function scaledGearSubValue(
  stat: AttrKey | ModifierStatKey,
  baseValue: number,
  level: GearSubLevel,
): number {
  const scaled = baseValue * LEVEL_MULTIPLIERS[level];

  if (stat.endsWith("_PCT")) {
    // round to xx.x% display precision, i.e. 1 decimal percent = 0.001 in stored decimal form
    return Math.round(scaled * 1000) / 1000;
  }

  return Math.floor(scaled);
}

export function formatGearSubValue(stat: AttrKey | ModifierStatKey, value: number): string {
  if (stat.endsWith("_PCT")) {
    return `+${(value * 100).toFixed(1)}%`;
  }
  return `+${Math.floor(value)}`;
}