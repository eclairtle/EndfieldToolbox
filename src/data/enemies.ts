import type { ElementType } from "@/data/characters";
import type { ModifierStats } from "@/lib/build/stats";
import * as Aggeloi from "./enemies/aggeloi";
import * as Cangzei from "./enemies/cangzei";
import * as Landbreakers from "./enemies/landbreakers";
import * as RuanYi from "./enemies/ruanyi";
import * as Wildlife from "./enemies/wildlife";

export type EnemyAppliedStatus = {
  id: string;
  stacks?: number;
  remainingSeconds?: number;
  [key: string]: unknown;
};

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
  staggerNodes?: number[];
  staggerRecoverySeconds: number;

  finisherMultiplier: number;
  finisherSpGain: number;
};

export type EnemyInstance = {
  base: EnemyBase;
  level: Number;

  hp: number;
  modifiers: ModifierStats;
  statuses: EnemyAppliedStatus[];
};

export const ENEMIES: EnemyBase[] = [
  ...Aggeloi.AGGELOI,
  ...Cangzei.CANGZEI,
  ...Landbreakers.LANDBREAKERS,
  ...RuanYi.RUAN_YI_ENEMIES,
  ...Wildlife.WILDLIFE,
];
