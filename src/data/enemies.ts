import type { ElementType } from "@/data/characters";
import type { ModifierStats } from "@/lib/build/stats";
import * as Bonekrushers from "./enemies/bonekrushers";
import type { AppliedStatus } from "@/lib/status";

export type EnemyResistances = 
{ Physical: number; 
  Heat: number;
  Cryo: number;
  Electric: number;
  Nature: number;
  Aether: number;};

export type EnemyBase = {
  id: string;
  name: string;

  baseHpLv1: number;
  baseAtkLv1: number;
  hpScalingModel: number[];
  atkScalingModel: number[];
  def: number;

  resistances: EnemyResistances;

  weight: number;
  staggerGauge: number;
  staggerRecoverySeconds: number;

  finisherMultiplier: number;
  finisherSpGain: number;
};

export type EnemyInstance = {
  base: EnemyBase;
  level: Number;

  hp: number;
  modifiers: ModifierStats;
  statuses: AppliedStatus[];
};

export const ENEMIES: EnemyBase[] = [
  Bonekrushers.RHODAGN,
];
