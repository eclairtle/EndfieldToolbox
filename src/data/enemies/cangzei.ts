import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

type CangzeiEnemyInput = {
  id: string;
  name: string;
  baseHpLv1: number;
  baseAtkLv1: number;
  def: number;
  weight: number;
  staggerGauge: number;
  staggerNodes?: number[];
  staggerRecoverySeconds: number;
  finisherMultiplier: number;
  finisherSpGain: number;
  resistances?: Partial<EnemyBase["resistances"]>;
};

function makeCangzeiEnemy(input: CangzeiEnemyInput): EnemyBase {
  return {
    id: input.id,
    name: input.name,
    baseHpLv1: input.baseHpLv1,
    baseAtkLv1: input.baseAtkLv1,
    hpScalingModel: DEFAULT_ENEMY_HP_SCALING,
    atkScalingModel: DEFAULT_ENEMY_ATK_SCALING,
    def: input.def,
    resistances: {
      Physical: 0,
      Heat: 0,
      Cryo: 0,
      Nature: 0,
      Electric: 0,
      Aether: 0,
      ...input.resistances,
    },
    weight: input.weight,
    staggerGauge: input.staggerGauge,
    staggerNodes: input.staggerNodes,
    staggerRecoverySeconds: input.staggerRecoverySeconds,
    finisherMultiplier: input.finisherMultiplier,
    finisherSpGain: input.finisherSpGain,
  };
}

export const ROAD_PLUNDERER = makeCangzeiEnemy({
  id: "road_plunderer",
  name: "Road Plunderer",
  baseHpLv1: 194,
  baseAtkLv1: 33,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const GROVE_ARCHER = makeCangzeiEnemy({
  id: "grove_archer",
  name: "Grove Archer",
  baseHpLv1: 180,
  baseAtkLv1: 28,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const HILL_SMASHER = makeCangzeiEnemy({
  id: "hill_smasher",
  name: "Hill Smasher",
  baseHpLv1: 1108,
  baseAtkLv1: 59,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const CLOUD_STALKER = makeCangzeiEnemy({
  id: "cloud_stalker",
  name: "Cloud Stalker",
  baseHpLv1: 761,
  baseAtkLv1: 49,
  def: 100,
  weight: 1.5,
  staggerGauge: 110,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const NIMBUS_RAZOR = makeCangzeiEnemy({
  id: "nimbus_razor",
  name: "Nimbus Razor",
  baseHpLv1: 761,
  baseAtkLv1: 49,
  def: 100,
  weight: 1.5,
  staggerGauge: 110,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.4,
    Heat: 0.2,
    Cryo: 0.2,
  },
});

export const HIGHWAY_REAVER = makeCangzeiEnemy({
  id: "highway_reaver",
  name: "Highway Reaver",
  baseHpLv1: 291,
  baseAtkLv1: 43,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const CLOUD_OBLITERATOR = makeCangzeiEnemy({
  id: "cloud_obliterator",
  name: "Cloud Obliterator",
  baseHpLv1: 1661,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const SWEEPING_WIND = makeCangzeiEnemy({
  id: "sweeping_wind",
  name: "Sweeping Wind",
  baseHpLv1: 166,
  baseAtkLv1: 33,
  def: 100,
  weight: 1,
  staggerGauge: 110,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const BREAKING_GUST = makeCangzeiEnemy({
  id: "breaking_gust",
  name: "Breaking Gust",
  baseHpLv1: 1108,
  baseAtkLv1: 56,
  def: 100,
  weight: 1.5,
  staggerGauge: 110,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.6,
    Heat: 0.2,
    Cryo: 0.2,
  },
});

export const CANGZEI: EnemyBase[] = [
  ROAD_PLUNDERER,
  GROVE_ARCHER,
  HILL_SMASHER,
  CLOUD_STALKER,
  NIMBUS_RAZOR,
  HIGHWAY_REAVER,
  CLOUD_OBLITERATOR,
  SWEEPING_WIND,
  BREAKING_GUST,
];
