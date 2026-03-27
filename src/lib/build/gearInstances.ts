import type { GearBase } from "@/data/gears";

export type GearSubLevel = 0 | 1 | 2 | 3;

export type GearInstance = {
  gearId: string;
  subLevels: GearSubLevel[];
};

export function makeGearInstance(gear: GearBase): GearInstance {
  return {
    gearId: gear.id,
    subLevels: gear.subs.map(() => 0 as GearSubLevel),
  };
}