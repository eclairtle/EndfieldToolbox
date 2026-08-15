import type { ElementType } from "@/data/characters";
import type { ModifierStats } from "@/lib/build/stats";
import { inferEnemyRank, type EnemyRank } from "@/data/enemies/ranks";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";
import type { EnemyActionEffect, RotationCombatEventType } from "@/lib/combat/rotation";
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

export type EnemyCombatListener = {
  eventType: Extract<RotationCombatEventType, "ENEMY_DEFEATED" | "ENEMY_TRANSFORMED">;
  effects?: EnemyActionEffect[];
  actionWindow?: {
    commandId?: string;
    label: string;
    durationSeconds: number;
    invulnerable?: boolean;
    tintColor?: string;
    startEffects?: EnemyActionEffect[];
    endEffects?: EnemyActionEffect[];
  };
};

export type EnemyBase = {
  id: string;
  name: string;
  rank: EnemyRank;
  crowdControlLevel?: number;

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
  listeners?: EnemyCombatListener[];
};

export type EnemyInstance = {
  base: EnemyBase;
  level: Number;

  hp: number;
  modifiers: ModifierStats;
  statuses: EnemyAppliedStatus[];
};

function makeEnemy(input: {
  id: string;
  name: string;
  baseHpLv1: number;
  baseAtkLv1: number;
  def: number;
  weight: number;
  staggerGauge: number;
  staggerRecoverySeconds: number;
  finisherMultiplier: number;
  finisherSpGain: number;
  crowdControlLevel?: number;
  resistances?: Partial<EnemyBase["resistances"]>;
}): EnemyBase {
  return {
    id: input.id,
    name: input.name,
    rank: inferEnemyRank(input.id),
    crowdControlLevel: input.crowdControlLevel,
    baseHpLv1: input.baseHpLv1,
    baseAtkLv1: input.baseAtkLv1,
    hpScalingModel: DEFAULT_ENEMY_HP_SCALING,
    atkScalingModel: DEFAULT_ENEMY_ATK_SCALING,
    def: input.def,
    resistances: {
      Physical: 0,
      Heat: 0,
      Cryo: 0,
      Electric: 0,
      Nature: 0,
      Aether: 0,
      ...input.resistances,
    },
    weight: input.weight,
    staggerGauge: input.staggerGauge,
    staggerRecoverySeconds: input.staggerRecoverySeconds,
    finisherMultiplier: input.finisherMultiplier,
    finisherSpGain: input.finisherSpGain,
  };
}

export const TIDEWALKER = makeEnemy({
  id: "tidewalker",
  name: "Tidewalker",
  crowdControlLevel: 2,
  baseHpLv1: 1246,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const TIDEWALKER_DELTA = makeEnemy({
  id: "tidewalker_delta",
  name: "Tidewalker δ",
  crowdControlLevel: 2,
  baseHpLv1: 1869,
  baseAtkLv1: 72,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const MUDFLOW = makeEnemy({
  id: "mudflow",
  name: "Mudflow",
  baseHpLv1: 180,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const MUDFLOW_DELTA = makeEnemy({
  id: "mudflow_delta",
  name: "Mudflow δ",
  baseHpLv1: 291,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 90,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const MARBLE_APPENDAGE = makeEnemy({
  id: "marble_appendage",
  name: "Marble Appendage",
  baseHpLv1: 235,
  baseAtkLv1: 59,
  def: 100,
  weight: 1,
  staggerGauge: 0,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0,
    Nature: 0,
    Electric: 0,
    Aether: 0,
  },
});

export const PRISM = makeEnemy({
  id: "prism",
  name: "Prism",
  baseHpLv1: 111,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const AETHILLU = makeEnemy({
  id: "aethillu",
  name: "Æthillu",
  baseHpLv1: 111,
  baseAtkLv1: 49,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
    Aether: 0,
  },
});

export const ARMORED_MANGLERBEAST = makeEnemy({
  id: "armored_manglerbeast",
  name: "Armored Manglerbeast",
  baseHpLv1: 1177,
  baseAtkLv1: 33,
  def: 100,
  weight: 2,
  staggerGauge: 280,
  staggerRecoverySeconds: 8,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
    Aether: 0,
  },
});

export const EREIGNIS = makeEnemy({
  id: "ereignis",
  name: "Ereignis",
  baseHpLv1: 886,
  baseAtkLv1: 33,
  def: 100,
  weight: 2,
  staggerGauge: 280,
  staggerRecoverySeconds: 20,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0,
    Nature: 0,
    Electric: 0,
    Aether: 0,
  },
});

export const TIDALKLAST = makeEnemy({
  id: "tidalklast",
  name: "Tidalklast",
  baseHpLv1: 1385,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 640,
  staggerRecoverySeconds: 13,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const HEDRON = makeEnemy({
  id: "hedron",
  name: "Hedron",
  baseHpLv1: 152,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const HEDRON_CC = makeEnemy({
  id: "hedron_cc",
  name: "Hedron (CC)",
  // Closest integer Lv. 1 base to 35,393 HP at Lv. 60 (actual: 35,399).
  baseHpLv1: 198,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const HEDRON_DELTA = makeEnemy({
  id: "hedron_delta",
  name: "Hedron δ",
  baseHpLv1: 208,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 90,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0,
    Aether: 0,
  },
});

export const ROCKHOWLER = makeEnemy({
  id: "rockhowler",
  name: "Rockhowler",
  baseHpLv1: 138,
  baseAtkLv1: 13,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
    Aether: 0,
  },
});

export const CRAGHOWLER = makeEnemy({
  id: "craghowler",
  name: "Craghowler",
  baseHpLv1: 2008,
  baseAtkLv1: 53,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
    Aether: 0,
  },
});

export const ENEMIES: EnemyBase[] = [
  ...Aggeloi.AGGELOI,
  ...Cangzei.CANGZEI,
  ...Landbreakers.LANDBREAKERS,
  ...RuanYi.RUAN_YI_ENEMIES,
  ...Wildlife.WILDLIFE,
  TIDEWALKER,
  TIDEWALKER_DELTA,
  MUDFLOW,
  MUDFLOW_DELTA,
  MARBLE_APPENDAGE,
  PRISM,
  AETHILLU,
  ARMORED_MANGLERBEAST,
  EREIGNIS,
  TIDALKLAST,
  HEDRON,
  HEDRON_DELTA,
  ROCKHOWLER,
  CRAGHOWLER,
];
